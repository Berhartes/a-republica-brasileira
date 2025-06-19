// Exporta o logger Pino
export { default as logger } from './pino-logger';
export type { LoggerConfig as PinoLoggerConfig } from './pino-logger';

// Exporta o console logger
export { default as consoleLogger } from './console-logger';
export { createConsoleLogger } from './console-logger';
export type { ConsoleLoggerConfig } from './console-logger';

// Exporta o tipo LogLevel do pino-logger
export type { LogLevel } from './pino-logger';
