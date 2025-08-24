import React, { useState, useEffect } from 'react';
import { Trash } from 'lucide-react';
import * as CommentService from '../../services/commentService';
import { useAuth } from '../../hooks/useAuthUnified';

/**
 * Panel de comentarios internos para un email.
 * No se envían al proveedor. Permite colaboración entre usuarios.
 * @param {string} emailId - ID del correo al que hacen referencia los comentarios.
 */
const EmailComments = ({ emailId }) => {
  const { currentUser, userProfile } = useAuth();
  const userId = currentUser?.uid || userProfile?.id || 'anonymous';

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const loadComments = () => {
    const list = CommentService.getComments(userId, emailId);
    setComments(list);
  };

  useEffect(() => {
    if (emailId) loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailId]);

  const handleAdd = () => {
    const body = newComment.trim();
    if (!body) return;
    CommentService.addComment(userId, emailId, {
      authorId: userId,
      authorName: userProfile?.name || 'Yo',
      body
    });
    setNewComment('');
    loadComments();
  };

  const handleDelete = (commentId) => {
    CommentService.deleteComment(userId, emailId, commentId);
    loadComments();
  };

  if (!emailId) return null;

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="font-semibold mb-2">Comentarios internos</h3>

      {comments.length === 0 && (
        <p className="text-sm text-gray-500 mb-4">Aún no hay comentarios.</p>
      )}

      <ul className="space-y-2 max-h-56 overflow-y-auto pr-2">
        {comments.map((c) => (
          <li key={c.id} className="bg-gray-50 border border-gray-200 p-2 rounded-md flex justify-between">
            <div>
              <p className="text-sm text-gray-800 whitespace-pre-line">{c.body}</p>
              <span className="text-xs text-gray-500">{c.authorName} · {new Date(c.date).toLocaleString('es-ES')}</span>
            </div>
            {c.authorId === userId && (
              <button
                onClick={() => handleDelete(c.id)}
                className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                title="Eliminar comentario"
              >
                <Trash size={14} />
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-start gap-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Añadir un comentario…"
          className="flex-grow border border-gray-300 rounded-md p-2 text-sm resize-none h-20"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white rounded-md px-3 py-2 text-sm disabled:opacity-40"
          disabled={!newComment.trim()}
        >
          Añadir
        </button>
      </div>
    </div>
  );
};

export default EmailComments;
