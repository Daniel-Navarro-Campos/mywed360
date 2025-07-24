// Script de validación del sistema de emails personalizado de Lovenda
// Ejecutar con: node email-system-test.js

// Nota: Este script está diseñado para probar la lógica, pero requiere adaptaciones
// para ejecutarse fuera del entorno de React debido a las dependencias de entorno

// Simulación de servicios para pruebas
const EmailService = {
  initEmailService: (profile) => {
    // Simula la lógica de generación de emails
    if (profile.emailAlias) {
      return `${profile.emailAlias}@lovenda.com`;
    }
    
    if (profile.brideFirstName && profile.brideLastName) {
      const normalizedName = `${profile.brideFirstName.toLowerCase()}.${profile.brideLastName.toLowerCase()}`
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
        .replace(/[^a-z0-9.]/g, '.'); // Reemplazar caracteres no permitidos
      return `${normalizedName}@lovenda.com`;
    }
    
    return `user${profile.userId}@lovenda.com`;
  },
  
  sendMail: async ({ to, subject, body }) => {
    console.log('\nSimulando envío de email:');
    console.log(`A: ${to}`);
    console.log(`Asunto: ${subject}`);
    console.log('Contenido: [Contenido HTML omitido]');
    
    // Simular respuesta exitosa
    return {
      id: 'email_' + Math.random().toString(36).substring(2, 10),
      from: 'usuario@lovenda.com',
      to,
      subject,
      date: new Date().toISOString(),
      status: 'sent'
    };
  }
};

const EmailTrackingService = {
  createTrackingRecord: async (email, provider) => {
    console.log('\nCreando registro de seguimiento:');
    console.log(`Email ID: ${email.id}`);
    console.log(`Proveedor: ${provider.name} (${provider.id})`);
    
    return {
      id: 'track_' + Math.random().toString(36).substring(2, 10),
      emailId: email.id,
      providerId: provider.id,
      providerName: provider.name,
      status: 'waiting',
      lastEmailDate: new Date().toISOString(),
      thread: [{ emailId: email.id, direction: 'outgoing', date: new Date().toISOString() }]
    };
  }
};

// Perfil de usuario de prueba
const testUserProfile = {
  userId: '1234',
  brideFirstName: 'María',
  brideLastName: 'García',
  weddingDate: '2025-09-15',
  emailAlias: '', // Dejar vacío para probar la generación automática
};

// Proveedor de prueba
const testProvider = {
  id: 'prov123',
  name: 'Fotografía Momentos',
  email: 'test@provider.com',
  service: 'fotografía',
  phone: '555-123456',
  contact: 'Juan Pérez'
};

// Inicializa la prueba
async function runEmailTest() {
  console.log('=== Iniciando prueba del sistema de emails de Lovenda ===');
  
  try {
    // 1. Inicializar el servicio con el perfil de usuario
    const userEmail = EmailService.initEmailService(testUserProfile);
    console.log(`✅ Email de usuario generado: ${userEmail}`);
    
    // 2. Enviar un email de prueba
    console.log('\n>> Enviando email de prueba al proveedor...');
    const emailSubject = `Consulta sobre servicios de fotografía para boda`;
    const emailBody = `
      <p>Estimado/a ${testProvider.name}:</p>
      
      <p>Mi nombre es ${testUserProfile.brideFirstName} ${testUserProfile.brideLastName} y me pongo en contacto con ustedes porque estoy organizando mi boda.</p>
      
      <p>He visto sus servicios de fotografía y me gustaría obtener más información.</p>
      
      <p>Saludos cordiales,<br>
      ${testUserProfile.brideFirstName}</p>
      
      <p style="color:#888; font-size:12px;">Email de prueba - Sistema Lovenda</p>
    `;
    
    const emailResult = await EmailService.sendMail({
      to: testProvider.email,
      subject: emailSubject,
      body: emailBody
    });
    
    if (emailResult && emailResult.id) {
      console.log(`✅ Email enviado correctamente con ID: ${emailResult.id}`);
      
      // 3. Crear registro de seguimiento
      console.log('\n>> Creando registro de seguimiento...');
      const trackingResult = await createTrackingRecord(emailResult, testProvider);
      
      if (trackingResult && trackingResult.id) {
        console.log(`✅ Registro de seguimiento creado con ID: ${trackingResult.id}`);
        console.log(`   Estado inicial: ${trackingResult.status}`);
        console.log(`   Fecha de seguimiento: ${trackingResult.lastEmailDate}`);
      } else {
        console.error('❌ Error al crear registro de seguimiento');
      }
      
      // 4. Simular recepción de respuesta
      console.log('\n>> Simulando respuesta del proveedor...');
      // Esta parte depende de la implementación concreta del sistema
      // En producción, esto sería automático al detectar un email entrante
      console.log('ℹ️ En un entorno real, el sistema detectaría automáticamente la respuesta');
      
    } else {
      console.error('❌ Error al enviar email');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
  
  console.log('\n=== Fin de la prueba ===');
}

// Ejecutar la prueba
runEmailTest()
  .then(() => {
    console.log('Prueba completada');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error fatal en la prueba:', err);
    process.exit(1);
  });
