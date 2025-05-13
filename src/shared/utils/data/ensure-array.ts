// src/shared/utils/data/ensure-array.ts

/**
 * Garante que o valor retornado seja um array
 * Se for undefined ou null, retorna array vazio
 * Se for um único item, converte para array com um item
 * Se já for array, retorna o próprio array
 * 
 * @template T Tipo dos itens do array
 * @param value Valor a ser convertido para array
 * @returns Array garantido
 * 
 * @example
 * // Retorna [1, 2, 3]
 * ensureArray([1, 2, 3])
 * 
 * @example
 * // Retorna [5]
 * ensureArray(5)
 * 
 * @example
 * // Retorna []
 * ensureArray(null)
 */
export function ensureArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

export default ensureArray;