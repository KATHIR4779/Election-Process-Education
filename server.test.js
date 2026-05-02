import request from 'supertest';
import app from './server.js';
import { jest } from '@jest/globals';

// Mocking the Google Generative AI SDK
jest.unstable_mockModule('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockImplementation(() => ({
            generateContent: jest.fn().mockResolvedValue({
                response: { text: () => "Mocked AI Response" }
            }),
            startChat: jest.fn().mockImplementation(() => ({
                sendMessage: jest.fn().mockResolvedValue({
                    response: { text: () => "Mocked AI Response" }
                })
            }))
        }))
    }))
}));

describe('BharatVoter Production API Tests', () => {
    
    test('GET /health returns healthy status', async () => {
        const response = await request(app).get('/health');
        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('healthy');
    });

    test('GET / serves the index page', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
        expect(response.text).toContain('Bharat Voter Guide');
    });

    test('POST /api/chat handles valid voter queries', async () => {
        const response = await request(app)
            .post('/api/chat')
            .send({ message: "How do I register?", history: [] });
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('response');
    }, 15000); // 15s timeout for CI stability

    test('POST /api/chat rejects empty queries (Input Validation)', async () => {
        const response = await request(app)
            .post('/api/chat')
            .send({ message: "", history: [] });
        expect(response.statusCode).toBe(400);
    });

    test('POST /api/chat rejects long queries (Security)', async () => {
        const longMessage = "a".repeat(1001);
        const response = await request(app)
            .post('/api/chat')
            .send({ message: longMessage, history: [] });
        expect(response.statusCode).toBe(400);
    });
});
