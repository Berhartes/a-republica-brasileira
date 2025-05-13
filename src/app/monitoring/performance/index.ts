// Exporta o DataDog para compatibilidade com código existente
export * from './datadog';

// Exporta o novo monitor de performance como alternativa mais simples
export * from './performance-monitor';
export { default as performanceMonitor } from './performance-monitor';
