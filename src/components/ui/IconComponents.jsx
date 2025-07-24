import React from 'react';

/**
 * Componentes de iconos simples para reemplazar las dependencias problemáticas
 * Estos iconos usan caracteres Unicode y emojis como alternativa temporal
 */

export const IconArrowLeft = ({size = 20, className = ''}) => (
  <span className={`icon ${className}`} style={{fontSize: `${size/16}rem`}}>←</span>
);

export const IconReply = ({size = 20, className = ''}) => (
  <span className={`icon ${className}`} style={{fontSize: `${size/16}rem`}}>↩</span>
);

export const IconTrash = ({size = 20, className = ''}) => (
  <span className={`icon ${className}`} style={{fontSize: `${size/16}rem`}}>🗑️</span>
);

export const IconDownload = ({size = 20, className = ''}) => (
  <span className={`icon ${className}`} style={{fontSize: `${size/16}rem`}}>↓</span>
);

export const IconStar = ({size = 20, className = ''}) => (
  <span className={`icon ${className}`} style={{fontSize: `${size/16}rem`}}>★</span>
);

export const IconMoreHorizontal = ({size = 20, className = ''}) => (
  <span className={`icon ${className}`} style={{fontSize: `${size/16}rem`}}>⋯</span>
);

export const IconExternalLink = ({size = 20, className = ''}) => (
  <span className={`icon ${className}`} style={{fontSize: `${size/16}rem`}}>↗</span>
);

export const IconPrinter = ({size = 20, className = ''}) => (
  <span className={`icon ${className}`} style={{fontSize: `${size/16}rem`}}>🖨️</span>
);

export const IconFlag = ({size = 20, className = ''}) => (
  <span className={`icon ${className}`} style={{fontSize: `${size/16}rem`}}>🏁</span>
);

export const IconArrowLeftRight = ({size = 20, className = ''}) => (
  <span className={`icon ${className}`} style={{fontSize: `${size/16}rem`}}>⇄</span>
);

export const IconFolderMove = ({size = 20, className = ''}) => (
  <span className={`icon ${className}`} style={{fontSize: `${size/16}rem`}}>📁</span>
);
