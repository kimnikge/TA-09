import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface FormFieldProps {
  label?: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
}

interface FormSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
}

interface FormContainerProps {
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
}

/**
 * Компонент поля формы
 */
const FormField: React.FC<FormFieldProps> = ({
  label,
  children,
  error,
  required = false,
  className = ''
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

/**
 * Компонент секции формы
 */
const FormSection: React.FC<FormSectionProps> = ({
  title,
  children,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <h3 className="text-base font-medium text-gray-900 border-b border-gray-200 pb-2">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

/**
 * Компонент действий формы (кнопки)
 */
const FormActions: React.FC<FormActionsProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`flex gap-3 pt-4 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Основной контейнер формы
 * Устраняет дублирование структуры форм по всему приложению
 */
const FormContainer: React.FC<FormContainerProps> = ({
  onSubmit,
  children,
  className = '',
  loading = false,
  disabled = false
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading && !disabled) {
      onSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <LoadingSpinner size="lg" />
        </div>
      )}
      <fieldset disabled={disabled || loading} className="space-y-6">
        {children}
      </fieldset>
    </form>
  );
};

// Составной компонент с подкомпонентами
const Form = Object.assign(FormContainer, {
  Field: FormField,
  Section: FormSection,
  Actions: FormActions
});

export default Form;
