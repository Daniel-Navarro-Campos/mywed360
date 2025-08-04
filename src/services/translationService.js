// Servicio de traducción
// Actualmente soporta Google Translate API v2 (clave en VITE_TRANSLATE_KEY).
// Si no existe la clave o hay error, devuelve el texto original.
import axios from 'axios';

const API_KEY = import.meta.env.VITE_TRANSLATE_KEY;

/**
 * Traduce un texto al idioma destino.
 * @param {string} text
 * @param {string} targetLang ej. 'es'
 * @param {string} sourceLang opcional (detectará si se omite)
 */
export async function translateText(text, targetLang = 'es', sourceLang = '') {
  if (!API_KEY || !text) return text;
  try {
    const res = await axios.post(
      `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
      {
        q: text,
        target: targetLang,
        source: sourceLang || undefined,
        format: 'text',
      }
    );
    const translated = res.data.data.translations[0].translatedText;
    return translated || text;
  } catch (e) {
    console.warn('Translation error', e.message);
    return text;
  }
}
