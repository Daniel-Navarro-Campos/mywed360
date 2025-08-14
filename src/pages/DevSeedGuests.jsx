import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, doc, getDocs, limit, query, setDoc, writeBatch, serverTimestamp, deleteDoc } from 'firebase/firestore';
// No exigimos autenticación explícita aquí; la ruta es de desarrollo

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

export default function DevSeedGuests() {
  const [status, setStatus] = useState('');
  const [details, setDetails] = useState('');

  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const weddingId = url.searchParams.get('weddingId') || '61ffb907-7fcb-4361-b764-0300b317fe06';
      const totalGuests = parseInt(url.searchParams.get('guests') || '250', 10);
      const perTable = parseInt(url.searchParams.get('perTable') || '10', 10);
      const force = (url.searchParams.get('force') || 'false') === 'true';

      try {
        setStatus('Preparando...');
        const guestsCol = collection(db, 'weddings', weddingId, 'guests');
        const tablesColPath = ['weddings', weddingId, 'seatingPlan', 'banquet', 'tables'];

        // Si no force y ya hay datos, salimos
        const [guestsSnap, tablesSnap] = await Promise.all([
          getDocs(query(guestsCol, limit(1))),
          getDocs(query(collection(db, ...tablesColPath), limit(1)))
        ]);
        if (!force && (!guestsSnap.empty || !tablesSnap.empty)) {
          setStatus('Datos existentes detectados. Añade force=true para sobrescribir.');
          return;
        }

        // Borrado si force
        if (force) {
          setStatus('Borrando datos anteriores...');
          const [allGuests, allTables] = await Promise.all([
            getDocs(collection(db, 'weddings', weddingId, 'guests')),
            getDocs(collection(db, ...tablesColPath))
          ]);
          const deletions = [];
          allGuests.forEach((d) => deletions.push({ path: ['weddings', weddingId, 'guests', d.id] }));
          allTables.forEach((d) => deletions.push({ path: [...tablesColPath, d.id] }));
          // Hacer deletes por lotes de 400
          for (const group of chunkArray(deletions, 400)) {
            const batch = writeBatch(db);
            group.forEach((g) => batch.delete(doc(db, ...g.path)));
            await batch.commit();
          }
        }

        setStatus('Generando invitados y mesas...');
        const tablesNeeded = Math.ceil(totalGuests / perTable);
        const writes = [];

        // Invitados
        for (let i = 1; i <= totalGuests; i++) {
          const tableId = ((i - 1) % tablesNeeded) + 1;
          const guestId = `G${i}`;
          writes.push({
            type: 'set',
            path: ['weddings', weddingId, 'guests', guestId],
            data: {
              id: guestId,
              name: `Invitado ${i}`,
              tableId: tableId,
              table: tableId,
              createdAt: serverTimestamp(),
            }
          });
        }

        // Mesas (con invitados asignados por id y nombre)
        const assignedByTable = {};
        for (let i = 1; i <= totalGuests; i++) {
          const tableId = ((i - 1) % tablesNeeded) + 1;
          const guestId = `G${i}`;
          if (!assignedByTable[tableId]) assignedByTable[tableId] = [];
          assignedByTable[tableId].push({ id: guestId, name: `Invitado ${i}` });
        }

        for (let t = 1; t <= tablesNeeded; t++) {
          writes.push({
            type: 'set',
            path: [...tablesColPath, String(t)],
            data: {
              id: t,
              name: `Mesa ${t}`,
              shape: 'circle',
              seats: perTable,
              x: 100 + ((t - 1) % 10) * 140,
              y: 120 + Math.floor((t - 1) / 10) * 160,
              assignedGuests: assignedByTable[t] || [],
              createdAt: serverTimestamp(),
            }
          });
        }

        // Ejecutar en lotes de 400 para evitar límite de 500
        let done = 0;
        for (const group of chunkArray(writes, 400)) {
          const batch = writeBatch(db);
          group.forEach((op) => {
            if (op.type === 'set') {
              batch.set(doc(db, ...op.path), op.data);
            } else if (op.type === 'delete') {
              batch.delete(doc(db, ...op.path));
            }
          });
          await batch.commit();
          done += group.length;
          setDetails(`Escritos ${done}/${writes.length} documentos...`);
        }

        // Asegurar documento de finanzas
        try {
          const financeDoc = doc(db, 'weddings', weddingId, 'finance', 'main');
          await setDoc(financeDoc, {
            movements: [],
            updatedAt: serverTimestamp(),
          }, { merge: true });
        } catch (e) {
          console.warn('No se pudo crear/actualizar finance/main:', e);
        }

        setStatus(`✅ Insertados ${totalGuests} invitados y ${tablesNeeded} mesas en la boda ${weddingId}`);
      } catch (e) {
        console.error(e);
        setStatus('❌ Error durante el seeding');
        setDetails(e?.message || String(e));
      }
    })();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Dev Seed Guests</h2>
      <p>{status}</p>
      {details && <pre style={{ whiteSpace: 'pre-wrap' }}>{details}</pre>}
      <p>Parámetros: weddingId, guests, perTable, force (true/false)</p>
      <p>Ejemplo: /dev/seed-guests?weddingId=61ffb907-7fcb-4361-b764-0300b317fe06&guests=250&perTable=10&force=true</p>
    </div>
  );
}
