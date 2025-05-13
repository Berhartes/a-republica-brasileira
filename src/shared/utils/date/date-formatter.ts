// src/shared/utils/date/date-formatter.ts
import { z } from 'zod';
import { logger } from '@/core/monitoring';

/**
 * Enum para formatos de data suportados
 */
export enum DateFormat {
  ISO = 'ISO',
  BR = 'BR',
  API = 'API',
  DATETIME_BR = 'DATETIME_BR',
  DATETIME_ISO = 'DATETIME_ISO',
  TIME = 'TIME'
}

/**
 * Schema para validação de formato de data
 */
export const dateFormatSchema = z.nativeEnum(DateFormat);

/**
 * Schema para opções de formatação de data
 */
export const dateFormatOptionsSchema = z.object({
  /**
   * Formato de saída da data
   */
  format: dateFormatSchema.optional().default(DateFormat.BR),
  
  /**
   * Locale para formatação
   */
  locale: z.string().optional().default('pt-BR'),
  
  /**
   * Valor a retornar se a data for inválida
   */
  fallback: z.string().optional().default('')
});

export type DateFormatOptions = z.infer<typeof dateFormatOptionsSchema>;

/**
 * Converte uma string de data da API para objeto Date
 * @param dateStr String de data para converter
 * @returns Objeto Date ou null se inválido
 */
export function parseApiDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  
  try {
    const date = new Date(dateStr);
    return isValidDate(date) ? date : null;
  } catch (error) {
    logger.error('Erro ao converter data:', error);
    return null;
  }
}

/**
 * Formata uma data para string no formato especificado
 * @param date Data para formatar
 * @param formatOrOptions Formato ou opções de formatação
 * @returns String formatada
 */
export function formatDate(
  date: Date | string | null | undefined, 
  formatOrOptions: DateFormat | DateFormatOptions = DateFormat.BR
): string {
  try {
    // Processar opções
    const options = typeof formatOrOptions === 'string'
      ? { format: formatOrOptions }
      : formatOrOptions;
      
    const validatedOptions = dateFormatOptionsSchema.parse(options);
    const { format, locale, fallback } = validatedOptions;
    
    // Validar data
    if (!date) return fallback;
    
    const d = typeof date === 'string' ? new Date(date) : date;
    if (!isValidDate(d)) return fallback;
    
    // Formatar de acordo com o formato especificado
    switch (format) {
      case DateFormat.ISO:
        return d.toISOString().split('T')[0]; // YYYY-MM-DD
        
      case DateFormat.BR:
        return d.toLocaleDateString(locale); // DD/MM/YYYY
        
      case DateFormat.API:
        return d.toISOString().split('T')[0]; // YYYY-MM-DD
        
      case DateFormat.DATETIME_BR:
        return d.toLocaleString(locale); // DD/MM/YYYY HH:MM:SS
        
      case DateFormat.DATETIME_ISO:
        return d.toISOString(); // YYYY-MM-DDTHH:MM:SS.sssZ
        
      case DateFormat.TIME:
        return d.toLocaleTimeString(locale); // HH:MM:SS
        
      default:
        return d.toLocaleDateString(locale);
    }
  } catch (error) {
    logger.error('Erro ao formatar data:', error);
    return '';
  }
}

/**
 * Verifica se uma data é válida
 * @param date Data para verificar
 * @returns true se a data for válida
 */
export function isValidDate(date: Date | null | undefined): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Compara duas datas
 * @param date1 Primeira data
 * @param date2 Segunda data
 * @returns -1 (date1 < date2), 0 (date1 = date2), 1 (date1 > date2)
 */
export function compareDates(date1: Date | null | undefined, date2: Date | null | undefined): number {
  if (!date1 && !date2) return 0;
  if (!date1) return -1;
  if (!date2) return 1;
  
  if (!isValidDate(date1) && !isValidDate(date2)) return 0;
  if (!isValidDate(date1)) return -1;
  if (!isValidDate(date2)) return 1;
  
  const time1 = date1.getTime();
  const time2 = date2.getTime();
  
  if (time1 < time2) return -1;
  if (time1 > time2) return 1;
  return 0;
}

/**
 * Adiciona um período a uma data
 * @param date Data base
 * @param amount Quantidade a adicionar
 * @param unit Unidade de tempo
 * @returns Nova data
 */
export function addToDate(
  date: Date | string | null,
  amount: number,
  unit: 'days' | 'months' | 'years' | 'hours' | 'minutes' | 'seconds'
): Date | null {
  if (!date) return null;
  
  try {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    if (!isValidDate(d)) return null;
    
    const result = new Date(d);
    
    switch (unit) {
      case 'days':
        result.setDate(d.getDate() + amount);
        break;
      case 'months':
        result.setMonth(d.getMonth() + amount);
        break;
      case 'years':
        result.setFullYear(d.getFullYear() + amount);
        break;
      case 'hours':
        result.setHours(d.getHours() + amount);
        break;
      case 'minutes':
        result.setMinutes(d.getMinutes() + amount);
        break;
      case 'seconds':
        result.setSeconds(d.getSeconds() + amount);
        break;
    }
    
    return result;
  } catch (error) {
    logger.error('Erro ao adicionar à data:', error);
    return null;
  }
}

/**
 * Calcula a diferença entre duas datas
 * @param date1 Primeira data
 * @param date2 Segunda data
 * @param unit Unidade de retorno
 * @returns Diferença na unidade especificada
 */
export function dateDifference(
  date1: Date | string | null,
  date2: Date | string | null,
  unit: 'days' | 'months' | 'years' | 'hours' | 'minutes' | 'seconds'
): number | null {
  if (!date1 || !date2) return null;
  
  try {
    const d1 = typeof date1 === 'string' ? new Date(date1) : new Date(date1);
    const d2 = typeof date2 === 'string' ? new Date(date2) : new Date(date2);
    
    if (!isValidDate(d1) || !isValidDate(d2)) return null;
    
    const diffMs = d2.getTime() - d1.getTime();
    
    switch (unit) {
      case 'days':
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      case 'months':
        return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
      case 'years':
        return d2.getFullYear() - d1.getFullYear();
      case 'hours':
        return Math.floor(diffMs / (1000 * 60 * 60));
      case 'minutes':
        return Math.floor(diffMs / (1000 * 60));
      case 'seconds':
        return Math.floor(diffMs / 1000);
      default:
        return diffMs;
    }
  } catch (error) {
    logger.error('Erro ao calcular diferença de datas:', error);
    return null;
  }
}

export default {
  DateFormat,
  parseApiDate,
  formatDate,
  isValidDate,
  compareDates,
  addToDate,
  dateDifference
};