/**
 * @file server.js
 * @description Production-grade backend for BharatVoter Guide.
 * Implements advanced security, performance optimization, and AI grounding.
 */

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

// Enable trust proxy for Cloud Run/App Engine environments
app.set('trust proxy', 1);

/**
 * LOGGING SYSTEM
 * Centralized audit trail with local console and cloud integration.
 */
const transports = [new winston.transports.Console()];
if (process.env.NODE_ENV === 'production') {
    transports.push(new LoggingWinston());
}
const logger = winston.createLogger({
    level: 'info',
    transports: transports,
});

/**
 * CACHE ARCHITECTURE
 * Reduces API latency and token consumption by caching repeated queries.
 */
const responseCache = new LRUCache({
    max: 500,
    ttl: 1000 * 60 * 60 * 24, // 24-hour persistence for stable election info
});

/**
 * SECURITY PROTOCOLS (Helmet & CSP)
 * Implements strict headers to prevent XSS, Clickjacking, and Sniffing.
 */
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "https://www.googletagmanager.com", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
            "connect-src": ["'self'", "https://www.google-analytics.com"],
            "img-src": ["'self'", "data:", "https://www.gstatic.com"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Favicon Fix
app.get('/favicon.ico', (req, res) => res.status(204).end());

/**
 * PERFORMANCE OPTIMIZATION
 * Implements Gzip compression and static asset caching.
 */
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Prevents large payload DoS attacks

// Optimized Static Asset Serving
app.use(express.static('public', {
    maxAge: '1d',
    etag: true,
}));

/**
 * AI CORE INITIALIZATION
 */
let model;
try {
    if (process.env.GOOGLE_API_KEY) {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        // Using gemini-flash-latest for industry-leading speed and efficiency
        model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    }
} catch (e) {
    logger.error('AI Initialization Failed:', e);
}

// Resilient Mock Layer
if (!model) {
    model = { startChat: () => ({ sendMessage: async () => ({ response: { text: () => "AI temporarily offline." } }) }) };
}

/**
 * API ENDPOINTS
 */

/** @route GET /health */
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

/** @route POST /api/chat */
app.post('/api/chat', [
    body('message').isString().trim().isLength({ min: 1, max: 1000 }).escape(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Invalid query parameters." });
    }

    try {
        const { message, history } = req.body;
        const cacheKey = `chat_v2_${message}_${JSON.stringify(history)}`;
        
        if (responseCache.has(cacheKey)) {
            return res.json({ response: responseCache.get(cacheKey), cached: true });
        }

        const systemPrompt = "Role: BharatVoter Assistant. Goal: Explain Indian election process clearly using ECI guidelines. Rule: No dates, no politics.";
        
        const chat = model.startChat({ history: history || [] });
        const result = await chat.sendMessage(systemPrompt + "\nUser: " + message);
        const text = result.response.text(); 

        responseCache.set(cacheKey, text);
        res.json({ response: text });
    } catch (error) {
        logger.error('Chat Engine Failure:', error);
        
        if (error.status === 429) {
            return res.status(429).json({ error: "API Rate Limit. Please try again tomorrow." });
        }
        
        res.status(500).json({ error: "Internal processing error." });
    }
});

export default app;

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        logger.info(`BharatVoter Production Node active on port ${port}`);
    });
}
