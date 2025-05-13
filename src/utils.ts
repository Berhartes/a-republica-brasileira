/**
 * Utilitários compartilhados entre todos os domínios
 */
import { ERROR_CODES } from './constants';
import type { ErrorResponse } from './types';

/**
 * Cria um objeto de erro padronizado
 * @param code Código do erro
 * @param message Mensagem do erro
 * @param details Detalhes adicionais do erro
 * @returns Objeto de erro padronizado
 */
export function createError(
  code: string = ERROR_CODES.UNKNOWN,
  message: string = 'Ocorreu um erro inesperado',
  details?: unknown
): ErrorResponse {
  const error: ErrorResponse = {
    code,
    message,
  };
  
  if (details !== undefined) {
    error.details = details;
  }
  
  return error;
}

/**
 * Converte um erro qualquer para o formato padronizado
 * @param error Erro a ser convertido
 * @returns Erro no formato padronizado
 */
export function normalizeError(error: unknown): ErrorResponse {
  if (error && typeof error === 'object') {
    if ('code' in error && 'message' in error) {
      return {
        code: String((error as { code: unknown }).code || ERROR_CODES.UNKNOWN),
        message: String((error as { message: unknown }).message),
        ...(('details' in error) && { details: (error as { details: unknown }).details }),
      };
    }
    
    if (error instanceof Error) {
      return {
        code: ERROR_CODES.UNKNOWN,
        message: error.message,
        details: error.stack,
      };
    }
  }
  
  return {
    code: ERROR_CODES.UNKNOWN,
    message: String(error) || 'Erro desconhecido',
  };
}

/**
 * Verifica se um objeto é vazio
 * @param obj Objeto a ser verificado
 * @returns true se o objeto for vazio, false caso contrário
 */
export function isEmpty(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Remove propriedades indefinidas de um objeto
 * @param obj Objeto a ser limpo
 * @returns Objeto sem propriedades indefinidas
 */
export function removeUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key as keyof T] = value as T[keyof T];
    }
    return acc;
  }, {} as T);
}

/**
 * Gera um ID único usando timestamp e caracteres aleatórios
 * @returns ID único
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Formata um estado brasileiro pelo seu código
 * @param uf Código UF do estado (2 caracteres)
 * @returns Nome do estado ou o próprio código se não encontrado
 */
export function formatarEstado(uf: string): string {
  const estados: Record<string, string> = {
    AC: 'Acre',
    AL: 'Alagoas',
    AP: 'Amapá',
    AM: 'Amazonas',
    BA: 'Bahia',
    CE: 'Ceará',
    DF: 'Distrito Federal',
    ES: 'Espírito Santo',
    GO: 'Goiás',
    MA: 'Maranhão',
    MT: 'Mato Grosso',
    MS: 'Mato Grosso do Sul',
    MG: 'Minas Gerais',
    PA: 'Pará',
    PB: 'Paraíba',
    PR: 'Paraná',
    PE: 'Pernambuco',
    PI: 'Piauí',
    RJ: 'Rio de Janeiro',
    RN: 'Rio Grande do Norte',
    RS: 'Rio Grande do Sul',
    RO: 'Rondônia',
    RR: 'Roraima',
    SC: 'Santa Catarina',
    SP: 'São Paulo',
    SE: 'Sergipe',
    TO: 'Tocantins',
  };
  
  return estados[uf.toUpperCase()] || uf;
}

/**
 * Converte uma string para o formato de slug
 * @param text Texto a ser convertido
 * @returns Slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}