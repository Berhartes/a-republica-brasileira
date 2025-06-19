/**
 * Utilitários gerais para o projeto
 */

/**
 * Cria uma resposta de erro padronizada
 */
export function createErrorResponse(error: Error | string) {
  return {
    error: typeof error === 'string' ? error : error.message,
    success: false
  };
}

/**
 * Normaliza um erro para string
 */
export function normalizeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return JSON.stringify(error);
}

/**
 * Wrapper para try/catch que retorna um tuple [error, result]
 */
export async function tryCatch<T>(promise: Promise<T>): Promise<[Error | null, T | null]> {
  try {
    const result = await promise;
    return [null, result];
  } catch (error) {
    return [error as Error, null];
  }
}

/**
 * Verifica se um objeto tem todas as propriedades especificadas
 */
export function hasProperties<T extends object>(obj: T, props: (keyof T)[]): boolean {
  return props.every(prop => prop in obj);
}

/**
 * Função de delay/sleep
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Tenta executar uma função várias vezes
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await delay(delayMs);
    return retry(fn, retries - 1, delayMs);
  }
}

/**
 * Converte objeto em query string
 */
export function objectToQueryString(obj: Record<string, any>): string {
  return Object.entries(obj)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

/**
 * Faz merge profundo de objetos
 */
export function deepMerge<T extends object = object>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) return target;
  const source = sources.shift();

  if (source === undefined) return target;

  if (isMergeable(target) && isMergeable(source)) {
    Object.keys(source).forEach(key => {
      const sourceKey = key as keyof typeof source;
      if (isMergeable(source[sourceKey])) {
        if (!target[sourceKey]) Object.assign(target, { [sourceKey]: {} });
        deepMerge(target[sourceKey] as object, source[sourceKey] as object);
      } else {
        Object.assign(target, { [sourceKey]: source[sourceKey] });
      }
    });
  }

  return deepMerge(target, ...sources);
}

/**
 * Verifica se um valor é um objeto que pode ser merged
 */
function isMergeable(item: any): item is object {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Obtém um valor aninhado de um objeto usando uma string de caminho
 */
export function getNestedValue<T = any>(obj: any, path: string, defaultValue?: T): T | undefined {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : defaultValue;
  }, obj);
}

/**
 * Define um valor aninhado em um objeto usando uma string de caminho
 */
export function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  const target = keys.reduce((current, key) => {
    current[key] = current[key] || {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * Remove valores vazios de um objeto (null, undefined, '')
 */
export function removeEmptyValues<T extends object>(obj: T): Partial<T> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as Partial<T>);
}

/**
 * Gera um ID único
 */
export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Agrupa um array de objetos por uma chave
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    (groups as any)[groupKey] = (groups as any)[groupKey] || [];
    (groups as any)[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
} 