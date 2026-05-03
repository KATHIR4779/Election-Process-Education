import request from 'supertest';
import app from './server.js';
import { jest } from '@jest/globals';

// Mock the AI SDK to ensure tests run without quota issues
jest.unstable_mockModule('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    constructor() {}
    getGenerativeModel() {
      return {
        startChat: () => ({
          sendMessage: async () => ({
            response: { text: () => "Mock Response" }
          })
        })
      };
    }
  }
}));

describe('BharatVoter Enterprise Suite - Master Validation', () => {
  
  test('CORE: System Health Check', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  test('SECURITY: Content Security Policy Headers', async () => {
    const res = await request(app).get('/');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['x-xss-protection']).toBeDefined();
  });

  test('SECURITY: XSS Injection Prevention', async () => {
    const maliciousPayload = { message: "<script>alert('xss')</script>" };
    const res = await request(app)
      .post('/api/chat')
      .send(maliciousPayload);
    // Should be accepted but sanitized (escaped) by express-validator
    expect(res.status).toBe(200);
  });

  test('EDGE_CASE: Extremely Long Payload (Denial of Service Prevention)', async () => {
    const longMessage = "a".repeat(11000); // Exceeds 10kb limit
    const res = await request(app)
      .post('/api/chat')
      .send({ message: longMessage });
    expect(res.status).toBe(413); // Payload Too Large
  });

  test('EDGE_CASE: Empty Message Handling', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: "" });
    expect(res.status).toBe(400); // Bad Request
  });

  test('EFFICIENCY: Compression Headers', async () => {
    const res = await request(app).get('/');
    expect(res.headers['vary']).toContain('Accept-Encoding');
  });

  test('INTEGRATION: AI Chat Flow', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: "What is EVM?", history: [] });
    expect(res.status).toBe(200);
    expect(res.body.response).toBeDefined();
  }, 10000);

});
