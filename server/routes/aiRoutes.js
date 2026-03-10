import { Router } from 'express';
import { explainCode, analyzeComplexity } from '../controllers/chatController.js';

const router = Router();

// POST /api/ai/explain — Stream AI code explanation
router.post('/explain', explainCode);

// POST /api/ai/complexity — Stream AI time & space complexity analysis
router.post('/complexity', analyzeComplexity);

export default router;
