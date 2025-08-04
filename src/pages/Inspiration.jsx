import React, { useEffect, useState, useRef, useCallback } from 'react';
import { fetchInspiration, trackInteraction } from '../services/inspirationService';
import { saveData } from '../services/SyncService';
import { useUserContext } from '../context/UserContext';
import Spinner from '../components/Spinner';

export default function Inspiration() {
  const { user } = useUserContext();
  const userId = user?.id || 'anon';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
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

  useEffect(() => {
    async function load() {
      setLoading(true);
      const newItems = await fetchInspiration('', page);
      setItems((prev) => [...prev, ...newItems]);
      setLoading(false);
    }
    load();
  }, [page]);

  const handleSave = (item) => {
    saveData('ideasPhotos', (prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      if (!arr.some((p) => p.id === item.id)) arr.push(item);
      return arr;
    }, { collection: 'userIdeas', showNotification: true });
    trackInteraction(userId, item, 0, true);
  };

  const handleView = (item, dwellStart) => {
    const dwellTime = Date.now() - dwellStart;
    trackInteraction(userId, item, dwellTime, false);
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Inspiración</h1>
      <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
        {items.map((item, idx) => (
          <InspirationCard
            key={item.id}
            item={item}
            onSave={handleSave}
            ref={idx === items.length - 1 ? lastItemRef : null}
            onView={handleView}
          />
        ))}
      </div>
      {loading && <div className="flex justify-center my-6"><Spinner /></div>}
    </div>
  );
}

const InspirationCard = React.forwardRef(({ item, onSave, onView }, ref) => {
  const [startTime, setStartTime] = useState(Date.now());
  useEffect(() => {
    setStartTime(Date.now());
    return () => {
      onView(item, startTime);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div ref={ref} className="relative break-inside-avoid" onDoubleClick={() => onSave(item)}>
      {item.type === 'image' ? (
        <img src={item.url} alt="insp" className="w-full rounded-lg" />
      ) : (
        <iframe
          src={`https://www.youtube.com/embed/${item.url.split('v=')[1]}`}
          title="video"
          className="w-full aspect-video rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
      <button
        onClick={() => onSave(item)}
        className="absolute bottom-2 right-2 bg-white/70 backdrop-blur px-2 py-1 text-xs rounded"
      >
        Guardar
      </button>
    </div>
  );
});
