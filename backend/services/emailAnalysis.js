import dotenv from 'dotenv';
import path from 'path';
import logger from '../logger.js';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';

let openai = null;
async function ensureOpenAI() {
  if (openai || !OPENAI_API_KEY) return;
  try {
    const { default: OpenAI } = await import('openai');
    openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    console.log('✅ Cliente OpenAI inicializado en emailAnalysis');
  } catch (err) {
    console.error('❌ Error inicializando OpenAI en emailAnalysis:', err);
  }
}

/**
 * Analiza el contenido de un correo y devuelve acciones estructuradas.
 * @param {Object} params
 * @param {string} params.subject - Asunto del correo
 * @param {string} params.body - Cuerpo (texto plano preferido)
 * @returns {Promise<Object>} JSON con tasks, meetings, budgets, contracts...
 */
export async function analyzeEmail({ subject = '', body = '' }) {
  await ensureOpenAI();
  if (!openai) {
    logger.warn('OPENAI_API_KEY no definido; análisis omitido');
    return { tasks: [], meetings: [], budgets: [], contracts: [] };
  }

  const promptUser = `Email recibido:\nAsunto: ${subject}\nCuerpo:\n${body}\n---\nExtrae acciones relevantes (tareas, reuniones, presupuestos, contratos). Devuelve JSON tal como se indica en la función.`;

  const functions = [
    {
      name: 'extractEmailActions',
      description: 'Extrae acciones desde un correo para generar tareas, reuniones, presupuestos, contratos',
      parameters: {
        type: 'object',
        properties: {
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                due: { type: 'string', description: 'Fecha ISO o vacío' },
                priority: { type: 'string', enum: ['alta','media','baja'], default: 'media' }
              },
              required: ['title']
            }
          },
          meetings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                date: { type: 'string', description: 'Fecha/hora ISO' },
                participants: { type: 'array', items: { type: 'string' } }
              },
              required: ['title','date']
            }
          },
          budgets: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                client: { type: 'string' },
                amount: { type: 'number' },
                currency: { type: 'string', default: 'EUR' }
              },
              required: ['client','amount']
            }
          },
          contracts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                party: { type: 'string' },
                type: { type: 'string' },
                action: { type: 'string', description: 'review, sign, send, etc.' }
              },
              required: ['party','type']
            }
          }
        },
        required: []
      }
    }
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      temperature: 0,
      messages: [
        { role: 'system', content: 'Eres un asistente que produce JSON estructurado' },
        { role: 'user', content: promptUser }
      ],
      functions,
      function_call: { name: 'extractEmailActions' }
    });
    const msg = completion.choices?.[0]?.message;
    let extracted = {};
    if (msg?.function_call?.arguments) {
      try {
        extracted = JSON.parse(msg.function_call.arguments);
      } catch (err) {
        logger.warn('No se pudo parsear JSON en emailAnalysis:', err);
      }
    }
    return extracted;
  } catch (err) {
    logger.error('Error analizando correo:', err);
    return { error: true, message: err.message };
  }
}
