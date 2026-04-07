import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

// Validate token and get survey data (no auth required)
router.get('/validate/:token', async (req, res) => {
  try {
    const { data: invitation, error } = await supabase
      .from('survey_invitations')
      .select('*, surveys(name, status), experts(name, email)')
      .eq('token', req.params.token)
      .single();
    if (error || !invitation) return res.status(404).json({ error: 'Invalid or expired link' });
    if (invitation.surveys.status === 'closed') return res.status(403).json({ error: 'Survey is closed' });

    await supabase.from('survey_invitations').update({ status: 'opened' }).eq('id', invitation.id);

    // Get courses and skills for this survey
    const { data: courses } = await supabase
      .from('survey_courses')
      .select('course_id, courses(*)')
      .eq('survey_id', invitation.survey_id);
    const { data: skills } = await supabase
      .from('survey_skills')
      .select('skill_id, skills(*)')
      .eq('survey_id', invitation.survey_id);

    // Get existing responses
    const { data: existingResponses } = await supabase
      .from('responses')
      .select('*')
      .eq('invitation_id', invitation.id);

    res.json({
      invitation,
      courses: courses?.map(c => c.courses) || [],
      skills: skills?.map(s => s.skills) || [],
      existingResponses: existingResponses || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit responses
router.post('/submit', async (req, res) => {
  try {
    const { token, mappings } = req.body;
    const { data: invitation, error: invError } = await supabase
      .from('survey_invitations')
      .select('id, survey_id')
      .eq('token', token)
      .single();
    if (invError || !invitation) return res.status(404).json({ error: 'Invalid token' });

    // Delete existing responses for this invitation
    await supabase.from('responses').delete().eq('invitation_id', invitation.id);

    // Insert new responses
    if (mappings?.length) {
      const rows = mappings.map(m => ({
        invitation_id: invitation.id,
        course_id: m.courseId,
        skill_id: m.skillId,
        notes: m.notes || null,
      }));
      const { error: insertError } = await supabase.from('responses').insert(rows);
      if (insertError) throw insertError;
    }

    await supabase.from('survey_invitations').update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', invitation.id);

    res.json({ message: 'Survey submitted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Save draft (partial save)
router.post('/save-draft', async (req, res) => {
  try {
    const { token, mappings } = req.body;
    const { data: invitation, error: invError } = await supabase
      .from('survey_invitations')
      .select('id')
      .eq('token', token)
      .single();
    if (invError || !invitation) return res.status(404).json({ error: 'Invalid token' });

    await supabase.from('responses').delete().eq('invitation_id', invitation.id);
    if (mappings?.length) {
      const rows = mappings.map(m => ({
        invitation_id: invitation.id,
        course_id: m.courseId,
        skill_id: m.skillId,
        notes: m.notes || null,
      }));
      await supabase.from('responses').insert(rows);
    }

    res.json({ message: 'Draft saved' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get public survey data (no token required)
router.get('/public/:publicId', async (req, res) => {
  try {
    const { data: survey, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('public_id', req.params.publicId)
      .single();
    if (error || !survey) return res.status(404).json({ error: 'Survey not found' });
    if (survey.status === 'closed') return res.status(403).json({ error: 'Survey is closed' });

    // Get courses and skills for this survey
    const { data: courses } = await supabase
      .from('survey_courses')
      .select('course_id, courses(*)')
      .eq('survey_id', survey.id);
    const { data: skills } = await supabase
      .from('survey_skills')
      .select('skill_id, skills(*)')
      .eq('survey_id', survey.id);

    res.json({
      survey,
      courses: courses?.map(c => c.courses) || [],
      skills: skills?.map(s => s.skills) || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit public responses (creates expert and invitation on the fly)
router.post('/submit-public', async (req, res) => {
  try {
    const { surveyId, name, email, mappings } = req.body;

    // 1. Find or create expert
    let { data: expert, error: expertError } = await supabase
      .from('experts')
      .select('id')
      .eq('email', email)
      .single();
    
    if (!expert) {
      const { data: newExpert, error: createError } = await supabase
        .from('experts')
        .insert({ name, email })
        .select('id')
        .single();
      if (createError) throw createError;
      expert = newExpert;
    }

    // 2. Create a one-time invitation for this submission
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const { data: invitation, error: invError } = await supabase
      .from('survey_invitations')
      .insert({ 
        survey_id: surveyId, 
        expert_id: expert.id, 
        token, 
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .select('id')
      .single();
    if (invError) throw invError;

    // 3. Insert responses
    if (mappings?.length) {
      const rows = mappings.map(m => ({
        invitation_id: invitation.id,
        course_id: m.courseId,
        skill_id: m.skillId,
        notes: m.notes || null,
      }));
      const { error: insertError } = await supabase.from('responses').insert(rows);
      if (insertError) throw insertError;
    }

    res.json({ message: 'Survey submitted successfully', token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
