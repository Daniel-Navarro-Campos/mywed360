import React, { useRef, useState, useEffect } from 'react';

/**
 * FreeDrawCanvas
 * Simple freehand drawing canvas that captures pointer strokes, smooths them with Chaikin algorithm,
 * and renders the smoothed path as SVG.
 * Props:
 *   onFinalize(points) => called when user double-clicks / presses Finish to commit current stroke
 */
export default function FreeDrawCanvas({ className = '', style = {}, strokeColor = '#3b82f6', scale = 1, offset = { x: 0, y: 0 }, areas = [], drawMode = 'free', onFinalize, onDeleteArea = () => {} }) {
  const svgRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const startRef = useRef(null);

  const toSvgPoint = (e) => {
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    // adjust for current transform
    return {
      x: (e.clientX - rect.left - offset.x) / scale,
      y: (e.clientY - rect.top - offset.y) / scale,
    };
  };

  // Chaikin smoothing – one iteration
  const smooth = (pts) => {
    if (pts.length < 2) return pts;
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      out.push({ x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y });
      out.push({ x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y });
    }
    return out;
  };

  const getPathD = (pts) => {
    if (!pts.length) return '';
    const d = [`M ${pts[0].x} ${pts[0].y}`];
    for (let i = 1; i < pts.length; i++) d.push(`L ${pts[i].x} ${pts[i].y}`);
    return d.join(' ');
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    const pt = toSvgPoint(e);
    if (drawMode === 'line') {
      setDrawing(true);
      setPoints([pt]);
      return;
    }
    if (drawMode === 'rect') {
      setDrawing(true);
      startRef.current = pt;
      setPoints([pt]);
      return;
    }
    if (drawMode === 'free' || drawMode === 'curve') {
      setDrawing(true);
      setPoints([pt]);
    }
  };

  const handlePointerMove = (e) => {
    if (!drawing) return;
    if (drawMode === 'line') {
      const pt = toSvgPoint(e);
      setPoints(prev => (prev.length === 1 ? [prev[0], pt] : [prev[0], pt]));
      return;
    }
    if (drawMode === 'rect') {
      const cur = toSvgPoint(e);
      const start = startRef.current;
      if (!start) return;
      const rectPts = [
        start,
        { x: cur.x, y: start.y },
        cur,
        { x: start.x, y: cur.y },
        start,
      ];
      setPoints(rectPts);
      return;
    }
    if (drawMode === 'free' || drawMode === 'curve') {
      const pt = toSvgPoint(e);
      setPoints(prev => [...prev, pt]);
    }
  };

  const handlePointerUp = (e) => {
    if (!drawing) return;
    if (drawMode === 'line') {
      const pt = toSvgPoint(e);
      const line = points.length === 2 ? points : [points[0], pt];
      onFinalize && onFinalize(line);
      setPoints([]);
      setDrawing(false);
      return;
    }
    if (drawMode === 'rect') {
      if (points.length >= 4) {
        onFinalize && onFinalize(points);
      }
      setPoints([]);
      startRef.current = null;
      setDrawing(false);
      return;
    }
    // Para freehand / curva simplemente detenemos la captura; la finalización será mediante doble clic
    setDrawing(false);
  };

  const handleDoubleClick = () => {
    if (drawMode === 'free' || drawMode === 'curve') {
      if (points.length > 2) {
        const smoothed = smooth(points);
        onFinalize && onFinalize(smoothed);
        setPoints([]);
      }
    }
  };

  return (
    <svg
      ref={svgRef}
      className={`w-full h-full touch-none ${className}`}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      {/* Áreas existentes */}
      <g transform={`translate(${offset.x} ${offset.y}) scale(${scale})`}>
        {areas.map((poly, idx) => (
          <path
            key={idx}
            d={getPathD(poly)}
            stroke="#10b981"
            strokeWidth={2}
            fill="none"
            onPointerDown={drawMode === 'erase' ? (e) => { e.stopPropagation(); onDeleteArea(idx); } : undefined}
            style={{ cursor: drawMode === 'erase' ? 'pointer' : 'default' }}
          />
        ))}
        {/* Trazo actual */}
        {points.length > 0 && (
          <path d={getPathD(points)} stroke={strokeColor} strokeWidth={2} fill="none" />
        )}
      </g>
    </svg>
  );
}
