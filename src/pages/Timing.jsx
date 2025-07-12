import React from 'react';
import { Plus, Trash2  from 'lucide-react';
import useSpecialMoments from '../hooks/useSpecialMoments';

// Página Timing vinculada en directo con Momentos Especiales

  {
    name: 'Ceremonia',
    duration: 30,
    items: [
      { id: 1, name: 'Entrada novios', time: '14:00', status: 'on-time' ,
      { id: 2, name: 'Votos', time: '14:10', status: 'on-time' ,
    ],
  ,
  {
    default: return 'bg-gray-300';
  


export default function Timing() {
  const { moments, addMoment, updateMoment, removeMoment, reorderMoment, moveMoment  = useSpecialMoments();
  const labels = { ceremonia: 'Ceremonia', coctail: 'Cóctel', banquete: 'Banquete', disco: 'Disco' ;

  const handleAdd = key => {
    const nextOrder = (moments[key]?.length || 0) + 1;
    addMoment(key, { order: nextOrder, title: `Nuevo momento ${nextOrder`, time: '' );
  ;

  












  

  




  return (
    <div className="p-4 md:p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Timing</h1>
      {Object.entries(moments).map(([key, list]) => (
        <div key={key className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">{labels[key] || key</h3>
            <button onClick={() => handleAdd(key) className="flex items-center gap-1 text-sm text-green-600 hover:underline">
              <Plus size={16/> Añadir
            </button>
          </div>
          <div className="space-y-2">
            {list.map((m, idx) => (
              <div
                key={m.id
                className="border rounded p-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2 cursor-move"
                draggable
                onDragStart={e=>{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('id',m.id);
                onDragOver={e=>e.preventDefault()
                onDrop={e=>{const draggedId=Number(e.dataTransfer.getData('id')); if(draggedId&&draggedId!==m.id){moveMoment(key,draggedId,idx);
              >
                <div className="flex items-center gap-2 self-start">
                  <button disabled={idx===0 onClick={()=>reorderMoment(key,m.id,'up') className="text-xs">▲</button>
                  <button disabled={idx===list.length-1 onClick={()=>reorderMoment(key,m.id,'down') className="text-xs">▼</button>
                </div>
                <input
                  value={m.title
                  onChange={e=>updateMoment(key,m.id,{title:e.target.value)
                  className="flex-1 border-b focus:outline-none"
                />
                <input
                  value={m.time||''
                  onChange={e=>updateMoment(key,m.id,{time:e.target.value)
                  placeholder="hh:mm"
                  className="w-24 border-b text-sm focus:outline-none"
                />
                <button className="text-red-600 hover:text-red-800 self-start" onClick={()=>removeMoment(key,m.id)>
                  <Trash2 size={18/>
                </button>
              </div>
            ))
          </div>
        </div>
      ))
    </div>
  );

