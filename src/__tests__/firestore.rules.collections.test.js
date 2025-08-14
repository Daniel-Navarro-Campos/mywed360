import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { beforeAll, afterAll, describe, test } from 'vitest';

let testEnv;
const PROJECT_ID = 'mywed360-test-collections';

beforeAll(async () => {
  const rules = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');
  testEnv = await initializeTestEnvironment({ projectId: PROJECT_ID, firestore: { rules } });

  // Seed base data under disabled rules
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = getFirestore(ctx.app);
    // Wedding w1: owner, planner, assistant
    await setDoc(doc(db, 'weddings', 'w1'), {
      ownerIds: ['owner1'],
      plannerIds: ['planner1'],
      assistantIds: ['assistant1'],
      name: 'Wedding 1'
    });

    // Seed one guest doc so read tests have data
    await setDoc(doc(db, 'weddings', 'w1', 'guests', 'g1'), {
      name: 'Guest 1'
    });

    // Seed one table doc in seatingPlan subcollection
    await setDoc(doc(db, 'weddings', 'w1', 'seatingPlan', 'table1'), {
      name: 'Mesa 1',
      x: 100,
      y: 100
    });

    // Seed supplier doc
    await setDoc(doc(db, 'weddings', 'w1', 'suppliers', 's1'), {
      name: 'Floristería Luz'
    });
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

const ctx = (uid) => uid ? testEnv.authenticatedContext(uid) : testEnv.unauthenticatedContext();

// ---------- Guests ----------

describe('guests subcollection rules', () => {
  test('Owner can CREATE guest', async () => {
    const db = getFirestore(ctx('owner1').app);
    const guestRef = doc(db, 'weddings', 'w1', 'guests', 'g2');
    await assertSucceeds(setDoc(guestRef, { name: 'New Guest' }));
  });

  test('Assistant cannot WRITE guest', async () => {
    const db = getFirestore(ctx('assistant1').app);
    const guestRef = doc(db, 'weddings', 'w1', 'guests', 'g3');
    await assertFails(setDoc(guestRef, { name: 'Hack' }));
  });

  test('Assistant CAN READ guest', async () => {
    const db = getFirestore(ctx('assistant1').app);
    const guestRef = doc(db, 'weddings', 'w1', 'guests', 'g1');
    await assertSucceeds(getDoc(guestRef));
  });
});

// ---------- seatingPlan ----------

describe('seatingPlan subcollection rules', () => {
  test('Planner can WRITE table', async () => {
    const db = getFirestore(ctx('planner1').app);
    const tableRef = doc(db, 'weddings', 'w1', 'seatingPlan', 'table2');
    await assertSucceeds(setDoc(tableRef, { name: 'Mesa 2', x: 50, y: 50 }));
  });

  test('Assistant cannot WRITE table', async () => {
    const db = getFirestore(ctx('assistant1').app);
    const tableRef = doc(db, 'weddings', 'w1', 'seatingPlan', 'tableHack');
    await assertFails(setDoc(tableRef, { name: 'Bad Mesa' }));
  });
});

// ---------- suppliers ----------

describe('suppliers subcollection rules', () => {
  test('Owner can WRITE supplier', async () => {
    const db = getFirestore(ctx('owner1').app);
    const suppRef = doc(db, 'weddings', 'w1', 'suppliers', 's2');
    await assertSucceeds(setDoc(suppRef, { name: 'Photo Co' }));
  });

  test('Unauthenticated cannot READ supplier', async () => {
    const db = getFirestore(ctx(null).app);
    const suppRef = doc(db, 'weddings', 'w1', 'suppliers', 's1');
    await assertFails(getDoc(suppRef));
  });
});
