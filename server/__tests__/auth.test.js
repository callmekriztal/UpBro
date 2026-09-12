const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../src/models/User');

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    // Set test env
    process.env.NODE_ENV = 'test';
    // Clear user test database
    await User.deleteMany({ email: 'jesttest@example.com' });
  });

  afterAll(async () => {
    await User.deleteMany({ email: 'jesttest@example.com' });
    await mongoose.connection.close();
  });

  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Jest Tester',
        email: 'jesttest@example.com',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('email', 'jesttest@example.com');
  });

  it('should log in an existing user with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jesttest@example.com',
        password: 'password123'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jesttest@example.com',
        password: 'wrongpassword'
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message');
  });
});
