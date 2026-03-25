const request = require('supertest');
const app = require('../server');

describe('ApnaResume Backend', () => {
  test('GET /api/health returns 200', async () => {
    const response = await request(app)
      .get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('Auth routes exist', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test@123',
        name: 'Test User'
      });

    // Should either succeed, return validation error, or 503 when DB is unavailable
    expect([200, 201, 400, 409, 503]).toContain(response.status);
  });

  test('Logout route exists and enforces auth', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .send({});

    expect([401, 403, 503]).toContain(response.status);
  });

  test('Logout-all route exists and enforces auth', async () => {
    const response = await request(app)
      .post('/api/auth/logout-all')
      .send({});

    expect([401, 403, 503]).toContain(response.status);
  });

  test('Verify-email route exists', async () => {
    const response = await request(app)
      .post('/api/auth/verify-email')
      .send({ email: 'test@example.com', token: 'invalid-token' });

    expect([200, 400, 404, 503]).toContain(response.status);
  });

  test('Resend-verification route exists', async () => {
    const response = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: 'test@example.com' });

    expect([200, 400, 503]).toContain(response.status);
  });

  test('Forgot-password route exists', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'test@example.com' });

    expect([200, 400, 503]).toContain(response.status);
  });

  test('Reset-password route exists', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: 'test@example.com',
        token: 'invalid-token',
        new_password: 'NewPass123'
      });

    expect([200, 400, 404, 503]).toContain(response.status);
  });
});
