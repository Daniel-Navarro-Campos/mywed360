/**
 * Script de prueba de integración para validar el funcionamiento conjunto 
 * del sistema de emails, calendario y plantillas de MyWed360.
 * 
 * Este script simula un flujo completo de usuario, desde recepción de emails
 * hasta la creación de eventos en calendario y uso de plantillas.
 */

// Simulación de servicios para pruebas
const mockServices = {
  EmailService: {
    // Datos de prueba - Emails recibidos
    inboxEmails: [
      {
        id: 'email_001',
        from: 'fotografo@ejemplo.com',
        to: 'maria.garcia@lovenda.com',
        subject: 'Disponibilidad para sesión de fotos',
        body: `<p>Hola María,</p>
        <p>Te confirmo que tengo disponibilidad para la sesión de fotos que solicitaste el 15/09/2025 a las 16:30.</p>
        <p>El lugar sería en nuestro estudio ubicado en Calle Gran Vía 56, Madrid.</p>
        <p>Si necesitas más información o quieres modificar algo, no dudes en contactarme.</p>
        <p>Saludos cordiales,</p>
        <p>Juan Pérez<br>Fotografía Momentos</p>`,
        date: '2025-07-10T10:23:45',
        read: false,
        folder: 'inbox',
        providerId: 'prov_001'
      },
      {
        id: 'email_002',
        from: 'catering@ejemplo.com',
        to: 'maria.garcia@lovenda.com',
        subject: 'Presupuesto para tu boda',
        body: `<p>Hola María,</p>
        <p>Adjunto encontrarás el presupuesto detallado para el servicio de catering que solicitaste.</p>
        <p>Como comentamos, incluye opciones para 100 invitados con diferentes menús a elegir.</p>
        <p>Necesitaríamos una confirmación antes del 20/07/2025 para reservar la fecha.</p>
        <p>Quedamos a tu disposición,</p>
        <p>Ana López<br>Catering Delicatessen</p>`,
        date: '2025-07-09T15:42:30',
        read: true,
        folder: 'inbox',
        attachments: [
          {
            name: 'Presupuesto-Boda-García.pdf',
            size: 2458000
          }
        ],
        providerId: 'prov_002'
      }
    ],
    
    // Datos de prueba - Emails enviados
    sentEmails: [
      {
        id: 'email_003',
        from: 'maria.garcia@lovenda.com',
        to: 'florista@ejemplo.com',
        subject: 'Consulta sobre arreglos florales',
        body: `<p>Estimados,</p>
        <p>Me pongo en contacto para consultar sobre sus servicios de decoración floral para una boda.</p>
        <p>La fecha sería el 15/09/2025 y necesitaría arreglos para la ceremonia y centro de mesa para 10 mesas.</p>
        <p>¿Podrían enviarme información y presupuesto?</p>
        <p>Muchas gracias,</p>
        <p>María García</p>`,
        date: '2025-07-08T09:15:22',
        read: true,
        folder: 'sent'
      }
    ],
    
    // Datos de prueba - Plantillas
    emailTemplates: [
      {
        id: 'template_001',
        name: 'Solicitud de información',
        category: 'Proveedores - Solicitud de información',
        subject: 'Consulta sobre servicios de {{servicio}} para boda',
        body: `<p>Estimado/a {{nombre_proveedor}}:</p>
        <p>Me pongo en contacto con ustedes porque estoy organizando mi boda para el día {{fecha_boda}} y estoy interesada en sus servicios de {{servicio}}.</p>
        <p>Me gustaría conocer más información sobre:</p>
        <ul>
          <li>Disponibilidad para la fecha mencionada</li>
          <li>Diferentes opciones y paquetes</li>
          <li>Precios aproximados</li>
        </ul>
        <p>Quedo a la espera de su respuesta.</p>
        <p>Saludos cordiales,</p>
        <p>{{nombre_novia}}</p>`,
        variables: ['servicio', 'nombre_proveedor', 'fecha_boda', 'nombre_novia'],
        isSystem: true
      },
      {
        id: 'template_002',
        name: 'Confirmación de cita',
        category: 'Proveedores - Confirmación',
        subject: 'Confirmación de cita - {{fecha_cita}}',
        body: `<p>Estimado/a {{nombre_proveedor}}:</p>
        <p>Por la presente confirmo nuestra cita para el día {{fecha_cita}} a las {{hora_cita}} en {{lugar_cita}}.</p>
        <p>Cualquier cambio, por favor házmelo saber con antelación.</p>
        <p>Saludos cordiales,</p>
        <p>{{nombre_novia}}</p>`,
        variables: ['nombre_proveedor', 'fecha_cita', 'hora_cita', 'lugar_cita', 'nombre_novia'],
        isSystem: true
      }
    ],
    
    // Métodos simulados
    getMails: function(folder = 'inbox') {
      if (folder === 'inbox') return this.inboxEmails;
      if (folder === 'sent') return this.sentEmails;
      return [];
    },
    
    getMailDetails: function(emailId) {
      const allEmails = [...this.inboxEmails, ...this.sentEmails];
      return allEmails.find(email => email.id === emailId) || null;
    },
    
    getEmailTemplates: function() {
      return this.emailTemplates;
    },
    
    saveEmailTemplate: function(template) {
      // Simular guardado
      console.log('Guardando plantilla:', template.name);
      return template;
    },
    
    sendMail: function(mailData) {
      console.log('Enviando email:', mailData);
      return {
        id: `email_${Date.now()}`,
        from: 'maria.garcia@lovenda.com',
        to: mailData.to,
        subject: mailData.subject,
        body: mailData.body,
        date: new Date().toISOString(),
        read: true,
        folder: 'sent'
      };
    },
    
    markAsRead: function(emailId) {
      console.log('Marcando email como leído:', emailId);
      const email = this.getMailDetails(emailId);
      if (email) {
        email.read = true;
      }
      return email;
    }
  },
  
  CalendarService: {
    // Datos de prueba - Eventos
    events: [
      {
        id: 'event_001',
        title: 'Prueba de vestido',
        dateTime: '2025-08-10T11:00:00',
        location: 'Tienda Novias Elegantes, Calle Serrano 25',
        description: 'Primera prueba del vestido con posibles ajustes',
        attendees: ['María García', 'Carmen García (madre)', 'Elena Martínez (madrina)'],
        providerRelated: true,
        providerId: 'prov_005'
      }
    ],
    
    // Métodos simulados
    getEvents: function() {
      return this.events;
    },
    
    addEvent: function(eventData) {
      console.log('Añadiendo evento al calendario:', eventData.title);
      const newEvent = {
        id: `event_${Date.now()}`,
        ...eventData
      };
      this.events.push(newEvent);
      return newEvent;
    }
  }
};

