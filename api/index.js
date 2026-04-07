import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import adminRoutes from './routes/admin.js';
import courseRoutes from './routes/courses.js';
import skillRoutes from './routes/skills.js';
import surveyRoutes from './routes/surveys.js';
import expertRoutes from './routes/experts.js';
import responseRoutes from './routes/responses.js';
import exportRoutes from './routes/export.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Optimized CORS for Vercel Monorepo
app.use(cors({ 
  origin: true, // Allow all origins for the unified API
  credentials: true
}));

app.use(express.json());

app.use('/api/admin', adminRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/experts', expertRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/export', exportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Survey API is running' });
});

export default app;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
