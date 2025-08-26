# Flujo 18: Generador de Documentos Legales

## Descripción General
Sistema integrado en el menú de Protocolo para generar automáticamente documentos legales necesarios para bodas, incluyendo contratos con proveedores, documentos de cesión de imagen, términos y condiciones personalizados, y sistema de firmas digitales.

## Objetivos
- Automatizar la creación de documentos legales estándar
- Reducir costos legales para parejas y wedding planners
- Garantizar cumplimiento legal básico
- Facilitar firma digital y gestión documental
- Proporcionar plantillas personalizables por región

---

## Ubicación en la Aplicación
**Menú**: Protocolo → Documentos Legales
**Ruta**: `/protocolo/documentos-legales`
**Acceso**: Disponible para todos los roles con diferentes permisos

---

## Flujo de Usuario

### 1. Acceso a Documentos Legales

#### **1.1 Navegación**
1. Usuario accede a menú "Protocolo"
2. Selecciona "Documentos Legales"
3. Ve dashboard con tipos de documentos disponibles
4. Puede crear nuevo documento o gestionar existentes

#### **1.2 Dashboard de Documentos**
```jsx
const DocumentsDashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <DocumentTypeCard
        title="Contratos Proveedores"
        description="Contratos estándar para catering, fotografía, música, etc."
        icon={FileText}
        count={contractsCount}
        status="active"
      />
      <DocumentTypeCard
        title="Cesión de Imagen"
        description="Autorización para uso de fotografías y videos"
        icon={Camera}
        count={imageRightsCount}
        status="pending"
      />
      <DocumentTypeCard
        title="Términos y Condiciones"
        description="T&C personalizados para eventos y servicios"
        icon={Shield}
        count={termsCount}
        status="draft"
      />
    </div>
  );
};
```

### 2. Tipos de Documentos Disponibles

#### **2.1 Contratos con Proveedores**

##### **Categorías de Contratos:**
- **Catering**: Menú, horarios, personal, equipamiento
- **Fotografía/Video**: Horas, entregables, derechos de imagen
- **Música/DJ**: Repertorio, equipos, horarios
- **Floristería**: Arreglos, entrega, montaje
- **Transporte**: Vehículos, horarios, rutas
- **Venue**: Espacios, horarios, restricciones

##### **Proceso de Creación:**
1. Seleccionar tipo de proveedor
2. Completar formulario con datos específicos
3. Personalizar cláusulas según necesidades
4. Generar documento PDF
5. Enviar para firma digital
6. Seguimiento de estado de firma

#### **2.2 Documentos de Cesión de Imagen**

##### **Tipos de Cesión:**
- **Invitados**: Autorización para aparecer en fotos/videos
- **Menores**: Autorización parental específica
- **Proveedores**: Uso de imágenes para portfolio
- **Redes Sociales**: Autorización para publicación online

##### **Generación Automática:**
```javascript
const generateImageRightsDocument = (eventData, participants) => {
  const template = {
    eventName: eventData.title,
    eventDate: eventData.date,
    eventLocation: eventData.venue,
    organizers: eventData.couple,
    participants: participants.map(p => ({
      name: p.name,
      dni: p.dni,
      relationship: p.relationship,
      minorAuthorization: p.isMinor
    })),
    usageRights: {
      photography: true,
      videography: true,
      socialMedia: eventData.socialMediaConsent,
      commercial: false,
      portfolio: eventData.portfolioConsent
    }
  };
  
  return generatePDF(template, 'image_rights_template');
};
```

#### **2.3 Términos y Condiciones Personalizados**

##### **Áreas Cubiertas:**
- **Responsabilidad civil** del evento
- **Política de cancelación** y reembolsos
- **Uso de instalaciones** y restricciones
- **Comportamiento de invitados**
- **Protección de datos** (GDPR)
- **Fuerza mayor** y contingencias

### 3. Generador de Contratos Inteligente

