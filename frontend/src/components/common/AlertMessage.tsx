import React from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';

interface AlertMessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
  showIcon?: boolean;
}

/**
 * Переиспользуемый компонент уведомлений
 * Устраняет дублирование alert-сообщений по всему приложению
 */
const AlertMessage: React.FC<AlertMessageProps> = ({
  type,
  title,
  message,
  onClose,
  className = '',
  showIcon = true
}) => {
  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 text-green-800',
          icon: 'text-green-600',
          IconComponent: CheckCircle
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: 'text-red-600',
          IconComponent: AlertCircle
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: 'text-yellow-600',
          IconComponent: AlertTriangle
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'text-blue-600',
          IconComponent: Info
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200 text-gray-800',
          icon: 'text-gray-600',
          IconComponent: Info
        };
    }
  };

  const { container, icon, IconComponent } = getTypeClasses();

  return (
    <div className={`border rounded-lg p-4 ${container} ${className}`}>
      <div className="flex items-start">
        {showIcon && (
          <div className="flex-shrink-0">
            <IconComponent className={`w-5 h-5 ${icon}`} />
          </div>
        )}
        <div className={`${showIcon ? 'ml-3' : ''} flex-1`}>
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          <p className="text-sm">
            {message}
          </p>
        </div>
        {onClose && (
          <div className="flex-shrink-0 ml-3">
            <button
              onClick={onClose}
              className={`text-sm hover:opacity-75 ${icon}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertMessage;
