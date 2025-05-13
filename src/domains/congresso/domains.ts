// src/domains/congresso/transformers/domains.ts
import { z } from 'zod';
import { parseApiDate } from '@/shared/utils/date/date-formatter';
import { senadorSchema, senadorDetalhadoSchema } from '@/domains/congresso/schemas/senado-schema';

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

/**
 * Normaliza dados do senador para o formato padronizado
 * @param data Dados brutos do senador
 * @returns Objeto Senador normalizado
 */
export function normalizeSenador(data: unknown): z.infer<typeof senadorSchema> {
  if (!data) {
    throw new Error('Dados do senador não fornecidos');
  }

  try {
    const rawData = data as Record<string, any>;
    const identificacao = rawData.IdentificacaoParlamentar || rawData;

    const senador = {
      id: (identificacao.CodigoParlamentar || '').toString(),
      nome: identificacao.NomeParlamentar || '',
      nomeCivil: identificacao.NomeCompletoParlamentar || '',
      sexo: identificacao.SexoParlamentar || '',
      formaTratamento: identificacao.FormaTratamento || '',
      urlFoto: identificacao.UrlFotoParlamentar || '',
      email: identificacao.EmailParlamentar || '',
      siglaPartido: identificacao.SiglaPartidoParlamentar || '',
      siglaUf: identificacao.UfParlamentar || '',
      emExercicio: true
    };

    // Validar com o schema
    return senadorSchema.parse(senador);
  } catch (error) {
    throw new Error(`Erro ao normalizar dados do senador: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Normaliza dados de matéria legislativa
 * @param data Dados brutos da matéria
 * @returns Objeto MateriaBase normalizado ou null
 */
export function normalizeMateria(data: unknown): MateriaBase | null {
  if (!data) return null;

  try {
    const rawData = data as Record<string, any>;
    
    const materia: MateriaBase = {
      id: rawData.CodigoMateria || '',
      sigla: rawData.SiglaMateria || '',
      numero: parseInt(rawData.NumeroMateria) || 0,
      ano: parseInt(rawData.AnoMateria) || 0,
      ementa: rawData.EmentaMateria || rawData.DescricaoIdentificacaoMateria || '',
      explicacao: rawData.ExplicacaoEmentaMateria || '',
      autor: rawData.AutorPrincipal?.NomeAutor || '',
      situacao: rawData.SituacaoAtual?.DescricaoSituacao || '',
      dataApresentacao: parseApiDate(rawData.DataApresentacao),
      ultimaAtualizacao: parseApiDate(rawData.DataUltimaAtualizacao)
    };

    // Validar com o schema
    return materiaBaseSchema.parse(materia);
  } catch (error) {
    console.error('Erro ao normalizar matéria:', error);
    return null;
  }
}

/**
 * Normaliza dados de votação
 * @param data Dados brutos da votação
 * @returns Objeto VotacaoBase normalizado ou null
 */
export function normalizeVotacao(data: unknown): VotacaoBase | null {
  if (!data) return null;

  try {
    const rawData = data as Record<string, any>;
    
    // Processar votos
    const votosRaw = Array.isArray(rawData.Votos?.Voto) 
      ? rawData.Votos.Voto 
      : rawData.Votos?.Voto 
        ? [rawData.Votos.Voto] 
        : [];

    const votos = votosRaw.map((voto: Record<string, any>) => ({
      senadorId: voto.IdentificacaoParlamentar?.CodigoParlamentar || '',
      voto: voto.DescricaoVoto || '',
      data: parseApiDate(voto.DataVoto)
    }));

    const votacao: VotacaoBase = {
      id: rawData.CodigoSessaoVotacao || '',
      data: parseApiDate(rawData.DataSessao),
      descricao: rawData.DescricaoVotacao || '',
      resultado: rawData.Resultado || '',
      votos,
      siglaMateria: rawData.SiglaMateria || '',
      numeroMateria: rawData.NumeroMateria || '',
      anoMateria: parseInt(rawData.AnoMateria) || 0
    };

    // Validar com o schema
    return votacaoBaseSchema.parse(votacao);
  } catch (error) {
    console.error('Erro ao normalizar votação:', error);
    return null;
  }
}

export default {
  normalizeSenador,
  normalizeMateria,
  normalizeVotacao
};