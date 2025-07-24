import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import logger from '../logger.js';

// Cargar variables .env por si este archivo se ejecuta aislado
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';

const router = express.Router();

/**
 * POST /api/ai-image
 * Body: { prompt: string, size?: '1024x1024' | '1792x1024' | '1024x1792', quality?: 'standard' | 'hd' }
 * Devuelve: { url }
 */
router.post('/', async (req, res) => {
  const { prompt, size = '1024x1024', quality = 'hd' } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt required' });
  }
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY missing' });
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        quality
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        timeout: 15000
      }
    );

    const url = response.data?.data?.[0]?.url;
    if (!url) throw new Error('No url in OpenAI response');

    res.json({ url });
  } catch (err) {
    logger.error('ai-image proxy error', err?.response?.data || err.message);
    const status = err?.response?.status || 500;
    res.status(status).json({ error: 'openai-failed', details: err?.message || 'unknown' });
  }
});

// ---------- PDF vectorizado ----------


import { createCanvas, loadImage } from 'canvas';
import ImageTracer from 'imagetracerjs';
import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';
import stream from 'stream';

/**
 * POST /api/ai-image/vector-pdf
 * Body: { url: string, widthMm?: number, heightMm?: number }
 * Devuelve PDF vectorial listo para imprenta.
 */
router.post('/vector-pdf', async (req, res) => {
  const { url, widthMm = 210, heightMm = 297, dpi = 300 } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url required' });
  try {
    // 1. Descargar la imagen (puede ser PNG o JPEG)
    const imgResp = await axios.get(url, { responseType: 'arraybuffer' });
    const originalBuf = Buffer.from(imgResp.data);

    // 2. Cargar en canvas y vectorizar con ImageTracerJS
    const pxPerMm = dpi / 25.4; // 1 in = 25.4 mm, dpi = dots per inch
    const targetWidthPx = Math.round(widthMm * pxPerMm);
    const targetHeightPx = Math.round(heightMm * pxPerMm);

    // 3. Cargar la imagen con canvas
    const img = await loadImage(originalBuf);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // 4. Obtener ImageData y vectorizar
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const svgString = ImageTracer.imagedataToSVG(imageData, {
      numberofcolors: 32,
      strokewidth: 1,
      ltres: 0.1,
      qtres: 0.1
    });

    // 5. Convertir dimensiones a puntos tipográficos
    const ptPerMm = 72 / 25.4;
    const widthPt = widthMm * ptPerMm;
    const heightPt = heightMm * ptPerMm;

    // 6. Crear PDF e insertar el SVG
    const doc = new PDFDocument({ size: [widthPt, heightPt], margin: 0 });

    // Recoger los datos antes de finalizar el documento
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => {
      const pdfBuf = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=design-vector-color.pdf');
      res.send(pdfBuf);
    });

    // Dibujar el SVG y cerrar
    SVGtoPDF(doc, svgString, 0, 0, { width: widthPt, height: heightPt });
    doc.end();
  } catch (err) {
    logger.error('vector-color-pdf error', err);
    res.status(500).json({ error: 'vector-color-pdf-failed', details: err?.message || 'unknown' });
  }
});

export default router;
