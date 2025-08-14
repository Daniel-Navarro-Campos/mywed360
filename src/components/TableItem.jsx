import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { ItemTypes } from './GuestItem';

// Basic draggable table (circle or rectangle)
// Helper para obtener primer nombre (máx 8 caracteres)
const firstName = (str='?') => {
  const first = String(str).trim().split(/\s+/)[0] || '?';
  return first.length>8? first.slice(0,8)+'…' : first;
};
export default function TableItem({ table, scale, offset, onMove, onAssignGuest, onToggleEnabled, onOpenConfig, onSelect, guests = [], canMove = true }) {
  // Decide qué texto mostrar en cada asiento según el nivel de zoom
  const getLabel = (name='?') => {
    if (scale >= 1.5) {
      return firstName(name); // nombre (o parte) cuando hay zoom suficiente
    }
    // Iniciales (máx. 2) cuando está alejado
    const initials = String(name).trim().split(/\s+/).map(w=>w[0]).filter(Boolean).slice(0,2).join('').toUpperCase();
    return initials || '?';
  };
  const ref = useRef(null);

  // drop logic
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.GUEST,
    canDrop: () => table.enabled !== false && !table.guestId,
    drop: (item) => onAssignGuest(table.id, item.id),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }), [table.id]);

  const handlePointerDown = (e) => {
    e.stopPropagation();
    const start = { x: e.clientX, y: e.clientY };
    const orig = { x: table.x, y: table.y };
    const move = (ev) => {
      const dx = (ev.clientX - start.x) / scale;
      const dy = (ev.clientY - start.y) / scale;
      onMove(table.id, { x: orig.x + dx, y: orig.y + dy });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // Contar invitados asignados considerando acompañantes
  // Total de personas (invitado + acompañantes) asignadas a esta mesa
  const guestCount = (() => {
    // Conteo desde lista global de invitados (por id o nombre de mesa)
    const countFromGuests = guests.reduce((sum, g) => {
      const matches = (() => {
      if (g.tableId !== undefined && g.tableId !== null) {
        return String(g.tableId) === String(table.id);
      }
      if (g.table !== undefined && g.table !== null && String(g.table).trim() !== '') {
        // puede ser nombre de mesa o número en string
        return String(g.table).trim() === String(table.id) || (table.name && String(g.table).trim() === String(table.name));
      }
      return false;
    })();
      if (!matches) return sum;
      const comp = parseInt(g.companion, 10) || 0;
      return sum + 1 + comp;
    }, 0);
    if (countFromGuests) return countFromGuests;
    // Conteo alternativo para propiedad assignedGuests (banquete)
    if (Array.isArray(table.assignedGuests) && table.assignedGuests.length) {
      return table.assignedGuests.reduce((sum, g) => sum + 1 + (parseInt(g.companion, 10) || 0), 0);
    }
    // Conteo para ceremonia (un solo invitado por mesa)
    return table.guestId ? 1 : 0;
  })();
  // Lista de invitados asignados a esta mesa (ignoramos acompañantes para las iniciales)
  const guestsList = (() => {
    // Primero, obtenemos los invitados de la lista global
    const list = guests.filter(g => {
      if (g.tableId !== undefined && g.tableId !== null) {
        return String(g.tableId) === String(table.id);
      }
      if (g.table !== undefined && g.table !== null && String(g.table).trim() !== '') {
        return String(g.table).trim() === String(table.id) || (table.name && String(g.table).trim() === String(table.name));
      }
      return false;
    });
    
    // Modo ceremonia: usamos exclusivamente los invitados de la lista global
    // Modo banquete: podemos tener invitados en la propiedad assignedGuests
    if (Array.isArray(table.assignedGuests) && table.assignedGuests.length) {
      // IDs ya presentes para evitar duplicados
      const guestIds = new Set(list.map((g) => g.id).filter(Boolean));

      // Resolvemos cada elemento de assignedGuests:
      //  - Si es string => buscamos el invitado en la lista global por id
      //  - Si ya es objeto => lo usamos tal cual
      const resolvedAssigned = table.assignedGuests.map((ag) => {
        if (ag && typeof ag === 'object') return ag; // ya es invitado completo
        const found = guests.find((g) => String(g.id) === String(ag));
        if (found) return found;
        // Fallback: devolvemos placeholder para contar asiento aunque no tengamos nombre
        return { id: ag };
      });

      // Filtramos duplicados por id
      const uniqueAssignedGuests = resolvedAssigned.filter(
        (g) => !g.id || !guestIds.has(g.id),
      );

      // Combinamos ambas fuentes
      return [...list, ...uniqueAssignedGuests];
    }

    // Sin assignedGuests: devolvemos la lista de invitados por mesa (puede estar vacía)
    return list;
  })();
  const seatDots = guestsList.length; // mostramos iniciales alrededor
  // Tamaño base: diámetro para circular o ancho/alto para rectangular
  const sizeX = table.shape === 'circle' ? (table.diameter || 60) : (table.width || 80);
  const sizeY = table.shape === 'circle' ? (table.diameter || 60) : (table.height || table.length || 60);
  const disabled = table.enabled === false;

  const style = {
    position: 'absolute',
    left: ( (table.x ?? 0) * scale ) + offset.x - (sizeX * scale) / 2,
    top: ( (table.y ?? 0) * scale ) + offset.y - (sizeY * scale) / 2,
    width: sizeX * scale,
    height: sizeY * scale,
    backgroundColor: disabled ? '#e5e7eb' : '#fef3c7',
    border: '2px solid #f59e0b',
    borderRadius: table.shape === 'circle' ? '50%' : '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'grab',
    userSelect: 'none'
  };

  return (
    <div ref={node => {ref.current=node; drop(node);}} 
      style={{...style, backgroundColor: isOver ? '#d1fae5' : style.backgroundColor}} 
      onPointerDown={disabled || !canMove ? undefined : handlePointerDown}
      onContextMenu={e=>{e.preventDefault(); onToggleEnabled(table.id);}}
      onClick={(e)=>{e.stopPropagation(); onSelect && onSelect(table.id);}}
      onDoubleClick={()=>onOpenConfig(table)}> 
      <button 
        onClick={(e)=>{e.stopPropagation(); onAssignGuest(table.id, null);}}
        className="absolute top-0 right-0 text-xs px-1 text-red-600">✖</button>
      {/* Contenido central opcional: solo mostramos el número de mesa pequeño */}
      <span style={{fontSize:14, fontWeight:'bold', pointerEvents:'none', color:'#374151'}}>{table.id}</span>
    {disabled && <div className="absolute inset-0 bg-white bg-opacity-50 rounded" />} 
      {/* seats */}
      {(() => {
        if(seatDots===0) return null;
        // Función para obtener el primer nombre
        const getFirst = (name='?') => {
           const first = name.trim().split(/\s+/)[0] || '?';
           return first;
         }
        if (table.shape === 'rect') {
           const cols = seatDots > 0 ? Math.ceil(seatDots / 2) : 0;
          return Array.from({ length: seatDots }).map((_, i) => {
            const isTop = i < cols;
            const idx = isTop ? i : i - cols;
            const px = (sizeX * scale) / (cols + 1) * (idx + 1);
            const offset = 18 * scale;
            const py = isTop ? -offset : sizeY * scale + offset; // fuera del borde
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  minWidth:24,
                   width:'auto',
                  height: 24,
                  background: '#2563eb',
                  borderRadius: '9999px',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  color:'#fff',
                  fontSize:10,
                  fontWeight:'bold',
                  left: px - 12,
                  top: py - 12,
                }}
              >{getLabel(guestsList[i]?.name || guestsList[i]?.nombre || '')}</div>
            );
          });
        }
         const seats = seatDots; // puntos según invitados
         if(seats===0) return null;
         const centerX = (sizeX * scale) / 2;
         const centerY = (sizeY * scale) / 2;
         return Array.from({ length: seats }).map((_, i) => {
          const angle = (Math.PI * 2 * i) / seats;
                    // Radio ligeramente mayor al de la mesa, proporcional al zoom para que siempre quede fuera
          const r = (Math.max(sizeX,sizeY) * scale) / 2 + 30 * scale; // fuera del borde
          const sx = centerX + Math.cos(angle) * r;
          const sy = centerY + Math.sin(angle) * r;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                minWidth:24,
                   width:'auto',
                height: 24,
                background: '#2563eb',
                borderRadius: '9999px',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                color:'#fff',
                fontSize:10,
                fontWeight:'bold',
                left: sx - 12,
                top: sy - 12,
              }}
            >{getLabel(guestsList[i]?.name || guestsList[i]?.nombre || '')}</div>
          );
        });
      })()}

    </div>
  );
}
