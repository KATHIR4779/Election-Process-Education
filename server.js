import express from 'express';
import { VertexAI } from '@google-cloud/vertexai';
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

const log  = (msg, data = '') => console.log(`[INFO]  ${msg}`, data);
const err  = (msg, data = '') => console.error(`[ERROR] ${msg}`, data);

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
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static('public'));
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ── Vertex AI Initialisation ──────────────────────────────────────────────────
// Cloud Run uses Application Default Credentials (ADC) automatically.
// Locally we need GOOGLE_APPLICATION_CREDENTIALS env var pointing to SA JSON.
const PROJECT_ID = 'election-process-495110';
const LOCATION   = 'us-central1';
const MODEL_ID   = 'gemini-1.5-flash';

const SYSTEM_INSTRUCTION = `You are the "BharatVoter AI Assistant," a highly accurate expert 
on the Indian Electoral Process. Use official ECI guidelines. Be clear and concise. 
Do NOT speculate on election dates. Redirect to voters.eci.gov.in for live information. 
Maintain strict political neutrality.`;

let generativeModel;
try {
    const vertexai = new VertexAI({ project: PROJECT_ID, location: LOCATION });
    generativeModel = vertexai.getGenerativeModel({
        model: MODEL_ID,
        systemInstruction: SYSTEM_INSTRUCTION,
    });
    log('Vertex AI model initialised', `project=${PROJECT_ID} model=${MODEL_ID}`);
} catch (e) {
    err('Vertex AI init failed', e.message);
}

// ── Routes ───────────────────────────────────────────────────────────────────
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
        const cacheKey = `v4_${message}`;

        if (responseCache.has(cacheKey)) {
            return res.json({ response: responseCache.get(cacheKey) });
        }

        if (!generativeModel) throw new Error('AI model is not available.');

        // Vertex AI SDK uses startChat / sendMessage
        const chat = generativeModel.startChat({ history });
        const result = await chat.sendMessage(message);
        const text   = result.response?.candidates?.[0]?.content?.parts?.[0]?.text
                    ?? 'Sorry, I could not generate a response. Please try again.';

        responseCache.set(cacheKey, text);
        res.json({ response: text });

    } catch (e) {
        err('Chat error', e.message);

        if (e.message?.includes('429')) {
            return res.status(429).json({ error: 'Rate limit reached. Please try again in a moment.' });
        }
        res.status(500).json({ error: `Service error: ${e.message}` });
    }
});

export default app;

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => log(`BharatVoter server listening on port ${port}`));
}
