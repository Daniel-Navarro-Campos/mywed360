import React, { useEffect, useState, useRef, useCallback } from 'react';
import { trackInteraction } from '../services/inspirationService';
import { fetchWall } from '../services/wallService';
import { saveData, loadData } from '../services/SyncService';
import { useUserContext } from '../context/UserContext';
import Spinner from '../components/Spinner';
import InspirationGallery from '../components/gallery/InspirationGallery';
import SearchBar from '../components/SearchBar';

export default function Inspiration() {
  const { user } = useUserContext();
  const userId = user?.id || 'anon';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('wedding');
  const [selectedTag, setSelectedTag] = useState('all');
  const [prefTags, setPrefTags] = useState([]); // top tags del usuario
  const observer = useRef();
  const lastItemRef = useCallback((node) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPage((prev) => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading]);

  // Obtener tags preferidos basados en favoritos guardados
  useEffect(() => {
    (async () => {
      const favs = await loadData('ideasPhotos', { firestore: false, fallbackToLocal: true });
      if(Array.isArray(favs)){
        const counts = {};
        favs.forEach(p => (p.tags||[]).forEach(t => {counts[t]=(counts[t]||0)+1;}));
        const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([t])=>t);
        setPrefTags(sorted.slice(0,5));
      }
    })();
  }, []);

  useEffect(() => {
    if(selectedTag==='favs') return; // No cargar muro cuando estamos en pestaña favoritos
    async function load() {
      setLoading(true);
      const newItems = await fetchWall(page, query);
      setItems((prev) => {
        const merged = [...prev, ...newItems];
        // Personalización: boost posts que incluyan tags preferidos
        const score = (item)=> (item.tags||[]).some(t=>prefTags.includes(t)) ? 1 : 0;
        return merged.sort((a,b)=> score(b)-score(a));
      });
      setLoading(false);
    }
    load();
  }, [page, query, selectedTag]);

  const handleSave = async (item) => {
    // Cargar estado actual de favoritos desde almacenamiento local
    const current = await loadData('ideasPhotos', { firestore: false, fallbackToLocal: true }) || [];
    const exists = Array.isArray(current) && current.some(p => p.id === item.id);
    let next;
    if (exists) {
      // Unfavorite: eliminar del array
      next = current.filter(p => p.id !== item.id);
    } else {
      // Favorite: añadir al array
      next = [...current, item];
      // actualizar prefTags en memoria SOLO al añadir
      const newTags = (item.tags || []).filter(t => !prefTags.includes(t));
      if (newTags.length) {
        setPrefTags([...prefTags, ...newTags].slice(0, 5));
      }
    }
    // Guardar array resultante (solo local en modo invitado)
    await saveData('ideasPhotos', next, { collection: 'userIdeas', firestore: false, showNotification: false });
    // Si estamos en la pestaña de favoritos, refrescar inmediatamente el listado
    if (selectedTag === 'favs') {
      setItems(next);
    }
    // Tracking de interacción (marcado estrella)
    trackInteraction(userId, item, 0, true);
  };

  const handleView = (item, dwellStart) => {
    const dwellTime = Date.now() - dwellStart;
    trackInteraction(userId, item, dwellTime, false);
  };

  const handleSearch = ({ query: q }) => {
    setItems([]);
    setPage(1);
    setQuery(q || 'wedding');
    setSelectedTag('all');
  };

  const handleTag = async (tag)=>{
    setSelectedTag(tag);
    if(tag==='favs'){
      const favs = await loadData('ideasPhotos', { firestore: false, fallbackToLocal: true });
      setItems(Array.isArray(favs)?favs:[]);
      setPage(1);
      return;
    }
    setItems([]);
    setPage(1);
    setQuery(tag==='all'?'wedding':tag);
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Inspiración</h1>
      <SearchBar onResults={() => {}} onSearch={handleSearch} />
      <InspirationGallery
          images={items}
          onSave={handleSave}
          onView={(item)=>handleView(item, Date.now())}
          lastItemRef={lastItemRef}
          onTagClick={handleTag}
          activeTag={selectedTag}
        />


      {loading && <div className="flex justify-center my-6"><Spinner /></div>}
    </div>
  );
}



