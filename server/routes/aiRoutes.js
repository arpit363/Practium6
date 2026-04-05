import { Router } from 'express';
import { explainCode, analyzeComplexity, generateTests, roastCode } from '../controllers/chatController.js';

const router = Router();

// POST /api/ai/explain — Stream AI code explanation
router.post('/explain', explainCode);

// POST /api/ai/complexity — Stream AI time & space complexity analysis
router.post('/complexity', analyzeComplexity);

// POST /api/ai/generate-tests — Stream AI generated tests
router.post('/generate-tests', generateTests);

// POST /api/ai/roast — Stream AI code roast
router.post('/roast', roastCode);

export default router;
