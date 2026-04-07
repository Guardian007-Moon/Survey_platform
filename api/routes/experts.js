import { Router } from 'express';
import { randomBytes } from 'crypto';
import { supabase } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('experts').select('*').order('name');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('experts').insert(req.body).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/bulk', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('experts').insert(req.body).select();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('experts').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.from('experts').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Expert deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send survey invitations to experts
router.post('/invite', authMiddleware, async (req, res) => {
  try {
    const { surveyId, expertIds } = req.body;
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0];
    const results = [];

    for (const expertId of expertIds) {
      const token = randomBytes(16).toString('hex');

      const { data: invitation, error: invError } = await supabase
        .from('survey_invitations')
        .insert({ survey_id: surveyId, expert_id: expertId, token })
        .select()
        .single();
      if (invError) throw invError;

      const { data: expert } = await supabase.from('experts').select('*').eq('id', expertId).single();
      const { data: survey } = await supabase.from('surveys').select('*').eq('id', surveyId).single();

      let emailStatus = 'pending';
      const surveyUrl = `${clientUrl}/survey/${token}`;

      // Only attempt to send email if credentials are provided
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_USER !== 'your_email@gmail.com') {
        try {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: expert.email,
            subject: `Survey Invitation: ${survey.name}`,
            html: `<p>Hi ${expert.name},</p><p>You are invited to participate in the survey: <strong>${survey.name}</strong>.</p><p>Please click the link below to start mapping courses to skills:</p><p><a href="${surveyUrl}">${surveyUrl}</a></p><p>Thank you!</p>`,
          });
          await supabase.from('survey_invitations').update({ status: 'sent' }).eq('id', invitation.id);
          emailStatus = 'sent';
        } catch (emailErr) {
          console.error('Email failed but link was generated:', emailErr.message);
          emailStatus = 'link_generated';
        }
      } else {
        emailStatus = 'link_generated';
      }

      results.push({ 
        expertId, 
        status: emailStatus, 
        token, 
        url: surveyUrl,
        expertName: expert.name 
      });
    }

    res.json({ message: 'Invitations processed', results });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
