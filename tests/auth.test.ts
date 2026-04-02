// Auth — login endpoint tests
import request from 'supertest';
import app     from '../src/server';

describe('POST /api/influwatch/auth/login', () => {
  it('returns 400 when email/password missing', async () => {
    const res = await request(app).post('/api/influwatch/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/influwatch/auth/login')
      .send({ email: 'j.harlow@fundurex.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/influwatch/auth/login')
      .send({ email: 'nobody@example.com', password: 'influwatch2026' });
    expect(res.status).toBe(401);
  });

  it('returns 200 with token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/influwatch/auth/login')
      .send({ email: 'j.harlow@fundurex.com', password: 'influwatch2026' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.actor).toHaveProperty('role', 'REGISTERED_PRINCIPAL');
  });
});
