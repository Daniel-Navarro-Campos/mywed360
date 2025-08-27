import { useEffect, useState, useCallback } from "react";
import UsernameWizard from "../components/UsernameWizard";
import useEmailUsername from "../hooks/useEmailUsername";
import Button from "../components/ui/Button";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Spinner from "../components/ui/Spinner";
import Alert from "../components/ui/Alert";
import { getMails, initEmailService, markAsRead, deleteMail } from "../services/emailService";
import EmailInsights from "../components/EmailInsights";

/**
 * Página principal de Buzón (correo interno @mywed360.com)
 * Incluye: Sidebar de carpetas, lista de correos, visor del correo y modal para redactar.
 * Email backend:
 *  - GET  /getMailgunEvents  -> lista de eventos (función Cloud)
 *  - POST /sendEmail        -> envía correo (función Cloud)
 */
const UnifiedEmail = () => {
  const { getCurrentUsername } = useEmailUsername();
  const [myEmail, setMyEmail] = useState(null);
  const [emails, setEmails] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [folder, setFolder] = useState("inbox"); // inbox | sent

  // Endpoint de función; podría venir de env
  const FUNCTION_ENDPOINT =
    "https://us-central1-lovenda-98c77.cloudfunctions.net/getMailgunEvents";

  const fetchEmails = useCallback(async () => {
    if (!myEmail) return;
    setLoading(true);
    setError(null);
    try {
      const mails = await getMails(folder === "sent" ? "sent" : "inbox");
      if (Array.isArray(mails)) {
        setEmails(mails);
      } else {
        console.warn("Respuesta inesperada de getMails", mails);
        setEmails([]);
      }
    } catch (err) {
      console.error("Error cargando correos:", err);
      setError("No se pudieron cargar los correos");
    } finally {
      setLoading(false);
    }
  }, [myEmail, folder]);

  // Obtener email del usuario en cuanto Firebase esté listo
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const username = await getCurrentUsername();
      if (username) {
        const email = `${username}@mywed360.com`;
        setMyEmail(email);
        await initEmailService({ uid: user.uid, emailUsername: username, myWed360Email: email });
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carga inicial + polling (se reinicia al cambiar carpeta)
  useEffect(() => {
    if (!myEmail) return;
    fetchEmails();
    const id = setInterval(fetchEmails, 60000);
    return () => clearInterval(id);
  }, [fetchEmails, myEmail, folder]);

  const handleMarkRead = async (mail) => {
    try {
      await markAsRead(mail.id);
      // Actualizar lista localmente
      setEmails(prev => prev.map(m => m.id === mail.id ? { ...m, read: true } : m));
      setSelected(prev => prev ? { ...prev, read: true } : prev);
    } catch (err) {
      console.error('Error marcando leído:', err);
      alert('No se pudo marcar como leído');
    }
  };

  const handleDelete = async (mail) => {
    try {
      await deleteMail(mail.id);
      // Quitar de lista local
      setEmails(prev => prev.filter(m => m.id !== mail.id));
      setSelected(null);
    } catch (err) {
      console.error('Error eliminando correo:', err);
      alert('No se pudo eliminar el correo');
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* Wizard para elegir nombre si es la primera vez */}
      <UsernameWizard />

      {/* Barra superior */}
      <header className="flex items-center justify-between border-b p-4">
        <h1 className="text-lg font-semibold">Buzón</h1>
        <Button variant="primary" onClick={() => setShowCompose(true)}>
          Redactar
        </Button>
      </header>

      {/* Contenido principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar de carpetas */}
        <aside className="w-48 border-r bg-gray-50 p-4">
          <nav className="space-y-2">
            <button
              className={`block w-full rounded px-3 py-2 text-left text-sm ${
                folder === "inbox"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setFolder("inbox")}
            >
              📥 Recibidos
            </button>
            <button
              className={`block w-full rounded px-3 py-2 text-left text-sm ${
                folder === "sent"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setFolder("sent")}
            >
              📤 Enviados
            </button>
          </nav>
        </aside>

        {/* Lista de correos */}
        <div className="w-80 border-r">
          <MailList emails={emails} onSelect={setSelected} selected={selected} />
          {loading && (
            <div className="flex items-center justify-center p-4">
              <Spinner size="sm" />
            </div>
          )}
          {error && (
            <Alert variant="error" className="m-4">
              {error}
            </Alert>
          )}
        </div>

        {/* Visor del correo */}
        <main className="flex-1 p-6">
          {selected ? (
            <MailViewer
              mail={selected}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              Selecciona un correo para verlo aquí
            </div>
          )}
        </main>
      </div>

      {/* Modal de redactar */}
      {showCompose && (
        <ComposeModal onClose={() => setShowCompose(false)} from={myEmail} />
      )}
    </div>
  );
};

/**
 * Lista lateral de correos sencillos.
 */
const MailList = ({ emails, onSelect, selected }) => {
  return (
    <div className="h-full overflow-y-auto">
      {emails.length === 0 ? (
        <p className="p-4 text-sm text-gray-500">No hay correos</p>
      ) : (
        emails.map((mail) => (
          <div
            key={mail.id}
            className={`cursor-pointer border-b p-3 hover:bg-gray-50 ${
              selected?.id === mail.id ? "bg-blue-50" : ""
            } ${!mail.read ? "font-semibold" : ""}`}
            onClick={() => onSelect(mail)}
          >
            <div className="text-sm">{mail.subject || "(Sin asunto)"}</div>
            <div className="text-xs text-gray-500">
              {mail.sender || mail.from}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

/**
 * Visor del correo seleccionado
 */
const MailViewer = ({ mail, onMarkRead, onDelete }) => {
  const handleMark = () => {
    onMarkRead(mail);
  };

  const handleDelete = () => {
    if (onDelete && window.confirm("¿Borrar este correo?")) {
      onDelete(mail);
    }
  };

  return (
    <div className="prose max-w-none">
      {/* Encabezado con acciones */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="m-0">{mail.subject || "(Sin asunto)"}</h2>
        <div className="flex gap-2">
          {!mail.read && (
            <Button size="sm" onClick={handleMark}>
              Marcar leído
            </Button>
          )}
          <Button size="sm" variant="danger" onClick={handleDelete}>
            Borrar
          </Button>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        De: {mail.sender || mail.from} — Para: {mail.recipient || mail.to}
      </p>

      <div
        dangerouslySetInnerHTML={{ __html: mail.body || "Sin contenido." }}
      />

      <EmailInsights mailId={mail.id} />
    </div>
  );
};

/**
 * Modal para redactar y enviar correos
 */
const ComposeModal = ({ onClose, from }) => {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      const resp = await fetch(
        "https://us-central1-lovenda-98c77.cloudfunctions.net/sendEmail",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from, to, subject, body, html: body, text: body }),
        }
      );
      if (!resp.ok) {
        let detail = '';
        try {
          const data = await resp.json();
          detail = data?.error || data?.message || '';
        } catch (_) {
          try { detail = await resp.text(); } catch (_) {}
        }
        const msg = `HTTP ${resp.status}${detail ? ` - ${detail}` : ''}`;
        throw new Error(msg);
      }
      onClose();
    } catch (err) {
      console.error("Error enviando correo:", err);
      setError(String(err?.message || err) || "No se pudo enviar el correo");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto p-4">
      <div className="w-full max-w-xl rounded-lg bg-white shadow-lg max-h-[90vh] flex flex-col">
        <div className="p-6 pb-4">
          <h2 className="text-lg font-semibold">Nuevo correo</h2>
        </div>

        <div className="px-6 space-y-4 flex-1 overflow-y-auto">
          <input
            type="email"
            placeholder="Para"
            className="w-full rounded border px-3 py-2 text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <input
            type="text"
            placeholder="Asunto"
            className="w-full rounded border px-3 py-2 text-sm"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <textarea
            rows="8"
            placeholder="Escribe tu mensaje…"
            className="w-full rounded border px-3 py-2 text-sm"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          {error && (
            <Alert variant="error" className="text-sm">
              {error}
            </Alert>
          )}
        </div>
        <div className="p-6 pt-4 mt-2 border-t flex justify-end gap-2 bg-white sticky bottom-0">
          <Button onClick={onClose} disabled={sending} variant="ghost">
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={sending || !to} variant="primary">
            {sending ? <Spinner size="sm" /> : "Enviar"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedEmail;
