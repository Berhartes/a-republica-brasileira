// src/shared/utils/strings/string-utils.ts
import { z } from 'zod';
import { logger } from '@/core/monitoring';

/**
 * Remove acentos de uma string
 * @param text Texto a ser processado
 * @returns Texto sem acentos
 */
export function removeAccents(text: string | null | undefined): string {
  if (!text) return '';
  
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Schema para opções de formatação de nomes
 */
export const nameFormatOptionsSchema = z.object({
  /** Lista de palavras a não capitalizar (exceto primeira) */
  lowerCaseWords: z.array(z.string()).default([
    'de', 'da', 'do', 'das', 'dos', 'e', 'o', 'a', 'os', 'as'
  ]),
  /** Converter para lowercase antes de formatar */
  lowercase: z.boolean().default(true)
});

export type NameFormatOptions = z.infer<typeof nameFormatOptionsSchema>;

/**
 * Formata um nome para título (primeira letra de cada palavra em maiúscula)
 * @param name Nome a ser formatado
 * @param options Opções de formatação
 * @returns Nome formatado
 */
export function formatName(
  name: string | null | undefined, 
  options: Partial<NameFormatOptions> = {}
): string {
  if (!name) return '';
  
  try {
    const validatedOptions = nameFormatOptionsSchema.parse(options);
    const { lowerCaseWords, lowercase } = validatedOptions;
    
    // Processar o texto conforme as opções
    const parts = (lowercase ? name.toLowerCase() : name).split(' ');
    
    return parts
      .map((part, index) => {
        // Se for uma palavra a não capitalizar e não for a primeira
        if (index > 0 && part.length <= 3 && lowerCaseWords.includes(part)) {
          return part;
        }
        
        // Capitalizar a palavra
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(' ');
  } catch (error) {
    logger.error('Erro ao formatar nome:', error);
    return name;
  }
}

/**
 * Schema para opções de truncamento de texto
 */
export const truncateOptionsSchema = z.object({
  /** Tamanho máximo do texto */
  maxLength: z.number().int().positive(),
  /** Sufixo a ser adicionado */
  suffix: z.string().default('...'),
  /** Adicionar sufixo apenas se o texto for truncado */
  suffixOnlyIfTruncated: z.boolean().default(true)
});

export type TruncateOptions = z.infer<typeof truncateOptionsSchema>;

/**
 * Trunca um texto para o tamanho especificado
 * @param text Texto a ser truncado
 * @param maxLengthOrOptions Tamanho máximo ou opções completas
 * @param suffix Sufixo a ser adicionado (padrão: "...")
 * @returns Texto truncado
 */
export function truncate(
  text: string | null | undefined, 
  maxLengthOrOptions: number | Partial<TruncateOptions>,
  suffix: string = '...'
): string {
  if (!text) return '';
  
  try {
    // Processar as opções
    let options: TruncateOptions;
    
    if (typeof maxLengthOrOptions === 'number') {
      options = {
        maxLength: maxLengthOrOptions,
        suffix,
        suffixOnlyIfTruncated: true
      };
    } else {
      options = {
        ...truncateOptionsSchema.parse(maxLengthOrOptions),
        suffix: maxLengthOrOptions.suffix ?? suffix
      };
    }
    
    const { maxLength, suffix: finalSuffix, suffixOnlyIfTruncated } = options;
    
    // Não truncar se o tamanho for suficiente
    if (text.length <= maxLength) {
      return suffixOnlyIfTruncated ? text : text + finalSuffix;
    }
    
    return text.substring(0, maxLength - finalSuffix.length) + finalSuffix;
  } catch (error) {
    logger.error('Erro ao truncar texto:', error);
    return text;
  }
}

/**
 * Schema para opções de geração de slug
 */
export const slugifyOptionsSchema = z.object({
  /** Converter para minúsculas */
  lowercase: z.boolean().default(true),
  /** Remover espaços no início e fim */
  trim: z.boolean().default(true),
  /** Caractere para substituir espaços */
  replacement: z.string().default('-'),
  /** Remover caracteres especiais */
  removeSpecialChars: z.boolean().default(true)
});

export type SlugifyOptions = z.infer<typeof slugifyOptionsSchema>;

/**
 * Converte uma string para slug (URL amigável)
 * @param text Texto a ser convertido
 * @param options Opções de configuração
 * @returns Slug gerado
 */
export function slugify(
  text: string | null | undefined,
  options: Partial<SlugifyOptions> = {}
): string {
  if (!text) return '';
  
  try {
    const validatedOptions = slugifyOptionsSchema.parse(options);
    const { lowercase, trim, replacement, removeSpecialChars } = validatedOptions;
    
    let slug = removeAccents(text);
    
    if (lowercase) {
      slug = slug.toLowerCase();
    }
    
    if (trim) {
      slug = slug.trim();
    }
    
    if (removeSpecialChars) {
      slug = slug.replace(/[^\w\s-]/g, '');
    }
    
    slug = slug.replace(/\s+/g, replacement);  // Substitui espaços por hífens
    slug = slug.replace(new RegExp(`${replacement}+`, 'g'), replacement);  // Remove hífens duplicados
    
    return slug;
  } catch (error) {
    logger.error('Erro ao gerar slug:', error);
    return removeAccents(text).replace(/\s+/g, '-').toLowerCase();
  }
}

/**
 * Extrai o primeiro nome de um nome completo
 * @param fullName Nome completo
 * @returns Primeiro nome
 */
export function getFirstName(fullName: string | null | undefined): string {
  if (!fullName) return '';
  
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || '';
}

/**
 * Schema para opções de formatação de moeda
 */
export const currencyFormatOptionsSchema = z.object({
  /** Código da moeda */
  currency: z.string().default('BRL'),
  /** Locale para formatação */
  locale: z.string().default('pt-BR'),
  /** Mostrar símbolo da moeda */
  symbol: z.boolean().default(true),
  /** Número de casas decimais */
  decimals: z.number().int().min(0).max(20).default(2)
});

export type CurrencyFormatOptions = z.infer<typeof currencyFormatOptionsSchema>;

/**
 * Formata um valor monetário
 * @param value Valor a ser formatado
 * @param optionsOrCurrency Opções de formatação ou código da moeda
 * @param locale Locale para formatação
 * @returns Valor formatado como moeda
 */
export function formatCurrency(
  value: number | string | null | undefined,
  optionsOrCurrency: Partial<CurrencyFormatOptions> | string = {},
  locale?: string
): string {
  try {
    // Valor padrão para valor inválido
    const fallbackValue = 'R$ 0,00';
    
    if (value === null || value === undefined) {
      return fallbackValue;
    }
    
    // Converter para número
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) {
      return fallbackValue;
    }
    
    // Processar opções
    let options: CurrencyFormatOptions;
    
    if (typeof optionsOrCurrency === 'string') {
      options = {
        currency: optionsOrCurrency,
        locale: locale || 'pt-BR',
        symbol: true,
        decimals: 2
      };
    } else {
      options = currencyFormatOptionsSchema.parse({
        ...optionsOrCurrency,
        locale: optionsOrCurrency.locale || locale || 'pt-BR'
      });
    }
    
    // Formatar o valor
    return new Intl.NumberFormat(options.locale, {
      style: options.symbol ? 'currency' : 'decimal',
      currency: options.currency,
      minimumFractionDigits: options.decimals,
      maximumFractionDigits: options.decimals
    }).format(numValue);
  } catch (error) {
    logger.error(`Erro ao formatar valor monetário: ${value}`, error);
    return typeof value === 'number' || typeof value === 'string' 
      ? `R$ ${value}` 
      : 'R$ 0,00';
  }
}

/**
 * Schema para opções de formatação de números
 */
export const numberFormatOptionsSchema = z.object({
  /** Locale para formatação */
  locale: z.string().default('pt-BR'),
  /** Número de casas decimais */
  decimals: z.number().int().min(0).max(20).optional(),
  /** Mostrar separador de milhares */
  useGrouping: z.boolean().default(true)
});

export type NumberFormatOptions = z.infer<typeof numberFormatOptionsSchema>;

/**
 * Formata um número com separadores de milhar
 * @param value Valor a ser formatado
 * @param optionsOrLocale Opções de formatação ou locale
 * @returns Número formatado
 */
export function formatNumber(
  value: number | string | null | undefined,
  optionsOrLocale: Partial<NumberFormatOptions> | string = {}
): string {
  try {
    if (value === null || value === undefined) {
      return '0';
    }
    
    // Converter para número
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) {
      return '0';
    }
    
    // Processar opções
    let options: NumberFormatOptions;
    
    if (typeof optionsOrLocale === 'string') {
      options = { 
        locale: optionsOrLocale,
        useGrouping: true
      };
    } else {
      options = numberFormatOptionsSchema.parse(optionsOrLocale);
    }
    
    // Formatar o número
    return new Intl.NumberFormat(options.locale, {
      minimumFractionDigits: options.decimals,
      maximumFractionDigits: options.decimals,
      useGrouping: options.useGrouping
    }).format(numValue);
  } catch (error) {
    logger.error(`Erro ao formatar número: ${value}`, error);
    return String(value || 0);
  }
}

/**
 * Formata um CPF
 * @param cpf Número do CPF
 * @returns CPF formatado (###.###.###-##)
 */
export function formatCPF(cpf: string | null | undefined): string {
  try {
    if (!cpf) return '';
    
    // Remove caracteres não numéricos
    const numbers = cpf.replace(/\D/g, '');
    
    if (numbers.length !== 11) {
      return cpf;
    }
    
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } catch (error) {
    logger.error(`Erro ao formatar CPF: ${cpf}`, error);
    return cpf || '';
  }
}

/**
 * Formata um CNPJ
 * @param cnpj Número do CNPJ
 * @returns CNPJ formatado (##.###.###/####-##)
 */
export function formatCNPJ(cnpj: string | null | undefined): string {
  try {
    if (!cnpj) return '';
    
    // Remove caracteres não numéricos
    const numbers = cnpj.replace(/\D/g, '');
    
    if (numbers.length !== 14) {
      return cnpj;
    }
    
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  } catch (error) {
    logger.error(`Erro ao formatar CNPJ: ${cnpj}`, error);
    return cnpj || '';
  }
}

/**
 * Schema para opções de busca de texto
 */
export const textSearchOptionsSchema = z.object({
  /** Ignorar acentos */
  ignoreAccents: z.boolean().default(true),
  /** Ignorar maiúsculas/minúsculas */
  ignoreCase: z.boolean().default(true),
  /** Busca exata (palavra completa) */
  exactMatch: z.boolean().default(false)
});

export type TextSearchOptions = z.infer<typeof textSearchOptionsSchema>;

/**
 * Verifica se uma string contém determinado termo
 * @param text Texto a ser verificado
 * @param searchTerm Termo de busca
 * @param options Opções de busca
 * @returns true se contém o termo
 */
export function contains(
  text: string | null | undefined, 
  searchTerm: string | null | undefined,
  options: Partial<TextSearchOptions> = {}
): boolean {
  if (!text || !searchTerm) return false;
  
  try {
    const validatedOptions = textSearchOptionsSchema.parse(options);
    const { ignoreAccents, ignoreCase, exactMatch } = validatedOptions;
    
    let normalizedText = text;
    let normalizedTerm = searchTerm;
    
    if (ignoreAccents) {
      normalizedText = removeAccents(normalizedText);
      normalizedTerm = removeAccents(normalizedTerm);
    }
    
    if (ignoreCase) {
      normalizedText = normalizedText.toLowerCase();
      normalizedTerm = normalizedTerm.toLowerCase();
    }
    
    if (exactMatch) {
      const regex = new RegExp(`\\b${normalizedTerm}\\b`, 'g');
      return regex.test(normalizedText);
    }
    
    return normalizedText.includes(normalizedTerm);
  } catch (error) {
    logger.error('Erro ao verificar conteúdo de texto:', error);
    return text.includes(searchTerm);
  }
}

export default {
  removeAccents,
  formatName,
  truncate,
  slugify,
  getFirstName,
  formatCurrency,
  formatNumber,
  formatCPF,
  formatCNPJ,
  contains
};