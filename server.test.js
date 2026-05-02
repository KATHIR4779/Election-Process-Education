import request from 'supertest';
import app from './server.js';

describe('Election Assistant API', () => {
    test('GET / should return index.html', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
        expect(response.text).toContain('Bharat Voter Guide');
    });

    test('POST /api/chat should return error if no message provided', async () => {
        const response = await request(app)
            .post('/api/chat')
            .send({});
        expect(response.statusCode).toBe(500); // Because it currently fails on req.body.message
    });
});
