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

// Standardized Logging
const log = (msg, data = "") => console.log(`[INFO] ${msg}`, data);
const error = (msg, err = "") => console.error(`[ERROR] ${msg}`, err);

const responseCache = new LRUCache({
    max: 100,
    ttl: 1000 * 60 * 60, 
});

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "https://www.googletagmanager.com", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
            "connect-src": ["'self'", "https://www.google-analytics.com", "https://cdnjs.cloudflare.com"],
            "img-src": ["'self'", "data:", "https://www.gstatic.com"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static('public'));

app.get('/favicon.ico', (req, res) => res.status(204).end());

// AI Core
let genAI;
let model;
const SYSTEM_INSTRUCTION = "Role: BharatVoter Assistant. Goal: Explain Indian election process clearly using ECI guidelines. Rule: No dates, no politics.";

try {
    const key = process.env.GOOGLE_API_KEY;
    if (key) {
        genAI = new GoogleGenerativeAI(key);
        model = genAI.getGenerativeModel({ 
            model: "gemini-flash-latest",
            systemInstruction: SYSTEM_INSTRUCTION
        });
        log("AI Engine Initialized with System Instructions");
    }
} catch (e) {
    error("AI Init Failed", e.message);
}

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

app.post('/api/chat', [
    body('message').isString().trim().isLength({ min: 1, max: 1000 }).escape(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: "Invalid input." });

    try {
        const { message, history } = req.body;
        const cacheKey = `v3_${message}`;
        
        if (responseCache.has(cacheKey)) {
            return res.json({ response: responseCache.get(cacheKey) });
        }

        if (!model) throw new Error("AI Model Offline");

        const chat = model.startChat({ history: history || [] });
        const result = await chat.sendMessage(message);
        const text = result.response.text(); 

        responseCache.set(cacheKey, text);
        res.json({ response: text });
    } catch (e) {
        error("Chat Error", e.message);
        res.status(500).json({ error: e.message || "Internal server error" });
    }
});

export default app;

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => log(`Server listening on port ${port}`));
}
