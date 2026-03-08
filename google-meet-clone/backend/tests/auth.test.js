const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../server');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

describe('Auth API Endpoints', () => {
    // Connect to an in-memory or alternative test database before all tests
    beforeAll(async () => {
        const url = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/google-meet-clone-test';
        await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    });

    // Clean the db after each test
    afterEach(async () => {
        await User.deleteMany({});
    });

    // Close server and database connection
    afterAll(async () => {
        await mongoose.connection.close();
        server.close(); // Close socket.io http server
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe('test@example.com');
        });

        it('should not register a user with an existing email', async () => {
            // First, create a user
            await User.create({
                name: 'Existing',
                email: 'exist@example.com',
                password: 'password123'
            });

            // Try to create again
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'New User',
                    email: 'exist@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('User already exists');
        });

        it('should require all fields', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ name: 'Test' });

            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('Please provide all required fields');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should log in an existing user and return a token', async () => {
            // Direct insertion (Remember the pre-save hook handles hashing if we use .create)
            await User.create({
                name: 'Login Test',
                email: 'login@example.com',
                password: 'password123'
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user.email).toBe('login@example.com');
        });

        it('should fail with incorrect password', async () => {
            await User.create({
                name: 'Login Test',
                email: 'login@example.com',
                password: 'password123'
            });

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body.message).toBe('Invalid Credentials');
        });
    });

    describe('GET /api/auth/me', () => {
        it('should access protected route with valid token', async () => {
            // Register, then use the returned token
            const regRes = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Protect Test',
                    email: 'protect@example.com',
                    password: 'password123'
                });

            const token = regRes.body.token;

            const res = await request(app)
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.email).toBe('protect@example.com');
        });

        it('should block access without standard token format', async () => {
            const res = await request(app)
                .get('/api/auth/me');

            expect(res.statusCode).toEqual(401);
        });
    });
});
