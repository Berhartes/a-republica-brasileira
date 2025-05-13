// src/domains/congresso/camara/schemas/despesa.schema.ts
import { z } from 'zod';

export const despesaSchema = z.object({
  id: z.number(),
  ano: z.number(),
  mes: z.number(),
  tipoDespesa: z.string(),
  codDocumento: z.string(),
  tipoDocumento: z.string(),
  dataDocumento: z.string(),
  numDocumento: z.string(),
  valorDocumento: z.number(),
  nomeFornecedor: z.string(),
  cnpjCpfFornecedor: z.string(),
  valorLiquido: z.number(),
  urlDocumento: z.string().url().optional(),
  numRessarcimento: z.string().optional(),
  codLote: z.number().optional(),
  parcela: z.number().optional(),
});

export const despesaResponseSchema = z.object({
  dados: z.array(despesaSchema),
  links: z.array(
    z.object({
      rel: z.string(),
      href: z.string(),
    })
  ),
});

export type Despesa = z.infer<typeof despesaSchema>;