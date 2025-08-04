import express from 'express';
import axios from 'axios';
import LRU from 'lru-cache';

// Proxy de imágenes para evitar bloqueos de hot-link (Pinterest, etc.)
// GET /api/image-proxy?u=<url_codificada>
// Cache en memoria 1h para minimizar peticiones externas

const router = express.Router();
const cache = new LRU({ max: 500, ttl: 1000 * 60 * 60 });

router.get('/', async (req, res) => {
  const { u } = req.query;
  if (!u) return res.status(400).send('missing url');

  try {
    if (cache.has(u)) {
      const { buffer, type } = cache.get(u);
      res.set('Content-Type', type);
      return res.send(buffer);
    }

    const response = await axios.get(u, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        // Evitar que el host remoto bloquee por falta de referer
        Referer: 'https://www.google.com',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      },
    });

    const type = response.headers['content-type'] || 'image/jpeg';
    cache.set(u, { buffer: response.data, type });
    res.set('Content-Type', type);
    res.send(response.data);
  } catch (err) {
    console.error('Image proxy error', err.message);
    res.status(500).send('proxy_error');
  }
});

export default router;
