import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { beforeAll, afterAll, describe, test } from 'vitest';

let testEnv;
const PROJECT_ID = 'mywed360-test-exhaustive';

beforeAll(async () => {
  const rules = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');
  testEnv = await initializeTestEnvironment({ projectId: PROJECT_ID, firestore: { rules } });

  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const adminDb = getFirestore(ctx.app);

    await setDoc(doc(adminDb, 'weddings', 'wX'), {
      ownerIds: ['ownerX'],
      plannerIds: ['plannerX'],
      assistantIds: ['assistantX'],
      name: 'Wedding X'
    });

    // Seed docs to read later
    const subcollections = ['tasks', 'meetings', 'guests', 'seatingPlan', 'suppliers', 'weddingInvitations', 'tasksCompleted'];
    await Promise.all(subcollections.map((col) =>
      setDoc(doc(adminDb, 'weddings', 'wX', col, 'doc1'), { sample: true })
    ));

    // weddingInfo is a single doc inside the wedding path
    await setDoc(doc(adminDb, 'weddings', 'wX', 'weddingInfo'), { banquetPlace: 'Salon Real' });

    // user profile docs
    await setDoc(doc(adminDb, 'users', 'ownerX'), { name: 'Own', role: 'owner' });
    await setDoc(doc(adminDb, 'users', 'plannerX'), { name: 'Plan', role: 'planner' });
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

const ctx = (uid) => uid ? testEnv.authenticatedContext(uid) : testEnv.unauthenticatedContext();

const COLLECTIONS = [
  'tasks',
  'meetings',
  'guests',
  'seatingPlan',
  'suppliers',
  'weddingInvitations',
  'tasksCompleted'
];

describe.each(COLLECTIONS)('%s subcollection permissions', (col) => {
  const newId = col + 'New';

  test('Owner can WRITE', async () => {
    const db = getFirestore(ctx('ownerX').app);
    const ref = doc(db, 'weddings', 'wX', col, newId);
    await assertSucceeds(setDoc(ref, { field: 'ok' }));
  });

  test('Planner can WRITE', async () => {
    const db = getFirestore(ctx('plannerX').app);
    const ref = doc(db, 'weddings', 'wX', col, newId + '2');
    await assertSucceeds(setDoc(ref, { field: 'ok' }));
  });

  test('Assistant CANNOT WRITE', async () => {
    const db = getFirestore(ctx('assistantX').app);
    const ref = doc(db, 'weddings', 'wX', col, newId + '3');
    await assertFails(setDoc(ref, { field: 'nope' }));
  });

  test('Unauthenticated cannot READ', async () => {
    const db = getFirestore(ctx(null).app);
    const ref = doc(db, 'weddings', 'wX', col, 'doc1');
    await assertFails(getDoc(ref));
  });
});

describe('weddingInfo doc permissions', () => {
  test('Owner can UPDATE weddingInfo', async () => {
    const db = getFirestore(ctx('ownerX').app);
    const ref = doc(db, 'weddings', 'wX', 'weddingInfo');
    await assertSucceeds(setDoc(ref, { banquetPlace: 'Nuevo' }, { merge: true }));
  });

  test('Assistant cannot UPDATE weddingInfo', async () => {
    const db = getFirestore(ctx('assistantX').app);
    const ref = doc(db, 'weddings', 'wX', 'weddingInfo');
    await assertFails(setDoc(ref, { banquetPlace: 'Hack' }, { merge: true }));
  });
});

describe('users profile rules', () => {
  test('User can UPDATE own profile', async () => {
    const db = getFirestore(ctx('plannerX').app);
    await assertSucceeds(setDoc(doc(db, 'users', 'plannerX'), { bio: 'hello' }, { merge: true }));
  });

  test('User cannot UPDATE others profile', async () => {
    const db = getFirestore(ctx('plannerX').app);
    await assertFails(setDoc(doc(db, 'users', 'ownerX'), { bio: 'hack' }, { merge: true }));
  });

  test('Unauthenticated cannot WRITE profile', async () => {
    const db = getFirestore(ctx(null).app);
    await assertFails(setDoc(doc(db, 'users', 'anon'), { name: 'Anon' }));
  });
});

describe('wedding delete permissions', () => {
  test('Only owner or planner can DELETE wedding', async () => {
    const dbOwner = getFirestore(ctx('ownerX').app);
    await assertSucceeds(deleteDoc(doc(dbOwner, 'weddings', 'wX')));

    // recreate for next test
    await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
      await setDoc(doc(getFirestore(adminCtx.app), 'weddings', 'wX'), { ownerIds: ['ownerX'], plannerIds: ['plannerX'] });
    });

    const dbPlanner = getFirestore(ctx('plannerX').app);
    await assertSucceeds(deleteDoc(doc(dbPlanner, 'weddings', 'wX')));
  });

  test('Assistant cannot DELETE wedding', async () => {
    await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
      await setDoc(doc(getFirestore(adminCtx.app), 'weddings', 'wX'), { ownerIds: ['ownerX'], assistantIds: ['assistantX'] });
    });
    const db = getFirestore(ctx('assistantX').app);
    await assertFails(deleteDoc(doc(db, 'weddings', 'wX')));
  });
});
