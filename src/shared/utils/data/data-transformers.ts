// src/shared/utils/data/transformers.ts
import { z } from 'zod';
import { logger } from '@/core/monitoring';
import { ensureArray } from './ensure-array';
import { getNestedProperty } from './nested-property';

/**
 * Tipo para função de mapeamento de objetos
 */
export type MapperFunction<T, R> = (item: T, index: number, array: T[]) => R;

/**
 * Schema para opções de agrupamento de dados
 */
export const groupByOptionsSchema = z.object({
  /** Preservar valores nulos/undefined como grupo */
  preserveNullValues: z.boolean().default(false),
  /** Chave para agrupar valores nulos/undefined */
  nullValueKey: z.string().default('undefined')
});

export type GroupByOptions = z.infer<typeof groupByOptionsSchema>;

/**
 * Agrupa um array de objetos por uma propriedade
 * @param array Array de objetos a ser agrupado
 * @param key Nome da propriedade ou função para extrair chave de agrupamento
 * @param options Opções de agrupamento
 * @returns Objeto com grupos
 */
export function groupBy<T extends Record<string, any> | null | undefined>(
  array: T[] | null | undefined,
  key: string | ((item: T) => string | number | null | undefined),
  options: GroupByOptions = {
    preserveNullValues: false,
    nullValueKey: 'undefined'
  }
): Record<string, T[]> {
  if (!array || !array.length) return {};
  
  const validatedOptions = groupByOptionsSchema.parse(options);
  const { 
    preserveNullValues, 
    nullValueKey 
  } = validatedOptions;
  
  return array.reduce((result: Record<string, T[]>, item: T) => {
    const groupKey = typeof key === 'function' 
      ? key(item) 
      : getNestedProperty(item, key);
    
    // Lidar com valores nulos/undefined
    let keyString: string;
    
    if (groupKey === null || groupKey === undefined) {
      if (!preserveNullValues) {
        return result;
      }
      keyString = nullValueKey;
    } else {
      // Converter para string para garantir compatibilidade como chave de objeto
      keyString = String(groupKey);
    }
    
    if (!result[keyString]) {
      result[keyString] = [];
    }
    
    result[keyString].push(item);
    return result;
  }, {});
}

/**
 * Schema para opções de mapeamento e filtragem
 */
export const mapFilterOptionsSchema = z.object({
  /** Remover valores nulos/undefined do resultado */
  removeNulls: z.boolean().default(true),
  /** Preservar o tamanho original do array (sem remover itens) */
  preserveLength: z.boolean().default(false)
});

export type MapFilterOptions = z.infer<typeof mapFilterOptionsSchema>;

/**
 * Mapeia um array de objetos aplicando transformações e filtrando nulos
 * @param array Array a ser mapeado
 * @param mapper Função de mapeamento
 * @param options Opções de processamento
 * @returns Array processado sem valores nulos/undefined
 */
export function mapAndFilter<T, R>(
  array: T[] | T | null | undefined,
  mapper: MapperFunction<T, R | null | undefined>,
  options: MapFilterOptions = {
    removeNulls: true,
    preserveLength: false
  }
): R[] {
  const validatedOptions = mapFilterOptionsSchema.parse(options);
  const { 
    removeNulls,
    preserveLength
  } = validatedOptions;
  
  const items = ensureArray(array);
  if (!items.length) return [];
  
  const mapped = items.map(mapper);
  
  if (!removeNulls) {
    return mapped as R[];
  }
  
  if (preserveLength) {
    return mapped.map(item => item === null || item === undefined ? null as unknown as R : item);
  }
  
  return mapped.filter((item): item is R => item !== null && item !== undefined);
}

/**
 * Schema para opções de normalização de dados
 */
export const normalizeOptionsSchema = z.object({
  /** Campo a ser usado como ID */
  keyField: z.string().default('id'),
  /** Gerar novo ID para itens sem ID */
  generateIdForMissing: z.boolean().default(false),
  /** Prefixo para IDs gerados */
  generatedIdPrefix: z.string().default('generated_')
});

export type NormalizeOptions = z.infer<typeof normalizeOptionsSchema>;

