import { jest } from '@jest/globals';
import request from 'supertest';

// 1. Mock MUST be defined before importing the app in ESM
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

// 2. Dynamically import the app after the mock is set
const { default: app } = await import('./server.js');

describe('BharatVoter Production API - Final Validation', () => {
    
    test('System Health Check', async () => {
        const response = await request(app).get('/health');
        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('healthy');
    });

    test('Frontend Delivery', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
        expect(response.text).toContain('Bharat Voter Guide');
    });

    test('Chat API Handling (Mocked)', async () => {
        const response = await request(app)
            .post('/api/chat')
            .send({ message: "Register to vote", history: [] });
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('response');
    });

    test('Input Validation - Empty String', async () => {
        const response = await request(app)
            .post('/api/chat')
            .send({ message: "", history: [] });
        expect(response.statusCode).toBe(400);
    });

    test('Security - Payload Limit Violation', async () => {
        const massiveMessage = "a".repeat(1001);
        const response = await request(app)
            .post('/api/chat')
            .send({ message: massiveMessage, history: [] });
        expect(response.statusCode).toBe(400);
    });
});
