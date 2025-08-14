import React, { useState } from 'react';
import Modal from './Modal';

/**
 * Modal para crear una nueva boda.
 * @param {{open:boolean,onClose:()=>void,onSave:(values:any)=>void}} props 
 */
export default function WeddingFormModal({ open, onClose, onSave }) {
  const [values, setValues] = useState({
    name: '',
    date: '',
    location: '',
    banquetPlace: '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // validaciones básicas
    if (!values.name.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      await onSave(values);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error guardando la boda');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title="Crear nueva boda" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
            Nombre de la boda
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={values.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Boda de Ana y Luis"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="date">
            Fecha
          </label>
          <input
            id="date"
            name="date"
            type="date"
            value={values.date}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="location">
            Lugar / Ciudad
          </label>
          <input
            id="location"
            name="location"
            type="text"
            value={values.location}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Sevilla"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="banquetPlace">
            Lugar del banquete (opcional)
          </label>
          <input
            id="banquetPlace"
            name="banquetPlace"
            type="text"
            value={values.banquetPlace}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Hacienda X"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
