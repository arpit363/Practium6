import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import aiRoutes from './routes/aiRoutes.js';
import codeRoutes from './routes/codeRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──
app.use(cors());
app.use(express.json());

// ── Routes ──
app.use('/api/ai', aiRoutes);
app.use('/api/code', codeRoutes);

// ── Health Check ──
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Apollo Backend is running' });
});

// ── Start Server ──
app.listen(PORT, () => {
  console.log(`🚀 Apollo server running on port ${PORT}`);
});
