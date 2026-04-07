import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase.js';
import dotenv from 'dotenv';

dotenv.config();
const router = Router();

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, email')
      .eq('id', decoded.id)
      .single();
      
    if (error || !admin) return res.status(401).json({ error: 'Invalid token' });
    res.json({ admin });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from('admins')
      .insert({ email, password_hash: hash })
      .select()
      .single();
    if (error) throw error;
    res.json({ message: 'Admin created', admin: { id: data.id, email: data.email } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[DEBUG] Login attempt - Email: ${email}, Port Header: ${req.headers.origin}`);
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();
    if (error || !admin) {
      console.log(`[DEBUG] Login failed - User not found for email: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      console.log(`[DEBUG] Login failed - Password mismatch for email: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`[DEBUG] Login successful - Email: ${email}`);

    const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, admin: { id: admin.id, email: admin.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    
    // 1. Find admin
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !admin) return res.status(404).json({ error: 'Admin not found' });

    // 2. Verify old password
    const valid = await bcrypt.compare(oldPassword, admin.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });

    // 3. Hash new password and update
    const newHash = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabase
      .from('admins')
      .update({ password_hash: newHash })
      .eq('email', email);

    if (updateError) throw updateError;

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
