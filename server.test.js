import request from 'supertest';
import app from './server.js';
import { jest } from '@jest/globals';

// Mocking the Google Generative AI SDK
jest.unstable_mockModule('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockImplementation(() => ({
            generateContent: jest.fn().mockResolvedValue({
                response: { text: () => "Mocked AI Response" }
            })
        }))
    }))
}));

describe('Election Assistant API', () => {
    test('GET / should return index.html', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
        expect(response.text).toContain('Bharat Voter Guide');
    });

    test('POST /api/chat should return a valid response', async () => {
        const response = await request(app)
            .post('/api/chat')
            .send({ message: "Hello", history: [] });
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('response');
    }, 10000); // Increased timeout
});