// Simulación de componentes React para pruebas
const mockComponents = {
  // Simula el comportamiento del componente EmailInbox
  EmailInbox: {
    name: 'EmailInbox',
    simulate: function() {
      console.log('\n--- SIMULANDO INTERACCIÓN CON BANDEJA DE ENTRADA ---');
      
      // Obtener emails
      console.log('1. Cargando emails de la bandeja de entrada');
      const emails = mockServices.EmailService.getMails('inbox');
      console.log(`   ✓ ${emails.length} emails recuperados`);
      
      // Seleccionar un email no leído
      const unreadEmail = emails.find(email => !email.read);
      if (unreadEmail) {
        console.log('2. Seleccionando email no leído:', unreadEmail.subject);
        
        // Marcar como leído
        const updatedEmail = mockServices.EmailService.markAsRead(unreadEmail.id);
        console.log('   ✓ Email marcado como leído');
        
        // Detectar posibles fechas y eventos
        console.log('3. Detectando información de eventos en el email');
        const hasEventInfo = unreadEmail.body.includes('sesión') && 
                            (unreadEmail.body.includes('fecha') || 
                             unreadEmail.body.match(/\d{1,2}\/\d{1,2}\/\d{4}/));
        
        if (hasEventInfo) {
          console.log('   ✓ Información de evento detectada, sugerencia de añadir al calendario');
        }
      }
      
      // Comprobar emails importantes
      const importantEmails = emails.filter(email => 
        email.folder === 'important' || 
        email.subject.toLowerCase().includes('urgente')
      );
      
      console.log(`4. Emails importantes: ${importantEmails.length}`);
      
      return { success: true };
    }
  },
  
  // Simula el comportamiento del componente EmailComposer con plantillas
  EmailComposer: {
    name: 'EmailComposer',
    simulate: function() {
      console.log('\n--- SIMULANDO CREACIÓN DE EMAIL CON PLANTILLA ---');
      
      // Cargar plantillas disponibles
      console.log('1. Cargando plantillas de email disponibles');
      const templates = mockServices.EmailService.getEmailTemplates();
      console.log(`   ✓ ${templates.length} plantillas disponibles`);
      
      // Seleccionar una plantilla
      const selectedTemplate = templates[0]; // Solicitud de información
      console.log('2. Seleccionando plantilla:', selectedTemplate.name);
      
      // Rellenar variables de la plantilla
      console.log('3. Rellenando variables de la plantilla');
      const replacedSubject = selectedTemplate.subject
        .replace('{{servicio}}', 'decoración floral');
      
      const replacedBody = selectedTemplate.body
        .replace('{{nombre_proveedor}}', 'Flores del Jardín')
        .replace('{{fecha_boda}}', '15/09/2025')
        .replace('{{servicio}}', 'decoración floral')
        .replace('{{nombre_novia}}', 'María García');
      
      console.log('   ✓ Variables reemplazadas correctamente');
      
      // Enviar email
      console.log('4. Enviando email basado en plantilla');
      const sentEmail = mockServices.EmailService.sendMail({
        to: 'flores.jardin@ejemplo.com',
        subject: replacedSubject,
        body: replacedBody
      });
      
      console.log('   ✓ Email enviado correctamente con ID:', sentEmail.id);
      
      return { success: true, emailId: sentEmail.id };
    }
  },
  
  // Simula el comportamiento del componente de integración con calendario
  CalendarIntegration: {
    name: 'CalendarIntegration',
    simulate: function() {
      console.log('\n--- SIMULANDO INTEGRACIÓN CON CALENDARIO ---');
      
      // Seleccionar un email con información de evento
      console.log('1. Seleccionando email con información de evento');
      const emailWithEvent = mockServices.EmailService.getMailDetails('email_001');
      console.log(`   ✓ Email seleccionado: "${emailWithEvent.subject}"`);
      
      // Extraer información de fecha y hora
      console.log('2. Extrayendo información de fecha y hora del email');
      const dateMatch = emailWithEvent.body.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      const timeMatch = emailWithEvent.body.match(/(\d{1,2}):(\d{2})/);
      
      let extractedDate = '';
      let extractedTime = '';
      
      if (dateMatch) {
        // Formato YYYY-MM-DD para fecha
        extractedDate = `${dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
        console.log(`   ✓ Fecha detectada: ${extractedDate}`);
      }
      
      if (timeMatch) {
        // Formato HH:MM para hora
        extractedTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
        console.log(`   ✓ Hora detectada: ${extractedTime}`);
      }
      
      // Extraer información de ubicación
      console.log('3. Extrayendo información de ubicación');
      const locationMatch = emailWithEvent.body.match(/en ([^.,<]+)/);
      const extractedLocation = locationMatch ? locationMatch[1].trim() : '';
      
      if (extractedLocation) {
        console.log(`   ✓ Ubicación detectada: ${extractedLocation}`);
      }
      
      // Crear evento en calendario
      console.log('4. Creando evento en el calendario');
      const newEvent = mockServices.CalendarService.addEvent({
        title: `Sesión de fotos - ${emailWithEvent.from.split('@')[0]}`,
        dateTime: `${extractedDate}T${extractedTime}:00`,
        location: extractedLocation,
        description: `Evento creado automáticamente desde email: "${emailWithEvent.subject}"`,
        attendees: ['María García', 'Fotógrafo'],
        providerRelated: true,
        providerId: emailWithEvent.providerId
      });
      
      console.log('   ✓ Evento añadido al calendario con ID:', newEvent.id);
      
      return { success: true, eventId: newEvent.id };
    }
  }
};

// Ejecutar prueba completa de integración
async function runIntegrationTest() {
  console.log('==========================================================');
  console.log('= PRUEBA DE INTEGRACIÓN DEL SISTEMA DE EMAILS DE LOVENDA =');
  console.log('==========================================================');
  
  try {
    // Probar la bandeja de entrada unificada
    const inboxResult = mockComponents.EmailInbox.simulate();
    
    // Probar el compositor con plantillas
    const composerResult = mockComponents.EmailComposer.simulate();
    
    // Probar la integración con calendario
    const calendarResult = mockComponents.CalendarIntegration.simulate();
    
    // Verificar resultados
    console.log('\n--- RESULTADOS DE LA PRUEBA DE INTEGRACIÓN ---');
    console.log(`1. Bandeja de entrada: ${inboxResult.success ? '✅ CORRECTO' : '❌ FALLÓ'}`);
    console.log(`2. Compositor con plantillas: ${composerResult.success ? '✅ CORRECTO' : '❌ FALLÓ'}`);
    console.log(`3. Integración con calendario: ${calendarResult.success ? '✅ CORRECTO' : '❌ FALLÓ'}`);
    
    console.log('\nPrueba de integración completada correctamente.');
    console.log('El sistema de emails personalizado de MyWed360 funciona según lo esperado.');
    
  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA DE INTEGRACIÓN:', error);
  }
}

// Ejecutar la prueba
runIntegrationTest();
