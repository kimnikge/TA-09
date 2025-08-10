/**
 * Централизованная система логирования
 * Поддерживает различные уровни логов и автоматическое отключение в production
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

type LogData = Record<string, unknown> | string | number | boolean | null | undefined;

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: LogData;
  timestamp: Date;
  component?: string;
}

interface ErrorReport extends LogEntry {
  userAgent: string;
  url: string;
}

class Logger {
  private currentLevel: LogLevel;
  private isDevelopment: boolean;
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Ограничиваем количество логов в памяти

  constructor() {
    // Определяем режим разработки безопасным способом
    this.isDevelopment = typeof import.meta !== 'undefined' && 
                        import.meta.env && 
                        import.meta.env.DEV === true;
    
    // В production показываем только ERROR и выше
    // В development показываем все
    this.currentLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR;
    
    // В production на мобильных устройствах отключаем логи полностью
    if (!this.isDevelopment && this.isMobileDevice()) {
      this.currentLevel = LogLevel.NONE;
    }
  }

  private isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private formatMessage(level: LogLevel, component: string | undefined, message: string): string {
    const emoji = this.getLevelEmoji(level);
    const prefix = component ? `${emoji} ${component}:` : `${emoji}`;
    return `${prefix} ${message}`;
  }

  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '🔍';
      case LogLevel.INFO: return '📋';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.ERROR: return '❌';
      default: return '📝';
    }
  }

  private log(level: LogLevel, message: string, data?: LogData, component?: string): void {
    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      component
    };

    // Добавляем в историю логов
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    const formattedMessage = this.formatMessage(level, component, message);

    // Выводим в консоль браузера
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, data);
        break;
      case LogLevel.INFO:
        console.log(formattedMessage, data);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, data);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, data);
        // В production отправляем критические ошибки в внешний сервис
        if (!this.isDevelopment) {
          this.reportToExternalService(logEntry);
        }
        break;
    }
  }

  private reportToExternalService(logEntry: LogEntry): void {
    // Здесь можно интегрировать с Sentry, LogRocket или другим сервисом
    // Пока просто сохраняем в localStorage для отладки
    try {
      const errorReports = JSON.parse(localStorage.getItem('errorReports') || '[]');
      errorReports.push({
        ...logEntry,
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      // Храним только последние 10 ошибок
      if (errorReports.length > 10) {
        errorReports.shift();
      }
      
      localStorage.setItem('errorReports', JSON.stringify(errorReports));
    } catch {
      // Если не можем сохранить, просто игнорируем
    }
  }

  // Публичные методы для использования в компонентах
  debug(message: string, data?: LogData, component?: string): void {
    this.log(LogLevel.DEBUG, message, data, component);
  }

  info(message: string, data?: LogData, component?: string): void {
    this.log(LogLevel.INFO, message, data, component);
  }

  warn(message: string, data?: LogData, component?: string): void {
    this.log(LogLevel.WARN, message, data, component);
  }

  error(message: string, data?: LogData, component?: string): void {
    this.log(LogLevel.ERROR, message, data, component);
  }

  // Специальные методы для частых случаев
  api(message: string, data?: LogData): void {
    this.info(message, data, 'API');
  }

  auth(message: string, data?: LogData): void {
    this.info(message, data, 'AUTH');
  }

  db(message: string, data?: LogData): void {
    this.info(message, data, 'DATABASE');
  }

  ui(message: string, data?: LogData): void {
    this.debug(message, data, 'UI');
  }

  // Утилитарные методы
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  getErrorReports(): ErrorReport[] {
    try {
      return JSON.parse(localStorage.getItem('errorReports') || '[]');
    } catch {
      return [];
    }
  }

  clearErrorReports(): void {
    localStorage.removeItem('errorReports');
  }

  // Публичные геттеры для отладки
  getCurrentLevel(): LogLevel {
    return this.currentLevel;
  }

  getIsDevelopment(): boolean {
    return this.isDevelopment;
  }
}

// Создаем единственный экземпляр логгера
export const logger = new Logger();

// Экспортируем удобные алиасы
export const log = {
  debug: (message: string, data?: LogData, component?: string) => logger.debug(message, data, component),
  info: (message: string, data?: LogData, component?: string) => logger.info(message, data, component),
  warn: (message: string, data?: LogData, component?: string) => logger.warn(message, data, component),
  error: (message: string, data?: LogData, component?: string) => logger.error(message, data, component),
  api: (message: string, data?: LogData) => logger.api(message, data),
  auth: (message: string, data?: LogData) => logger.auth(message, data),
  db: (message: string, data?: LogData) => logger.db(message, data),
  ui: (message: string, data?: LogData) => logger.ui(message, data),
};

export default logger;
