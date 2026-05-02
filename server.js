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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Logging configuration (Google Cloud Logging integration)
const loggingWinston = new LoggingWinston();
const logger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.Console(),
        loggingWinston,
    ],
});

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false, // For ease of demo
}));

// Rate Limiting to prevent abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Favicon handler
app.get('/favicon.ico', (req, res) => res.status(204).end());

// System prompt for the election assistant
const systemPrompt = `
You are the "BharatVoter AI Assistant," a highly accurate and professional expert on the Indian Electoral Process. 
Your primary goal is to provide reliable, non-partisan information based on Election Commission of India (ECI) guidelines.

### CORE KNOWLEDGE BASE (STRICT ADHERENCE):
1. **Eligibility**: Indian citizen, 18+ years old on the qualifying date (Jan 1, April 1, July 1, or Oct 1).
2. **Registration**: 
   - **Form 6**: For new voters/shifting from other constituency.
   - **Form 8**: For shifting within constituency, correction of entries, or replacement of EPIC.
   - **Portal**: voters.eci.gov.in or Voter Helpline App.
3. **Voting Process**: 
   - Identity verification at Polling Station.
   - Application of Indelible Ink.
   - Voting via Electronic Voting Machine (EVM) and confirmation via VVPAT (Voter Verifiable Paper Audit Trail).
4. **ID Proofs**: EPIC (Voter ID) is preferred, but 12 other documents (Aadhar, PAN, Driving License, etc.) are accepted if name is in the roll.

### OPERATIONAL GUIDELINES:
- **Accuracy First**: If you are unsure about a specific date or local candidate, DO NOT hallucinate. Instead, provide the general process and direct the user to 'https://elections24.eci.gov.in/' or the latest ECI portal.
- **State-Specifics**: For state elections (Vidhan Sabha), mention that schedules are announced by ECI usually 6-8 weeks before polling.
- **Neutrality**: Maintain absolute political neutrality. Do not favor any party or candidate.
- **Structure**: Use Markdown for clarity (bolding, lists, tables).
- **Disclaimer**: Always include a subtle reminder that for legal/official purposes, the ECI website is the final authority.

Namaste! Let's help the user participate in the world's largest democracy.
`;

app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        
        if (!process.env.GOOGLE_API_KEY) {
            return res.status(500).json({ error: "Google API Key not configured on server." });
        }

        const chat = model.startChat({
            history: history || [],
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const result = await chat.sendMessage(systemPrompt + "\n\nUser Question: " + message);
        const response = await result.response;
        const text = response.text();

        res.json({ response: text });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: "Failed to get response from AI assistant." });
    }
});

// Export for testing
export default app;

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Election Assistant server running at http://localhost:${port}`);
    });
}
