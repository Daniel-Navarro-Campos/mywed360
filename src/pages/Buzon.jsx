import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { getMails, sendMail, markAsRead, deleteMail } from '../services/emailService';

export default function Buzon() {
  const [folder, setFolder] = useState('inbox');
  const [mails, setMails] = useState([]);
  const [selected, setSelected] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [form, setForm] = useState({ to: '', subject: '', body: '' });

  const refresh = () => setMails(getMails(folder));

  useEffect(() => {
    refresh();
  }, [folder]);

  const openMail = (mail) => {
    setSelected(mail);
    if (!mail.read) {
      markAsRead(mail.id);
      refresh();
    }
  };

  const handleSend = () => {
    if (!form.to || !form.subject) return;
    sendMail(form);
    setComposeOpen(false);
    setForm({ to: '', subject: '', body: '' });
    if (folder === 'sent') refresh();
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Buzón de correo</h1>

      {/* Folder Tabs */}
      <div className="flex space-x-2 mt-2">
        {['inbox', 'sent'].map((f) => (
          <button
            key={f}
            onClick={() => {
              setSelected(null);
              setFolder(f);
            }}
            className={`px-3 py-1 rounded capitalize ${folder === f ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            {f === 'inbox' ? 'Entrada' : 'Enviados'}
          </button>
        ))}
        <Button className="ml-auto" onClick={() => setComposeOpen(true)}>
          Redactar
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mt-4">
        {/* Mail list */}
        <div className="md:w-1/3 border rounded overflow-y-auto h-[70vh] bg-white">
          {mails.length === 0 && <p className="p-4 text-gray-500">No hay mensajes</p>}
          {mails.map((m) => (
            <div
              key={m.id}
              onClick={() => openMail(m)}
              className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${!m.read ? 'bg-blue-50' : ''}`}
            >
              <div className="flex justify-between text-sm">
                <span className="font-medium truncate" title={m.subject}>
                  {m.subject || '(Sin asunto)'}
                </span>
                <span className="text-gray-500">{new Date(m.date).toLocaleDateString()}</span>
              </div>
              <div className="text-xs text-gray-600 truncate">
                {folder === 'inbox' ? m.from : m.to}
              </div>
            </div>
          ))}
        </div>

        {/* Mail viewer */}
        <div className="flex-1 border rounded p-4 bg-white h-[70vh] overflow-y-auto">
          {!selected && <p className="text-gray-500">Selecciona un mensaje para leerlo.</p>}
          {selected && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold break-all">{selected.subject || '(Sin asunto)'}</h2>
                  <div className="text-sm text-gray-500 mt-1">
                    De: {selected.from} <br /> A: {selected.to}
                  </div>
                </div>
                <Button variant="outline" className="text-red-600" onClick={() => { deleteMail(selected.id); setSelected(null); refresh(); }}>
                  Eliminar
                </Button>
              </div>
              <hr />
              <p className="whitespace-pre-line text-sm">{selected.body}</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {composeOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={() => setComposeOpen(false)}
        >
          <div
            className="bg-white rounded-lg w-full max-w-lg p-6 space-y-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold">Nuevo mensaje</h3>
            <div className="space-y-2">
              <Input label="Para" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
              <Input label="Asunto" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              <textarea
                className="w-full border rounded px-3 py-2 h-40"
                placeholder="Escribe tu mensaje..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2 mt-2">
              <Button variant="outline" onClick={() => setComposeOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSend}>Enviar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
