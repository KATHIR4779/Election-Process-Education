import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import compression from 'compression';
import { LRUCache } from 'lru-cache';
import { body, validationResult } from 'express-validator';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;
app.set('trust proxy', 1);

const log = (msg) => console.log(`[INFO]  ${msg}`);
const err = (msg, e = '') => console.error(`[ERROR] ${msg}`, e);

const responseCache = new LRUCache({ max: 100, ttl: 1000 * 60 * 60 });

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            'script-src':  ["'self'", 'https://www.googletagmanager.com', 'https://cdnjs.cloudflare.com', "'unsafe-inline'"],
            'connect-src': ["'self'", 'https://www.google-analytics.com', 'https://cdnjs.cloudflare.com'],
            'img-src':     ["'self'", 'data:', 'https://www.gstatic.com'],
        },
    },
}));

app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static('public'));
app.get('/favicon.ico', (req, res) => res.status(204).end());

const SYSTEM_PROMPT = `You are the "BharatVoter AI Assistant," a highly accurate expert 
on the Indian Electoral Process. Use official ECI guidelines. Be clear and concise. 
Do NOT speculate on election dates. Redirect to voters.eci.gov.in for live information. 
Maintain strict political neutrality at all times.`;

let model;
try {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) throw new Error('GOOGLE_API_KEY is not set');
    const genAI = new GoogleGenerativeAI(key);
    model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: SYSTEM_PROMPT,
    });
    log('Gemini AI model ready (gemini-2.0-flash)');
} catch (e) {
    err('AI init failed:', e.message);
}

app.get('/health', (_req, res) =>
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() })
);

app.post('/api/chat', [
    body('message').isString().trim().isLength({ min: 1, max: 1000 }).escape(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Invalid input.' });

    try {
        const { message, history = [] } = req.body;
        const cacheKey = `v5_${message}`;

        if (responseCache.has(cacheKey)) {
            return res.json({ response: responseCache.get(cacheKey) });
        }

        if (!model) throw new Error('AI service unavailable — check API key.');

        const chat = model.startChat({ history });
        const result = await chat.sendMessage(message);
        const text = result.response.text();

        responseCache.set(cacheKey, text);
        res.json({ response: text });

    } catch (e) {
        err('Chat error:', e.message);
        if (e.status === 429 || e.message?.includes('429')) {
            return res.status(429).json({ error: 'Rate limit reached. Please try again shortly.' });
        }
        res.status(500).json({ error: `AI error: ${e.message}` });
    }
});

export default app;

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => log(`Server running on port ${port}`));
}
