import request from 'supertest';
import app from '../index.js';

// Test de smoke para comprobar que el backend levanta y responde

describe('GET / (health check)', () => {
  it('debe responder con status ok', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'lovenda-backend' });
  });
});
