import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Clock, List, Music, FileText } from 'lucide-react';

export default function Protocolo() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Protocolo</h1>
      <nav className="flex space-x-4 mb-6 border-b pb-2">
        <Link to="momentos" className="text-blue-600 hover:underline">Momentos Especiales</Link>
        <Link to="timing" className="text-blue-600 hover:underline">Timing</Link>
        <Link to="checklist" className="text-blue-600 hover:underline">Checklist</Link>
        <Link to="ayuda-ceremonia" className="text-blue-600 hover:underline">Ayuda Ceremonia</Link>
      </nav>
      <Outlet />
    </div>
  );
}
