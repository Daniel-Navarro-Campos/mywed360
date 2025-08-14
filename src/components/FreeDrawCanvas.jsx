import React, { useRef, useState, useEffect } from 'react';

/**
 * FreeDrawCanvas
 * Simple freehand drawing canvas that captures pointer strokes, smooths them with Chaikin algorithm,
 * and renders the smoothed path as SVG.
 * Props:
 *   onFinalize(points) => called when user double-clicks / presses Finish to commit current stroke
 */
export default function FreeDrawCanvas({ className = '', style = {}, strokeColor = '#3b82f6', scale = 1, offset = { x: 0, y: 0 }, areas = [], drawMode = 'free', onFinalize, onDeleteArea = () => {}, onUpdateArea = () => {} }) {
  const svgRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [drawing, setDrawing] = useState(false);
  // Estado para mostrar la regla mientras se dibuja
  const [cursorPos, setCursorPos] = useState(null); // posición del cursor dentro del SVG
  const [segLength, setSegLength] = useState(null); // longitud del segmento actual en cm
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

    // Actualizar posición del cursor relativa al SVG
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    // Punto actual en coordenadas de dibujo (cm)
    const curPt = toSvgPoint(e);
    // Punto previo para calcular distancia
    const prevPt = points.length ? points[points.length - 1] : curPt;
    const dx = curPt.x - prevPt.x;
    const dy = curPt.y - prevPt.y;
    setSegLength(Math.sqrt(dx * dx + dy * dy));

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
      // Reiniciar regla
      setCursorPos(null);
      setSegLength(null);
      return;
    }
    if (drawMode === 'rect') {
      if (points.length >= 4) {
        onFinalize && onFinalize(points);
      }
      setPoints([]);
      startRef.current = null;
      setDrawing(false);
    // Reiniciar regla
    setCursorPos(null);
    setSegLength(null);
      return;
    }
    // Para freehand / curva simplemente detenemos la captura; la finalización será mediante doble clic
    setDrawing(false);
    // Reiniciar regla
    setCursorPos(null);
    setSegLength(null);
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
    <div className={`relative w-full h-full ${className}`} style={style}>
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

      {/* Etiquetas persistentes de áreas existentes */}
      {areas.map((poly, aIdx) => {
        const segs = [];
        for (let i = 0; i < poly.length - 1; i++) {
          const p1 = poly[i];
          const p2 = poly[i + 1];
          const length = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          const midX = (p1.x + p2.x) / 2 * scale + offset.x;
          const midY = (p1.y + p2.y) / 2 * scale + offset.y;
          segs.push({ p1, p2, length, midX, midY, idx: i });
        }
        return segs.map((seg) => (
          <div
            key={`s-${aIdx}-${seg.idx}`}
            className="absolute pointer-events-auto text-[10px] bg-white bg-opacity-90 rounded px-1 cursor-pointer select-none"
            style={{ left: seg.midX, top: seg.midY, transform: 'translate(-50%, -50%)' }}
            title="Doble clic para ajustar longitud"
            onDoubleClick={() => {
              const currentM = (seg.length / 100).toFixed(2);
              const val = window.prompt('Nueva longitud (m):', currentM);
              if (!val) return;
              const newLenCm = parseFloat(val) * 100;
              if (!newLenCm || newLenCm <= 0) return;
              const factor = newLenCm / seg.length;
              const dx = seg.p2.x - seg.p1.x;
              const dy = seg.p2.y - seg.p1.y;
              const newP2 = { x: seg.p1.x + dx * factor, y: seg.p1.y + dy * factor };
              const updated = [...poly];
              updated[seg.idx + 1] = newP2;
              onUpdateArea(aIdx, updated);
            }}
          >
            {(seg.length / 100).toFixed(2)} m
          </div>
        ));
      })}

      {/* Etiqueta temporal de distancia (m) */}
      {drawing && cursorPos && segLength != null && (
        <div
          className="absolute pointer-events-none text-[10px] bg-white bg-opacity-80 rounded px-1"
          style={{ left: cursorPos.x + 10, top: cursorPos.y + 10 }}
        >
          {(segLength / 100).toFixed(2)} m
        </div>
      )}
    </div>
  );
}
