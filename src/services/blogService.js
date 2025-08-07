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
    // Fallback: parse RSS feeds de noticias de bodas
    const RSS_URLS = [
      'https://www.hola.com/novias/rss/',
      'https://www.zankyou.es/p/actualidad/feed',
      'https://feeds.feedburner.com/bodasnet',
    ];
    const fetchRss = async (url)=>{
      try{
        const resp = await axios.get(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
        const xml = resp.data;
        const dom = new DOMParser().parseFromString(xml,'text/xml');
        const items = Array.from(dom.querySelectorAll('item')).slice(0,pageSize);
        return items.map(it=>({
          id: it.querySelector('guid')?.textContent || it.querySelector('link')?.textContent,
          title: it.querySelector('title')?.textContent,
          description: it.querySelector('description')?.textContent.replace(/<[^>]+>/g,'').trim(),
          url: it.querySelector('link')?.textContent,
          image: it.querySelector('enclosure')?.getAttribute('url') || null,
          source: (new URL(url)).hostname.replace('www.',''),
          published: it.querySelector('pubDate') ? new Date(it.querySelector('pubDate').textContent).toISOString() : new Date().toISOString(),
        }));
      }catch(e){console.error('RSS error',e);return[];}
    };

    const allPosts = (await Promise.all(RSS_URLS.map(fetchRss))).flat();
    // Ordenar por fecha desc
    allPosts.sort((a,b)=> new Date(b.published)-new Date(a.published));
    return allPosts.slice(0,pageSize);
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
