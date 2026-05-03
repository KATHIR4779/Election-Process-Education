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
import { LRUCache } from 'lru-cache';
import { body, validationResult } from 'express-validator';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Enable trust proxy for Cloud Run to prevent rate-limit crashes
app.set('trust proxy', 1);

/**
 * GOOGLE CLOUD LOGGING SETUP
 * Integrated with Winston for centralized audit trails.
 */
const transports = [new winston.transports.Console()];

// Only add Google Cloud Logging if we're in production to prevent local authentication errors
if (process.env.NODE_ENV === 'production') {
    transports.push(new LoggingWinston());
}

const logger = winston.createLogger({
    level: 'info',
    transports: transports,
});

/**
 * CACHING LAYER
 * Efficiently caches AI responses for 1 hour to reduce API calls and latency.
 */
const responseCache = new LRUCache({
    max: 100,
    ttl: 1000 * 60 * 60, // 1 hour
});

/**
 * SECURITY MIDDLEWARE
 */
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

let model;
try {
    if (process.env.GOOGLE_API_KEY) {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        // Using gemini-1.5-flash as the primary stable model for maximum compatibility
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
} catch (e) {
    logger.error('Failed to initialize AI model:', e);
}

// Fallback mock if initialization fails completely
if (!model) {
    model = { startChat: () => ({ sendMessage: async () => ({ response: { text: () => "AI Service currently unavailable." } }) }) };
}

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

const systemPrompt = `
You are the "BharatVoter AI Assistant," a highly accurate expert on the Indian Electoral Process.
STRICT GUIDELINES:
1. Prioritize ECI guidelines (Form 6, 8, etc.).
2. DO NOT hallucinate dates. Redirect to voters.eci.gov.in.
3. Maintain political neutrality.
`;

app.post('/api/chat', [
    body('message').isString().trim().isLength({ min: 1, max: 500 }).escape(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Invalid input provided." });
    }

    try {
        const { message, history } = req.body;
        const cacheKey = `chat_${message}_${JSON.stringify(history)}`;
        
        if (responseCache.has(cacheKey)) {
            return res.json({ response: responseCache.get(cacheKey), cached: true });
        }

        // Safety check to ensure model is ready
        if (!model || typeof model.startChat !== 'function') {
            throw new Error('AI Model not initialized correctly');
        }

        const chat = model.startChat({
            history: history || [],
        });

        const result = await chat.sendMessage(systemPrompt + "\nUser Query: " + message);
        const text = result.response.text(); 

        responseCache.set(cacheKey, text);
        res.json({ response: text });
    } catch (error) {
        logger.error('Chat error:', error);
        
        // Handle specific Google API Errors
        if (error.message?.includes('429') || error.status === 429) {
            return res.status(429).json({ error: "AI Daily Quota Exceeded. The free limit (20 requests/day) has been reached. Please try again tomorrow." });
        }
        
        if (error.message?.includes('404') || error.status === 404) {
            return res.status(503).json({ error: "AI Model is currently being updated by Google. Please try again in a few minutes." });
        }

        res.status(500).json({ error: "Internal Server Error. Please refresh and try again." });
    }
});

export default app;

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        logger.info(`BharatVoter Server running on port ${port}`);
    });
}
