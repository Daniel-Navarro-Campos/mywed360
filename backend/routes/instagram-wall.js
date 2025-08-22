import express from 'express';
import axios from 'axios';
import LRU from 'lru-cache';
// Carga dinámica para evitar crash si la librería no es compatible o falta
let pinterestSearchPins = null;
async function loadPinterestScraper() {
  if (pinterestSearchPins !== null) return pinterestSearchPins;
  try {
    const mod = await import('@myno_21/pinterest-scraper');
    pinterestSearchPins = mod.searchPins || (mod.default && mod.default.searchPins);
    if (typeof pinterestSearchPins !== 'function') {
      console.warn('Pinterest scraper no expone searchPins; deshabilitado');
      pinterestSearchPins = async () => [];
    }
  } catch (err) {
    console.warn('Pinterest scraper no disponible:', err.message);
    pinterestSearchPins = async () => [];
  }
  return pinterestSearchPins;
}

/*
  Prototipo de muro de inspiración (mezcla Instagram/Pinterest)
  Por ahora implementa descubrimiento con Unsplash + Pexels como placeholder
  y devuelve un array de objetos { id, html, like_count, comments_count, timestamp, score }
  La capa de scoring y personalización es muy básica.
*/

const router = express.Router();
const cache = new LRU({ max: 500, ttl: 1000 * 60 * 60 }); // 1h en memoria

const UNSPLASH_KEY = process.env.UNSPLASH_KEY || process.env.VITE_UNSPLASH_KEY;
const PEXELS_KEY = process.env.PEXELS_KEY || process.env.VITE_PEXELS_KEY;
const PINTEREST_TOKEN = process.env.PINTEREST_TOKEN || process.env.VITE_PINTEREST_TOKEN;

// Mapeo simple de palabras clave a categorías
const KEYWORD_MAP = {
  ceremonia: ['ceremony','altar','vows','ceremonia','boda','arco'],
  decoración: ['decor','decoración','centerpiece','mesa','table','floral','flor','ornament'],
  cóctel: ['cocktail','drinks','bar','cóctel'],
  banquete: ['reception','banquet','cena','dinner','banquete'],
  disco: ['dance','disco','party','baile'],
  flores: ['flower','flor','bouquet','ramo'],
  vestido: ['dress','vestido','gown','traje'],
  pastel: ['cake','pastel','tarta'],
  fotografía: ['photo','fotografía','camera','fotógrafo'],
};

function inferCategory(text=''){
  const lower = text.toLowerCase();
  for(const [cat,keywords] of Object.entries(KEYWORD_MAP)){
    if(keywords.some(k=> lower.includes(k))) return cat;
  }
  return 'inspiration';
}

function picsumPlaceholders(page = 1, query = 'wedding', count = 15) {
  const start = (page - 1) * count;
  const BASE_TAGS = ['ceremonia','decoración','cóctel','banquete','disco','flores','vestido','pastel','fotografía','inspiration'];
  return Array.from({ length: count }, (_, idx) => {
    const id = start + idx;
    const url = `https://picsum.photos/seed/${encodeURIComponent(query)}-${id}/800/600`;
    return {
      id: `picsum_${id}`,
      permalink: url,
      media_url: url,
      timestamp: new Date().toISOString(),
      like_count: 0,
      comments_count: 0,
      provider: 'picsum',
      categories: [BASE_TAGS[(start+idx)%BASE_TAGS.length]],
    };
  });
}


async function discoverUnsplash(page = 1, query = 'wedding') {
  // Si no hay clave, intentar endpoint público no autenticado de Unsplash
  if (!UNSPLASH_KEY) {
    try {
      const { data } = await axios.get('https://unsplash.com/napi/search/photos', {
        params: { query, page, per_page: 15 },
        headers: {
          'User-Agent': 'Mozilla/5.0 (myWed360 dev)'
        },
        timeout: 10000,
      });
      const results = (data?.results || data?.photos?.results || []);
      if(results.length){
        return results.map((img)=>({
          id: `unsplash_${img.id}`,
          permalink: `https://unsplash.com/photos/${img.id}`,
          media_url: img.urls?.regular || img.urls?.small,
          timestamp: img.created_at || new Date().toISOString(),
          like_count: img.likes || 0,
          comments_count: 0,
          provider: 'unsplash_public',
        }));
      }
    } catch(err){
      console.warn('Unsplash public endpoint error', err.message);
    }
    // Si sigue fallando, usar Picsum
    return picsumPlaceholders(page, query);
  }

  const url = 'https://api.unsplash.com/search/photos';
  let data;
  try {
    const resp = await axios.get(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
      params: { query, page, per_page: 15 },
      timeout: 10000,
    });
    data = resp.data;
  } catch (err) {
    console.error('discoverUnsplash error', err.message);
    return picsumPlaceholders(page, query);
  }
  return data.results.map((img) => ({
    id: `unsplash_${img.id}`,
    permalink: img.links.html,
    media_url: img.urls.regular,
    timestamp: img.created_at,
    like_count: img.likes,
    comments_count: 0,
    provider: 'unsplash',
  }));
}

async function discoverPexels(page = 1, query = 'wedding') {
  if (!PEXELS_KEY) return [];
  const { data } = await axios.get('https://api.pexels.com/v1/search', {
    headers: { Authorization: PEXELS_KEY },
    params: { query, page, per_page: 15 },
  });
  return data.photos.map((img) => ({
    id: `pexels_${img.id}`,
    permalink: img.url,
    media_url: img.src.large2x,
    timestamp: img.alt || new Date().toISOString(),
    like_count: 0,
    comments_count: 0,
    provider: 'pexels',
  }));
}

