// src/domains/congresso/schemas/senado-schema.ts
import { z } from 'zod';

/**
 * Schema para senador
 */
export const senadorSchema = z.object({
  id: z.string(),
  nome: z.string(),
  nomeCivil: z.string().optional(),
  sexo: z.string().optional(),
  formaTratamento: z.string().optional(),
  urlFoto: z.string().optional(),
  email: z.string().optional(),
  siglaPartido: z.string(),
  siglaUf: z.string(),
  emExercicio: z.boolean().default(true)
});

/**
 * Tipo do senador
 */
export type Senador = z.infer<typeof senadorSchema>;

/**
 * Schema para mandato de senador
 */
export const mandatoSchema = z.object({
  inicio: z.date(),
  fim: z.date().optional(),
  tipo: z.string(),
  suplentes: z.array(z.object({
    id: z.string(),
    nome: z.string(),
    grau: z.number().or(z.string()),
    urlFoto: z.string().optional()
  })).optional(),
  afastamentos: z.array(z.object({
    dataInicio: z.date(),
    dataFim: z.date().optional(),
    motivo: z.string()
  })).optional()
});

/**
 * Tipo do mandato
 */
export type Mandato = z.infer<typeof mandatoSchema>;

/**
 * Schema para comissão
 */
export const comissaoSchema = z.object({
  id: z.string(),
  sigla: z.string(),
  nome: z.string(),
  cargo: z.string(),
  dataInicio: z.date().optional(),
  dataFim: z.date().optional()
});

/**
 * Tipo da comissão
 */
export type Comissao = z.infer<typeof comissaoSchema>;

/**
 * Schema para senador detalhado
 */
export const senadorDetalhadoSchema = senadorSchema.extend({
  mandatos: z.array(mandatoSchema),
  comissoes: z.array(comissaoSchema).optional(),
  biografia: z.string().optional(),
  profissao: z.string().optional(),
  dataNascimento: z.date().optional(),
  naturalidade: z.string().optional(),
  redes: z.object({
    twitter: z.string().optional(),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    site: z.string().optional()
  }).optional()
});

/**
 * Tipo de senador detalhado
 */
export type SenadorDetalhado = z.infer<typeof senadorDetalhadoSchema>;

/**
 * Schema para resposta de senador
 */
export const senadorResponseSchema = z.object({
  data: senadorSchema,
  success: z.boolean(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown()
  }).optional()
});

/**
 * Tipo de resposta de senador
 */
export type SenadorResponse = z.infer<typeof senadorResponseSchema>;

/**
 * Schema para resposta de senador detalhado
 */
export const senadorDetalhadoResponseSchema = z.object({
  data: senadorDetalhadoSchema,
  success: z.boolean(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown()
  }).optional()
});

/**
 * Tipo de resposta de senador detalhado
 */
export type SenadorDetalhadoResponse = z.infer<typeof senadorDetalhadoResponseSchema>;

/**
 * Schema para resposta de lista de senadores
 */
export const senadoresResponseSchema = z.object({
  data: z.array(senadorSchema),
  success: z.boolean(),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number()
  }).optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown()
  }).optional()
});

/**
 * Tipo de resposta de lista de senadores
 */
export type SenadoresResponse = z.infer<typeof senadoresResponseSchema>;
