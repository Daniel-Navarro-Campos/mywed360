import React from 'react';

export default function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded shadow-lg w-full max-w-md max-h-[90vh] flex flex-col p-0" onClick={(e)=>e.stopPropagation()}>
        <div className="flex justify-between items-center px-4 pt-4 pb-2 border-b">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-500">✖</button>
        </div>
        <div className="overflow-y-auto px-4 py-2 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
