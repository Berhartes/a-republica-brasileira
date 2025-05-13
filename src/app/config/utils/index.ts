/**
 * @file Utilitários de configuração
 */

import { logger } from '@/core/monitoring';

/**
 * Obtém uma variável de ambiente com fallback
 * @param key Nome da variável de ambiente
 * @param fallback Valor padrão caso a variável não exista
 * @returns Valor da variável de ambiente ou fallback
 */
export function getEnv(key: string, fallback: string = ''): string {
  const value = import.meta.env[key] || fallback;
  
  if (!value && fallback === '') {
    logger.warn(`Variável de ambiente ${key} não encontrada e sem fallback`);
  }
  
  return value;
}

/**
 * Verifica se estamos em ambiente de desenvolvimento
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV === true || import.meta.env.MODE === 'development';
}

/**
 * Verifica se estamos em ambiente de produção
 */
export function isProduction(): boolean {
  return import.meta.env.PROD === true || import.meta.env.MODE === 'production';
}

/**
 * Verifica se estamos em ambiente de teste
 */
export function isTest(): boolean {
  return import.meta.env.MODE === 'test';
}

/**
 * Formata uma URL de API
 * @param path Caminho da API
 * @returns URL completa da API
 */
export function apiUrl(path: string): string {
  const baseUrl = getEnv('VITE_API_URL', '');
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Formata diferentes tipos de valores para string
 * @param value Valor a ser formatado
 * @returns String formatada
 */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

/**
 * Sanitiza um objeto removendo propriedades undefined e null
 * @param obj Objeto a ser sanitizado
 * @returns Objeto sanitizado
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as Partial<T>);
}

/**
 * Mescla objetos de configuração, permitindo sobreposição profunda
 * @param target Objeto alvo
 * @param source Objeto fonte
 * @returns Objeto mesclado
 */
export function mergeConfigs<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  Object.keys(source).forEach(key => {
    const sourceValue = source[key as keyof T];
    const targetValue = target[key as keyof T];
    
    if (
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      targetValue !== null &&
      typeof targetValue === 'object' &&
      !Array.isArray(sourceValue) &&
      !Array.isArray(targetValue)
    ) {
      result[key as keyof T] = mergeConfigs(
        targetValue,
        sourceValue as any
      ) as any;
    } else if (sourceValue !== undefined) {
      result[key as keyof T] = sourceValue as any;
    }
  });
  
  return result;
}
