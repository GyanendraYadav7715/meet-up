const request = require('supertest');
const mongoose = require('mongoose');
jest.mock('jsdom', () => ({ JSDOM: class { constructor() { this.window = {}; } } }));
jest.mock('dompurify', () => () => ({ sanitize: (str) => str }));
const { app, server } = require('../server');
const Log = require('../models/Log');
const logger = require('../utils/logger'); // Ensure stream captures

describe('Structured Logging API Overheads', () => {

    beforeAll(async () => {
        // Use a test database
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect('mongodb://localhost:27017/google-meet-clone-test');
        }
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        server.close();
    });

    afterEach(async () => {
        await Log.deleteMany({});
    });

    it('should query logs via /api/logs in non-production environments', async () => {
        // Manually write a test log to mongo
        await Log.create({
            level: 'info',
            message: 'Test log entry for querying',
            meta: { testData: 'Testing Data' }
        });

        const res = await request(app)
            .get('/api/logs?level=info')
            .send();

        expect(res.statusCode).toEqual(200);
        expect(res.body.logs.length).toBe(1);
        expect(res.body.logs[0].message).toBe('Test log entry for querying');
    });

    it('should redact sensitive PII data in winston formatter', () => {
        const testPayload = {
            level: 'info',
            message: 'User authentication attempt',
            meta: { email: 'user@test.com', password: 'secret-password-123' }
        };

        // Redact formatter mutates the returned object by cloning, preserving safe structure but destroying passwords
        let formatted = logger.format.transform(testPayload);

        expect(formatted.meta.password).toBe('[REDACTED]');
        expect(formatted.meta.email).toBe('user@test.com'); // standard user attributes preserved
    });

    it('should successfully log a failed login attempt with Winston', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: "does_not_exist@fake.com",
                password: "wrong"
            });

        expect(res.statusCode).toBe(401);

        // Allow Winston to flush the stream to Mongo asynchronously
        await new Promise(resolve => setTimeout(resolve, 500));

        const logs = await Log.find({ message: /Login failed/ });
        expect(logs.length).toBeGreaterThan(0);
        expect(logs[0].meta.email).toBe('does_not_exist@fake.com');
        expect(logs[0].level).toBe('warn');
    });
});
