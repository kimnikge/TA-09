// Dev-only logger initialization helper
// This file is dynamically imported in development to avoid bundling in production

import logger, { log, LogLevel } from './logger';

declare global {
  interface Window {
    appLogger: typeof logger;
    log: typeof log;
  }
}

try {
  // Ensure verbose logs in development
  logger.setLevel(LogLevel.DEBUG);
  log.debug('loggerTest: development logging enabled');

  // Expose logger helpers globally for quick console access during debugging
  if (typeof window !== 'undefined') {
    window.appLogger = logger;
    window.log = log;
  }
} catch (e) {
  // Fallback to console in case something goes wrong very early
  console.error('loggerTest initialization error', e);
}

export {};
