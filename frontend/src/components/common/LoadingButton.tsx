import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

/**
 * Переиспользуемый компонент кнопки с состоянием загрузки
 * Устраняет дублирование кода кнопок по всему приложению
 */
const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading,
  children,
  loadingText,
  disabled = false,
  type = 'button',
  className = '',
  onClick,
  variant = 'primary'
}) => {
  const getVariantClasses = () => {
    const baseClasses = 'px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2';
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700`;
      case 'secondary':
        return `${baseClasses} bg-gray-200 text-gray-800 hover:bg-gray-300`;
      case 'danger':
        return `${baseClasses} bg-red-600 text-white hover:bg-red-700`;
      case 'success':
        return `${baseClasses} bg-green-600 text-white hover:bg-green-700`;
      default:
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700`;
    }
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`${getVariantClasses()} ${className}`}
      onClick={onClick}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {loading ? (loadingText || 'Загрузка...') : children}
    </button>
  );
};

export default LoadingButton;
