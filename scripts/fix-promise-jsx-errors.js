#!/usr/bin/env node

/**
 * Script para corregir automáticamente los errores de Promesas en JSX
 * que están bloqueando los tests E2E Cypress
 */

const fs = require('fs');
const path = require('path');

// Lista de componentes que necesitan corrección
const componentsToFix = [
  'src/components/email/EmailInbox.jsx',
  'src/components/email/EmailComposer.jsx',
  'src/components/email/EmailDetail.jsx',
  'src/components/email/UnifiedInbox/EmailDetail.jsx',
  'src/components/email/UnifiedInbox/EmailList.jsx',
  'src/components/email/UnifiedInbox/InboxContainer.jsx',
  'src/components/email/TagsManager.jsx',
  'src/components/email/EmailStats.jsx',
  'src/components/email/ComposeEmail.jsx',
  'src/components/email/EmailRecommendationsPanel.jsx',
  'src/components/email/EmailComments.jsx',
  'src/components/email/EmailNotificationBadge.jsx',
  'src/components/email/EmailTagsManager.jsx',
  'src/components/email/EmailList.jsx',
  'src/components/email/EmailView.jsx',
  'src/components/email/EmailFolderList.jsx',
  'src/components/email/CustomFolders.jsx',
  'src/components/email/FolderSelectionModal.jsx'
];

// Función para añadir el import del promiseSafeRenderer
function addPromiseSafeRendererImport(content) {
  // Verificar si ya tiene el import
  if (content.includes('promiseSafeRenderer')) {
    return content;
  }

  // Buscar otros imports de React
  const reactImportRegex = /import React[^;]+;/;
  const match = content.match(reactImportRegex);
  
  if (match) {
    const importLine = "import { safeRender, ensureNotPromise, safeMap, safeExecute, safeDangerouslySetInnerHTML } from '../../../utils/promiseSafeRenderer';";
    return content.replace(match[0], match[0] + '\n' + importLine);
  }

  return content;
}

// Función para envolver valores peligrosos con safeRender
function wrapDangerousValues(content) {
  // Patrones comunes que pueden retornar Promesas
  const patterns = [
    // Funciones async directas en JSX
    /\{([^}]*async[^}]*)\}/g,
    // Llamadas a funciones que podrían retornar Promesas
    /\{([^}]*\.then\([^}]*)\}/g,
    // Variables que podrían ser Promesas
    /\{([^}]*Promise[^}]*)\}/g
  ];

  let result = content;
  
  patterns.forEach(pattern => {
    result = result.replace(pattern, (match, group) => {
      return `{safeRender(${group.trim()})}`;
    });
  });

  return result;
}

// Función principal para procesar un archivo
function processFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Archivo no encontrado: ${filePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Aplicar correcciones
    content = addPromiseSafeRendererImport(content);
    content = wrapDangerousValues(content);
    
    // Escribir el archivo corregido
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Corregido: ${filePath}`);
    
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
  }
}

// Ejecutar correcciones
console.log('🔧 Iniciando corrección automática de errores de Promesas en JSX...\n');

componentsToFix.forEach(processFile);

console.log('\n✅ Corrección automática completada!');
console.log('📝 Recuerda commitear y pushear los cambios para que se ejecuten en CI.');
