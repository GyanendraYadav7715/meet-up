const request = require('supertest');
const { app } = require('../server');
const mongoose = require('mongoose');

describe('Security Headers & Injection', () => {

    it('should have strict Helmet security headers', async () => {
        const res = await request(app).get('/');
        // Helmet headers evaluation
        expect(res.headers['x-dns-prefetch-control']).toBe('off');
        expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
        expect(res.headers['strict-transport-security']).toBe('max-age=15552000; includeSubDomains');
        expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    });

    it('should prevent NoSQL injection on login', async () => {
        // payload typical for NoSQL boolean based injection
        const maliciousPayload = {
            email: { "$gt": "" },
            password: "password123"
        };

        const res = await request(app)
            .post('/api/auth/login')
            .send(maliciousPayload);

        // Express-mongo-sanitize should strip or block this, resulting in invalid credentials or bad request (400/401), not 200 or 500
        expect([400, 401]).toContain(res.status);
    });

    it('should apply rate limiting to auth endpoints', async () => {
        // Hit the endpoint 4 times (limit is 3 for authLimiter)
        for (let i = 0; i < 3; i++) {
            await request(app).post('/api/auth/login').send({ email: 'test@test.com', password: 'test' });
        }

        const finalRes = await request(app).post('/api/auth/login').send({ email: 'test@test.com', password: 'test' });
        expect(finalRes.status).toBe(429); // Too Many Requests
    });
});
