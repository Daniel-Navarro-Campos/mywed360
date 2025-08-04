import request from 'supertest';
import { vi, describe, it, expect, beforeAll } from 'vitest';

process.env.FRONTEND_BASE_URL = 'http://localhost:5173';

// ---- Mock firebase-admin ----
const mockGuestData = {
  token: 'mocktoken',
  name: 'John Doe',
  status: 'pending',
  companions: 0,
  allergens: '',
};

const firestoreStub = () => {
  // Collection stub decides by collection name
  const collection = vi.fn((colName) => {
    if (colName === 'guests') {
      return {
        doc: vi.fn((id) => {
          // docRef stub
          return {
            set: vi.fn().mockResolvedValue(undefined),
            update: vi.fn().mockResolvedValue(undefined),
            get: vi.fn().mockResolvedValue({
              exists: true,
              data: () => ({ ...mockGuestData, token: id ?? 'mocktoken' }),
            }),
          };
        }),
      };
    }
    // default fallthrough
    return { doc: vi.fn(() => ({ set: vi.fn(), update: vi.fn(), get: vi.fn() })) };
  });
  return { collection };
};

vi.mock('firebase-admin', () => {
  const FieldValue = { serverTimestamp: () => new Date('2025-01-01') };
  const firestore = firestoreStub;
  return {
    __esModule: true,
    default: { firestore, apps: [], credential: { applicationDefault: vi.fn() }, initializeApp: vi.fn() },
    firestore,
    credential: { applicationDefault: vi.fn() },
    apps: [],
  };
});

// Mock uuid
vi.mock('uuid', () => {
  return {
    __esModule: true,
    v4: () => 'mocktoken',
  };
});

import app from '../index.js';

const api = request(app);

describe('Guests API', () => {
  it('POST /api/guests/invite crea invitación', async () => {
    const res = await api.post('/api/guests/invite').send({ name: 'John Doe' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ token: 'mocktoken', link: 'http://localhost:5173/rsvp/mocktoken' });
  });

  it('POST /api/guests/invite sin nombre ⇒ 400', async () => {
    const res = await api.post('/api/guests/invite').send({});
    expect(res.status).toBe(400);
  });

  it('GET /api/guests/:token devuelve datos básicos', async () => {
    const res = await api.get('/api/guests/mocktoken');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      name: 'John Doe',
      status: 'pending',
      companions: 0,
      allergens: '',
    });
  });

  it('PUT /api/guests/:token con estado inválido ⇒ 400', async () => {
    const res = await api.put('/api/guests/mocktoken').send({ status: 'maybe' });
    expect(res.status).toBe(400);
  });

  it('PUT /api/guests/:token accepted ⇒ ok', async () => {
    const res = await api.put('/api/guests/mocktoken').send({ status: 'accepted', companions: 2 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
