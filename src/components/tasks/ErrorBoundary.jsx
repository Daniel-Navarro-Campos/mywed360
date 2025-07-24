import { Component } from 'react';

// Componente ErrorBoundary para manejar errores en componentes hijos
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error en componente:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Algo salió mal.</div>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