/**
 * Resultado da normalização de dados
 */
export interface NormalizedData<T> {
  /** Objetos indexados por ID */
  byId: Record<string, T>;
  /** Lista de todos os IDs */
  allIds: string[];
  /** Itens sem ID (se houver) */
  unidentified?: T[];
}

/**
 * Normaliza dados para estrutura consistente
 * @param data Dados a serem normalizados
 * @param options Opções de normalização
 * @returns Objeto normalizado com índices por ID
 */
export function normalize<T extends Record<string, any>>(
  data: T[] | null | undefined,
  options: NormalizeOptions = {
    keyField: 'id',
    generateIdForMissing: false,
    generatedIdPrefix: 'generated_'
  }
): NormalizedData<T> {
  try {
    if (!data || !data.length) {
      return { byId: {}, allIds: [] };
    }
    
    const validatedOptions = normalizeOptionsSchema.parse(options);
    const { 
      keyField,
      generateIdForMissing,
      generatedIdPrefix
    } = validatedOptions;
    
    const byId: Record<string, T> = {};
    const allIds: string[] = [];
    const unidentified: T[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const id = String(getNestedProperty(item, keyField, '') || '');
      
      if (!id) {
        if (generateIdForMissing) {
          // Gerar ID para item sem ID
          const generatedId = `${generatedIdPrefix}${i}`;
          const itemWithId = { ...item, [keyField]: generatedId };
          
          byId[generatedId] = itemWithId;
          allIds.push(generatedId);
        } else {
          logger.warn(`Item sem ID válido no campo "${keyField}"`, item);
          unidentified.push(item);
        }
        continue;
      }
      
      byId[id] = { ...item };
      allIds.push(id);
    }
    
    return { 
      byId, 
      allIds,
      ...(unidentified.length > 0 ? { unidentified } : {})
    };
  } catch (error) {
    logger.error('Erro ao normalizar dados:', error);
    return { byId: {}, allIds: [] };
  }
}

/**
 * Resultado do cálculo de estatísticas
 */
export interface StatsResult {
  /** Valor mínimo */
  min: number;
  /** Valor máximo */
  max: number;
  /** Média aritmética */
  avg: number;
  /** Mediana */
  median: number;
  /** Soma dos valores */
  sum: number;
  /** Número de valores válidos */
  count: number;
  /** Desvio padrão (se solicitado) */
  stdDev?: number;
  /** Variância (se solicitado) */
  variance?: number;
}

/**
 * Schema para opções de cálculo de estatísticas
 */
export const statsOptionsSchema = z.object({
  /** Calcular desvio padrão */
  calculateStdDev: z.boolean().default(false),
  /** Calcular variância */
  calculateVariance: z.boolean().default(false),
  /** Função para extrair valores numéricos de objetos complexos */
  valueExtractor: z.function()
    .args(z.any())
    .returns(z.number())
    .optional()
});

export type StatsOptions = z.infer<typeof statsOptionsSchema>;

/**
 * Calcula estatísticas para um array de números
 * @param values Array de valores numéricos ou objetos
 * @param options Opções de cálculo
 * @returns Objeto com estatísticas ou null se array vazio/inválido
 */
