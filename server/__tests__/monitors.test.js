const request = require('supertest');
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const app = require('../server');
const User = require('../src/models/User');
const Monitor = require('../src/models/Monitor');

describe('Monitor API & Multi-Tenant Security Tests', () => {
  let userAToken = '';
  let userBToken = '';
  let userAMonitorId = '';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();
    await User.deleteMany({ email: { $in: ['usera@example.com', 'userb@example.com'] } });

    // Register User A
    const resA = await request(app).post('/api/auth/register').send({
      name: 'User A',
      email: 'usera@example.com',
      password: 'password123'
    });
    userAToken = resA.body.token;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send({
      name: 'User B',
      email: 'userb@example.com',
      password: 'password123'
    });
    userBToken = resB.body.token;
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['usera@example.com', 'userb@example.com'] } });
    if (userAMonitorId) {
      await Monitor.findByIdAndDelete(userAMonitorId);
    }
    await mongoose.connection.close();
  });

  it('should allow User A to create a new monitor', async () => {
    const res = await request(app)
      .post('/api/monitors')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'User A Service',
        url: 'https://api.github.com/zen',
        interval: 5,
        timeout: 5000
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('_id');
    userAMonitorId = res.body._id;
  });

  it('should allow User A to list their own monitor', async () => {
    const res = await request(app)
      .get('/api/monitors')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((m) => m._id === userAMonitorId)).toBe(true);
  });

  it('should PREVENT User B from accessing User A monitor (Multi-tenant security scoping)', async () => {
    const res = await request(app)
      .get(`/api/monitors/${userAMonitorId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('message');
  });
});
