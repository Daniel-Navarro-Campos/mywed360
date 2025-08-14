import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection } from 'firebase/firestore';
import { beforeAll, afterAll, describe, test } from 'vitest';

let testEnv;
const PROJECT_ID = 'mywed360-test-extended';

beforeAll(async () => {
  const rules = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');
  testEnv = await initializeTestEnvironment({ projectId: PROJECT_ID, firestore: { rules } });

  // Seed base data
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = getFirestore(ctx.app);

    // Wedding with single owner only (no plannerIds/assistantIds yet)
    await setDoc(doc(db, 'weddings', 'w2'), {
      ownerIds: ['owner2'],
      name: 'Wedding 2'
    });

    // Wedding with all roles
    await setDoc(doc(db, 'weddings', 'w3'), {
      ownerIds: ['owner3'],
      plannerIds: ['planner3'],
      assistantIds: ['assistant3'],
      name: 'Wedding 3'
    });

    // Invitation doc
    await setDoc(doc(db, 'weddingInvitations', 'inv123'), {
      weddingId: 'w3',
      email: 'planner@example.com',
      createdBy: 'owner3'
    });


  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

const ctx = (uid) => uid ? testEnv.authenticatedContext(uid) : testEnv.unauthenticatedContext();

// Helper
const weddingDoc = (db, id) => doc(db, 'weddings', id);

// --- WEDDING CORE ---

describe('Wedding document permissions', () => {
  test('Owner can CREATE new wedding', async () => {
    const db = getFirestore(ctx('newOwner').app);
    await assertSucceeds(setDoc(weddingDoc(db, 'wNew'), { ownerIds: ['newOwner'], name: 'New W' }));
  });

  test('Planner cannot CREATE new top-level wedding', async () => {
    const db = getFirestore(ctx('somePlanner').app);
    await assertFails(setDoc(weddingDoc(db, 'plannerCreate'), { ownerIds: ['somePlanner'] }));
  });

  test('Owner can ADD planner to plannerIds', async () => {
    const db = getFirestore(ctx('owner2').app);
    await assertSucceeds(setDoc(weddingDoc(db, 'w2'), { plannerIds: ['planner2'] }, { merge: true }));
  });

  test('Planner can add THEMSELVES to plannerIds (invitation accepted)', async () => {
    const db = getFirestore(ctx('plannerSelf').app);
    // First seed doc without their uid
    await testEnv.withSecurityRulesDisabled(async (admin) => {
      await setDoc(weddingDoc(getFirestore(admin.app), 'selfAdd'), { ownerIds: ['ownerX'], plannerIds: [] });
    });
    await assertSucceeds(setDoc(weddingDoc(db, 'selfAdd'), { plannerIds: ['plannerSelf'] }, { merge: true }));
  });

  test('Planner cannot modify other fields while adding themselves', async () => {
    const db = getFirestore(ctx('plannerBad').app);
    await testEnv.withSecurityRulesDisabled(async (admin) => {
      await setDoc(weddingDoc(getFirestore(admin.app), 'selfAddBad'), { ownerIds: ['ownerY'], plannerIds: [] });
    });
    await assertFails(setDoc(weddingDoc(db, 'selfAddBad'), { plannerIds: ['plannerBad'], name: 'Hack' }, { merge: true }));
  });

  test('Assistant cannot WRITE wedding doc', async () => {
    const db = getFirestore(ctx('assistant3').app);
    await assertFails(setDoc(weddingDoc(db, 'w3'), { title: 'try' }, { merge: true }));
  });

  test('Owner can DELETE wedding', async () => {
    const db = getFirestore(ctx('owner3').app);
    await assertSucceeds(deleteDoc(weddingDoc(db, 'w3')));
  });

  test('External user cannot READ wedding with missing plannerIds array', async () => {
    const db = getFirestore(ctx('rand').app);
    await assertFails(getDoc(weddingDoc(db, 'w2')));
  });
});

// --- SUBCOLLECTIONS ---

describe('Wedding subcollection permissions', () => {
  test('Owner can CREATE task', async () => {
    const db = getFirestore(ctx('owner2').app);
    const taskRef = doc(db, 'weddings', 'w2', 'tasks', 'task1');
    await assertSucceeds(setDoc(taskRef, { name: 't' }));
  });

  test('Planner added later can WRITE tasks', async () => {
    const db = getFirestore(ctx('planner2').app);
    const taskRef = doc(db, 'weddings', 'w2', 'tasks', 'task2');
    await assertSucceeds(setDoc(taskRef, { name: 'plan' }));
  });

  test('Assistant cannot WRITE tasks', async () => {
    const db = getFirestore(ctx('assistant3').app);
    const taskRef = doc(db, 'weddings', 'w3', 'tasks', 'tBad');
    await assertFails(setDoc(taskRef, { name: 'bad' }));
  });
});

// --- INVITATIONS ---

describe('weddingInvitations rules', () => {
  test('Any auth user can CREATE invitation', async () => {
    const db = getFirestore(ctx('ownerZ').app);
    await assertSucceeds(setDoc(doc(db, 'weddingInvitations', 'invZ'), { weddingId: 'w2', email: 'p@example.com' }));
  });

  test('Unauthenticated cannot CREATE invitation', async () => {
    const db = getFirestore(ctx(null).app);
    await assertFails(setDoc(doc(db, 'weddingInvitations', 'invNo'), { weddingId: 'w2' }));
  });
});


