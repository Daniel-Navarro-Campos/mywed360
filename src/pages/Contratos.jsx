import React, { useState } from 'react';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import { Plus, Download, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import Toast from '../components/Toast';
import Card from '../components/Card';

export default function Contratos() {
  const sampleContracts = [
    { id: 1, provider: 'Eventos Catering', type: 'Catering', signedDate: '2025-04-01', serviceDate: '2025-06-10', status: 'Vigente', docUrl: '#' },
    { id: 2, provider: 'Flores y Diseño', type: 'Flores', signedDate: '2025-03-15', serviceDate: '2025-06-12', status: 'Vigente', docUrl: '#' },
  ];
  const { data: contracts, addItem: addContract, updateItem: updateContract, deleteItem: deleteContract } = useFirestoreCollection('contracts', sampleContracts);
  // selected state keeps ids locally
  const [selected, setSelected] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState(null);
  const initialContract = { provider: '', type: '', signedDate: '', serviceDate: '', status: '', docUrl: '' };
  const [newContract, setNewContract] = useState(initialContract);

  const handleAddContract = async e => {
    e.preventDefault();
    const contractObj = { id: `ct${Date.now()}`, ...newContract, docUrl: newContract.docUrl || '#' };
    await addContract(contractObj);
    setNewContract(initialContract);
    setShowAddModal(false);
    setToast({ message: 'Contrato agregado', type: 'success' });
  };

  const isNearExpiry = date => {
    const today = new Date();
    const svc = new Date(date);
    const diff = (svc - today) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  };

  const toggleSelect = id => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const exportSelected = () => {
    console.log('Export contracts:', selected);
  };

  return (
    <>
      <Card className="p-6 space-y-6">
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Contratos</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"
            >
              <Plus size={16} className="mr-2" /> Añadir Contrato
            </button>
            <button
              onClick={exportSelected}
              className="bg-gray-200 px-4 py-2 rounded flex items-center"
            >
              <Download size={16} className="mr-2" /> Exportar Seleccionados
            </button>
          </div>
        </div>

        {/* Escritorio */}
        <div className="hidden md:block overflow-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2">
                  <input
                    type="checkbox"
                    onChange={e => setSelected(
                      e.target.checked ? contracts.map(c => c.id) : []
                    )}
                  />
                </th>
                <th className="p-2">Proveedor</th>
                <th className="p-2">Tipo de contrato</th>
                <th className="p-2">Fecha de firma</th>
                <th className="p-2">Fecha de servicio</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Documento</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map(c => (
                <tr
                  key={c.id}
                  className={`${isNearExpiry(c.serviceDate) ? 'bg-yellow-100' : ''} border-b`}
                >
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(c.id)}
                      onChange={() => toggleSelect(c.id)}
                    />
                  </td>
                  <td className="p-2">{c.provider}</td>
                  <td className="p-2">{c.type}</td>
                  <td className="p-2">{c.signedDate}</td>
                  <td className="p-2">{c.serviceDate}</td>
                  <td className="p-2">{c.status}</td>
                  <td className="p-2">
                    <a
                      href={c.docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600"
                    >
                      <Eye size={16} className="mr-1" /> Ver
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Móvil */}
        <div className="block md:hidden space-y-4">
          {contracts.map(c => (
            <ContractItem
              key={c.id}
              contract={c}
              isSelected={selected.includes(c.id)}
              onToggle={() => toggleSelect(c.id)}
            />
          ))}
        </div>
      </Card>

      {/* Modal Añadir */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow w-96">
            <h2 className="text-xl font-semibold mb-4">Añadir Contrato</h2>
            <form onSubmit={handleAddContract} className="space-y-3">
              <input
                type="text"
                placeholder="Proveedor"
                value={newContract.provider}
                onChange={e => setNewContract({ ...newContract, provider: e.target.value })}
                className="w-full border rounded px-2 py-1"
                required
              />
              <input
                type="text"
                placeholder="Tipo de contrato"
                value={newContract.type}
                onChange={e => setNewContract({ ...newContract, type: e.target.value })}
                className="w-full border rounded px-2 py-1"
                required
              />
              <input
                type="date"
                value={newContract.signedDate}
                onChange={e => setNewContract({ ...newContract, signedDate: e.target.value })}
                className="w-full border rounded px-2 py-1"
                required
              />
              <input
                type="date"
                value={newContract.serviceDate}
                onChange={e => setNewContract({ ...newContract, serviceDate: e.target.value })}
                className="w-full border rounded px-2 py-1"
                required
              />
              <select
                value={newContract.status}
                onChange={e => setNewContract({ ...newContract, status: e.target.value })}
                className="w-full border rounded px-2 py-1"
              >
                <option value="">Seleccionar estado</option>
                <option value="Vigente">Vigente</option>
                <option value="Expirado">Expirado</option>
              </select>
              <div>
                <label className="block mb-1">Documento</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={e => {
                    const file = e.target.files[0];
                    setNewContract({ ...newContract, docUrl: URL.createObjectURL(file) });
                  }}
                  className="w-full"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function ContractItem({ contract, isSelected, onToggle }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded p-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold">{contract.provider}</p>
          <p className="text-sm text-gray-600">{contract.type} - {contract.status}</p>
        </div>
        <button onClick={() => setOpen(v => !v)}>
          {open ? <ChevronUp /> : <ChevronDown />}
        </button>
      </div>
      {open && (
        <div className="mt-2 space-y-2">
          <p>Fecha de firma: {contract.signedDate}</p>
          <p>Fecha de servicio: {contract.serviceDate}</p>
          <a href={contract.docUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600">
            <Eye size={16} className="mr-1" /> Ver documento
          </a>
          <div>
            <input type="checkbox" checked={isSelected} onChange={onToggle} /> Seleccionar
          </div>
        </div>
      )}
    </div>
  );
}
