// Servicio de Inspiración
// Agrega contenido desde Unsplash, Pexels, Pixabay y YouTube.
// Para producción se requieren las siguientes variables de entorno:
// UNSPLASH_KEY, PEXELS_KEY, PIXABAY_KEY, YOUTUBE_KEY
// Devuelve los resultados en un formato unificado para el componente Inspiration.

import axios from 'axios';

/**
 * Formato unificado de item de inspiración
 * @typedef {Object} InspirationItem
 * @property {string} id  - id único (source_type_id)
 * @property {('image'|'video')} type
 * @property {string} url - URL principal (imagen HD o vídeo embebido)
 * @property {string} thumb - URL de miniatura
 * @property {string[]} categories - categorías asignadas
 * @property {string} source - proveedor original (unsplash|pexels|pixabay|youtube)
 */

const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_KEY;
const PEXELS_KEY = import.meta.env.VITE_PEXELS_KEY;
const PIXABAY_KEY = import.meta.env.VITE_PIXABAY_KEY;
const YOUTUBE_KEY = import.meta.env.VITE_YOUTUBE_KEY;

/**
 * Realiza búsquedas en múltiples proveedores y devuelve resultados mezclados.
 * Por simplicidad, hace requests secuenciales cuando no existen claves API.
 * En producción se puede paralelizar.
 * @param {string} category
 * @param {number} page
 * @returns {Promise<InspirationItem[]>}
 */
export async function fetchInspiration(category = '', page = 1) {
  const results = [];

  // Unsplash
  if (UNSPLASH_KEY) {
    try {
      const res = await axios.get('https://api.unsplash.com/search/photos', {
        params: {
          query: `wedding ${category}`.trim(),
          page,
          per_page: 15,
        },
        headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
      });
      const mapped = res.data.results.map((img) => ({
        id: `unsplash_image_${img.id}`,
        type: 'image',
        url: img.urls.regular,
        thumb: img.urls.small,
        categories: [category],
        source: 'unsplash',
      }));
      results.push(...mapped);
    } catch (e) {
      console.warn('Unsplash error', e.message);
    }
  }

  // Pexels
  if (PEXELS_KEY) {
    try {
      const res = await axios.get('https://api.pexels.com/v1/search', {
        headers: { Authorization: PEXELS_KEY },
        params: {
          query: `wedding ${category}`.trim(),
          per_page: 15,
          page,
        },
      });
      const mapped = res.data.photos.map((img) => ({
        id: `pexels_image_${img.id}`,
        type: 'image',
        url: img.src.large2x,
        thumb: img.src.medium,
        categories: [category],
        source: 'pexels',
      }));
      results.push(...mapped);
    } catch (e) {
      console.warn('Pexels error', e.message);
    }
  }

  // Pixabay
  if (PIXABAY_KEY) {
    try {
      const res = await axios.get('https://pixabay.com/api/', {
        params: {
          key: PIXABAY_KEY,
          q: `wedding ${category}`.trim(),
          image_type: 'photo',
          per_page: 15,
          page,
        },
      });
      const mapped = res.data.hits.map((img) => ({
        id: `pixabay_image_${img.id}`,
        type: 'image',
        url: img.largeImageURL,
        thumb: img.webformatURL,
        categories: [category],
        source: 'pixabay',
      }));
      results.push(...mapped);
    } catch (e) {
      console.warn('Pixabay error', e.message);
    }
  }

  // YouTube videos
  if (YOUTUBE_KEY) {
    try {
      const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          key: YOUTUBE_KEY,
          part: 'snippet',
          q: `wedding inspiration ${category}`.trim(),
          type: 'video',
          maxResults: 10,
        },
      });
      const mapped = res.data.items.map((vid) => ({
        id: `youtube_video_${vid.id.videoId}`,
        type: 'video',
        url: `https://www.youtube.com/watch?v=${vid.id.videoId}`,
        thumb: vid.snippet.thumbnails.medium.url,
        categories: [category],
        source: 'youtube',
      }));
      results.push(...mapped);
    } catch (e) {
      console.warn('YouTube error', e.message);
    }
  }

  // Fallback de ejemplo (sin claves API)
  if (!results.length) {
    results.push({
      id: 'demo_1',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1529634896862-08db0e0ea1cf',
      thumb: 'https://images.unsplash.com/photo-1529634896862-08db0e0ea1cf?w=400',
      categories: ['decoracion'],
      source: 'demo',
    });
  }

  return results;
}

/**
 * Registra interacción del usuario con un item.
 * @param {string} userId
 * @param {InspirationItem} item
 * @param {number} dwellTime - milisegundos que el usuario lo observó
 * @param {boolean} saved
 */
export function trackInteraction(userId, item, dwellTime, saved = false) {
  const key = `inspiration_stats_${userId}`;
  const raw = localStorage.getItem(key);
  const stats = raw ? JSON.parse(raw) : {};

  const current = stats[item.id] || { views: 0, saves: 0, time: 0 };
  current.views += 1;
  current.time += dwellTime;
  if (saved) current.saves += 1;

  stats[item.id] = current;
  localStorage.setItem(key, JSON.stringify(stats));
}
