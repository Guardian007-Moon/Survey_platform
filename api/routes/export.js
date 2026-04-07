import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import * as XLSX from 'xlsx';

const router = Router();

router.get('/survey/:surveyId', authMiddleware, async (req, res) => {
  try {
    const { data: responses, error } = await supabase
      .from('responses')
      .select(`
        *,
        survey_invitations(experts(name, email), surveys(name)),
        courses(code, name),
        skills(name)
      `)
      .eq('survey_invitations.survey_id', req.params.surveyId);

    if (error) throw error;

    // Build rows for CSV
    const rows = responses.map(r => ({
      Expert: r.survey_invitations.experts.name,
      Email: r.survey_invitations.experts.email,
      Survey: r.survey_invitations.surveys.name,
      Course_Code: r.courses.code,
      Course_Name: r.courses.name,
      Skill: r.skills.name,
      Notes: r.notes || '',
      Submitted_At: r.survey_invitations.submitted_at || '',
    }));

    // Build also a pivot matrix: rows = courses, cols = skills, cells = count of experts
    const { data: courses } = await supabase
      .from('survey_courses')
      .select('course_id, courses(code, name)')
      .eq('survey_id', req.params.surveyId);
    const { data: skills } = await supabase
      .from('survey_skills')
      .select('skill_id, skills(name)')
      .eq('survey_id', req.params.surveyId);

    const pivotRows = courses?.map(c => {
      const row = { Course: `${c.courses.code} - ${c.courses.name}` };
      skills?.forEach(s => {
        const count = responses.filter(r => r.course_id === c.course_id && r.skill_id === s.skill_id).length;
        row[s.skills.name] = count;
      });
      return row;
    });

    // Create workbook with two sheets
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(rows);
    const ws2 = XLSX.utils.json_to_sheet(pivotRows || []);
    XLSX.utils.book_append_sheet(wb, ws1, 'All Responses');
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary Matrix');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="survey_${req.params.surveyId}_results.xlsx"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CSV version
router.get('/survey/:surveyId/csv', authMiddleware, async (req, res) => {
  try {
    const { data: responses, error } = await supabase
      .from('responses')
      .select(`
        *,
        survey_invitations(experts(name, email), surveys(name)),
        courses(code, name),
        skills(name)
      `)
      .eq('survey_invitations.survey_id', req.params.surveyId);

    if (error) throw error;

    const rows = responses.map(r => ({
      Expert: r.survey_invitations.experts.name,
      Email: r.survey_invitations.experts.email,
      Survey: r.survey_invitations.surveys.name,
      Course_Code: r.courses.code,
      Course_Name: r.courses.name,
      Skill: r.skills.name,
      Notes: r.notes || '',
      Submitted_At: r.survey_invitations.submitted_at || '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Responses');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'csv' });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="survey_${req.params.surveyId}_results.csv"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
