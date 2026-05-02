import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import compression from 'compression';
import { body, validationResult } from 'express-validator';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [new winston.transports.Console()],
});

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "https://www.googletagmanager.com", "'unsafe-inline'"],
            "connect-src": ["'self'", "https://www.google-analytics.com", "*.run.app"],
        },
    },
}));

// Compression settings
app.use((req, res, next) => {
    if (req.path === '/api/chat') {
        next();
    } else {
        compression()(req, res, next);
    }
});

app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static('public'));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Use the STABLE gemini-pro model
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

const systemPrompt = `
You are the "BharatVoter AI Assistant."
Expert on Indian Elections. Provide accurate, non-partisan info.
Use Markdown.
`;

app.post('/api/chat', [
    body('message').isString().trim().notEmpty().escape(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: "Invalid input." });

    try {
        const { message, history } = req.body;
        
        // Use standard generation (non-stream) for maximum reliability first
        const chat = model.startChat({
            history: history || [],
        });

        const result = await chat.sendMessage(systemPrompt + "\nUser Query: " + message);
        const text = result.response.text();

        res.json({ response: text });
    } catch (error) {
        logger.error('Chat error:', error);
        res.status(500).json({ error: "The AI Assistant is currently busy. Please try again." });
    }
});

export default app;

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        logger.info(`BharatVoter Server running on port ${port}`);
    });
}
