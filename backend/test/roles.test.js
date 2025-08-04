import request from 'supertest';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock firebase-admin with a minimal Firestore stub ----------------------------------
vi.mock('firebase-admin', () => {
  const getMock = vi.fn().mockResolvedValue({ exists: true, data: () => ({ role: 'owner' }) });
  const setMock = vi.fn().mockResolvedValue();
  const deleteMock = vi.fn().mockResolvedValue();

  // Recursive stub helpers
  const makeDoc = () => ({ get: getMock, set: setMock, delete: deleteMock });
  const makeCollection = () => ({
    doc: vi.fn(() => ({ ...makeCollection(), ...makeDoc() })),
    get: vi.fn().mockResolvedValue({
      docs: [
        { id: 'user1', data: () => ({ role: 'owner' }) },
        { id: 'user2', data: () => ({ role: 'assistant' }) },
      ],
    }),
  });

  const firestore = () => ({ collection: vi.fn(() => makeCollection()) });

  return {
    __esModule: true,
    default: { firestore },
    firestore,
  };
});

process.env.NODE_ENV = 'test';
import app from '../index.js';

const AUTH_HEADER = { Authorization: 'Bearer ownerUid' };

describe('Roles API', () => {
  it('GET /api/roles/:eventId devuelve la lista de miembros', async () => {
    const res = await request(app)
      .get('/api/roles/wed123')
      .set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ uid: 'user1', role: 'owner' }),
        expect.objectContaining({ uid: 'user2', role: 'assistant' }),
      ]),
    );
  });

  it('POST /api/roles/:eventId/assign asigna rol válido', async () => {
    const res = await request(app)
      .post('/api/roles/wed123/assign')
      .set(AUTH_HEADER)
      .send({ uid: 'newUser', role: 'assistant' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('POST /api/roles/:eventId/assign rechaza rol inválido', async () => {
    const res = await request(app)
      .post('/api/roles/wed123/assign')
      .set(AUTH_HEADER)
      .send({ uid: 'newUser', role: 'hacker' });

    expect(res.status).toBe(400);
  });

  it('DELETE /api/roles/:eventId/:uid elimina colaborador', async () => {
    const res = await request(app)
      .delete('/api/roles/wed123/user2')
      .set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
