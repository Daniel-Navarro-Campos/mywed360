// blogService.js - noticias de bodas
import axios from 'axios';
import { translateText } from './translationService.js';

// Usa variable de entorno Vite; si no existe, usa clave proporcionada explícitamente.
const API_KEY = import.meta.env.VITE_NEWSAPI_KEY || 'f7579ee601634944822b313e268a9357';

/**
 * @typedef {Object} BlogPost
 * @property {string} id          Identificador único
 * @property {string} title       Título
 * @property {string} description Descripción
 * @property {string} url         Enlace original
 * @property {string|null} image  URL de la imagen
 * @property {string} source      Fuente
 * @property {string} published   ISODate de publicación
 */

/**
 * Obtiene titulares de bodas.
 * Con API_KEY → NewsAPI.org; sin API_KEY → proxy RSS backend.
 * @param {number} [page=1]
 * @param {number} [pageSize=10]
 * @param {string} [language='es'] ISO 639-1
 * @returns {Promise<BlogPost[]>}
 */
export async function fetchWeddingNews(page = 1, pageSize = 10, language = 'es') {
  if (!API_KEY) {
    // Fallback RSS proxy (backend) para evitar CORS
    const { data } = await axios.get('/api/wedding-news', {
      params: { page, pageSize },
      timeout: 8000,
    });
    
    let posts = data;
    if (language && language !== 'en') {
      for (const p of posts) {
        p.title = await translateText(p.title, language, '');
        p.description = await translateText(p.description, language, '');
      }
    }
    return posts;
  }

    // NewsAPI sólo permite 100 resultados y rate-limit estricto.
  // Para páginas >1 recurrimos al backend RSS proxy para continuar con variedad.
  if (page > 1) {
    const { data } = await axios.get('/api/wedding-news', {
      params: { page, pageSize, lang: language },
      timeout: 8000,
    });
    return data;
  }
  const endpointOpts = {
    params: {
      q: 'wedding OR boda',
      language,
      sortBy: 'publishedAt',
      pageSize,
      page,
    },
    headers: { 'X-Api-Key': API_KEY },
    timeout: 8000,
  };

  let data;
  try {
    const resp = await axios.get('https://newsapi.org/v2/everything', endpointOpts);
    data = resp.data;
  } catch (err) {
    if (err.response && err.response.status === 426) {
      console.warn('NewsAPI 426 Upgrade Required – plan gratuito limitado a primera página.');
      return [];
    }
    throw err;
  }

  const posts = data.articles.map((a, idx) => ({
    id: `${page}_${idx}_${a.url}`,
    title: a.title,
    description: a.description,
    url: a.url,
    image: a.urlToImage,
    source: a.source.name,
    published: a.publishedAt,
  }));

  if (language && language !== 'en') {
    for (const p of posts) {
      p.title = await translateText(p.title, language, '');
      p.description = await translateText(p.description, language, '');
    }
  }

  return posts;
}
// Fin de archivo
