// Simple logger that works in both client and server environments
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

export class SimpleLogger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatLog(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context ?? {},
    };
  }

  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const formattedMessage = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formattedMessage, entry.context);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, entry.context);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, entry.context);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage, entry.context);
        break;
    }
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    const entry = this.formatLog(LogLevel.ERROR, message, context);
    if (error) {
      entry.context = { ...entry.context, error: error.message };
    }
    this.output(entry);
  }

  warn(message: string, context?: Record<string, any>): void {
    const entry = this.formatLog(LogLevel.WARN, message, context);
    this.output(entry);
  }

  info(message: string, context?: Record<string, any>): void {
    const entry = this.formatLog(LogLevel.INFO, message, context);
    this.output(entry);
  }

  debug(message: string, context?: Record<string, any>): void {
    const entry = this.formatLog(LogLevel.DEBUG, message, context);
    this.output(entry);
  }
}

// Export singleton instance
export const logger = new SimpleLogger();

