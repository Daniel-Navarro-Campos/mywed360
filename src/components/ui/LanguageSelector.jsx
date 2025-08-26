import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { getAvailableLanguages, changeLanguage, getCurrentLanguage } from '../../i18n';

/**
 * Componente selector de idioma con dropdown
 * Permite cambiar el idioma de la aplicación de forma intuitiva
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.className - Clases CSS adicionales
 * @param {boolean} props.showFlag - Si mostrar la bandera del país
 * @param {boolean} props.showText - Si mostrar el texto del idioma
 * @param {string} props.variant - Variante del selector ('button', 'minimal', 'full')
 * @returns {React.ReactElement} Componente selector de idioma
 */
const LanguageSelector = ({ 
  className = '', 
  showFlag = true, 
  showText = true,
  variant = 'button'
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  
  const currentLanguage = getCurrentLanguage();
  const availableLanguages = getAvailableLanguages();
  const currentLang = availableLanguages.find(lang => lang.code === currentLanguage) || availableLanguages[0];

  // Manejar cambio de idioma
  const handleLanguageChange = async (languageCode) => {
    if (languageCode === currentLanguage) {
      setIsOpen(false);
      return;
    }

    setIsChanging(true);
    try {
      await changeLanguage(languageCode);
      
      // Guardar preferencia en localStorage
      localStorage.setItem('preferredLanguage', languageCode);
      
      // Opcional: recargar la página para aplicar cambios completos
      // window.location.reload();
      
    } catch (error) {
      console.error('Error cambiando idioma:', error);
    } finally {
      setIsChanging(false);
      setIsOpen(false);
    }
  };

  // Cerrar dropdown al hacer clic fuera
  const handleClickOutside = (event) => {
    if (!event.target.closest('.language-selector')) {
      setIsOpen(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  // Variante minimal (solo icono)
  if (variant === 'minimal') {
    return (
      <div className={`relative language-selector ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          title={t('navigation.settings')}
          disabled={isChanging}
        >
          <Globe size={20} className={isChanging ? 'animate-spin' : ''} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[150px]">
            {availableLanguages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`
                  w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2
                  ${language.code === currentLanguage ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
                `}
              >
                <span className="text-lg">{language.flag}</span>
                <span className="flex-1">{language.name}</span>
                {language.code === currentLanguage && (
                  <Check size={16} className="text-blue-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Variante completa (botón con texto)
  return (
    <div className={`relative language-selector ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChanging}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 
          bg-white hover:bg-gray-50 transition-colors min-w-[120px]
          ${isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {showFlag && (
          <span className="text-lg">{currentLang.flag}</span>
        )}
        
        {showText && (
          <span className="flex-1 text-left text-sm font-medium">
            {currentLang.name}
          </span>
        )}
        
        <ChevronDown 
          size={16} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''} ${isChanging ? 'animate-spin' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-full">
          {availableLanguages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`
                w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm
                ${language.code === currentLanguage ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
              `}
            >
              <span className="text-lg">{language.flag}</span>
              <span className="flex-1">{language.name}</span>
              {language.code === currentLanguage && (
                <Check size={16} className="text-blue-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
