import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { getFirestore, doc, setDoc, getDoc, collection } from 'firebase/firestore';
import { beforeAll, afterAll, describe, test, expect } from 'vitest';

let testEnv; /** @type {RulesTestEnvironment} */

const PROJECT_ID = 'mywed360-test';

beforeAll(async () => {
  // Carga las reglas del archivo real del proyecto
  const rules = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules }
  });

  // Semilla de datos: crear una boda con distintos roles
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = getFirestore(ctx.app);

    const weddingDoc = doc(db, 'weddings', 'w1');
    await setDoc(weddingDoc, {
      ownerIds: ['owner1'],
      plannerIds: ['planner1'],
      assistantIds: ['assistant1'],
      name: 'Test Wedding'
    });

    // Subcolección de tareas
    await setDoc(doc(db, 'weddings', 'w1', 'tasks', 't1'), {
      name: 'Reservar catering',
      completed: false
    });
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

const getContext = (uid) => {
  if (!uid) return testEnv.unauthenticatedContext();
  return testEnv.authenticatedContext(uid);
};

describe('Reglas de Firestore - bodas', () => {
  test('Owner puede leer y escribir su boda', async () => {
    const ctx = getContext('owner1');
    const db = getFirestore(ctx.app);

    // Read
    await assertSucceeds(getDoc(doc(db, 'weddings', 'w1')));
    // Write (update un campo)
    await assertSucceeds(setDoc(doc(db, 'weddings', 'w1'), { updatedBy: 'owner1' }, { merge: true }));
  });

  test('Planner puede leer y escribir su boda', async () => {
    const ctx = getContext('planner1');
    const db = getFirestore(ctx.app);
    await assertSucceeds(getDoc(doc(db, 'weddings', 'w1')));
    await assertSucceeds(setDoc(doc(db, 'weddings', 'w1'), { title: 'Planner edit' }, { merge: true }));
  });

  test('Assistant puede leer pero no escribir', async () => {
    const ctx = getContext('assistant1');
    const db = getFirestore(ctx.app);
    await assertSucceeds(getDoc(doc(db, 'weddings', 'w1')));
    await assertFails(setDoc(doc(db, 'weddings', 'w1'), { title: 'No allowed' }, { merge: true }));
  });

  test('Usuario externo no puede leer', async () => {
    const ctx = getContext('randomUser');
    const db = getFirestore(ctx.app);
    await assertFails(getDoc(doc(db, 'weddings', 'w1')));
  });

  test('Planner puede leer y escribir subcolección tasks', async () => {
    const ctx = getContext('planner1');
    const db = getFirestore(ctx.app);
    await assertSucceeds(getDoc(doc(db, 'weddings', 'w1', 'tasks', 't1')));
    await assertSucceeds(setDoc(doc(db, 'weddings', 'w1', 'tasks', 't1'), { completed: true }, { merge: true }));
  });

  test('Assistant puede leer pero no escribir subcolección', async () => {
    const ctx = getContext('assistant1');
    const db = getFirestore(ctx.app);
    await assertSucceeds(getDoc(doc(db, 'weddings', 'w1', 'tasks', 't1')));
    await assertFails(setDoc(doc(db, 'weddings', 'w1', 'tasks', 't1'), { completed: true }, { merge: true }));
  });
});

describe('Colecciones de diagnóstico', () => {
  test('_conexion_prueba lectura/escritura sin auth', async () => {
    const ctx = getContext(null); // no autenticado
    const db = getFirestore(ctx.app);
    await assertSucceeds(setDoc(doc(db, '_conexion_prueba', 'test'), { ok: true }));
    await assertSucceeds(getDoc(doc(db, '_conexion_prueba', 'test')));
  });

  test('_test_connection lectura/escritura sin auth', async () => {
    const ctx = getContext(null);
    const db = getFirestore(ctx.app);
    await assertSucceeds(setDoc(doc(db, '_test_connection', 'test'), { ok: true }));
    await assertSucceeds(getDoc(doc(db, '_test_connection', 'test')));
  });
});
