import { Router } from 'express';
import { explainCode } from '../controllers/chatController.js';

const router = Router();

// POST /api/ai/explain — Stream AI code explanation
router.post('/explain', explainCode);

export default router;
