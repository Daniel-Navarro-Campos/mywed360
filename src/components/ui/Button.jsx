import React from 'react';

/**
 * Componente Button personalizado 
 * Ofrece diferentes variantes y tamaños
 * 
 * @component
 * @example
 * ```jsx
 * <Button variant="primary" size="md" onClick={handleClick}>Click me</Button>
 * ```
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  onClick,
  type = "button",
  startIcon,
  leftIcon,
  ...props
}) {
  // Clases base
  const baseClasses = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";
  
  // Variantes
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900",
    outline: "bg-transparent border border-gray-300 hover:bg-gray-50 text-gray-700",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700",
    destructive: "bg-red-600 hover:bg-red-700 text-white",
    link: "bg-transparent underline-offset-4 hover:underline text-blue-600 hover:text-blue-800"
  };
  
  // Tamaños
  const sizeClasses = {
    xs: "text-xs px-2 py-1 rounded",
    sm: "text-sm px-3 py-1.5 rounded",
    md: "text-sm px-4 py-2 rounded-md",
    lg: "text-base px-5 py-2.5 rounded-md",
    xl: "text-lg px-6 py-3 rounded-md"
  };
  
  // Estado deshabilitado
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer";

  // Juntar todas las clases
  const buttonClasses = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    disabledClasses,
    className
  ].join(" ");

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      { (startIcon || leftIcon) && <span className="mr-2">{startIcon || leftIcon}</span>}
      {children}
    </button>
  );
};

