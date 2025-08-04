import request from 'supertest';
import { vi, describe, it, expect, beforeAll } from 'vitest';

const axiosMock = { get: vi.fn().mockResolvedValue({ data: { organic_results: [{ title: 'Foto', link: 'http://ejemplo.com', snippet: 'desc' }] } }) };
vi.mock('axios', () => axiosMock);
// Mock Firestore to evitar conexiones reales
vi.mock('../db.js', () => ({
  __esModule: true,
  db: { collection: () => ({}) },
}));

// Asegurar que el backend no arranca servidor
process.env.NODE_ENV = 'test';

// Set env var para la ruta
beforeAll(() => {
  process.env.SERPAPI_API_KEY = 'dummy';
});

import app from '../index.js';

describe('AI Routes', () => {
  it('GET /api/ai/search-suppliers devuelve 5 resultados máx', async () => {
    const res = await request(app).get('/api/ai/search-suppliers?q=fotografo');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBeGreaterThan(0);
    expect(res.body.results[0]).toEqual(
      expect.objectContaining({ title: expect.any(String), link: expect.any(String), snippet: expect.any(String) }),
    );
  });

  it('GET /api/ai/search-suppliers sin q devuelve 400', async () => {
    const res = await request(app).get('/api/ai/search-suppliers');
    expect(res.status).toBe(400);
  });
});
