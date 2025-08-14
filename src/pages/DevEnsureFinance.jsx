import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function DevEnsureFinance() {
  const [status, setStatus] = useState('');
  const [details, setDetails] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setStatus('Buscando bodas...');
        const weddingsSnap = await getDocs(collection(db, 'weddings'));
        const ids = weddingsSnap.docs.map(d => d.id);
        setDetails(`Encontradas ${ids.length} bodas`);

        let ok = 0, fail = 0;
        for (const wid of ids) {
          try {
            const financeRef = doc(db, 'weddings', wid, 'finance', 'main');
            await setDoc(financeRef, { movements: [], updatedAt: serverTimestamp() }, { merge: true });
            ok++;
          } catch (e) {
            console.warn('Fallo en', wid, e);
            fail++;
          }
        }
        setStatus(`✅ Finance asegurado en ${ok}/${ids.length} bodas. Fallos: ${fail}`);
      } catch (e) {
        console.error(e);
        setStatus('❌ Error al asegurar finance para todas las bodas');
        setDetails(e?.message || String(e));
      }
    })();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Dev Ensure Finance</h1>
      <p>{status}</p>
      {details && <pre style={{ whiteSpace: 'pre-wrap' }}>{details}</pre>}
      <p>Nota: Usa permisos del usuario actual en Firestore. Si no tienes permisos de lectura/escritura sobre todas las bodas, algunos writes fallarán.</p>
    </div>
  );
}
