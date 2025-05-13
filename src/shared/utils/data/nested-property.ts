// src/shared/utils/data/nested-property.ts
import { z } from 'zod';
import { logger } from '@/core/monitoring';

/**
 * Schema para validação de caminhos de propriedade
 */
export const propertyPathSchema = z.string().min(1);

/**
 * Obtém uma propriedade aninhada de um objeto de forma segura
 * 
 * @template T Tipo da propriedade a ser retornada
 * @template D Tipo do valor padrão
 * @param obj Objeto fonte
 * @param path Caminho da propriedade (usando pontos)
 * @param defaultValue Valor padrão se não encontrado
 * @returns Valor da propriedade ou valor padrão
 * 
 * @example
 * // Retorna o valor da cidade ou 'N/A' se não encontrado
 * getNestedProperty(usuario, 'endereco.cidade', 'N/A');
 */
export function getNestedProperty<T = unknown, D = undefined>(
  obj: Record<string, any> | null | undefined, 
  path: string, 
  defaultValue?: D
): T | D {
  try {
    if (!obj || !path) {
      return defaultValue as D;
    }
    
    // Validar caminho
    const validPath = propertyPathSchema.parse(path);
    
    return validPath.split('.')
      .reduce<any>(
        (current, key) => (current !== null && current !== undefined) ? current[key] : undefined, 
        obj
      ) ?? defaultValue as D;
  } catch (error) {
    logger.error(`Erro ao acessar propriedade ${path}:`, error);
    return defaultValue as D;
  }
}

/**
 * Define uma propriedade aninhada em um objeto de forma segura
 * 
 * @template T Tipo do valor a ser definido
 * @param obj Objeto alvo
 * @param path Caminho da propriedade (usando pontos)
 * @param value Valor a ser definido
 * @returns true se a operação foi bem-sucedida
 * 
 * @example
 * // Define o valor da cidade
 * setNestedProperty(usuario, 'endereco.cidade', 'São Paulo');
 */
export function setNestedProperty<T = unknown>(
  obj: Record<string, any>,
  path: string,
  value: T
): boolean {
  try {
    if (!obj || !path) {
      return false;
    }
    
    // Validar caminho
    const validPath = propertyPathSchema.parse(path);
    
    const parts = validPath.split('.');
    const lastKey = parts.pop();
    
    if (!lastKey) {
      return false;
    }
    
    let current = obj;
    
    // Navegue até o objeto pai
    for (const key of parts) {
      if (current[key] === undefined || current[key] === null) {
        current[key] = {};
      } else if (typeof current[key] !== 'object') {
        // Não podemos definir uma propriedade em um valor primitivo
        return false;
      }
      
      current = current[key];
    }
    
    // Definir o valor
    current[lastKey] = value;
    return true;
  } catch (error) {
    logger.error(`Erro ao definir propriedade ${path}:`, error);
    return false;
  }
}

/**
 * Verifica se uma propriedade aninhada existe em um objeto
 * 
 * @param obj Objeto a ser verificado
 * @param path Caminho da propriedade (usando pontos)
 * @returns true se a propriedade existir
 * 
 * @example
 * // Verifica se a cidade existe
 * hasNestedProperty(usuario, 'endereco.cidade');
 */
export function hasNestedProperty(
  obj: Record<string, any> | null | undefined,
  path: string
): boolean {
  try {
    if (!obj || !path) {
      return false;
    }
    
    // Validar caminho
    const validPath = propertyPathSchema.parse(path);
    
    const value = getNestedProperty(obj, validPath);
    return value !== undefined;
  } catch (error) {
    logger.error(`Erro ao verificar propriedade ${path}:`, error);
    return false;
  }
}

/**
 * Remove uma propriedade aninhada de um objeto
 * 
 * @param obj Objeto alvo
 * @param path Caminho da propriedade (usando pontos)
 * @returns true se a propriedade foi removida
 * 
 * @example
 * // Remove a cidade
 * removeNestedProperty(usuario, 'endereco.cidade');
 */
export function removeNestedProperty(
  obj: Record<string, any> | null | undefined,
  path: string
): boolean {
  try {
    if (!obj || !path) {
      return false;
    }
    
    // Validar caminho
    const validPath = propertyPathSchema.parse(path);
    
    const parts = validPath.split('.');
    const lastKey = parts.pop();
    
    if (!lastKey) {
      return false;
    }
    
    // Se for uma propriedade direta, use delete
    if (parts.length === 0) {
      return delete obj[lastKey];
    }
    
    // Navegue até o objeto pai
    const parent = getNestedProperty<Record<string, any>>(obj, parts.join('.'));
    
    if (!parent || typeof parent !== 'object') {
      return false;
    }
    
    return delete parent[lastKey];
  } catch (error) {
    logger.error(`Erro ao remover propriedade ${path}:`, error);
    return false;
  }
}

export default {
  getNestedProperty,
  setNestedProperty,
  hasNestedProperty,
  removeNestedProperty
};