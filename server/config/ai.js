import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

const ai = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default ai;
