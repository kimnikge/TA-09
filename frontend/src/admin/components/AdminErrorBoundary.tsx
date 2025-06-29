import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class AdminErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ Ошибка в админ-панели:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-red-800 mb-2">
              Ошибка в админ-панели
            </h1>
            <p className="text-gray-600 mb-4">
              Произошла ошибка при загрузке админ-панели. 
              Основной сайт продолжает работать нормально.
            </p>
            <div className="bg-red-100 border border-red-300 rounded p-3 mb-4">
              <code className="text-sm text-red-700">
                {this.state.error?.message || 'Неизвестная ошибка'}
              </code>
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors mr-2"
            >
              Попробовать снова
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Перезагрузить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;
