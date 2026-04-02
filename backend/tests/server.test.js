const request = require('supertest');
const app = require('../server');

describe('ApnaResume Backend', () => {
  test('GET /api/health returns 200', async () => {
    const response = await request(app)
      .get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('Legacy auth register route returns 410', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test@123',
        name: 'Test User'
      });

    expect(response.status).toBe(410);
    expect(response.body.error).toMatch(/legacy \/api\/auth endpoints are removed/i);
  });

  test('Legacy auth logout route returns 410', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .send({});

    expect(response.status).toBe(410);
  });

  test('Legacy auth logout-all route returns 410', async () => {
    const response = await request(app)
      .post('/api/auth/logout-all')
      .send({});

    expect(response.status).toBe(410);
  });

  test('Legacy auth verify-email route returns 410', async () => {
    const response = await request(app)
      .post('/api/auth/verify-email')
      .send({ email: 'test@example.com', token: 'invalid-token' });

    expect(response.status).toBe(410);
  });

  test('Legacy auth resend-verification route returns 410', async () => {
    const response = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: 'test@example.com' });

    expect(response.status).toBe(410);
  });

  test('Legacy auth forgot-password route returns 410', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'test@example.com' });

    expect(response.status).toBe(410);
  });

  test('Legacy auth reset-password route returns 410', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({
        email: 'test@example.com',
        token: 'invalid-token',
        new_password: 'NewPass123'
      });

    expect(response.status).toBe(410);
    expect(response.body.message).toMatch(/use clerk sign-in and sign-up flows/i);
  });
});
