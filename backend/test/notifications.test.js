import request from 'supertest';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock db.js to stub Firestore behaviour -------------------------------------------
vi.mock('../db.js', () => {
  const dataStore = new Map();

  const collection = (name) => {
    if (!dataStore.has(name)) dataStore.set(name, new Map());
    const col = dataStore.get(name);

    return {
      // GET collection (orderBy mocked to ignore params)
      orderBy: () => ({
        get: async () => ({
          docs: Array.from(col.entries()).map(([id, d]) => ({ id, data: () => d })),
        }),
      }),
      get: async () => ({
        docs: Array.from(col.entries()).map(([id, d]) => ({ id, data: () => d })),
      }),
      // ADD document
      add: async (doc) => {
        const id = `notif_${col.size + 1}`;
        col.set(id, doc);
        return { id };
      },
      // Return a doc ref helper
      doc: (id) => ({
        get: async () => ({ exists: col.has(id), data: () => col.get(id) }),
        update: async (fields) => {
          if (!col.has(id)) throw new Error('not found');
          col.set(id, { ...col.get(id), ...fields });
        },
        delete: async () => {
          col.delete(id);
        },
      }),
    };
  };

  return { __esModule: true, db: { collection } };
});

process.env.NODE_ENV = 'test';
import app from '../index.js';

describe('Notifications API', () => {
  const base = '/api/notifications';

  it('POST / crea notificación', async () => {
    const res = await request(app).post(base).send({ type: 'info', message: 'Hola' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual(
      expect.objectContaining({ id: expect.any(String), type: 'info', message: 'Hola', read: false }),
    );
  });

  it('GET / devuelve lista', async () => {
    // hay al menos 1 de la prueba anterior
    const res = await request(app).get(base);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('PATCH /:id/read marca como leída', async () => {
    const create = await request(app).post(base).send({ message: 'Marcar lectura' });
    const { id } = create.body;

    const patch = await request(app).patch(`${base}/${id}/read`).send();
    expect(patch.status).toBe(200);
    expect(patch.body).toEqual(expect.objectContaining({ id, read: true }));
  });

  it('DELETE /:id elimina notificación', async () => {
    const create = await request(app).post(base).send({ message: 'Eliminar' });
    const { id } = create.body;

    const del = await request(app).delete(`${base}/${id}`);
    expect(del.status).toBe(204);

    const list = await request(app).get(base);
    // debe no existir
    expect(list.body.find((n) => n.id === id)).toBeUndefined();
  });
});
