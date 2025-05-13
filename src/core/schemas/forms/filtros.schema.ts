/**
 * @file Schema de validação para filtros de busca
 */

import { z } from 'zod';

// Re-export dos filtros da aplicação
export * from '@/app/config/schemas/filtros';

// Schema para filtros de busca avançada
export const buscaAvancadaSchema = z.object({
  // Filtros gerais
  termo: z.string().min(1).optional(),
  dataInicio: z.string().or(z.date()).optional(),
  dataFim: z.string().or(z.date()).optional(),
  
  // Filtros específicos de domínio
  entidade: z.enum(['senador', 'deputado', 'proposicao', 'votacao', 'despesa', 'todos'])
    .default('todos'),
  
  estado: z.string().length(2).optional(),
  partido: z.string().optional(),
  
  // Critérios de votações
  tipoVotacao: z.enum(['nominal', 'simbolica', 'secreta', 'todas'])
    .default('todas')
    .optional(),
  
  // Filtros de proposição
  tipoProposicao: z.string().optional(),
  situacaoProposicao: z.string().optional(),
  materiaId: z.string().optional(),
  
  // Paginação
  pagina: z.number().int().positive().default(1),
  itensPorPagina: z.number().int().positive().max(100).default(20)
}).refine(
  (data) => {
    if (data.dataInicio && data.dataFim) {
      return new Date(data.dataInicio) <= new Date(data.dataFim);
    }
    return true;
  },
  {
    message: 'A data final deve ser posterior à data inicial',
    path: ['dataFim']
  }
);

// Tipos inferidos
export type BuscaAvancada = z.infer<typeof buscaAvancadaSchema>;
