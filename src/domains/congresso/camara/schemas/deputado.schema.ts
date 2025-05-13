// src/domains/congresso/camara/schemas/deputado.schema.ts
import { z } from 'zod';

export const gabineteSchema = z.object({
  nome: z.string().optional(),
  predio: z.string().optional(),
  andar: z.string().optional(),
  sala: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email().optional(),
});

export const deputadoSchema = z.object({
  id: z.number(),
  nome: z.string(),
  siglaPartido: z.string(),
  siglaUf: z.string(),
  urlFoto: z.string().url().optional(),
  email: z.string().email().optional(),
});

export const deputadoDetalhadoSchema = deputadoSchema.extend({
  nomeCivil: z.string().optional(),
  dataNascimento: z.string().optional(),
  municipioNascimento: z.string().optional(),
  ufNascimento: z.string().optional(),
  escolaridade: z.string().optional(),
  situacao: z.string().optional(),
  condicaoEleitoral: z.string().optional(),
  gabinete: gabineteSchema.optional(),
  redesSociais: z.array(z.string()).optional(),
});

export const deputadoResponseSchema = z.object({
  dados: z.array(deputadoSchema),
  links: z.array(
    z.object({
      rel: z.string(),
      href: z.string(),
    })
  ),
});

export const deputadoDetalhadoResponseSchema = z.object({
  dados: deputadoDetalhadoSchema,
});

export type Deputado = z.infer<typeof deputadoSchema>;
export type DeputadoDetalhado = z.infer<typeof deputadoDetalhadoSchema>;