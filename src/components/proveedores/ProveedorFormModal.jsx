import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';

/**
 * Modal para añadir o editar proveedores
 * 
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.visible - Indica si el modal está visible
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Function} props.onGuardar - Función para guardar el proveedor
 * @param {Object} props.proveedorEditar - Proveedor a editar (null si es nuevo)
 * @returns {React.ReactElement} Modal de formulario de proveedor
 */
const ProveedorFormModal = ({ 
  visible, 
  onClose, 
  onGuardar,
  proveedorEditar = null
}) => {
  // Estado para los campos del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    servicio: '',
    presupuesto: '',
    estado: 'Nuevo',
    contacto: '',
    email: '',
    telefono: '',
    web: '',
    ubicacion: '',
    notas: '',
    fechaCita: '',
    imagen: ''
  });
  
  // Estados de la UI
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState({});
  
  // Cargar datos si estamos editando
  useEffect(() => {
    if (proveedorEditar) {
      setFormData({
        nombre: proveedorEditar.nombre || '',
        servicio: proveedorEditar.servicio || '',
        presupuesto: proveedorEditar.presupuesto || '',
        estado: proveedorEditar.estado || 'Nuevo',
        contacto: proveedorEditar.contacto || '',
        email: proveedorEditar.email || '',
        telefono: proveedorEditar.telefono || '',
        web: proveedorEditar.web || '',
        ubicacion: proveedorEditar.ubicacion || '',
        notas: proveedorEditar.notas || '',
        fechaCita: proveedorEditar.fechaCita || '',
        imagen: proveedorEditar.imagen || ''
      });
    } else {
      // Resetear si es nuevo
      setFormData({
        nombre: '',
        servicio: '',
        presupuesto: '',
        estado: 'Nuevo',
        contacto: '',
        email: '',
        telefono: '',
        web: '',
        ubicacion: '',
        notas: '',
        fechaCita: '',
        imagen: ''
      });
    }
    
    // Limpiar errores
    setErrores({});
  }, [proveedorEditar, visible]);
  
  // Actualizar un campo del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si es presupuesto, asegurar que sea numérico
    if (name === 'presupuesto') {
      const numericValue = value.replace(/\D/g, '');
      setFormData({ ...formData, [name]: numericValue });
      return;
    }
    
    setFormData({ ...formData, [name]: value });
    
    // Limpiar error de ese campo si existe
    if (errores[name]) {
      setErrores({
        ...errores,
        [name]: null
      });
    }
  };
  
  // Validar formulario
  const validarFormulario = () => {
    const nuevosErrores = {};
    
    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    }
    
    if (!formData.servicio.trim()) {
      nuevosErrores.servicio = 'El servicio es obligatorio';
    }
    
    // Email válido si se proporciona
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      nuevosErrores.email = 'El email no tiene formato válido';
    }
    
    // Web con formato válido si se proporciona
    if (formData.web && !formData.web.startsWith('http')) {
      nuevosErrores.web = 'La web debe empezar con http:// o https://';
    }
    
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };
  
  // Enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    
    // Validar
    if (!validarFormulario()) {
      console.log('Validation failed');
      return;
    }
    
    console.log('Validation passed, sending data', formData);
    setEnviando(true);
    
    try {
      // Convertir presupuesto a número si existe
      const datosFinales = {
        ...formData,
        presupuesto: formData.presupuesto ? parseInt(formData.presupuesto, 10) : null
      };
      
      // Si estamos editando, incluir el ID
      if (proveedorEditar) {
        datosFinales.id = proveedorEditar.id;
      }
      
      // Guardar
      await onGuardar(datosFinales);
      onClose();
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
      setErrores({
        ...errores,
        general: 'Error al guardar. Inténtalo de nuevo.'
      });
    } finally {
      setEnviando(false);
    }
  };
  
  if (!visible) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Cabecera */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h3 className="font-semibold text-lg text-gray-800">
            {proveedorEditar ? 'Editar proveedor' : 'Nuevo proveedor'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-4">
            {/* Error general */}
            {errores.general && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md">
                {errores.general}
              </div>
            )}
            
            {/* Datos básicos */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Información básica</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${
                      errores.nombre ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Nombre del proveedor"
                  />
                  {errores.nombre && (
                    <p className="mt-1 text-sm text-red-600">{errores.nombre}</p>
                  )}
                </div>
                
                {/* Servicio */}
                <div>
                  <label htmlFor="servicio" className="block text-sm font-medium text-gray-700 mb-1">
                    Servicio *
                  </label>
                  <input
                    type="text"
                    id="servicio"
                    name="servicio"
                    value={formData.servicio}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${
                      errores.servicio ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Tipo de servicio"
                  />
                  {errores.servicio && (
                    <p className="mt-1 text-sm text-red-600">{errores.servicio}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Presupuesto */}
                <div>
                  <label htmlFor="presupuesto" className="block text-sm font-medium text-gray-700 mb-1">
                    Presupuesto
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                      €
                    </span>
                    <input
                      type="text"
                      id="presupuesto"
                      name="presupuesto"
                      value={formData.presupuesto}
                      onChange={handleChange}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                {/* Estado */}
                <div>
                  <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    id="estado"
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Nuevo">Nuevo</option>
                    <option value="Contactado">Contactado</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Contratado">Contratado</option>
                    <option value="Descartado">Descartado</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Datos de contacto */}
            <div className="pt-2 space-y-4">
              <h4 className="font-medium text-gray-700">Datos de contacto</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contacto */}
                <div>
                  <label htmlFor="contacto" className="block text-sm font-medium text-gray-700 mb-1">
                    Persona de contacto
                  </label>
                  <input
                    type="text"
                    id="contacto"
                    name="contacto"
                    value={formData.contacto}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nombre de contacto"
                  />
                </div>
                
                {/* Teléfono */}
                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+34 XXX XXX XXX"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${
                      errores.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="email@ejemplo.com"
                  />
                  {errores.email && (
                    <p className="mt-1 text-sm text-red-600">{errores.email}</p>
                  )}
                </div>
                
                {/* Web */}
                <div>
                  <label htmlFor="web" className="block text-sm font-medium text-gray-700 mb-1">
                    Sitio web
                  </label>
                  <input
                    type="text"
                    id="web"
                    name="web"
                    value={formData.web}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${
                      errores.web ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="https://ejemplo.com"
                  />
                  {errores.web && (
                    <p className="mt-1 text-sm text-red-600">{errores.web}</p>
                  )}
                </div>
              </div>
              
              {/* Ubicación */}
              <div>
                <label htmlFor="ubicacion" className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  id="ubicacion"
                  name="ubicacion"
                  value={formData.ubicacion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ciudad, provincia"
                />
              </div>
              
              {/* Cita */}
              <div>
                <label htmlFor="fechaCita" className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de cita
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-500" />
                  </div>
                  <input
                    type="date"
                    id="fechaCita"
                    name="fechaCita"
                    value={formData.fechaCita}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Información adicional */}
            <div className="pt-2 space-y-4">
              <h4 className="font-medium text-gray-700">Información adicional</h4>
              
              {/* Notas */}
              <div>
                <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  id="notas"
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Notas adicionales sobre el proveedor"
                />
              </div>
              
              {/* URL de imagen */}
              <div>
                <label htmlFor="imagen" className="block text-sm font-medium text-gray-700 mb-1">
                  URL de imagen
                </label>
                <input
                  type="text"
                  id="imagen"
                  name="imagen"
                  value={formData.imagen}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Introduce una URL para la imagen del proveedor (opcional)
                </p>
              </div>
            </div>
          </div>
          
          {/* Pie del formulario */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {enviando ? 'Guardando...' : proveedorEditar ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProveedorFormModal;
