import React, { useEffect, useState, useRef, useCallback } from 'react';
import { fetchWeddingNews } from '../services/blogService';
import Spinner from '../components/Spinner';

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const observer = useRef();

  const lastRef = useCallback((node) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setPage((p) => p + 1);
    });
    if (node) observer.current.observe(node);
  }, [loading]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchWeddingNews(page, 10, 'es');
      setPosts((prev) => [...prev, ...data]);
      setLoading(false);
    }
    load();
  }, [page]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold">Blog</h1>
      {posts.map((p, idx) => (
        <ArticleCard key={p.id} post={p} ref={idx === posts.length - 1 ? lastRef : null} />
      ))}
      {loading && <div className="flex justify-center my-6"><Spinner /></div>}
    </div>
  );
}

const ArticleCard = React.forwardRef(({ post }, ref) => (
  <div ref={ref} className="border rounded-lg overflow-hidden shadow hover:shadow-md transition">
    {post.image && <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />}
    <div className="p-4 space-y-2">
      <h2 className="text-lg font-semibold">{post.title}</h2>
      <p className="text-sm text-gray-700 line-clamp-3">{post.description}</p>
      <div className="text-xs text-gray-500 flex justify-between">
        <span>{post.source}</span>
        <span>{new Date(post.published).toLocaleDateString()}</span>
      </div>
      <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm">Leer más</a>
    </div>
  </div>
));
