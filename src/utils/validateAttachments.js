/**
 * Valida adjuntos para asegurar tipo de archivo permitido y tamaño máximo.
 * @param {Array} attachments - [{ file: File, filename: string, size: number }]
 * @param {Object} opts
 * @param {number} opts.maxSizeMB Tamaño máximo permitido en MB (default 25)
 * @param {string[]} opts.allowedExts Extensiones permitidas (default lista común)
 * @throws {Error} Si algún adjunto no cumple las reglas
 */
export default function validateAttachments(attachments = [], opts = {}) {
    // Limite individual (MB) y total (MB)
  const maxSize = (opts.maxSizeMB ?? 10) * 1024 * 1024; // bytes
  const maxTotal = (opts.maxTotalSizeMB ?? 10) * 1024 * 1024; // bytes
    const allowed = opts.allowedExts || [
    'pdf','doc','docx','xls','xlsx','ppt','pptx','txt',
    'png','jpg','jpeg','gif','svg','webp'
  ];

    let totalSize = 0;
  for (const att of attachments) {
    if (!att) continue;
    const name = att.filename || (att.file && att.file.name) || '';
    const size = att.size || (att.file && att.file.size) || 0;
    const ext = name.split('.').pop().toLowerCase();

        // Si no hay extensión, ignorar comprobación de tipo de archivo
    if (ext && !allowed.includes(ext)) {
      throw new Error(`Tipo de archivo no permitido: .${ext}`);
    }
        if (size > maxSize) {
      throw new Error(`El archivo ${name} excede el tamaño máximo de ${maxSize / (1024 * 1024)} MB`);
    }
      totalSize += size;
  }
  if (totalSize > maxTotal) {
    throw new Error(`El tamaño total de adjuntos excede el tamaño máximo de ${maxTotal / (1024 * 1024)} MB`);
  }
  return true;
}
