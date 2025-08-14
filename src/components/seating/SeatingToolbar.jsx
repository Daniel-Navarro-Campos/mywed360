import React from 'react';

export default function SeatingToolbar({
  tab,
  addTable,
  setScale,
  undo,
  redo,

  exportPDF,
  setTemplateOpen,
  setCeremonyConfigOpen,
  setBanquetConfigOpen,
  setSpaceConfigOpen,
  handleLocalAssign,
  handleServerAssign,
  loadingAI,
  setOffset,
  onToggleShape,
  canToggleShape,
  // nuevos props para dibujo
  drawMode,
  setDrawMode,
}) {
  return (
    <div className="mt-3 flex space-x-2 flex-wrap md:flex-nowrap overflow-x-auto pb-2">
      {/* Controles de dibujo */}
      <button aria-label onClick={() => setDrawMode('pan')} className={`px-3 py-1 text-sm rounded ${drawMode==='pan'?'bg-blue-500 text-white':'bg-gray-200'}`}>Pan</button>
      <button aria-label onClick={() => setDrawMode('boundary')} className={`px-3 py-1 text-sm rounded ${drawMode==='boundary'?'bg-blue-500 text-white':'bg-gray-200'}`}>Perímetro</button>
      <button aria-label onClick={() => setDrawMode('obstacle')} className={`px-3 py-1 text-sm rounded ${drawMode==='obstacle'?'bg-blue-500 text-white':'bg-gray-200'}`}>Obstáculo</button>
      <button aria-label onClick={() => setDrawMode('erase')} className={`px-3 py-1 text-sm rounded ${drawMode==='erase'?'bg-blue-500 text-white':'bg-gray-200'}`}>Borrar</button>

      <button aria-label onClick={addTable} className="px-3 py-1 text-sm bg-amber-300 rounded">Añadir mesa</button>
      <button aria-label onClick={() => setScale(s => Math.min(4, s * 1.2))} className="px-3 py-1 text-sm bg-gray-200 rounded">➕</button>
      <button aria-label onClick={() => setScale(s => Math.max(0.5, s / 1.2))} className="px-3 py-1 text-sm bg-gray-200 rounded">➖</button>
      <button aria-label onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }} className="px-3 py-1 text-sm bg-gray-200 rounded">Reset</button>
      <button aria-label onClick={undo} className="px-3 py-1 text-sm bg-gray-200 rounded">Undo</button>
      <button aria-label onClick={redo} className="px-3 py-1 text-sm bg-gray-200 rounded">Redo</button>

      <button aria-label onClick={exportPDF} className="px-3 py-1 text-sm bg-gray-200 rounded">Export PDF</button>
      <button aria-label onClick={() => setTemplateOpen(true)} className="px-3 py-1 text-sm bg-gray-200 rounded">Plantillas</button>
      <button aria-label onClick={onToggleShape} disabled={!canToggleShape} className={`px-3 py-1 text-sm rounded ${canToggleShape ? 'bg-gray-200' : 'bg-gray-400 text-white'}`}>Cambiar forma</button>
      {tab === 'banquet' && (
        <>
          <button aria-label onClick={() => setBanquetConfigOpen(true)} className="px-3 py-1 text-sm bg-gray-200 rounded">Auto-layout banquete</button>
          <button aria-label onClick={() => setSpaceConfigOpen(true)} className="px-3 py-1 text-sm bg-gray-200 rounded">Dimensiones salón</button>
        </>
      )}
      {tab === 'ceremony' && (
        <button aria-label onClick={() => setCeremonyConfigOpen(true)} className="px-3 py-1 text-sm bg-gray-200 rounded">Configurar ceremonia</button>
      )}
      <button aria-label onClick={handleLocalAssign} className="px-3 py-1 text-sm bg-emerald-400 text-white rounded">Propuesta IA (local)</button>
      <button aria-label onClick={handleServerAssign} className={`px-3 py-1 ${loadingAI ? 'bg-gray-400' : 'bg-purple-600'} text-white rounded`} disabled={loadingAI}>{loadingAI ? 'Esperando...' : 'Propuesta IA (servidor)'}</button>
    </div>
  );
}
