// Тестирование новой системы логирования
import { log, logger, LogLevel } from '../utils/logger';

declare global {
  interface Window {
    testLogger: () => void;
    loggerUtils: {
      setLevel: (level: LogLevel) => void;
      getLogs: () => unknown[];
      clearLogs: () => void;
      getErrorReports: () => unknown[];
      clearErrorReports: () => void;
    };
  }
}

// Экспортируем для использования в консоли браузера
window.testLogger = () => {
  console.log('🧪 Тестирование системы логирования...');
  
  // Тестируем все уровни логов
  log.debug('Тестовое DEBUG сообщение', { test: 'debug' });
  log.info('Тестовое INFO сообщение', { test: 'info' });
  log.warn('Тестовое WARN сообщение', { test: 'warn' });
  log.error('Тестовое ERROR сообщение', { test: 'error' });
  
  // Тестируем специализированные логи
  log.ui('Тестовое UI событие', { component: 'TestComponent' });
  log.api('Тестовый API запрос', { endpoint: '/test' });
  log.auth('Тестовая авторизация', { userId: 'test-123' });
  log.db('Тестовая операция БД', { table: 'test' });
  
  // Показываем настройки логгера
  console.log('Текущий уровень логирования:', logger.getCurrentLevel());
  console.log('Режим разработки:', logger.getIsDevelopment());
  
  // Показываем сохраненные логи
  console.log('История логов:', logger.getLogs());
  
  console.log('✅ Тестирование завершено');
};

// Экспортируем утилиты для отладки
window.loggerUtils = {
  setLevel: (level: LogLevel) => logger.setLevel(level),
  getLogs: () => logger.getLogs(),
  clearLogs: () => logger.clearLogs(),
  getErrorReports: () => logger.getErrorReports(),
  clearErrorReports: () => logger.clearErrorReports()
};

console.log('🔧 Утилиты логгера доступны в консоли:');
console.log('  testLogger() - тестирование логирования');
console.log('  loggerUtils.setLevel(0-4) - установка уровня');
console.log('  loggerUtils.getLogs() - просмотр логов');
console.log('  loggerUtils.clearLogs() - очистка логов');
