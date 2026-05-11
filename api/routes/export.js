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
        survey_invitations(experts(name, email), surveys(name), submitted_at),
        courses(code, name),
        skills(name)
      `)
      .eq('survey_invitations.survey_id', req.params.surveyId);

    if (error) throw error;

    // Build rows for XLSX with safe access
    const rows = (responses || []).map(r => ({
      Expert: r.survey_invitations?.experts?.name || 'N/A',
      Email: r.survey_invitations?.experts?.email || 'N/A',
      Survey: r.survey_invitations?.surveys?.name || 'N/A',
      Course_Code: r.courses?.code || 'N/A',
      Course_Name: r.courses?.name || 'N/A',
      Skill: r.skills?.name || 'N/A',
      Weight: r.rating || 0,
      Notes: r.notes || '',
      Submitted_At: r.survey_invitations?.submitted_at || '',
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

    const pivotRows = (courses || []).map(c => {
      const row = { Course: `${c.courses?.code || ''} - ${c.courses?.name || 'Untitled'}` };
      (skills || []).forEach(s => {
        const matchingResponses = (responses || []).filter(r => r.course_id === c.course_id && r.skill_id === s.skill_id);
        const avgRating = matchingResponses.length > 0 
          ? Math.round(matchingResponses.reduce((acc, curr) => acc + (curr.rating || 0), 0) / matchingResponses.length) 
          : 0;
        row[s.skills?.name || 'Unknown Skill'] = avgRating;
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
        survey_invitations(experts(name, email), surveys(name), submitted_at),
        courses(code, name),
        skills(name)
      `)
      .eq('survey_invitations.survey_id', req.params.surveyId);

    if (error) throw error;

    const rows = (responses || []).map(r => ({
      Expert: r.survey_invitations?.experts?.name || 'N/A',
      Email: r.survey_invitations?.experts?.email || 'N/A',
      Survey: r.survey_invitations?.surveys?.name || 'N/A',
      Course_Code: r.courses?.code || 'N/A',
      Course_Name: r.courses?.name || 'N/A',
      Skill: r.skills?.name || 'N/A',
      Weight: r.rating || 0,
      Notes: r.notes || '',
      Submitted_At: r.survey_invitations?.submitted_at || '',
    }));

    const csv = [
      Object.keys(rows[0] || {}).join(','),
      ...rows.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="survey_${req.params.surveyId}_results.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
