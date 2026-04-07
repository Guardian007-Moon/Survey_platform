import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('surveys').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data: survey, error } = await supabase.from('surveys').select('*').eq('id', req.params.id).single();
    if (error) throw error;

    const { data: courses } = await supabase.from('survey_courses').select('course_id').eq('survey_id', req.params.id);
    const { data: skills } = await supabase.from('survey_skills').select('skill_id').eq('survey_id', req.params.id);
    const { data: invitations } = await supabase
      .from('survey_invitations')
      .select('*, experts(name, email)')
      .eq('survey_id', req.params.id);

    res.json({ ...survey, courseIds: courses?.map(c => c.course_id) || [], skillIds: skills?.map(s => s.skill_id) || [], invitations: invitations || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, courseIds, skillIds } = req.body;
    const { data: survey, error } = await supabase.from('surveys').insert({ name }).select().single();
    if (error) throw error;

    if (courseIds?.length) {
      await supabase.from('survey_courses').insert(courseIds.map(id => ({ survey_id: survey.id, course_id: id })));
    }
    if (skillIds?.length) {
      await supabase.from('survey_skills').insert(skillIds.map(id => ({ survey_id: survey.id, skill_id: id })));
    }

    res.status(201).json(survey);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('surveys').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.from('surveys').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Survey deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
