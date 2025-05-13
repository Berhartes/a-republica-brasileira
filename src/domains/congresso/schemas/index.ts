// src/domains/congresso/schemas/index.ts
import { z } from 'zod';

/**
 * Schema base para matéria legislativa
 */
export const materiaBaseSchema = z.object({
  id: z.string(),
  sigla: z.string(),
  numero: z.number(),
  ano: z.number(),
  ementa: z.string(),
  explicacao: z.string().optional(),
  autor: z.string().optional(),
  situacao: z.string().optional(),
  dataApresentacao: z.date().nullable().optional(),
  ultimaAtualizacao: z.date().nullable().optional()
});

export type MateriaBase = z.infer<typeof materiaBaseSchema>;

/**
 * Schema base para voto
 */
export const votoBaseSchema = z.object({
  senadorId: z.string(),
  voto: z.string(),
  data: z.date().nullable()
});

export type VotoBase = z.infer<typeof votoBaseSchema>;

/**
 * Schema base para votação
 */
export const votacaoBaseSchema = z.object({
  id: z.string(),
  data: z.date().nullable(),
  descricao: z.string(),
  resultado: z.string().optional(),
  votos: z.array(votoBaseSchema),
  siglaMateria: z.string().optional(),
  numeroMateria: z.string().optional(),
  anoMateria: z.number().optional()
});

export type VotacaoBase = z.infer<typeof votacaoBaseSchema>;