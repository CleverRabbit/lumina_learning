import { LogEntry } from "./types";

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  log(level: LogEntry['level'], message: string, context?: any) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    console.log(`[${entry.level.toUpperCase()}] ${entry.message}`, context || '');
    
    // Persist to localStorage for session persistence
    try {
      const savedLogs = JSON.parse(localStorage.getItem('lumina_logs') || '[]');
      savedLogs.unshift(entry);
      localStorage.setItem('lumina_logs', JSON.stringify(savedLogs.slice(0, 500)));
    } catch (e) {}
  }

  info(message: string, context?: any) { this.log('info', message, context); }
  warn(message: string, context?: any) { this.log('warn', message, context); }
  error(message: string, context?: any) { this.log('error', message, context); }

  getLogs() {
    try {
      return JSON.parse(localStorage.getItem('lumina_logs') || '[]');
    } catch (e) {
      return this.logs;
    }
  }

  clear() {
    this.logs = [];
    localStorage.removeItem('lumina_logs');
  }
}

export const logger = new Logger();
