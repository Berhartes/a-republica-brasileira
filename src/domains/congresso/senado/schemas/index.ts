import { z } from 'zod';

/**
 * Schema base para datas
 */
export const dateSchema = z.preprocess(
  (arg) => {
    if (arg === null || arg === undefined) return undefined;
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
    return arg;
  },
  z.date().optional().nullable()
);

/**
 * Schema de senador
 */
export const senadorSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nome: z.string().min(1),
  nomeCivil: z.string().min(1).optional(),
  siglaPartido: z.string().min(1),
  siglaUf: z.string().length(2),
  urlFoto: z.string().url().optional(),
  email: z.string().email().optional(),
  emExercicio: z.boolean().default(true),
});

export type SenadorSchema = z.infer<typeof senadorSchema>;

/**
 * Schema de mandato
 */
export const mandatoSchema = z.object({
  inicio: dateSchema.pipe(z.date()),
  fim: dateSchema.nullable(),
  tipo: z.string(),
  descricao: z.string(),
  suplentes: z.array(z.object({
    id: z.string(),
    nome: z.string(),
    grau: z.union([z.number(), z.string()]),
    urlFoto: z.string().url().optional()
  })).optional(),
  afastamentos: z.array(z.object({
    dataInicio: dateSchema.pipe(z.date()),
    dataFim: dateSchema.nullable(),
    motivo: z.string()
  })).optional()
});

export type MandatoSchema = z.infer<typeof mandatoSchema>;

/**
 * Schema de comissão
 */
export const comissaoSchema = z.object({
  id: z.string(),
  sigla: z.string(),
  nome: z.string(),
  cargo: z.string(),
  dataInicio: dateSchema.nullable(),
  dataFim: dateSchema.nullable()
});

export type ComissaoSchema = z.infer<typeof comissaoSchema>;

/**
 * Schema de senador detalhado
 */
export const senadorDetalhadoSchema = senadorSchema.extend({
  mandatos: z.array(mandatoSchema),
  comissoes: z.array(comissaoSchema).optional(),
  biografia: z.string().optional(),
  profissao: z.string().optional(),
  dataNascimento: dateSchema.nullable(),
  naturalidade: z.string().optional(),
  ufNascimento: z.string().length(2).optional(),
  redes: z.object({
    twitter: z.string().url().optional(),
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional(),
    site: z.string().url().optional()
  }).optional()
});

export type SenadorDetalhadoSchema = z.infer<typeof senadorDetalhadoSchema>;

/**
 * Schema de voto
 */
export const votoSchema = z.object({
  senadorId: z.string(),
  voto: z.string(),
  data: dateSchema
});

export type VotoSchema = z.infer<typeof votoSchema>;

/**
 * Schema de votação
 */
export const votacaoSchema = z.object({
  id: z.string(),
  data: dateSchema.pipe(z.date()),
  descricao: z.string(),
  resultado: z.string(),
  siglaMateria: z.string().optional(),
  numeroMateria: z.string().optional(),
  anoMateria: z.number().optional(),
  votos: z.array(votoSchema)
});

export type VotacaoSchema = z.infer<typeof votacaoSchema>;

/**
 * Schema de matéria
 */
export const materiaSchema = z.object({
  id: z.string(),
  sigla: z.string(),
  numero: z.number(),
  ano: z.number(),
  ementa: z.string(),
  explicacao: z.string().optional(),
  autor: z.string().optional(),
  situacao: z.string().optional(),
  dataApresentacao: dateSchema,
  ultimaAtualizacao: dateSchema,
  tramitacoes: z.array(z.object({
    data: dateSchema.pipe(z.date()),
    local: z.string(),
    status: z.string(),
    descricao: z.string()
  })).optional()
});

export type MateriaSchema = z.infer<typeof materiaSchema>;

/**
 * Schema de despesa
 */
export const despesaSchema = z.object({
  id: z.string(),
  ano: z.number(),
  mes: z.number(),
  tipo: z.string(),
  valor: z.number(),
  fornecedor: z.string().optional(),
  descricao: z.string().optional(),
  dataDocumento: dateSchema,
  urlDocumento: z.string().url().optional(),
  senadorId: z.string()
});

export type DespesaSchema = z.infer<typeof despesaSchema>;

/**
 * Schema de presença
 */
export const presencaSchema = z.object({
  id: z.string(),
  senadorId: z.string(),
  data: dateSchema.pipe(z.date()),
  tipo: z.enum(['sessao', 'comissao']),
  presente: z.boolean(),
  justificativa: z.string().optional(),
  sessaoId: z.string().optional(),
  comissaoId: z.string().optional()
});

export type PresencaSchema = z.infer<typeof presencaSchema>;

/**
 * Schemas para parâmetros de API
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});

export const getSenadoresParamsSchema = z.object({
  uf: z.string().length(2).optional(),
  partido: z.string().optional(),
  emExercicio: z.boolean().optional(),
}).merge(paginationSchema);

export const getVotacoesParamsSchema = z.object({
  senadorId: z.string().optional(),
  dataInicio: z.union([z.string(), z.date()]).optional(),
  dataFim: z.union([z.string(), z.date()]).optional(),
  siglaMateria: z.string().optional(),
}).merge(paginationSchema);

export const getMateriasParamsSchema = z.object({
  senadorId: z.string().optional(),
  dataInicio: z.union([z.string(), z.date()]).optional(),
  dataFim: z.union([z.string(), z.date()]).optional(),
  tipo: z.string().optional(),
  situacao: z.string().optional(),
}).merge(paginationSchema);

export const getDespesasParamsSchema = z.object({
  senadorId: z.string(),
  ano: z.number().int().optional(),
  mes: z.number().int().min(1).max(12).optional(),
  tipo: z.string().optional(),
}).merge(paginationSchema);

/**
 * Schemas para respostas de API
 */
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown(),
  error: z.object({
    message: z.string(),
    code: z.string(),
    status: z.number(),
    details: z.unknown().optional()
  }).optional()
});

export const paginatedResponseSchema = z.object({
  data: z.array(z.unknown()),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number()
  })
});

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: {
    message: string;
    code: string;
    status: number;
    details?: unknown;
  };
};

export type PaginatedApiResponse<T> = ApiResponse<T[]> & {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};