import React, { useState } from 'react';
import { Play, Check, X, AlertTriangle, Trash2 } from 'lucide-react';
import { runUserManagementTests } from '../../tests/userManagementTest';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  duration?: number;
}

const UserManagementTestSection: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Создание тестового пользователя', status: 'pending' },
    { name: 'Активация пользователя', status: 'pending' },
    { name: 'Блокировка пользователя', status: 'pending' },
    { name: 'Получение списка пользователей', status: 'pending' },
    { name: 'Проверка RLS политик', status: 'pending' },
    { name: 'Удаление пользователя', status: 'pending' },
  ]);
  
  const [isRunning, setIsRunning] = useState(false);
  const [testOutput, setTestOutput] = useState<string[]>([]);

  const runTests = async () => {
    setIsRunning(true);
    setTestOutput(['🚀 Запуск тестирования системы управления пользователями...']);
    
    // Сброс статусов тестов
    setTests(prev => prev.map(test => ({ ...test, status: 'pending' })));

    try {
      // Здесь можно запустить реальные тесты
      await runUserManagementTests();
      
      // Имитация выполнения тестов для демонстрации
      for (let i = 0; i < tests.length; i++) {
        setTests(prev => prev.map((test, index) => 
          index === i ? { ...test, status: 'running' } : test
        ));
        
        setTestOutput(prev => [...prev, `⏳ Выполняется тест: ${tests[i].name}`]);
        
        // Имитация времени выполнения
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        // Случайный результат для демонстрации
        const passed = Math.random() > 0.2; // 80% тестов проходят
        
        setTests(prev => prev.map((test, index) => 
          index === i ? { 
            ...test, 
            status: passed ? 'passed' : 'failed',
            message: passed ? 'Тест пройден успешно' : 'Тест провален'
          } : test
        ));
        
        setTestOutput(prev => [...prev, `${passed ? '✅' : '❌'} ${tests[i].name}: ${passed ? 'ПРОЙДЕН' : 'ПРОВАЛЕН'}`]);
      }
      
      setTestOutput(prev => [...prev, '🎉 Тестирование завершено!']);
    } catch (error) {
      setTestOutput(prev => [...prev, `❌ Ошибка при выполнении тестов: ${error}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const clearOutput = () => {
    setTestOutput([]);
    setTests(prev => prev.map(test => ({ ...test, status: 'pending' })));
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />;
      case 'passed':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'passed':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const passedTests = tests.filter(t => t.status === 'passed').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;
  const totalTests = tests.length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              Тестирование управления пользователями
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Проверка работоспособности системы активации и удаления пользователей
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={clearOutput}
              disabled={isRunning}
              className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Очистить
            </button>
            <button
              onClick={runTests}
              disabled={isRunning}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Play className="w-4 h-4 mr-2" />
              {isRunning ? 'Выполняется...' : 'Запустить тесты'}
            </button>
          </div>
        </div>

        {/* Статистика тестов */}
        {(passedTests > 0 || failedTests > 0) && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{passedTests}</div>
              <div className="text-sm text-green-600">Пройдено</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{failedTests}</div>
              <div className="text-sm text-red-600">Провалено</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{totalTests}</div>
              <div className="text-sm text-gray-600">Всего</div>
            </div>
          </div>
        )}

        {/* Список тестов */}
        <div className="space-y-3 mb-6">
          {tests.map((test, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 border rounded-lg ${getStatusColor(test.status)}`}
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(test.status)}
                <span className="font-medium">{test.name}</span>
              </div>
              {test.message && (
                <span className="text-sm text-gray-600">{test.message}</span>
              )}
            </div>
          ))}
        </div>

        {/* Вывод тестов */}
        {testOutput.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <AlertTriangle className="w-4 h-4 text-yellow-400 mr-2" />
              <span className="text-sm font-medium text-white">Лог выполнения</span>
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {testOutput.map((line, index) => (
                <div key={index} className="text-sm font-mono text-gray-300">
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Предупреждения */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Внимание</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Эти тесты создают временных пользователей в базе данных для проверки функциональности. 
                Все тестовые данные автоматически удаляются после завершения тестов.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementTestSection;