export function calculateStats(
  values: unknown[] | null | undefined,
  options: StatsOptions = {
    calculateStdDev: false,
    calculateVariance: false
  }
): StatsResult | null {
  try {
    if (!values || !values.length) return null;
    
    const validatedOptions = statsOptionsSchema.parse(options);
    const { 
      calculateStdDev, 
      calculateVariance,
      valueExtractor
    } = validatedOptions;
    
    // Extrair valores numéricos conforme necessário
    let validValues: number[];
    
    if (valueExtractor) {
      validValues = values
        .map(v => {
          try {
            const extractedValue = valueExtractor(v);
            return typeof extractedValue === 'number' && !isNaN(extractedValue) 
              ? extractedValue 
              : null;
          } catch (e) {
            return null;
          }
        })
        .filter((v): v is number => v !== null);
    } else {
      // Filtrar apenas valores numéricos válidos
      validValues = values
        .filter(v => typeof v === 'number' && !isNaN(v)) as number[];
    }
    
    if (!validValues.length) return null;
    
    // Ordenar para cálculo da mediana
    const sorted = [...validValues].sort((a, b) => a - b);
    
    const sum = validValues.reduce((acc, val) => acc + val, 0);
    const count = validValues.length;
    const avg = sum / count;
    
    // Cálculo da mediana
    const middle = Math.floor(count / 2);
    const median = count % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
    
    const result: StatsResult = {
      min: Math.min(...validValues),
      max: Math.max(...validValues),
      avg,
      median,
      sum,
      count
    };
    
    // Cálculos opcionais
    if (calculateVariance || calculateStdDev) {
      // Calcular a variância
      const variance = validValues.reduce((acc, val) => 
        acc + Math.pow(val - avg, 2), 0) / count;
      
      if (calculateVariance) {
        result.variance = variance;
      }
      
      if (calculateStdDev) {
        result.stdDev = Math.sqrt(variance);
      }
    }
    
    return result;
  } catch (error) {
    logger.error('Erro ao calcular estatísticas:', error);
    return null;
  }
}

/**
 * Resultado do agrupamento por período
 */
export interface TimePeriodGroup<T> {
  /** Período (formato: YYYY-MM-DD ou YYYY-MM ou YYYY) */
  period: string;
  /** Número de itens no período */
  count: number;
  /** Soma dos valores (se valueField for fornecido) */
  total?: number;
  /** Itens no período */
  items: T[];
}

/**
 * Schema para opções de agrupamento por período
 */
export const timePeriodOptionsSchema = z.object({
  /** Tipo de agrupamento */
  groupBy: z.enum(['day', 'month', 'year', 'week', 'quarter']),
  /** Campo para soma de valores */
  valueField: z.string().optional(),
  /** Função para extrair valor a ser somado */
  valueExtractor: z.function()
    .args(z.any())
    .returns(z.number())
    .optional(),
  /** Formato de saída para o período */
  periodFormat: z.enum(['iso', 'br', 'timestamp']).optional().default('iso')
});

export type TimePeriodOptions = z.infer<typeof timePeriodOptionsSchema>;

/**
 * Agrupa valores por período de tempo
 * @param items Array de itens com data
 * @param dateField Nome do campo de data
 * @param options Opções de agrupamento
 * @returns Array de itens agrupados por período
 */
