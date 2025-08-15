import express from 'express';
import LRU from 'lru-cache';
import Parser from 'rss-parser';

// Ruta que recupera titulares del sector nupcial desde varios feeds RSS.
// Se usa en el frontend Blog cuando no hay NEWSAPI_KEY.
// GET /api/wedding-news?pageSize=10&lang=es
// Devuelve: [{ id, title, description, url, image, source, published }]

const router = express.Router();

// Cache en memoria: 6 horas
const cache = new LRU({ max: 1, ttl: 1000 * 60 * 60 * 6 });
const parser = new Parser();

// Feeds RSS categorizados por idioma
const RSS_FEEDS = {
  es: [
    'https://www.hola.com/feeds/rss/any/novias/any/50.xml',
    'https://e00-telva.uecdn.es/rss/novias.xml',
    'https://luciasecasa.com/feed/',
    'https://www.zankyou.es/feed/',
    'https://luciasecasa.com/feed/vestidos-de-novia',
    'https://www.zankyou.it/feed/',
  ],
  en: [
    'https://rss.nytimes.com/services/xml/rss/nyt/Weddings.xml',
    'https://www.lovemydress.net/feed/',
    'https://weddinginspiration.co/feed/',
  ],
};

// Conversión genérica de elementos RSS a esquema del frontend
function mapItems(feed, feedUrl) {
  return (feed.items || []).map((it) => ({
    id: it.guid || it.id || it.link,
    title: it.title || '',
    description:
      it.contentSnippet ||
      it.summary ||
      it.content ||
      (typeof it.description === 'string' ? it.description.replace(/<[^>]+>/g, '') : ''),
    url: it.link || '',
    image:
      it.enclosure?.url ||
      it['media:content']?.url ||
      (Array.isArray(it.enclosure) && it.enclosure[0]?.url) ||
      null,
    source: new URL(feedUrl).hostname.replace('www.', ''),
    published: it.isoDate || it.pubDate || new Date().toISOString(),
  }));
}
// Fin mapItems

router.get('/', async (req, res) => {
  try {
    const lang = (req.query.lang || 'es').toLowerCase();
    const pageSize = parseInt(req.query.pageSize || '10', 10);

    // Cache por idioma
    if (cache.has(`posts_${lang}`)) {
      return res.json(cache.get(`posts_${lang}`).slice(0, pageSize));
    }

    const sources = RSS_FEEDS[lang] || RSS_FEEDS['en'];

    const promises = sources.map(async (url) => {
      try {
        const feed = await parser.parseURL(url);
        return mapItems(feed, url);
      } catch (err) {
        console.warn('RSS fetch failed', url, err.message);
        return [];
      }
    });

    let results = (await Promise.all(promises)).flat();
    // Elimina duplicados por id/url
    const seen = new Set();
    results = results.filter((p)=>{
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
    // Ordenar por fecha descendente
    results.sort((a, b) => new Date(b.published) - new Date(a.published));
    const final = results.slice(0, 50); // Cache hasta 50
    cache.set(`posts_${lang}`, final);
    res.json(final.slice(0, pageSize));
  } catch (err) {
    console.error('wedding-news error', err);
    res.status(500).json({ error: 'wedding-news-failed' });
  }
});

export default router;
