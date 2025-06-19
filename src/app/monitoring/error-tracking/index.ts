// Exporta o Sentry para compatibilidade com código existente
export * from './sentry';

// Exporta o novo error-handler como alternativa mais simples
export * from './error-handler';
export { default as errorHandler } from './error-handler';
