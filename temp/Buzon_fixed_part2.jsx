  // Función para manejar la selección de un correo
  const handleSelectEmail = (mail) => {
    setSelected(mail);
    if (!mail.read) {
      markAsRead(mail.id);
      // Actualizar el estado local
      setMails(mails.map(m => m.id === mail.id ? {...m, read: true} : m));
    }
  };

  // Crear un nuevo registro de seguimiento para un proveedor
  const handleCreateTracking = (email) => {
    if (!email) return;

    const newRecord = createTrackingRecord({
      email,
      status: TRACKING_STATUS.NEW,
      providerName: email.from,
      subject: email.subject,
      initialMessage: email.body
    });

    setTrackingRecords([...trackingRecords, newRecord]);
    setTrackingSelected(newRecord);
    setFolder('tracking');
  };

  // Actualizar el estado de un seguimiento
  const handleUpdateTrackingStatus = (id, newStatus) => {
    const updatedRecords = trackingRecords.map(record => 
      record.id === id ? {...record, status: newStatus} : record
    );
    updateTrackingStatus(id, newStatus);
    setTrackingRecords(updatedRecords);
    
    if (trackingSelected && trackingSelected.id === id) {
      setTrackingSelected({
        ...trackingSelected,
        status: newStatus
      });
    }
  };

  // Aplicar una plantilla al campo del correo
  const handleApplyTemplate = (templateId) => {
    if (!templateId) return;
    
    const result = applyTemplate(templateId, {
      userName: profile?.name || 'Usuario',
      companyName: 'Lovenda',
      providerName: form.to.split('@')[0] || 'Proveedor'
    });
    
    setForm({
      ...form,
      subject: result.subject || form.subject,
      body: result.body || form.body
    });
    
    setSelectedTemplate('');
  };

  // Filtrar correos según la búsqueda
  const filteredMails = mails.filter(mail => {
    const searchLower = search.toLowerCase();
    return (
      mail.subject.toLowerCase().includes(searchLower) ||
      mail.from.toLowerCase().includes(searchLower) ||
      mail.to.toLowerCase().includes(searchLower)
    );
  });

  // Filtrar y ordenar los registros de seguimiento
  const filteredTrackingRecords = trackingRecords
    .filter(record => {
      const searchMatch = record.providerName.toLowerCase().includes(search.toLowerCase()) || 
                         record.subject.toLowerCase().includes(search.toLowerCase());
      const statusMatch = statusFilter ? record.status === statusFilter : true;
      return searchMatch && statusMatch;
    })
    .sort((a, b) => {
      if (sortOrder === 'priority') {
        // Ordenar por prioridad (urgente primero)
        if (a.status === TRACKING_STATUS.URGENT && b.status !== TRACKING_STATUS.URGENT) return -1;
        if (a.status !== TRACKING_STATUS.URGENT && b.status === TRACKING_STATUS.URGENT) return 1;
        if (a.status === TRACKING_STATUS.WAITING && b.status !== TRACKING_STATUS.WAITING) return -1;
        if (a.status !== TRACKING_STATUS.WAITING && b.status === TRACKING_STATUS.WAITING) return 1;
        return new Date(b.lastUpdated) - new Date(a.lastUpdated);
      } else {
        // Ordenar por fecha
        return new Date(b.lastUpdated) - new Date(a.lastUpdated);
      }
    });

  return (
    <div className="container mx-auto p-4">
      {!serviceStatus.initialized ? (
        <Card className="p-4 mb-4">
          <div className="text-center py-4">
            {serviceStatus.error ? (
              <div>
                <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-2" />
                <h3 className="font-medium">Error al inicializar el servicio de correo</h3>
                <p className="text-sm text-gray-600">{serviceStatus.error}</p>
              </div>
            ) : (
              <div>
                <ClockIcon className="h-12 w-12 text-blue-500 mx-auto mb-2 animate-pulse" />
                <p>Inicializando servicio de correo...</p>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold">Buzón de correo</h1>
            <div className="flex items-center">
              {userEmail ? (
                <div className="text-right mr-2">
                  <p className="text-sm font-medium">Tu correo:</p>
                  <p className="text-xs text-blue-600">{userEmail}</p>
                </div>
              ) : serviceStatus.error ? (
                <div className="text-right mr-2">
                  <p className="text-xs text-red-600">Error al inicializar servicio de correo</p>
                </div>
              ) : (
                <div className="text-right mr-2">
                  <p className="text-xs text-gray-500">Inicializando...</p>
                </div>
              )}
              <Button 
                variant="outline" 
                className="text-xs py-1 px-2" 
                onClick={() => setShowEmailConfig(!showEmailConfig)}
              >
                Configurar
              </Button>
            </div>
          </div>

          {showEmailConfig && (
            <Card className="p-4 mb-4">
              <h2 className="text-lg font-medium mb-2">Configura tu correo electrónico</h2>
              <p className="text-sm text-gray-600 mb-4">
                Personaliza tu dirección de correo para recibir mensajes en Lovenda
              </p>
              
              <div className="flex items-end">
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alias de correo</label>
                  <div className="flex rounded-md shadow-sm">
                    <Input
                      type="text"
                      value={emailAlias}
                      onChange={(e) => setEmailAlias(e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, '.'))}
                      placeholder="tu.nombre"
                      className="rounded-r-none"
                      disabled={aliasStatus.loading}
                    />
                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      @lovenda.com
                    </span>
                  </div>
                  {aliasStatus.error && (
                    <p className="text-xs text-red-600 mt-1">{aliasStatus.error}</p>
                  )}
                </div>
                <Button 
                  onClick={handleCreateAlias} 
                  disabled={aliasStatus.loading || !emailAlias}
                  className="ml-2"
                >
                  {aliasStatus.loading ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
              
              {aliasStatus.success && (
                <div className="flex items-center text-green-600 mt-2">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  <span className="text-sm">¡Alias configurado correctamente!</span>
                </div>
              )}
            </Card>
          )}

          {/* Folder Tabs */}
          <div className="flex flex-wrap gap-2 mt-2 items-center">
            {['inbox', 'sent', 'tracking'].map((f) => {
                const unread = f==='inbox' ? mails.filter(m=>!m.read).length : 0;
                const needAttention = f==='tracking' ? trackingRecords.filter(r => 
                  r.status === TRACKING_STATUS.WAITING || r.status === TRACKING_STATUS.FOLLOWUP
                ).length : 0;
                
                return (
              <button
                key={f}
                onClick={() => {
                  setSelected(null);
                  setTrackingSelected(null);
                  setFolder(f);
                }}
                className={`relative px-3 py-1 rounded capitalize ${folder === f ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                {f === 'inbox' ? 'Entrada' : f === 'sent' ? 'Enviados' : 'Seguimiento'}
                  {unread>0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1">{unread}</span>}
                  {needAttention>0 && f==='tracking' && <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full px-1">{needAttention}</span>}
              </button>
              );
            })}
            <Input placeholder="Buscar..." className="ml-auto w-48" value={search} onChange={e=>setSearch(e.target.value)} />
            <Button variant="outline" onClick={refresh}>Refrescar</Button>
            <Button 
              onClick={() => {
                if (!userEmail) {
                  alert("Configura tu cuenta de correo primero");
                  setShowEmailConfig(true);
                  return;
                }
                setComposeOpen(true);
              }}
            >
              Redactar
            </Button>
          </div>