export function groupByTimePeriod<T extends Record<string, any>>(
  items: T[] | null | undefined,
  dateField: string,
  options: TimePeriodOptions
): TimePeriodGroup<T>[] {
  try {
    if (!items || !items.length) return [];
    
    const validatedOptions = timePeriodOptionsSchema.parse(options);
    const { 
      groupBy,
      valueField,
      valueExtractor,
      periodFormat
    } = validatedOptions;
    
    const result: Record<string, TimePeriodGroup<T>> = {};
    
    for (const item of items) {
      const dateValue = getNestedProperty(item, dateField);
      if (!dateValue) continue;
      
      const date = new Date(dateValue as string);
      if (isNaN(date.getTime())) continue;
      
      // Formatar chave do período
      let periodKey: string;
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      switch (groupBy) {
        case 'day':
          if (periodFormat === 'iso') {
            periodKey = `${year}-${String(month).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          } else if (periodFormat === 'br') {
            periodKey = `${String(date.getDate()).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
          } else {
            periodKey = String(date.getTime());
          }
          break;
          
        case 'month':
          if (periodFormat === 'iso') {
            periodKey = `${year}-${String(month).padStart(2, '0')}`;
          } else if (periodFormat === 'br') {
            periodKey = `${String(month).padStart(2, '0')}/${year}`;
          } else {
            // Primeiro dia do mês
            periodKey = String(new Date(year, month - 1, 1).getTime());
          }
          break;
          
        case 'year':
          periodKey = String(year);
          break;
          
        case 'week':
          // Calcular o primeiro dia da semana (domingo = 0)
          const dayOfWeek = date.getDay();
          const firstDayOfWeek = new Date(date);
          firstDayOfWeek.setDate(date.getDate() - dayOfWeek);
          
          if (periodFormat === 'iso') {
            periodKey = `${firstDayOfWeek.getFullYear()}-W${getWeekNumber(firstDayOfWeek)}`;
          } else if (periodFormat === 'br') {
            periodKey = `Semana ${getWeekNumber(firstDayOfWeek)}/${firstDayOfWeek.getFullYear()}`;
          } else {
            periodKey = String(firstDayOfWeek.getTime());
          }
          break;
          
        case 'quarter':
          const quarter = Math.floor((month - 1) / 3) + 1;
          
          if (periodFormat === 'iso') {
            periodKey = `${year}-Q${quarter}`;
          } else if (periodFormat === 'br') {
            periodKey = `${quarter}º Tri/${year}`;
          } else {
            // Primeiro dia do trimestre
            periodKey = String(new Date(year, (quarter - 1) * 3, 1).getTime());
          }
          break;
          
        default:
          if (periodFormat === 'iso') {
            periodKey = `${year}-${String(month).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          } else if (periodFormat === 'br') {
            periodKey = `${String(date.getDate()).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
          } else {
            periodKey = String(date.getTime());
          }
      }
      
      if (!result[periodKey]) {
        result[periodKey] = {
          period: periodKey,
          count: 0,
          items: []
        };
      }
      
      result[periodKey].count += 1;
      result[periodKey].items.push(item);
      
      // Processar campo de valor, se houver
      if (valueField || valueExtractor) {
        if (!result[periodKey].total) {
          result[periodKey].total = 0;
        }
        
        let value: number;
        
        if (valueExtractor) {
          try {
            value = valueExtractor(item);
          } catch (e) {
            value = 0;
          }
        } else if (valueField) {
          const rawValue = getNestedProperty(item, valueField, 0);
          value = typeof rawValue === 'number' 
            ? rawValue 
            : parseFloat(String(rawValue));
        } else {
          value = 0;
        }
        
        if (!isNaN(value)) {
          result[periodKey].total! += value;
        }
      }
    }
    
    // Converter para array e ordenar por período
    return Object.values(result).sort((a, b) => a.period.localeCompare(b.period));
  } catch (error) {
    logger.error('Erro ao agrupar por período:', error);
    return [];
  }
}

/**
 * Obtém o número da semana de uma data
 * @param date Data
 * @returns Número da semana
 */
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Ordena um array de objetos
 * @param array Array a ser ordenado
 * @param key Campo ou função para extração de chave
 * @param order Ordem de classificação
 * @returns Array ordenado
 */
export function sortBy<T>(
  array: T[] | null | undefined,
  key: keyof T | ((item: T) => string | number | Date | boolean | null | undefined),
  order: 'asc' | 'desc' = 'asc'
): T[] {
  if (!array || !array.length) return [];
  
  const sorted = [...array];
  
  sorted.sort((a, b) => {
    let valueA: any;
    let valueB: any;
    
    if (typeof key === 'function') {
      valueA = key(a);
      valueB = key(b);
    } else {
      valueA = a[key];
      valueB = b[key];
    }
    
    // Manipulação de nulos/undefined
    if (valueA === null || valueA === undefined) {
      return order === 'asc' ? -1 : 1;
    }
    if (valueB === null || valueB === undefined) {
      return order === 'asc' ? 1 : -1;
    }
    
    // Comparação por tipo
    if (valueA instanceof Date && valueB instanceof Date) {
      return order === 'asc' 
        ? valueA.getTime() - valueB.getTime() 
        : valueB.getTime() - valueA.getTime();
    }
    
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return order === 'asc' 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    }
    
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return order === 'asc' ? valueA - valueB : valueB - valueA;
    }
    
    if (typeof valueA === 'boolean' && typeof valueB === 'boolean') {
      return order === 'asc' 
        ? (valueA === valueB ? 0 : valueA ? 1 : -1) 
        : (valueA === valueB ? 0 : valueA ? -1 : 1);
    }
    
    // Comparação genérica para outros tipos
    const strA = String(valueA);
    const strB = String(valueB);
    
    return order === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
  });
  
  return sorted;
}

export default {
  groupBy,
  mapAndFilter,
  normalize,
  calculateStats,
  groupByTimePeriod,
  sortBy
};