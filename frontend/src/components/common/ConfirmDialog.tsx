import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
  loading?: boolean;
}

/**
 * Переиспользуемый диалог подтверждения
 * Устраняет дублирование confirm-диалогов по всему приложению
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Подтверждение',
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  confirmVariant = 'primary',
  loading = false
}) => {
  const getConfirmButtonClasses = () => {
    const baseClasses = 'px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50';
    
    switch (confirmVariant) {
      case 'danger':
        return `${baseClasses} bg-red-600 text-white hover:bg-red-700 disabled:hover:bg-red-600`;
      case 'primary':
      default:
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600`;
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onCancel();
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleOverlayClick}
    >
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={getConfirmButtonClasses()}
            >
              {loading ? 'Загрузка...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
