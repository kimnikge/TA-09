import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  fullScreen?: boolean;
  variant?: 'primary' | 'secondary' | 'white';
}

/**
 * Переиспользуемый компонент загрузки
 * Устраняет дублирование спиннеров по всему приложению
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = '',
  fullScreen = false,
  variant = 'primary'
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'md':
        return 'w-6 h-6';
      case 'lg':
        return 'w-8 h-8';
      case 'xl':
        return 'w-12 h-12';
      default:
        return 'w-6 h-6';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'text-blue-600';
      case 'secondary':
        return 'text-gray-600';
      case 'white':
        return 'text-white';
      default:
        return 'text-blue-600';
    }
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 className={`${getSizeClasses()} ${getVariantClasses()} animate-spin`} />
      {text && (
        <p className={`mt-2 text-sm ${variant === 'white' ? 'text-white' : 'text-gray-600'}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
