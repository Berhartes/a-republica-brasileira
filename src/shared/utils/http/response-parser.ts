// src/shared/utils/http/response-parser.ts
import { z } from 'zod';
import { logger } from '@/core/monitoring';
import { isXmlContentType, isJsonContentType } from './content-type';

/**
 * Schema para opções do parser
 */
export const parserOptionsSchema = z.object({
  /**
   * Formato preferido para parsing
   */
  preferredFormat: z.enum(['json', 'xml', 'auto']).default('auto')
});

export type ParserOptions = z.infer<typeof parserOptionsSchema>;

/**
 * Detecta o tipo de conteúdo a partir da resposta ou do Content-Type
 */
function detectContentType(data: unknown, contentType?: string): 'json' | 'xml' | 'text' {
  // Se já temos um tipo de conteúdo explícito
  if (contentType) {
    if (isJsonContentType(contentType)) return 'json';
    if (isXmlContentType(contentType)) return 'xml';
  }
  
  // Tente inferir pelo tipo de dados
  if (typeof data === 'object' && data !== null) return 'json';
  if (typeof data === 'string') {
    // Verificar se parece XML
    if (data.trim().startsWith('<') && data.trim().endsWith('>')) return 'xml';
    
    // Verificar se parece JSON
    try {
      JSON.parse(data);
      return 'json';
    } catch {
      // Provavelmente não é JSON
    }
  }
  
  // Padrão quando não conseguimos inferir
  return 'text';
}

/**
 * Analisa uma resposta de API para objeto utilizável
 * 
 * @param data Dados da resposta
 * @param options Opções de parsing
 * @returns Objeto parseado ou null em caso de erro
 */
export function parseApiResponse(
  data: unknown, 
  contentType?: string,
  options?: Partial<ParserOptions>
): unknown {
  try {
    if (data === null || data === undefined) return null;
    
    // Validar opções
    const validatedOptions = parserOptionsSchema.parse(options || {});
    
    // Determinar formato baseado nas opções e tipo de dados
    let format = validatedOptions.preferredFormat;
    
    if (format === 'auto' || !format) {
      format = detectContentType(data, contentType) as 'json' | 'xml' | 'auto';
    }
    
    // Se já for um objeto JavaScript, retorna diretamente
    if (typeof data === 'object' && data !== null && format !== 'xml') {
      return data;
    }
    
    // Se for string, tenta fazer parse de acordo com o formato
    if (typeof data === 'string') {
      if (format === 'json' || format === 'auto') {
        try {
          return JSON.parse(data);
        } catch (error) {
          if (format === 'json') {
            throw new Error(`Erro ao fazer parse JSON: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          }
          // Se formato é auto, podemos tentar outros métodos
        }
      }
      
      if (format === 'xml' || format === 'auto') {
        // Nota: Em produção, usaríamos uma biblioteca de parsing XML
        // Como estamos migrando, vamos apenas indicar que seria necessário
        logger.warn('Parsing XML não implementado. Use uma biblioteca como fast-xml-parser.');
        return { _type: 'xml', _raw: data };
      }
      
      // Se chegamos aqui e o formato é auto, retornamos a string como está
      return data;
    }
    
    // Tipo não suportado
    return data;
  } catch (error) {
    logger.error('Erro ao fazer parse da resposta:', error);
    return null;
  }
}

export default {
  parseApiResponse
};