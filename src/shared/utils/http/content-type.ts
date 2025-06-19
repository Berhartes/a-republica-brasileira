// src/shared/utils/http/content-type.ts
import { z } from 'zod';

/**
 * Schema para tipos de conteúdo suportados
 */
export const contentTypeSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string())
]);

export type ContentType = z.infer<typeof contentTypeSchema>;

/**
 * Schema para cabeçalhos de resposta
 */
export const responseHeadersSchema = z.record(
  z.string(),
  contentTypeSchema
);

export type ResponseHeaders = z.infer<typeof responseHeadersSchema>;

/**
 * Verifica se o tipo de conteúdo é XML
 * @param contentType Tipo de conteúdo a ser verificado
 * @returns true se o conteúdo for XML
 */
export function isXmlContentType(contentType: ContentType): contentType is string {
  return typeof contentType === 'string' && 
    (contentType.includes('application/xml') || contentType.includes('text/xml'));
}

/**
 * Verifica se o tipo de conteúdo é JSON
 * @param contentType Tipo de conteúdo a ser verificado
 * @returns true se o conteúdo for JSON
 */
export function isJsonContentType(contentType: ContentType): contentType is string {
  return typeof contentType === 'string' && contentType.includes('application/json');
}

/**
 * Extrai o tipo de conteúdo dos cabeçalhos
 * @param headers Cabeçalhos HTTP
 * @returns Tipo de conteúdo ou 'application/json' como padrão
 */
export function getContentType(headers: Record<string, ContentType>): ContentType {
  const contentType = headers['content-type'] || headers['Content-Type'];
  return contentType || 'application/json';
}

/**
 * Valida e normaliza o tipo de conteúdo
 * @param contentType Tipo de conteúdo a ser validado
 * @returns Tipo de conteúdo normalizado
 */
export function validateContentType(contentType: ContentType): string {
  if (!contentType || typeof contentType !== 'string') {
    return 'application/json';
  }

  if (isXmlContentType(contentType)) {
    return 'application/xml';
  }

  if (isJsonContentType(contentType)) {
    return 'application/json';
  }

  return contentType;
}

export default {
  isXmlContentType,
  isJsonContentType,
  getContentType,
  validateContentType
};