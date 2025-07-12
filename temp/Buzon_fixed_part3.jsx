          <div className="flex flex-col md:flex-row gap-4 mt-4">
            {folder !== 'tracking' ? (
            <>
              {/* Mail list */}
              <div className="md:w-1/3 border rounded overflow-y-auto h-[70vh] bg-white">
                {filteredMails.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <p>No hay correos en esta carpeta</p>
                  </div>
                ) : (
                  filteredMails.map(mail => (
                    <div 
                      key={mail.id}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${selected?.id === mail.id ? 'bg-blue-50' : ''} ${!mail.read && folder === 'inbox' ? 'font-semibold' : ''}`}
                      onClick={() => handleSelectEmail(mail)}
                    >
                      <div className="flex justify-between">
                        <span className="text-sm">{folder === 'inbox' ? mail.from : mail.to}</span>
                        <span className="text-xs text-gray-500">{new Date(mail.date).toLocaleString()}</span>
                      </div>
                      <div className="text-sm font-medium">{mail.subject}</div>
                      <div className="text-xs text-gray-500 truncate">{mail.body.substring(0, 60)}...</div>
                      
                      {mail.attachments && mail.attachments.length > 0 && (
                        <div className="mt-1 flex items-center">
                          <PaperclipIcon className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500 ml-1">{mail.attachments.length} adjunto(s)</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              {/* Mail viewer */}
              <div className="flex-1 border rounded p-4 bg-white h-[70vh] overflow-y-auto">
                {!selected ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <p>Selecciona un correo para verlo</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-medium">{selected.subject}</h2>
                        {folder === 'inbox' && (
                          <Button 
                            variant="outline" 
                            onClick={() => handleCreateTracking(selected)}
                          >
                            <TagIcon className="h-4 w-4 mr-1" />
                            Crear seguimiento
                          </Button>
                        )}
                      </div>
                      <div className="mt-2 text-sm">
                        <div><span className="font-medium">De:</span> {selected.from}</div>
                        <div><span className="font-medium">Para:</span> {selected.to}</div>
                        <div><span className="font-medium">Fecha:</span> {new Date(selected.date).toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selected.body }} />
                    
                    {selected.attachments && selected.attachments.length > 0 && (
                      <div className="border-t pt-2">
                        <h3 className="font-medium mb-2">Adjuntos:</h3>
                        <div className="space-y-1">
                          {selected.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center p-2 border rounded">
                              <PaperclipIcon className="h-4 w-4 text-gray-400 mr-2" />
                              <span>{attachment.name || `Adjunto ${index + 1}`}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-auto"
                                onClick={() => {/* Acción para descargar */}}
                              >
                                Descargar
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="border-t pt-2 flex justify-end space-x-2">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setForm({
                            to: selected.from,
                            subject: `Re: ${selected.subject}`,
                            body: `\n\n----- Original Message -----\nDe: ${selected.from}\nFecha: ${new Date(selected.date).toLocaleString()}\nAsunto: ${selected.subject}\n\n${selected.body}`,
                            attachments: []
                          });
                          setComposeOpen(true);
                        }}
                      >
                        Responder
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={async () => {
                          if (confirm('¿Estás seguro de que deseas eliminar este correo?')) {
                            await deleteMail(selected.id);
                            setSelected(null);
                            refresh();
                          }
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
            ) : (
            <>
              {/* Tracking list */}
              <div className="md:w-1/3 border rounded overflow-y-auto h-[70vh] bg-white">
                <div className="p-3 border-b bg-gray-100 sticky top-0">
                  <h3 className="font-medium">Seguimiento de proveedores</h3>
                  <p className="text-xs text-gray-600">Gestiona las respuestas y comunicaciones con proveedores</p>
                  
                  <div className="flex gap-2 mt-2">
                    <select 
                      className="text-xs border rounded p-1"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">Todos los estados</option>
                      <option value={TRACKING_STATUS.NEW}>Nuevos</option>
                      <option value={TRACKING_STATUS.WAITING}>Esperando respuesta</option>
                      <option value={TRACKING_STATUS.FOLLOWUP}>Seguimiento</option>
                      <option value={TRACKING_STATUS.COMPLETED}>Completados</option>
                      <option value={TRACKING_STATUS.CANCELLED}>Cancelados</option>
                      <option value={TRACKING_STATUS.URGENT}>Urgentes</option>
                    </select>
                    <select
                      className="text-xs border rounded p-1"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                    >
                      <option value="priority">Por prioridad</option>
                      <option value="date">Por fecha</option>
                    </select>
                  </div>
                </div>
                
                {filteredTrackingRecords.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <p>No hay registros de seguimiento</p>
                  </div>
                ) : (
                  filteredTrackingRecords.map(record => (
                    <div 
                      key={record.id} 
                      onClick={() => setTrackingSelected(record)}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${trackingSelected?.id === record.id ? 'bg-blue-50' : ''} ${record.status === TRACKING_STATUS.URGENT ? 'border-l-4 border-l-red-500' : ''}`}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{record.providerName}</span>
                        <span className="text-xs">
                          {record.status === TRACKING_STATUS.NEW && <span className="bg-blue-100 text-blue-800 px-1 rounded">Nuevo</span>}
                          {record.status === TRACKING_STATUS.WAITING && <span className="bg-yellow-100 text-yellow-800 px-1 rounded">Esperando</span>}
                          {record.status === TRACKING_STATUS.FOLLOWUP && <span className="bg-purple-100 text-purple-800 px-1 rounded">Seguimiento</span>}
                          {record.status === TRACKING_STATUS.COMPLETED && <span className="bg-green-100 text-green-800 px-1 rounded">Completado</span>}
                          {record.status === TRACKING_STATUS.CANCELLED && <span className="bg-gray-100 text-gray-800 px-1 rounded">Cancelado</span>}
                          {record.status === TRACKING_STATUS.URGENT && <span className="bg-red-100 text-red-800 px-1 rounded">Urgente</span>}
                        </span>
                      </div>
                      <div className="text-sm truncate">{record.subject}</div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Último: {new Date(record.lastUpdated).toLocaleDateString()}</span>
                        {record.tags && record.tags.length > 0 && (
                          <div className="flex space-x-1">
                            {record.tags.slice(0, 2).map((tag, idx) => (
                              <span key={idx} className="bg-gray-100 px-1 rounded">{tag}</span>
                            ))}
                            {record.tags.length > 2 && <span>+{record.tags.length - 2}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Tracking viewer - Empty state */}
              <div className="flex-1 border rounded p-4 bg-white h-[70vh] overflow-y-auto">
                {!trackingSelected ? (
                  <div className="text-center py-10">
                    <MailIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Selecciona un seguimiento para ver los detalles</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Encabezado con información del proveedor */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-semibold">{trackingSelected.providerName}</h2>
                        <p className="text-sm text-gray-600">{trackingSelected.subject}</p>
                        
                        <div className="flex items-center mt-1">
                          <span className={`
                            inline-flex items-center px-2 py-1 rounded text-xs font-medium
                            ${trackingSelected.status === TRACKING_STATUS.NEW ? 'bg-blue-100 text-blue-800' : ''}
                            ${trackingSelected.status === TRACKING_STATUS.WAITING ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${trackingSelected.status === TRACKING_STATUS.FOLLOWUP ? 'bg-purple-100 text-purple-800' : ''}
                            ${trackingSelected.status === TRACKING_STATUS.COMPLETED ? 'bg-green-100 text-green-800' : ''}
                            ${trackingSelected.status === TRACKING_STATUS.CANCELLED ? 'bg-gray-100 text-gray-800' : ''}
                            ${trackingSelected.status === TRACKING_STATUS.URGENT ? 'bg-red-100 text-red-800' : ''}
                          `}>
                            {trackingSelected.status === TRACKING_STATUS.NEW ? 'Nuevo' : ''}
                            {trackingSelected.status === TRACKING_STATUS.WAITING ? 'Esperando respuesta' : ''}
                            {trackingSelected.status === TRACKING_STATUS.FOLLOWUP ? 'Seguimiento pendiente' : ''}
                            {trackingSelected.status === TRACKING_STATUS.COMPLETED ? 'Completado' : ''}
                            {trackingSelected.status === TRACKING_STATUS.CANCELLED ? 'Cancelado' : ''}
                            {trackingSelected.status === TRACKING_STATUS.URGENT ? 'Urgente' : ''}
                          </span>
                          
                          {trackingSelected.tags && trackingSelected.tags.length > 0 && (
                            <div className="ml-2 flex flex-wrap gap-1">
                              {trackingSelected.tags.map((tag, idx) => (
                                <span key={idx} className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowTrackingEditModal(true)}
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setForm({
                              to: trackingSelected.email || trackingSelected.providerName,
                              subject: `Re: ${trackingSelected.subject}`,
                              body: '',
                              attachments: []
                            });
                            setComposeOpen(true);
                          }}
                        >
                          Responder
                        </Button>
                      </div>
                    </div>
                    
                    {/* Notas del proveedor */}
                    {trackingSelected.notes && (
                      <div className="bg-gray-50 p-3 rounded">
                        <h3 className="text-sm font-medium mb-1">Notas:</h3>
                        <p className="text-sm whitespace-pre-wrap">{trackingSelected.notes}</p>
                      </div>
                    )}
                    
                    {/* Historial de comunicaciones */}
                    <div>
                      <h3 className="text-sm font-medium mb-2">Historial de comunicaciones</h3>
                      <div className="space-y-2">
                        {trackingSelected.thread && trackingSelected.thread.length > 0 ? (
                          trackingSelected.thread.map((item, index) => (
                            <div key={index} className="border rounded p-3">
                              <div className="flex justify-between">
                                <span className="text-xs font-medium">{item.from}</span>
                                <span className="text-xs text-gray-500">{new Date(item.date).toLocaleString()}</span>
                              </div>
                              <p className="text-sm mt-1">{item.message}</p>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-gray-500 text-sm py-3">
                            <p>No hay comunicaciones registradas</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Opciones de acción */}
                    <div className="border-t pt-4 flex flex-wrap gap-2">
                      <div className="w-full">
                        <h3 className="text-sm font-medium mb-2">Acciones:</h3>
                      </div>
                      
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newStatus = trackingSelected.status === TRACKING_STATUS.COMPLETED ? 
                            TRACKING_STATUS.FOLLOWUP : TRACKING_STATUS.COMPLETED;
                            
                          const updatedRecords = trackingRecords.map(record => 
                            record.id === trackingSelected.id ? {...record, status: newStatus} : record
                          );
                          
                          updateTrackingStatus(trackingSelected.id, newStatus);
                          setTrackingRecords(updatedRecords);
                          setTrackingSelected({
                            ...trackingSelected,
                            status: newStatus
                          });
                        }}
                      >
                        {trackingSelected.status === TRACKING_STATUS.COMPLETED ? 'Reabrir' : 'Marcar completado'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
            )}
          </div>
        </div>
      )}
      
      {/* Modal de composición */}
      {composeOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Redactar correo</h2>
              <button
                onClick={() => setComposeOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Información del remitente */}
              <div className="bg-blue-50 p-2 rounded flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">De: </span>
                  <span className="text-sm">{userEmail}</span>
                </div>
              </div>
              
              {/* Campo destinatario */}
              <div>
                <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
                  Para:
                </label>
                <Input
                  id="to"
                  value={form.to}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
                  placeholder="direccion@ejemplo.com"
                />
              </div>
              
              {/* Campo asunto */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Asunto:
                </label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Asunto del correo"
                />
              </div>
              
              {/* Selector de plantillas */}
              {templates.length > 0 && (
                <div>
                  <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
                    Usar plantilla:
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="template"
                      className="flex-1 border rounded p-2 text-sm"
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                    >
                      <option value="">Seleccionar plantilla</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <Button
                      onClick={() => handleApplyTemplate(selectedTemplate)}
                      disabled={!selectedTemplate}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Campo cuerpo del mensaje */}
              <div>
                <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje:
                </label>
                <textarea
                  id="body"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Escribe tu mensaje aquí..."
                  className="w-full min-h-[200px] p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Adjuntos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivos adjuntos
                </label>
                
                {form.attachments.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {form.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div className="flex items-center">
                          <PaperclipIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm truncate max-w-xs">{file.name}</span>
                        </div>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <PaperclipIcon className="h-4 w-4 mr-1" />
                    Adjuntar archivo
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAttachmentUpload}
                    className="hidden"
                    multiple
                  />
                  <span className="text-xs text-gray-500">
                    {form.attachments.length} archivo(s) adjunto(s)
                  </span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => setComposeOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={!form.to || !form.subject}
                >
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de edición de seguimiento */}
      {showTrackingEditModal && trackingSelected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Editar seguimiento</h2>
            <p className="text-sm text-gray-600 mb-4">
              Actualiza el estado y detalles del seguimiento del proveedor
            </p>
            
            <div className="space-y-4">
              {/* Estado del seguimiento */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  id="status"
                  value={trackingForm.status || trackingSelected.status}
                  onChange={(e) => setTrackingForm({...trackingForm, status: e.target.value})}
                  className="w-full border rounded p-2"
                >
                  <option value={TRACKING_STATUS.NEW}>Nuevo</option>
                  <option value={TRACKING_STATUS.WAITING}>Esperando respuesta</option>
                  <option value={TRACKING_STATUS.FOLLOWUP}>Seguimiento pendiente</option>
                  <option value={TRACKING_STATUS.URGENT}>Urgente</option>
                  <option value={TRACKING_STATUS.COMPLETED}>Completado</option>
                  <option value={TRACKING_STATUS.CANCELLED}>Cancelado</option>
                </select>
              </div>
              
              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                  Etiquetas
                </label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {(trackingForm.tags || trackingSelected.tags || []).map((tag, index) => (
                    <div key={index} className="bg-gray-100 px-2 py-1 rounded flex items-center">
                      <span className="text-xs">{tag}</span>
                      <button 
                        className="ml-1 text-gray-500 hover:text-red-500"
                        onClick={() => {
                          const newTags = [...(trackingForm.tags || trackingSelected.tags || [])];
                          newTags.splice(index, 1);
                          setTrackingForm({...trackingForm, tags: newTags});
                        }}
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    id="newTag"
                    placeholder="Nueva etiqueta"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value) {
                        const newTags = [...(trackingForm.tags || trackingSelected.tags || []), e.target.value];
                        setTrackingForm({...trackingForm, tags: newTags});
                        e.target.value = '';
                      }
                    }}
                  />
                  <Button
                    onClick={(e) => {
                      const input = e.target.previousSibling;
                      if (input && input.value) {
                        const newTags = [...(trackingForm.tags || trackingSelected.tags || []), input.value];
                        setTrackingForm({...trackingForm, tags: newTags});
                        input.value = '';
                      }
                    }}
                  >
                    Añadir
                  </Button>
                </div>
              </div>
              
              {/* Notas */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  id="notes"
                  value={trackingForm.notes !== undefined ? trackingForm.notes : trackingSelected.notes || ''}
                  onChange={(e) => setTrackingForm({...trackingForm, notes: e.target.value})}
                  className="w-full border rounded p-2 min-h-[100px]"
                  placeholder="Añade notas sobre este proveedor o seguimiento"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button 
                variant="outline"
                onClick={() => setShowTrackingEditModal(false)}
              >
                Cancelar
              </Button>
              
              <Button
                onClick={() => {
                  // Actualizar el registro de seguimiento
                  const updatedRecord = {
                    ...trackingSelected,
                    ...trackingForm,
                    lastUpdated: new Date().toISOString()
                  };
                  
                  // Actualizar en la base de datos
                  updateTrackingStatus(trackingSelected.id, updatedRecord.status);
                  if (trackingForm.tags) {
                    updateTrackingTags(trackingSelected.id, updatedRecord.tags);
                  }
                  
                  // Actualizar estado local
                  const updatedRecords = trackingRecords.map(r => 
                    r.id === trackingSelected.id ? updatedRecord : r
                  );
                  
                  setTrackingRecords(updatedRecords);
                  setTrackingSelected(updatedRecord);
                  setTrackingForm({
                    status: '',
                    dueDate: '',
                    notes: '',
                    tags: []
                  });
                  setShowTrackingEditModal(false);
                }}
              >
                Guardar cambios
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
