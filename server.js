import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';
import compression from 'compression';
import { body, validationResult } from 'express-validator';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

const loggingWinston = new LoggingWinston();
const logger = winston.createLogger({
    level: 'info',
    transports: [new winston.transports.Console(), loggingWinston],
});

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "https://www.googletagmanager.com", "'unsafe-inline'"],
            "connect-src": ["'self'", "https://www.google-analytics.com"],
        },
    },
}));

app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static('public'));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Initialize Gemini with the FAST model
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

const systemPrompt = `
You are the "BharatVoter AI Assistant," an expert on the Indian Electoral Process.
KEEP RESPONSES CONCISE AND FAST.
1. Prioritize ECI guidelines.
2. Redirect to voters.eci.gov.in for dates.
3. Use Markdown.
`;

/**
 * STREAMING CHAT API
 * Provides near-instant visual feedback by streaming chunks.
 */
app.post('/api/chat', [
    body('message').isString().trim().isLength({ min: 1, max: 500 }).escape(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: "Invalid input." });

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
        const { message, history } = req.body;
        const chat = model.startChat({ history: history || [] });

        const result = await chat.sendMessageStream(systemPrompt + "\nUser Query: " + message);

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            res.write(chunkText);
        }
        
        res.end();
    } catch (error) {
        logger.error('Streaming error:', error);
        res.status(500).write("Service temporarily slow. Please try again.");
        res.end();
    }
});

export default app;

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        logger.info(`BharatVoter Server running on port ${port}`);
    });
}
