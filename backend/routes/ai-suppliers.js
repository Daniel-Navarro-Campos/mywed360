// routes/ai-suppliers.js
// Endpoint que llama a OpenAI para buscar proveedores de boda
// POST /api/ai-suppliers
// Body (JSON): { query: string, service?: string, budget?: string, profile?: object, location?: string }
// Respuesta: Array<{title, link, snippet, service, location, priceRange}>

import express from 'express';
import OpenAI from 'openai';
import logger from '../logger.js';

const router = express.Router();

// Inicializar cliente OpenAI una sola vez
const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
let openai = null;
const projectId = process.env.OPENAI_PROJECT_ID;
if (apiKey) {
  openai = new OpenAI({ apiKey, project: projectId });
  logger.info('✅ Cliente OpenAI inicializado para /api/ai-suppliers');
} else {
  logger.warn('⚠️  OPENAI_API_KEY no definido. /api/ai-suppliers devolverá 500');
}

router.post('/', async (req, res) => {
  if (!openai) return res.status(500).json({ error: 'OPENAI_API_KEY missing' });
  const { query, service = '', budget = '', profile = {}, location = '' } = req.body || {};
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'query is required' });
  }

  const servicioSeleccionado = service;
  const formattedLocation = location || profile?.celebrationPlace || 'España';

  const locationPrompt = formattedLocation
    ? `La boda es en ${formattedLocation}.`
    : 'La ubicación de la boda no está especificada.';
  const budgetPrompt = budget ? `El presupuesto es ${budget}.` : 'No hay un presupuesto especificado.';

  const prompt = `Actúa como un asistente de planificación de bodas que busca proveedores reales. 
Necesito encontrar proveedores de "${servicioSeleccionado || 'servicios para bodas'}" que ofrezcan: "${query}".
${locationPrompt}
${budgetPrompt}
Devuelve ÚNICAMENTE un array JSON con 5 opciones de proveedores reales, con el formato exacto por cada proveedor: \n{
  \"title\": \"Nombre del proveedor\",\n  \"link\": \"URL de su web oficial o perfil en plataforma de bodas\",\n  \"snippet\": \"Breve descripción del servicio que ofrecen\",\n  \"service\": \"${servicioSeleccionado || 'Servicios para bodas'}\",\n  \"location\": \"Ubicación del proveedor (ciudad o provincia)\",\n  \"priceRange\": \"Rango de precios aproximado\"\n}\nAsegúrate de: 1) incluir enlaces reales y operativos, preferiblemente web oficial o bodas.net; 2) priorizar proveedores en ${formattedLocation}; 3) que sean relevantes para "${query}"; 4) devolver SOLO el array JSON, sin texto adicional.`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      temperature: 0,
      messages: [
        { role: 'system', content: 'Eres un asistente experto en planificación de bodas.' },
        { role: 'user', content: prompt }
      ]
    });

    const content = completion.choices?.[0]?.message?.content || '';
    let results = [];
    try {
      results = JSON.parse(content);
    } catch {
      // Intentar extraer substring que parezca un array JSON
      const match = content.match(/\[.*\]/s);
      if (match) {
        try {
          results = JSON.parse(match[0]);
        } catch { /* deja results vacío */ }
      }
    }

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(502).json({ error: 'openai_invalid_response', raw: content });
    }

    res.json(results);
  } catch (err) {
    logger.error('❌ Error en /api/ai-suppliers', err);
    res.status(500).json({ error: 'openai_failed', details: err?.message || 'unknown' });
  }
});

export default router;
