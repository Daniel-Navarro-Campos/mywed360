import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Importar traducciones
import esTranslations from './locales/es/common.json';
import enTranslations from './locales/en/common.json';
import frTranslations from './locales/fr/common.json';

// Configuración de i18next
i18n
  // Detectar idioma del navegador
  .use(LanguageDetector)
  // Cargar traducciones desde archivos
  .use(Backend)
  // Integrar con React
  .use(initReactI18next)
  // Inicializar
  .init({
    // Idioma por defecto
    fallbackLng: 'es',
    
    // Idiomas soportados
    supportedLngs: ['es', 'en', 'fr'],
    
    // Configuración de detección de idioma
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      checkWhitelist: true
    },
    
    // Configuración de backend para cargar traducciones
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    // Recursos de traducción embebidos (fallback)
    resources: {
      es: {
        common: esTranslations
      },
      en: {
        common: enTranslations
      },
      fr: {
        common: frTranslations
      }
    },
    
    // Namespace por defecto
    defaultNS: 'common',
    
    // Configuración de interpolación
    interpolation: {
      escapeValue: false, // React ya escapa por defecto
      formatSeparator: ',',
      format: function(value, format, lng) {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        if (format === 'currency') {
          return new Intl.NumberFormat(lng, {
            style: 'currency',
            currency: 'EUR'
          }).format(value);
        }
        if (format === 'date') {
          return new Intl.DateTimeFormat(lng).format(new Date(value));
        }
        return value;
      }
    },
    
    // Configuración de desarrollo
    debug: process.env.NODE_ENV === 'development',
    
    // Configuración de carga
    load: 'languageOnly', // Solo cargar idioma, no región (es en lugar de es-ES)
    
    // Configuración de pluralización
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // Configuración de React
    react: {
      useSuspense: false, // Evitar suspense para mejor UX
      bindI18n: 'languageChanged',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'span']
    }
  });

// Función para cambiar idioma
export const changeLanguage = (lng) => {
  return i18n.changeLanguage(lng);
};

// Función para obtener idioma actual
export const getCurrentLanguage = () => {
  return i18n.language || 'es';
};

// Función para obtener idiomas disponibles
export const getAvailableLanguages = () => {
  return [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];
};

// Función para formatear fechas según el idioma
export const formatDate = (date, options = {}) => {
  const lng = getCurrentLanguage();
  return new Intl.DateTimeFormat(lng, options).format(new Date(date));
};

// Función para formatear moneda según el idioma
export const formatCurrency = (amount, currency = 'EUR') => {
  const lng = getCurrentLanguage();
  return new Intl.NumberFormat(lng, {
    style: 'currency',
    currency
  }).format(amount);
};

// Función para formatear números según el idioma
export const formatNumber = (number) => {
  const lng = getCurrentLanguage();
  return new Intl.NumberFormat(lng).format(number);
};

export default i18n;
