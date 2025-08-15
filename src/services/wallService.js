// Servicio para consumir el muro de inspiración backend
// POST /api/instagram/wall { page, query }
// Devuelve array de posts con html embebido y metadatos

import axios from 'axios';

// Imágenes de demo para fallback en desarrollo
const DEMO_IMAGES = [
  {
    id: 'demo_1',
    url: 'https://images.unsplash.com/photo-1529634896862-08db0e0ea1cf?auto=format&fit=crop&w=800&q=60',
    thumb: 'https://images.unsplash.com/photo-1529634896862-08db0e0ea1cf?auto=format&fit=crop&w=400&q=60',
    tags: ['decoración','flores'],
    source: 'demo'
  },
  {
    id: 'demo_2',
    url: 'https://images.unsplash.com/photo-1499955085172-a104c9463ece?auto=format&fit=crop&w=800&q=60',
    thumb: 'https://images.unsplash.com/photo-1499955085172-a104c9463ece?auto=format&fit=crop&w=400&q=60',
    tags: ['ceremonia'],
    source: 'demo'
  },
  {
    id: 'demo_3',
    url: 'https://images.unsplash.com/photo-1502920917128-1aa500764b1c?auto=format&fit=crop&w=800&q=60',
    thumb: 'https://images.unsplash.com/photo-1502920917128-1aa500764b1c?auto=format&fit=crop&w=400&q=60',
    tags: ['flores','vestido'],
    source: 'demo'
  }
];

/**
 * Obtiene un lote paginado del muro de inspiración.
 * @param {number} page
 * @param {string} query
 * @returns {Promise<Array<{id:string, html:string, score:number}>>}
 */
const API_BASE = import.meta.env.DEV ? 'http://localhost:4004' : '';

export async function fetchWall(page = 1, query = 'wedding') {
  const proxify = (url)=> url? `${API_BASE}/api/image-proxy?u=${encodeURIComponent(url)}` : url;
  const KEYWORDS = {
    ceremonia: /ceremon(y|ia)|altar|vows/i,
    decoración: /decor|centerpiece|table|arco|floral/i,
    cóctel: /cocktail|drinks|bar/i,
    banquete: /reception|banquet|dinner|mesa/i,
    disco: /dance|disco|party|baile/i,
    flores: /flower|flor/i,
    vestido: /dress|vestido/i,
    pastel: /cake|pastel/i,
    fotografía: /photo|fotograf/i,
  };

  const guessTags = (text)=>{
    const found = [];
    for(const [tag,re] of Object.entries(KEYWORDS)){
      if(re.test(text)) found.push(tag);
    }
    return found;
  };

  const normalize = (p)=>{
    const obj = { ...p };
    const original = p.media_url || p.url || p.image || obj.thumb;
    obj.url = proxify(original);
    obj.original_url = original;
    obj.thumb = proxify(p.thumb || original);
    obj.tags = p.tags || p.categories;
    if(!obj.tags || obj.tags.length===0){
      const txt = (p.description || p.alt || p.permalink || '').toString();
      const inferred = guessTags(txt);
      if(inferred.length) obj.tags = inferred;
    }

    return obj;
  };
  try {
    const resp = await axios.post(`${API_BASE}/api/instagram/wall`, { page, query });
    const data = resp.data.map(normalize);
    return data.length ? data : DEMO_IMAGES;
  } catch (err) {
    console.error('wallService error', err);
    return DEMO_IMAGES;
  }
}
