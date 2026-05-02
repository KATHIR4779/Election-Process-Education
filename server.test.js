import { jest } from '@jest/globals';
import request from 'supertest';

jest.unstable_mockModule('@google/generative-ai', () => ({
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockImplementation(() => ({
            sendMessageStream: jest.fn().mockImplementation(() => ({
                stream: (async function* () {
                    yield { text: () => "Mocked " };
                    yield { text: () => "Streaming " };
                    yield { text: () => "Response" };
                })()
            })),
            startChat: jest.fn().mockImplementation(() => ({
                sendMessageStream: jest.fn().mockImplementation(() => ({
                    stream: (async function* () {
                        yield { text: () => "Mocked " };
                        yield { text: () => "Streaming " };
                        yield { text: () => "Response" };
                    })()
                }))
            }))
        }))
    }))
}));

const { default: app } = await import('./server.js');

describe('BharatVoter Streaming API Tests', () => {
    
    test('System Health Check', async () => {
        const response = await request(app).get('/health');
        expect(response.statusCode).toBe(200);
    });

    test('Chat API Streaming - Valid Request', async () => {
        const response = await request(app)
            .post('/api/chat')
            .send({ message: "Hello", history: [] });
        
        expect(response.statusCode).toBe(200);
        expect(response.header['transfer-encoding']).toBe('chunked');
        expect(response.text).toContain("Mocked Streaming Response");
    });

    test('Input Validation - Empty String', async () => {
        const response = await request(app)
            .post('/api/chat')
            .send({ message: "", history: [] });
        expect(response.statusCode).toBe(400);
    });
});