async function discoverPinterest(page = 1, query = 'wedding') {
  // Si hay token, usa API oficial v5
  if(PINTEREST_TOKEN){
    try{
      const { data } = await axios.get('https://api.pinterest.com/v5/search/pins',{
        headers:{ Authorization:`Bearer ${PINTEREST_TOKEN}` },
        params:{ query, page_size: 15 },
        timeout: 10000,
      });
      const items = data.items || data.data || [];
      return items.map((pin,idx)=>{
        const catMeta = pin.board?.category || pin.rich_metadata?.aggregated_pin_data?.category;
        const desc = pin.title || pin.description || pin.rich_metadata?.description || '';
        const category = catMeta || inferCategory(desc);
        const imgUrl = pin.media?.images?.originals?.url || pin.images?.originals?.url || pin.media?.images?.original?.url;
        return {
          id: `pinterest_${pin.id}`,
          permalink: pin.link || pin.url || `https://www.pinterest.com/pin/${pin.id}`,
          media_url: imgUrl,
          timestamp: pin.created_at || new Date().toISOString(),
          like_count: 0,
          comments_count: 0,
          provider: 'pinterest',
          categories: [category],
          description: desc,
        };
      });
    }catch(err){
      console.error('Pinterest API error', err.response?.data || err.message);
      // fallback a scraper
    }
  }
  // Fallback al scraper si no hay token o falló
  try {
    // Obtenemos dinámicamente el scraper sólo si está disponible
    const searchPins = await loadPinterestScraper();
    const pins = await searchPins(query);
    const offset = (page - 1) * 15;
    const slice = pins.slice(offset, offset + 15);
    return slice.map((pin, idx) => {
      const category = inferCategory(pin.title || pin.description || '');
      return {
        id: `pinterest_${offset + idx}`,
        permalink: pin.url,
        media_url: pin.image,
        timestamp: new Date().toISOString(),
        like_count: 0,
        comments_count: 0,
        provider: 'pinterest',
        categories: [category],
        description: pin.title,
      };
    });
  } catch (err) {
    console.error('discoverPinterest scraper error', err.message);
    return [];
  }
}

function scorePost(post) {
  const ageHours = (Date.now() - new Date(post.timestamp).getTime()) / 3_600_000;
  const recencyScore = Math.max(0, 100 - ageHours);
  const engagement = post.like_count + 3 * post.comments_count;
  const engageScore = Math.log10(engagement + 1) * 20;
  return 0.6 * recencyScore + 0.4 * engageScore;
}

router.post('/', async (req, res) => {
  try {
    const { page = 1, query = 'wedding' } = req.body || {};
    // Mapeo de categorías a consultas más descriptivas de bodas
    const CATEGORY_QUERY_MAP = {
      'decoración': 'wedding decor ideas wedding decoration',
      'cóctel': 'wedding cocktail hour drinks',
      'banquete': 'wedding reception banquet',
      'ceremonia': 'wedding ceremony ideas',
      'disco': 'wedding dance floor',
      'flores': 'wedding flowers bouquet',
      'vestido': 'wedding dress bridal gown',
      'pastel': 'wedding cake ideas',
      'fotografía': 'wedding photography ideas',
      'inspiration': 'wedding inspiration ideas'
    };

    const baseKeywords = CATEGORY_QUERY_MAP[(query || '').toLowerCase()] || query;
    // Aseguramos temática boda
    const searchQuery = /\b(boda|wedding)\b/i.test(baseKeywords) ? baseKeywords : `${baseKeywords} boda wedding`;
    // Aseguramos que la búsqueda siempre sea temática de bodas
    
    const cacheKey = `${searchQuery}_${page}`;
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Array.isArray(cached) && cached.length) {
        return res.json(cached);
      } else {
        cache.delete(cacheKey); // evita servir resultados vacíos
      }
    }

    // Descubrimiento (placeholder)
    const discoverPinterestPromise = discoverPinterest(page, searchQuery);
    const [unsplash, pexels, pinterest] = await Promise.all([
      discoverUnsplash(page, searchQuery),
      discoverPexels(page, searchQuery),
      discoverPinterestPromise,
    ]);
    let posts = [...unsplash, ...pexels, ...pinterest]; // Usar únicamente resultados de Pinterest para asegurar temática

    // --- Nueva lógica de filtrado nupcial ligero ---
    const WEDDING_RE = /(wedding|boda|bridal|bride|groom|novia|novio|ceremony|reception|matrimonio|casamiento)/i;
    posts = posts.filter((p)=>{
      const text = `${p.description||''} ${p.alt||''} ${p.permalink||''}`.toLowerCase();
      return WEDDING_RE.test(text);
    });

    // Asignar categoría inferida si falta, se usa para mostrar badge en frontend
    posts = posts.map((p)=>{
      if(!p.categories || p.categories.length===0){
        const cat = inferCategory(p.description || p.alt || p.permalink || '');
        p.categories = [cat];
      }
      return p;
    });

    // Enriquecer con HTML embed
    posts = posts.map((p) => ({
      ...p,
      html: `<a href="${p.permalink}" target="_blank"><img src="${p.media_url}" alt="Wedding inspiration" /></a>`,
    }));

    // Scoring
    posts.forEach((p) => {
      p.score = scorePost(p);
    });

    posts.sort((a, b) => b.score - a.score);
    const top = posts.slice(0, 12);

    if (top.length) {
      cache.set(cacheKey, top);
    }
    res.json(top);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'wall_error', message: err.message });
  }
});

export default router;
