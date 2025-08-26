/**
 * Hook personalizado para gestionar el estado del plan de asientos
 * Centraliza toda la lógica de estado y operaciones del SeatingPlan
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { doc as fsDoc, setDoc, getDoc, getDocs, collection as fsCollection, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { saveData, loadData, subscribeSyncState, getSyncState } from '../services/SyncService';
import { useWedding } from '../context/WeddingContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Utilidad para normalizar IDs de mesas
export const normalizeId = (id) => {
  const num = parseInt(id, 10);
  return !isNaN(num) ? num : id;
};

export const useSeatingPlan = () => {
  const { activeWedding } = useWedding();
  
  // Estados principales
  const [tab, setTab] = useState('ceremony');
  const [syncStatus, setSyncStatus] = useState(getSyncState());
  const [hallSize, setHallSize] = useState({ width: 1800, height: 1200 });
  
  // Estados por tipo de evento
  const [areasCeremony, setAreasCeremony] = useState([]);
  const [areasBanquet, setAreasBanquet] = useState([]);
  const [tablesCeremony, setTablesCeremony] = useState([]);
  const [seatsCeremony, setSeatsCeremony] = useState([]);
  const [tablesBanquet, setTablesBanquet] = useState([]);
  
  // Estados de UI
  const [selectedTable, setSelectedTable] = useState(null);
  const [configTable, setConfigTable] = useState(null);
  const [preview, setPreview] = useState(null);
  const [guests, setGuests] = useState([]);
  const [drawMode, setDrawMode] = useState('pan');
  
  // Estados de modales
  const [ceremonyConfigOpen, setCeremonyConfigOpen] = useState(false);
  const [banquetConfigOpen, setBanquetConfigOpen] = useState(false);
  const [spaceConfigOpen, setSpaceConfigOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  // Herramienta actual de dibujo / inserción
  const [currentTool, setCurrentTool] = useState('select');
  
  // Historial para undo/redo
  const [history, setHistory] = useState([]);
  const [historyPointer, setHistoryPointer] = useState(-1);
  
  // Referencias
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  
  // Estados computados basados en la pestaña activa
  const areas = tab === 'ceremony' ? areasCeremony : areasBanquet;
  const setAreas = tab === 'ceremony' ? setAreasCeremony : setAreasBanquet;
  const tables = tab === 'ceremony' ? tablesCeremony : tablesBanquet;
  const seats = tab === 'ceremony' ? seatsCeremony : [];
  const setTables = tab === 'ceremony' ? setTablesCeremony : setTablesBanquet;
  
  // Cargar dimensiones del salón con debounce para evitar múltiples llamadas
  useEffect(() => {
    if (!activeWedding) return;
    
    const loadHallDimensions = async () => {
      try {
        // Corregir referencia: usar colección/documento/colección/documento (número par de segmentos)
        const cfgRef = fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'banquet');
        const snap = await getDoc(cfgRef);
        if (snap.exists()) {
          const data = snap.data();
          const { width, height } = data?.config || data || {};
          if (width && height) setHallSize({ width, height });
        }
      } catch (err) {
        console.warn('🚫 No se pudieron cargar dimensiones del salón:', {
          error: err?.message,
          code: err?.code,
          activeWedding
        });
      }
    };
    
    // Debounce para evitar múltiples llamadas
    const timeoutId = setTimeout(loadHallDimensions, 100);
    return () => clearTimeout(timeoutId);
  }, [activeWedding]);
  
  // Suscribirse a cambios en el estado de sincronización
  useEffect(() => {
    const unsubscribe = subscribeSyncState(setSyncStatus);
    return () => unsubscribe();
  }, []);
  
  // Funciones de gestión del historial con protección contra bucles
  const pushHistory = (snapshot) => {
    // Evitar duplicados consecutivos para prevenir bucles infinitos
    if (history.length > 0 && JSON.stringify(history[historyPointer]) === JSON.stringify(snapshot)) {
      return;
    }
    
    const newHistory = history.slice(0, historyPointer + 1);
    newHistory.push(snapshot);
    setHistory(newHistory);
    setHistoryPointer(newHistory.length - 1);
  };
  
  const undo = () => {
    if (historyPointer > 0) {
      const prevSnapshot = history[historyPointer - 1];
      // Aplicar snapshot anterior
      setHistoryPointer(historyPointer - 1);
      return prevSnapshot;
    }
    return null;
  };
  
  const redo = () => {
    if (historyPointer < history.length - 1) {
      const nextSnapshot = history[historyPointer + 1];
      // Aplicar siguiente snapshot
      setHistoryPointer(historyPointer + 1);
      return nextSnapshot;
    }
    return null;
  };
  
  // Funciones de gestión de mesas
  const handleSelectTable = (id) => {
    const table = tables.find(t => t.id === id);
    setSelectedTable(table || null);
  };
  
  const handleTableDimensionChange = (field, value) => {
    if (!selectedTable) return;
    
    const updatedTable = { ...selectedTable, [field]: parseInt(value) };
    setSelectedTable(updatedTable);
    
    // Actualizar en la lista de mesas
    setTables(prev => prev.map(t => 
      t.id === selectedTable.id ? updatedTable : t
    ));
  };
  
  const toggleSelectedTableShape = () => {
    if (!selectedTable) return;
    
    const newShape = selectedTable.shape === 'rectangle' ? 'circle' : 'rectangle';
    const updatedTable = { ...selectedTable, shape: newShape };
    setSelectedTable(updatedTable);
    
    setTables(prev => prev.map(t => 
      t.id === selectedTable.id ? updatedTable : t
    ));
  };
  
  // --- Gestor de áreas/obstáculos ---
  const addArea = (area) => {
    console.log('useSeatingPlan - addArea llamado con:', area);
    const newArea = { id: Date.now(), ...area };
    console.log('useSeatingPlan - nueva área creada:', newArea);
    setAreas(prev => {
      const updated = [...prev, newArea];
      console.log('useSeatingPlan - áreas actualizadas:', updated);
      return updated;
    });
    pushHistory({ type: 'area-add', area: newArea, tab });
    console.log('useSeatingPlan - área añadida al historial');
    // No cambiar automáticamente a 'pan' para permitir seguir dibujando
    // setTimeout(() => { setDrawMode('pan'); }, 0);
  };

  // --- Gestor de mesas ---
  const addTable = (table) => {
    const newTable = { 
      id: Date.now(), 
      x: 100,
      y: 100,
      width: 80,
      height: 60,
      shape: 'rectangle',
      seats: 8,
      enabled: true,
      guestId: null,
      guestName: null,
      name: `Mesa ${tables.length + 1}`,
      ...table 
    };
    setTables(prev => [...prev, newTable]);
    // Guardar en historial
    pushHistory({ type: 'table-add', table: newTable, tab });
  };

  // Funciones de generación de layouts
  const generateSeatGrid = (rows = 10, cols = 12, gap = 40, startX = 100, startY = 80, aisleAfter = 6) => {
    const newSeats = [];
    let seatId = 1;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * gap + (col > aisleAfter ? gap : 0);
        const y = startY + row * gap;
        
        newSeats.push({
          id: seatId++,
          x,
          y,
          enabled: true,
          guestId: null,
          guestName: null
        });
      }
    }
    
    setSeatsCeremony(newSeats);
    
    // Guardar en historial
    pushHistory({
      type: 'ceremony',
      seats: newSeats,
      tables: tablesCeremony,
      areas: areasCeremony
    });
  };
  
  const generateBanquetLayout = ({ rows = 3, cols = 4, seats = 8, gapX = 140, gapY = 160, startX = 120, startY = 160 } = {}) => {
    const newTables = [];
    let tableId = 1;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * gapX;
        const y = startY + row * gapY;
        
        newTables.push({
          id: tableId++,
          x,
          y,
          width: 80,
          height: 60,
          shape: 'rectangle',
          seats,
          enabled: true,
          guestId: null,
          guestName: null,
          name: `Mesa ${tableId - 1}`
        });
      }
    }
    
    setTablesBanquet(newTables);
    
    // Guardar en historial
    pushHistory({
      type: 'banquet',
      tables: newTables,
      areas: areasBanquet
    });
  };
  
  // Funciones de exportación
  const exportPNG = async () => {
    if (!canvasRef.current) return;
    
    try {
      const canvas = await html2canvas(canvasRef.current);
      const link = document.createElement('a');
      link.download = `seating-plan-${tab}-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error exportando PNG:', error);
    }
  };
  
  const exportPDF = async () => {
    if (!canvasRef.current) return;
    
    try {
      const canvas = await html2canvas(canvasRef.current);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`seating-plan-${tab}-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error exportando PDF:', error);
    }
  };
  
  // Funciones de guardado
  const saveHallDimensions = async (width, height) => {
    setHallSize({ width, height });
    
    if (activeWedding) {
      try {
        const cfgRef = fsDoc(db, 'weddings', activeWedding, 'seatingPlan', 'banquet', 'config');
        await setDoc(cfgRef, { width, height }, { merge: true });
      } catch (err) {
        console.error('Error guardando dimensiones del salón:', err);
      }
    }
  };
  
  return {
    // Estados
    tab,
    setTab,
    syncStatus,
    hallSize,
    areas,
    tables,
    seats,
    selectedTable,
    configTable,
    preview,
    guests,
    drawMode,
    setDrawMode,
    
    // Estados de modales
    ceremonyConfigOpen,
    setCeremonyConfigOpen,
    banquetConfigOpen,
    setBanquetConfigOpen,
    spaceConfigOpen,
    setSpaceConfigOpen,
    templateOpen,
    setTemplateOpen,
    
    // Referencias
    canvasRef,
    wsRef,
    
    // Funciones de estado
    setAreas,
    setTables,
    setSelectedTable,
    setConfigTable,
    setPreview,
    setGuests,
    
    // Funciones de gestión
    handleSelectTable,
    handleTableDimensionChange,
    toggleSelectedTableShape,
    addArea,
    addTable,
    
    // Funciones de historial
    pushHistory,
    undo,
    redo,
    canUndo: historyPointer > 0,
    canRedo: historyPointer < history.length - 1,
    
    // Funciones de generación
    generateSeatGrid,
    generateBanquetLayout,
    
    // Funciones de exportación
    exportPNG,
    exportPDF,
    
    // Funciones de configuración
    saveHallDimensions,
    
    // Utilidades
    normalizeId
  };
};
