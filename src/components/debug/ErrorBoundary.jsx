import React from 'react';
import { performanceMonitor } from '../../services/PerformanceMonitor';

/**
 * ErrorBoundary global para capturar errores de React y registrar métricas.
 * Muestra un mensaje amigable y registra el error mediante el monitor de rendimiento.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    this.setState({ errorInfo: info });
    try {
      performanceMonitor.logError('react_error', error, { componentStack: info.componentStack });
    } catch (e) {
      // En caso de fallo en el monitor, al menos mostramos por consola
      console.error('Error report failed:', e);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h1 className="text-2xl font-semibold mb-4">Algo ha ido mal</h1>
          <p className="text-gray-600 mb-4">Se ha producido un error inesperado. Nuestro equipo ha sido notificado.</p>
          {process.env.NODE_ENV !== 'production' && this.state.errorInfo && (
            <pre className="text-left whitespace-pre-wrap bg-gray-100 p-4 rounded shadow-inner overflow-x-auto max-h-64">
              {this.state.errorInfo.componentStack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
