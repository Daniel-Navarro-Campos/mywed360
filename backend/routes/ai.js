// routes/ai.js
// Handles AI-powered endpoints: parse-dialog via OpenAI GPT and image generation via Stability SDK
// Note: requires environment variables OPENAI_API_KEY and STABILITY_API_KEY

import express from 'express';
import OpenAI from 'openai';
import axios from 'axios';
import admin from 'firebase-admin';


const router = express.Router();

// ---------- OpenAI Client ----------
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


// ---------- Firestore (optional) ----------
let db = null;
try {
  if (admin.apps.length === 0 && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({});
  }
  db = admin.apps.length ? admin.firestore() : null;
} catch {}

// POST /api/parse-dialog
// Body: { text: "free form conversation" }
// Returns: { extracted: {...} }
router.post('/parse-dialog', async (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text required' });
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY missing' });
  }

  try {
    // Define function schema for structured output
    const functions = [
      {
        name: 'extractWeddingData',
        description:
          'Extrae datos relevantes de la conversación para la aplicación de planificación de boda',
        parameters: {
          type: 'object',
          properties: {
            guests: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Nombre del invitado' },
                  phone: { type: 'string', description: 'Teléfono' },
                  address: { type: 'string' },
                  companions: { type: 'integer', minimum: 0 },
                  table: { type: 'string' },
                },
              },
            },
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  due: { type: 'string', description: 'Fecha ISO' },
                },
              },
            },
            meetings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  start: { type: 'string', description: 'Fecha/hora inicio ISO' },
                  end: { type: 'string', description: 'Fecha/hora fin ISO' },
                  date: { type: 'string', description: 'Fecha ISO shorthand' },
                  when: { type: 'string', description: 'Expresión natural de fecha/hora' }
                },
              },
            },
            budgetMovements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  concept: { type: 'string' },
                  amount: { type: 'number' },
                  date: { type: 'string' },
                  type: { type: 'string', enum: ['expense', 'income'] },
                },
              },
            },
            commands: {
              description: 'Acciones que el usuario quiere realizar en la aplicación',
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  entity: { type: 'string', enum: ['task','meeting','guest','movement','table','config','supplier'] },
                  action: { type: 'string', enum: ['add','update','delete','complete','move','set','search'] },
                  payload: { type: 'object' }
                },
                required: ['entity','action','payload']
              }
            },
          },
        },
        required: [],
      },
    ];

    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'Eres un asistente que extrae información estructurada para una aplicación de bodas. Devuelve solo datos válidos en la función.',
        },
        { role: 'user', content: text },
      ],
      functions,
      function_call: { name: 'extractWeddingData' },
    });

    const responseMessage = completion.choices?.[0]?.message;
    let extracted = {};
    if (responseMessage?.function_call?.arguments) {
      try {
        extracted = JSON.parse(responseMessage.function_call.arguments);
      } catch (parseErr) {
        console.warn('⚠️  No se pudo parsear JSON de la función:', parseErr);
        extracted = { raw: responseMessage.function_call.arguments };
      }
    }

    // ----- Conversational friendly reply -----
    let reply = '';
    try {
      const summaryCompletion = await openai.chat.completions.create({
        model,
        temperature: 0.7,
        messages: [
          { role: 'system', content: 'Eres un asistente wedding planner que responde de forma breve y amistosa a la pareja, resumiendo las acciones o dudas detectadas.' },
          { role: 'user', content: text },
          { role: 'assistant', content: `He extraído estos datos: ${JSON.stringify(extracted)}` },
          { role: 'user', content: 'Por favor, responde de forma cercana en español.' }
        ]
      });
      reply = summaryCompletion.choices?.[0]?.message?.content || '';
    } catch (sumErr) {
      console.warn('No se pudo generar respuesta amigable:', sumErr);
    }

    // Guardar en Firestore si está configurado
    if (db) {
      const ref = db.collection('aiParsedDialogs').doc();
      await ref.set({ text, extracted, reply, createdAt: admin.firestore.FieldValue.serverTimestamp() }).catch(()=>{});
    }

    res.json({ extracted, reply });
  } catch (err) {
    console.error('AI parsing failed:', err);
    res.status(500).json({ error: 'AI parsing failed', details: err?.message || 'unknown' });
  }
});

// GET /api/ai/search-suppliers?q=photographer+Madrid
router.get('/search-suppliers', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'q required' });
  const { SERPAPI_API_KEY } = process.env;
  if (!SERPAPI_API_KEY) {
    return res.status(500).json({ error: 'SERPAPI_API_KEY missing' });
  }
  try {
    const resp = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google',
        q,
        num: 10,
        api_key: SERPAPI_API_KEY,
      },
    });
    const results = (resp.data?.organic_results || []).slice(0, 5).map((r) => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet,
    }));
    res.json({ results });
  } catch (err) {
    console.error('Supplier search failed:', err);
    res.status(500).json({ error: 'search failed', details: err?.message || 'unknown' });
  }
});

export default router;
