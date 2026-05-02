import { jest } from '@jest/globals';
import request from 'supertest';

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

const { default: app } = await import('./server.js');

describe('BharatVoter Stable API Tests', () => {
    
    test('System Health Check', async () => {
        const response = await request(app).get('/health');
        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('healthy');
    });

    test('Chat API - Valid Request', async () => {
        const response = await request(app)
            .post('/api/chat')
            .send({ message: "Hello", history: [] });
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('response');
        expect(response.body.response).toBe("Mocked AI Response");
    });

    test('Input Validation - Empty String', async () => {
        const response = await request(app)
            .post('/api/chat')
            .send({ message: "", history: [] });
        expect(response.statusCode).toBe(400);
    });
});
