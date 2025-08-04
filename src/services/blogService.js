// Servicio de Blog
// Carga noticias del sector bodas usando NewsAPI.org.
// La clave se leerá de VITE_NEWSAPI_KEY; si no existe, se devolverán artículos de ejemplo.

import axios from 'axios';
import { translateText } from './translationService.js';

/**
 * @typedef {Object} BlogPost
 * @property {string} id         - identificador único
 * @property {string} title      - título del artículo
 * @property {string} description- descripción breve
 * @property {string} url        - enlace original
 * @property {string} image      - URL de imagen de portada (puede ser null)
 * @property {string} source     - medio
 * @property {string} published  - fecha ISO
 */

const API_KEY = import.meta.env.VITE_NEWSAPI_KEY;

export async function fetchWeddingNews(page = 1, pageSize = 10, language = 'es') {
  if (!API_KEY) {
    // Demo sin clave
    return [
      {
        id: 'demo_1',
        title: 'Ideas de decoración para tu boda en 2025',
        description: 'Tendencias frescas en flores, iluminación y mesas para sorprender a tus invitados.',
        url: 'https://example.com/boda-decoracion-2025',
        image: 'https://images.unsplash.com/photo-1529634896862-08db0e0ea1cf?w=600',
        source: 'Demo News',
        published: new Date().toISOString(),
      },
    ];
  }

  const res = await axios.get('https://newsapi.org/v2/everything', {
    params: {
      q: 'wedding OR boda',
      language,
      sortBy: 'publishedAt',
      pageSize,
      page,
    },
    headers: {
      'X-Api-Key': API_KEY,
    },
  });

  const mapped = res.data.articles.map((a, idx) => ({
    id: `${page}_${idx}_${a.url}`,
    title: a.title,
    description: a.description,
    url: a.url,
    image: a.urlToImage,
    source: a.source.name,
    published: a.publishedAt,
  }));

  // Traducción si es necesario y hay API Key de traducción
  if (language !== 'en') {
    for (const post of mapped) {
      post.title = await translateText(post.title, language, '');
      post.description = await translateText(post.description, language, '');
    }
  }
  return mapped;
}
