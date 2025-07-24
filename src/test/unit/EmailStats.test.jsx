import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailStats from '../../components/email/EmailStats';

// Mocks para los servicios utilizados
vi.mock('../../services/statsService', () => ({
  generateUserStats: vi.fn(),
  getUserStats: vi.fn()
}));

// Mocks para react-chartjs-2
vi.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Line: () => <div data-testid="line-chart">Line Chart</div>,
  Pie: () => <div data-testid="pie-chart">Pie Chart</div>,
  Doughnut: () => <div data-testid="doughnut-chart">Doughnut Chart</div>
}));

// Importamos las funciones después del mock para poder manipularlas
import { generateUserStats, getUserStats } from '../../services/statsService';

describe('EmailStats', () => {
  // Mock de estadísticas de correo electrónico
  const mockStats = {
    overview: {
      totalSent: 150,
      totalReceived: 280,
      responseRate: 75,
      averageResponseTime: '2.5h'
    },
    timeline: {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      sent: [10, 20, 15, 30, 25, 50],
      received: [15, 25, 20, 45, 55, 120]
    },
    contacts: [
      { name: 'example@lovenda.com', count: 45 },
      { name: 'contact@example.com', count: 32 },
      { name: 'info@provider.com', count: 28 }
    ],
    folderDistribution: {
      labels: ['Bandeja', 'Enviados', 'Importantes', 'Trabajo'],
      data: [45, 30, 15, 10]
    },
    tagDistribution: {
      labels: ['Urgente', 'Personal', 'Trabajo', 'Facturas'],
      data: [20, 35, 25, 20]
    },
    hourlyActivity: {
      labels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'],
      data: [5, 15, 10, 20, 25, 15]
    },
    lastUpdated: new Date().toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra indicador de carga al iniciar', () => {
    // Configurar el mock para devolver una promesa que no se resuelve
    getUserStats.mockReturnValue({});
    generateUserStats.mockImplementation(() => new Promise(() => {}));
    
    render(<EmailStats userId="user123" />);
    
    expect(screen.getByText('Cargando estadísticas...')).toBeInTheDocument();
  });

  it('carga estadísticas desde localStorage si están disponibles y no desactualizadas', async () => {
    // Configurar el mock para devolver estadísticas recientes
    getUserStats.mockReturnValue({
      ...mockStats,
      lastUpdated: new Date().toISOString()
    });
    
    render(<EmailStats userId="user123" />);
    
    // Verificar que no se llamó a generateUserStats
    await waitFor(() => {
      expect(generateUserStats).not.toHaveBeenCalled();
    });
    
    // Verificar que se muestran los datos principales
    expect(screen.getByText('150')).toBeInTheDocument(); // totalSent
    expect(screen.getByText('280')).toBeInTheDocument(); // totalReceived
  });

  it('genera nuevas estadísticas si no hay datos en localStorage', async () => {
    // Configurar mocks
    getUserStats.mockReturnValue({});
    generateUserStats.mockResolvedValue(mockStats);
    
    render(<EmailStats userId="user123" />);
    
    // Verificar que se llamó a generateUserStats
    await waitFor(() => {
      expect(generateUserStats).toHaveBeenCalledWith('user123');
    });
    
    // Verificar que se muestran los datos principales
    expect(screen.getByText('150')).toBeInTheDocument(); // totalSent
    expect(screen.getByText('280')).toBeInTheDocument(); // totalReceived
  });

  it('genera nuevas estadísticas si los datos están desactualizados', async () => {
    // Configurar el mock para devolver estadísticas desactualizadas (más de 1 hora)
    const oldDate = new Date();
    oldDate.setHours(oldDate.getHours() - 2); // 2 horas atrás
    
    getUserStats.mockReturnValue({
      ...mockStats,
      lastUpdated: oldDate.toISOString()
    });
    
    generateUserStats.mockResolvedValue(mockStats);
    
    render(<EmailStats userId="user123" />);
    
    // Verificar que se llamó a generateUserStats para actualizar los datos
    await waitFor(() => {
      expect(generateUserStats).toHaveBeenCalledWith('user123');
    });
  });

  it('muestra mensaje de error si falla la carga de estadísticas', async () => {
    // Configurar mock para fallar
    getUserStats.mockReturnValue({});
    generateUserStats.mockRejectedValue(new Error('Error de prueba'));
    
    render(<EmailStats userId="user123" />);
    
    // Verificar mensaje de error
    await waitFor(() => {
      expect(screen.getByText('No se pudieron cargar las estadísticas')).toBeInTheDocument();
    });
  });

  it('permite actualizar manualmente las estadísticas', async () => {
    // Configurar mocks
    getUserStats.mockReturnValue(mockStats);
    generateUserStats.mockResolvedValue({
      ...mockStats,
      overview: {
        ...mockStats.overview,
        totalSent: 160, // Valor actualizado
        totalReceived: 290
      }
    });
    
    render(<EmailStats userId="user123" />);
    
    // Esperar a que se carguen los datos iniciales
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // totalSent inicial
    });
    
    // Simular clic en botón de actualizar
    const user = userEvent.setup();
    await user.click(screen.getByLabelText(/actualizar estadísticas/i));
    
    // Verificar que se llamó a generateUserStats
    expect(generateUserStats).toHaveBeenCalledTimes(1);
    
    // Verificar valores actualizados
    await waitFor(() => {
      expect(screen.getByText('160')).toBeInTheDocument(); // totalSent actualizado
      expect(screen.getByText('290')).toBeInTheDocument(); // totalReceived actualizado
    });
  });

  it('renderiza correctamente todas las secciones del dashboard', async () => {
    // Configurar mock
    getUserStats.mockReturnValue(mockStats);
    
    render(<EmailStats userId="user123" />);
    
    // Verificar secciones principales
    await waitFor(() => {
      // Tarjetas de resumen
      expect(screen.getByText('Correos enviados')).toBeInTheDocument();
      expect(screen.getByText('Correos recibidos')).toBeInTheDocument();
      expect(screen.getByText('Tasa de respuesta')).toBeInTheDocument();
      expect(screen.getByText('Tiempo medio de respuesta')).toBeInTheDocument();
      
      // Gráficos
      expect(screen.getByTestId('line-chart')).toBeInTheDocument(); // Actividad
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument(); // Distribución por carpeta
      expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument(); // Distribución por etiquetas
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument(); // Contactos frecuentes
    });
  });

  it('no hace nada si no hay userId', () => {
    // Renderizar sin userId
    render(<EmailStats />);
    
    // Verificar que no se llamó a ninguna función de obtención de datos
    expect(getUserStats).not.toHaveBeenCalled();
    expect(generateUserStats).not.toHaveBeenCalled();
    
    // Verificar que se muestra mensaje adecuado
    expect(screen.getByText('No hay estadísticas disponibles')).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay suficientes datos para estadísticas', async () => {
    // Configurar mock para devolver datos insuficientes
    getUserStats.mockReturnValue({});
    generateUserStats.mockResolvedValue({
      overview: {
        totalSent: 0,
        totalReceived: 0,
        responseRate: 0,
        averageResponseTime: '0h'
      },
      emptyData: true
    });
    
    render(<EmailStats userId="user123" />);
    
    // Verificar mensaje de datos insuficientes
    await waitFor(() => {
      expect(screen.getByText(/no hay suficientes datos/i)).toBeInTheDocument();
    });
  });
});
