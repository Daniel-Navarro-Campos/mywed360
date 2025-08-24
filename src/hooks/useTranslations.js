import { useTranslation } from 'react-i18next';
import { getCurrentLanguage, formatDate, formatCurrency, formatNumber } from '../i18n';

/**
 * Hook personalizado para traducciones y formateo localizado
 * Extiende useTranslation con funcionalidades adicionales específicas de MyWed360
 * 
 * @returns {Object} Objeto con funciones de traducción y formateo
 */
const useTranslations = () => {
  const { t, i18n } = useTranslation();
  
  // Función de traducción mejorada con fallback
  const translate = (key, options = {}) => {
    const translation = t(key, options);
    
    // Si la traducción es igual a la clave, significa que no se encontró
    if (translation === key && process.env.NODE_ENV === 'development') {
      console.warn(`Traducción faltante para la clave: ${key}`);
    }
    
    return translation;
  };

  // Función para traducir con pluralización
  const translatePlural = (key, count, options = {}) => {
    return t(key, { count, ...options });
  };

  // Función para traducir con interpolación de variables
  const translateWithVars = (key, variables = {}) => {
    return t(key, variables);
  };

  // Funciones de formateo localizadas
  const formatters = {
    // Formatear fecha según el idioma actual
    date: (date, options = {}) => {
      const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      return formatDate(date, { ...defaultOptions, ...options });
    },

    // Formatear fecha corta
    dateShort: (date) => {
      return formatDate(date, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },

    // Formatear fecha y hora
    datetime: (date) => {
      return formatDate(date, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    // Formatear solo hora
    time: (date) => {
      return formatDate(date, {
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    // Formatear moneda
    currency: (amount, currency = 'EUR') => {
      return formatCurrency(amount, currency);
    },

    // Formatear número
    number: (number) => {
      return formatNumber(number);
    },

    // Formatear porcentaje
    percentage: (value) => {
      const lng = getCurrentLanguage();
      return new Intl.NumberFormat(lng, {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1
      }).format(value / 100);
    }
  };

  // Funciones específicas para MyWed360
  const wedding = {
    // Formatear estado de invitado
    guestStatus: (status) => {
      const statusMap = {
        confirmed: translate('guests.confirmed'),
        pending: translate('guests.pending'),
        declined: translate('guests.declined')
      };
      return statusMap[status] || status;
    },

    // Formatear prioridad de tarea
    taskPriority: (priority) => {
      const priorityMap = {
        high: translate('tasks.high'),
        medium: translate('tasks.medium'),
        low: translate('tasks.low')
      };
      return priorityMap[priority] || priority;
    },

    // Formatear estado de tarea
    taskStatus: (status) => {
      const statusMap = {
        completed: translate('tasks.completed'),
        inProgress: translate('tasks.inProgress'),
        notStarted: translate('tasks.notStarted'),
        overdue: translate('tasks.overdue')
      };
      return statusMap[status] || status;
    },

    // Formatear método de pago
    paymentMethod: (method) => {
      const methodMap = {
        cash: translate('finance.cash'),
        card: translate('finance.card'),
        transfer: translate('finance.transfer')
      };
      return methodMap[method] || method;
    },

    // Formatear servicio de proveedor
    providerService: (service) => {
      const serviceMap = {
        photographer: translate('providers.photographer'),
        videographer: translate('providers.videographer'),
        florist: translate('providers.florist'),
        caterer: translate('providers.caterer'),
        dj: translate('providers.dj'),
        band: translate('providers.band'),
        venue: translate('providers.venue'),
        decorator: translate('providers.decorator'),
        makeup: translate('providers.makeup'),
        hairdresser: translate('providers.hairdresser')
      };
      return serviceMap[service] || service;
    }
  };

  // Función para obtener traducciones de navegación
  const getNavigation = () => {
    return {
      home: translate('navigation.home'),
      dashboard: translate('navigation.dashboard'),
      guests: translate('navigation.guests'),
      providers: translate('navigation.providers'),
      finance: translate('navigation.finance'),
      seating: translate('navigation.seating'),
      email: translate('navigation.email'),
      protocol: translate('navigation.protocol'),
      designs: translate('navigation.designs'),
      website: translate('navigation.website'),
      contracts: translate('navigation.contracts'),
      tasks: translate('navigation.tasks'),
      profile: translate('navigation.profile'),
      settings: translate('navigation.settings'),
      logout: translate('navigation.logout')
    };
  };

  // Función para obtener mensajes comunes
  const getMessages = () => {
    return {
      saveSuccess: translate('messages.saveSuccess'),
      saveError: translate('messages.saveError'),
      deleteSuccess: translate('messages.deleteSuccess'),
      deleteError: translate('messages.deleteError'),
      updateSuccess: translate('messages.updateSuccess'),
      updateError: translate('messages.updateError'),
      loadError: translate('messages.loadError'),
      networkError: translate('messages.networkError'),
      confirmDelete: translate('messages.confirmDelete'),
      unsavedChanges: translate('messages.unsavedChanges')
    };
  };

  // Función para obtener etiquetas de formulario
  const getFormLabels = () => {
    return {
      required: translate('forms.required'),
      optional: translate('forms.optional'),
      pleaseSelect: translate('forms.pleaseSelect'),
      selectOption: translate('forms.selectOption'),
      enterText: translate('forms.enterText'),
      chooseFile: translate('forms.chooseFile'),
      uploadFile: translate('forms.uploadFile'),
      fieldRequired: translate('forms.fieldRequired'),
      invalidEmail: translate('forms.invalidEmail'),
      invalidPhone: translate('forms.invalidPhone'),
      invalidUrl: translate('forms.invalidUrl')
    };
  };

  return {
    // Funciones básicas de traducción
    t: translate,
    tPlural: translatePlural,
    tVars: translateWithVars,
    
    // Funciones de formateo
    format: formatters,
    
    // Funciones específicas de MyWed360
    wedding,
    
    // Funciones de conveniencia
    getNavigation,
    getMessages,
    getFormLabels,
    
    // Información del idioma actual
    currentLanguage: getCurrentLanguage(),
    isRTL: ['ar', 'he', 'fa'].includes(getCurrentLanguage()),
    
    // Acceso directo a i18n
    i18n
  };
};

export default useTranslations;