#### **3.1 Formulario Dinámico**
```jsx
const ContractGenerator = ({ providerType }) => {
  const [contractData, setContractData] = useState({});
  const [selectedClauses, setSelectedClauses] = useState([]);
  const [customClauses, setCustomClauses] = useState([]);
  
  const contractFields = getFieldsByProviderType(providerType);
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Datos básicos */}
      <Section title="Información General">
        <FormField label="Nombre del Proveedor" required />
        <FormField label="Servicio Contratado" required />
        <FormField label="Fecha del Evento" type="date" required />
        <FormField label="Importe Total" type="currency" required />
      </Section>
      
      {/* Campos específicos por tipo */}
      <Section title="Detalles del Servicio">
        {contractFields.map(field => (
          <DynamicFormField key={field.id} field={field} />
        ))}
      </Section>
      
      {/* Cláusulas estándar */}
      <Section title="Cláusulas del Contrato">
        <ClauseSelector
          availableClauses={getStandardClauses(providerType)}
          selectedClauses={selectedClauses}
          onSelectionChange={setSelectedClauses}
        />
      </Section>
      
      {/* Cláusulas personalizadas */}
      <Section title="Cláusulas Adicionales">
        <CustomClauseEditor
          clauses={customClauses}
          onChange={setCustomClauses}
        />
      </Section>
    </div>
  );
};
```

#### **3.2 Plantillas por Región**
```javascript
const REGIONAL_TEMPLATES = {
  'ES': {
    name: 'España',
    currency: 'EUR',
    language: 'es',
    legalFramework: 'spanish_civil_code',
    standardClauses: [
      'gdpr_compliance',
      'spanish_consumer_rights',
      'civil_liability_spain'
    ]
  },
  'FR': {
    name: 'Francia',
    currency: 'EUR',
    language: 'fr',
    legalFramework: 'french_civil_code',
    standardClauses: [
      'gdpr_compliance',
      'french_consumer_code',
      'civil_liability_france'
    ]
  },
  'US': {
    name: 'Estados Unidos',
    currency: 'USD',
    language: 'en',
    legalFramework: 'us_contract_law',
    standardClauses: [
      'liability_limitation',
      'dispute_resolution',
      'force_majeure'
    ]
  }
};
```

### 4. Sistema de Firmas Digitales

#### **4.1 Integración con DocuSign/HelloSign**
```javascript
const initializeDigitalSignature = async (documentId, signers) => {
  const signatureRequest = {
    documentId: documentId,
    signers: signers.map(signer => ({
      email: signer.email,
      name: signer.name,
      role: signer.role, // 'client', 'provider', 'witness'
      signatureFields: signer.signatureFields
    })),
    settings: {
      reminderFrequency: 3, // días
      expirationDays: 30,
      requireAllSigners: true
    }
  };
  
  return await digitalSignatureService.createRequest(signatureRequest);
};
```

#### **4.2 Seguimiento de Firmas**
```jsx
const SignatureTracker = ({ documentId }) => {
  const [signatureStatus, setSignatureStatus] = useState(null);
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Estado de Firmas</h3>
      
      {signatureStatus?.signers.map(signer => (
        <div key={signer.id} className="flex items-center justify-between py-3 border-b">
          <div className="flex items-center space-x-3">
            <Avatar src={signer.avatar} name={signer.name} />
            <div>
              <p className="font-medium">{signer.name}</p>
              <p className="text-sm text-gray-500">{signer.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {signer.status === 'signed' && (
              <Badge variant="success">Firmado</Badge>
            )}
            {signer.status === 'pending' && (
              <Badge variant="warning">Pendiente</Badge>
            )}
            {signer.status === 'declined' && (
              <Badge variant="error">Rechazado</Badge>
            )}
            
            <span className="text-sm text-gray-500">
              {signer.signedAt ? formatDate(signer.signedAt) : 'Sin firmar'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 5. Gestión Documental

#### **5.1 Biblioteca de Documentos**
```jsx
const DocumentLibrary = () => {
  const [documents, setDocuments] = useState([]);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    provider: 'all'
  });
  
  return (
    <div className="space-y-6">
      {/* Filtros */}
      <DocumentFilters filters={filters} onChange={setFilters} />
      
      {/* Lista de documentos */}
      <div className="grid gap-4">
        {documents.map(doc => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onEdit={() => editDocument(doc.id)}
            onDownload={() => downloadDocument(doc.id)}
            onDelete={() => deleteDocument(doc.id)}
            onResend={() => resendForSignature(doc.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

#### **5.2 Versionado de Documentos**
```javascript
const DocumentVersion = {
  id: "doc_123_v2",
  documentId: "doc_123",
  version: 2,
  createdAt: "2024-08-26T10:00:00Z",
  createdBy: "user_456",
  changes: [
    "Actualizado importe del catering",
    "Añadida cláusula de cancelación por COVID",
    "Corregida fecha de montaje"
  ],
  status: "draft", // draft, sent, signed, archived
  signatureRequestId: "sr_789"
};
```

---

## Especificación Técnica

### **Estructura de Datos**

#### **Documento Legal**
```javascript
{
  id: "legal_doc_123",
  weddingId: "wedding_456",
  type: "provider_contract", // provider_contract, image_rights, terms_conditions
  subtype: "catering", // catering, photography, music, etc.
  title: "Contrato de Catering - Restaurante El Jardín",
  
  // Datos del documento
  data: {
    provider: {
      name: "Restaurante El Jardín",
      cif: "B12345678",
      address: "Calle Mayor 123, Madrid",
      contact: "info@eljardin.com",
      phone: "+34 91 123 4567"
    },
    service: {
      description: "Servicio de catering para boda",
      date: "2024-12-15",
      time: "14:00-02:00",
      guests: 120,
      menu: "Menú Premium",
      totalAmount: 8500,
      deposit: 2550,
      finalPayment: 5950
    },
    clauses: [
      {
        id: "payment_terms",
        title: "Condiciones de Pago",
        content: "30% al firmar, 70% 15 días antes del evento",
        required: true
      },
      {
        id: "cancellation_policy",
        title: "Política de Cancelación",
        content: "Cancelación gratuita hasta 60 días antes",
        required: true
      }
    ]
  },
  
  // Estado del documento
  status: "draft", // draft, sent, partially_signed, fully_signed, expired
  createdAt: "2024-08-26T10:00:00Z",
  updatedAt: "2024-08-26T11:30:00Z",
  
  // Firmas digitales
  signatures: {
    requestId: "sr_789",
    signers: [
      {
        role: "client",
        email: "pareja@email.com",
        name: "Juan y María",
        status: "signed",
        signedAt: "2024-08-26T12:00:00Z"
      },
      {
        role: "provider",
        email: "info@eljardin.com",
        name: "Restaurante El Jardín",
        status: "pending",
        signedAt: null
      }
    ]
  },
  
  // Archivos generados
  files: {
    pdf: "documents/legal_doc_123.pdf",
    signedPdf: "documents/legal_doc_123_signed.pdf"
  }
}
```

### **Generador de PDFs**

#### **Servicio de Generación**
```javascript
import PDFDocument from 'pdfkit';

class LegalDocumentGenerator {
  constructor() {
    this.templates = new Map();
    this.loadTemplates();
  }
  
  async generateContract(documentData) {
    const doc = new PDFDocument();
    const template = this.templates.get(documentData.type);
    
    // Header
    this.addHeader(doc, documentData);
    
    // Parties information
    this.addPartiesInfo(doc, documentData);
    
    // Service details
    this.addServiceDetails(doc, documentData);
    
    // Clauses
    this.addClauses(doc, documentData.clauses);
    
    // Signature fields
    this.addSignatureFields(doc, documentData.signatures.signers);
    
    // Footer
    this.addFooter(doc, documentData);
    
    return doc;
  }
  
  addHeader(doc, data) {
    doc.fontSize(20)
       .text('CONTRATO DE SERVICIOS', 50, 50, { align: 'center' })
       .fontSize(12)
       .text(`Documento: ${data.id}`, 50, 100)
       .text(`Fecha: ${new Date().toLocaleDateString()}`, 400, 100);
  }
  
  addPartiesInfo(doc, data) {
    doc.fontSize(14)
       .text('PARTES CONTRATANTES', 50, 150)
       .fontSize(12)
       .text('CONTRATANTE:', 50, 180)
       .text(`${data.client.name}`, 150, 180)
       .text(`DNI: ${data.client.dni}`, 150, 195)
       .text(`Dirección: ${data.client.address}`, 150, 210)
       .text('CONTRATADO:', 50, 240)
       .text(`${data.provider.name}`, 150, 240)
       .text(`CIF: ${data.provider.cif}`, 150, 255)
       .text(`Dirección: ${data.provider.address}`, 150, 270);
  }
}
```

### **Integración con Firma Digital**

#### **Servicio de DocuSign**
```javascript
class DigitalSignatureService {
  constructor(apiKey, accountId) {
    this.apiKey = apiKey;
    this.accountId = accountId;
    this.baseUrl = 'https://demo.docusign.net/restapi';
  }
  
  async createEnvelope(documentData, signers) {
    const envelope = {
      emailSubject: `Firma de documento: ${documentData.title}`,
      documents: [{
        documentBase64: documentData.pdfBase64,
        name: documentData.title,
        fileExtension: 'pdf',
        documentId: '1'
      }],
      recipients: {
        signers: signers.map((signer, index) => ({
          email: signer.email,
          name: signer.name,
          recipientId: (index + 1).toString(),
          tabs: {
            signHereTabs: [{
              documentId: '1',
              pageNumber: signer.signaturePage || 1,
              xPosition: signer.signatureX || 100,
              yPosition: signer.signatureY || 100
            }]
          }
        }))
      },
      status: 'sent'
    };
    
    const response = await fetch(`${this.baseUrl}/v2.1/accounts/${this.accountId}/envelopes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(envelope)
    });
    
    return response.json();
  }
}
```

---

## Integración con Módulos Existentes

### **Con Sistema de Proveedores**
```javascript
// Generar contrato automáticamente al contratar proveedor
const contractProvider = async (providerId, serviceDetails) => {
  const provider = await getProvider(providerId);
  const contractData = {
    type: 'provider_contract',
    subtype: provider.category,
    provider: provider,
    service: serviceDetails,
    client: activeWedding.couple
  };
  
  const document = await generateLegalDocument(contractData);
  await sendForSignature(document, [
    { role: 'client', email: activeWedding.couple.email },
    { role: 'provider', email: provider.email }
  ]);
};
```

### **Con Sistema de Invitados**
```javascript
// Generar documentos de cesión de imagen para invitados
const generateImageRightsForGuests = async (guestList) => {
  const imageRightsDoc = {
    type: 'image_rights',
    participants: guestList.map(guest => ({
      name: guest.name,
      dni: guest.dni,
      isMinor: guest.age < 18,
      parentalConsent: guest.parentalConsent
    }))
  };
  
  return await generateLegalDocument(imageRightsDoc);
};
```

### **Con Sistema de Tareas**
```javascript
// Crear tareas automáticas para seguimiento de documentos
const createDocumentTasks = async (documentId) => {
  const tasks = [
    {
      title: "Revisar contrato generado",
      dueDate: addDays(new Date(), 2),
      category: "legal",
      priority: "high"
    },
    {
      title: "Seguir estado de firmas",
      dueDate: addDays(new Date(), 7),
      category: "legal",
      priority: "medium"
    },
    {
      title: "Archivar documento firmado",
      dueDate: addDays(new Date(), 30),
      category: "legal",
      priority: "low"
    }
  ];
  
  for (const task of tasks) {
    await createTask({ ...task, relatedDocument: documentId });
  }
};
```

---

## Consideraciones Legales

### **Limitaciones y Disclaimers**
- Los documentos son plantillas básicas, no asesoramiento legal
- Se recomienda revisión por abogado para casos complejos
- Cumplimiento con legislación local según región
- Actualización periódica de plantillas según cambios legales

### **Protección de Datos**
- Encriptación de documentos sensibles
- Cumplimiento GDPR para datos personales
- Retención limitada de documentos firmados
- Derecho al olvido y portabilidad de datos

### **Validez Legal**
- Firma digital con certificado reconocido
- Timestamping para prueba de fecha
- Almacenamiento seguro de evidencias
- Trazabilidad completa del proceso

---

## Implementación por Fases

### **Fase 1: Generador Básico (3 semanas)**
- Plantillas de contratos principales
- Generador de PDFs
- Interfaz básica de creación
- Almacenamiento de documentos

### **Fase 2: Firma Digital (2 semanas)**
- Integración con DocuSign
- Seguimiento de estado de firmas
- Notificaciones automáticas
- Gestión de recordatorios

### **Fase 3: Funcionalidades Avanzadas (2 semanas)**
- Plantillas por región
- Versionado de documentos
- Biblioteca documental
- Integración con otros módulos

### **Fase 4: Optimización (1 semana)**
- Mejoras de UX
- Optimización de plantillas
- Testing legal
- Documentación final

Esta funcionalidad proporciona una solución completa para la gestión de documentos legales en bodas, reduciendo costos y simplificando procesos administrativos complejos.
