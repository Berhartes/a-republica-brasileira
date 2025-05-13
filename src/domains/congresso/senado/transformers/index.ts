import { z } from 'zod';
import { 
  senadorSchema, 
  senadorDetalhadoSchema, 
  votacaoSchema, 
  materiaSchema,
  dateSchema
} from '../schemas';
import { 
  ValidationApiError, 
  ServerApiError 
} from '../errors';
export function parseApiDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  
  try {
    // Tentar converter para data
    const date = new Date(dateStr);
    
    // Verificar se é uma data válida
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date;
  } catch (error) {
    return null;
  }
}

/**
 * Normaliza dados do senador para o formato padronizado
 * @param data Dados brutos do senador
 * @returns Objeto Senador normalizado
 */
export function normalizeSenador(data: unknown) {
  if (!data) {
    throw new ValidationApiError(
      'Dados do senador não fornecidos',
      { data: ['Valor não pode ser nulo ou indefinido'] }
    );
  }

  try {
    const rawData = data as Record<string, any>;
    const identificacao = rawData.IdentificacaoParlamentar || rawData;

    const senador = {
      id: String(identificacao.CodigoParlamentar || ''),
      nome: identificacao.NomeParlamentar || '',
      nomeCivil: identificacao.NomeCompletoParlamentar || '',
      siglaPartido: identificacao.SiglaPartidoParlamentar || '',
      siglaUf: identificacao.UfParlamentar || '',
      urlFoto: identificacao.UrlFotoParlamentar || '',
      email: identificacao.EmailParlamentar || '',
      emExercicio: true
    };

    // Validar com o schema
    const result = senadorSchema.safeParse(senador);
    
    if (!result.success) {
      const errorFields: Record<string, string[]> = {};
      result.error.issues.forEach(issue => {
        const path = issue.path.join('.');
        if (!errorFields[path]) {
          errorFields[path] = [];
        }
        errorFields[path].push(issue.message);
      });
      
      throw new ValidationApiError(
        'Dados inválidos para senador',
        errorFields
      );
    }
    
    return result.data;
  } catch (error) {
    if (error instanceof ValidationApiError) {
      throw error;
    }
    
    throw new ServerApiError(
      'Erro ao normalizar dados do senador',
      error instanceof Error ? error.message : 'Erro desconhecido'
    );
  }
}

/**
 * Normaliza detalhes completos de senador
 * @param data Dados brutos do senador
 * @returns Objeto SenadorDetalhado normalizado
 */
export function normalizeSenadorDetalhado(data: unknown) {
  try {
    const rawData = data as Record<string, any>;
    const identificacao = rawData.IdentificacaoParlamentar || rawData;
    const dadosBasicos = rawData.DadosBasicosParlamentar || {};
    const mandatoAtual = rawData.Mandato || {};
    const comissoes = rawData.Comissoes?.Comissao || [];

    // Processar mandatos
    const mandatos = [{
      inicio: parseApiDate(mandatoAtual.DataInicio),
      fim: parseApiDate(mandatoAtual.DataFim),
      tipo: mandatoAtual.DescricaoParticipacao || 'Titular',
      descricao: mandatoAtual.DescricaoSituacao || 'Em exercício'
    }];

    // Processar comissões
    const comissoesNormalizadas = Array.isArray(comissoes) 
      ? comissoes.map((com: any) => {
          const dataInicio = parseApiDate(com.DataInicio);
          const dataFim = parseApiDate(com.DataFim);
          return {
            id: String(com.CodigoComissao || ''),
            sigla: com.SiglaComissao || '',
            nome: com.NomeComissao || '',
            cargo: com.DescricaoParticipacao || '',
            dataInicio, // Manter como null se for null
            dataFim // Manter como null se for null
          };
        })
      : [];

    const senadorDetalhado = {
      id: String(identificacao.CodigoParlamentar || ''),
      nome: identificacao.NomeParlamentar || '',
      nomeCivil: identificacao.NomeCompletoParlamentar || '',
      siglaPartido: identificacao.SiglaPartidoParlamentar || '',
      siglaUf: identificacao.UfParlamentar || '',
      urlFoto: identificacao.UrlFotoParlamentar || '',
      email: identificacao.EmailParlamentar || '',
      emExercicio: true,
      biografia: rawData.TextoBiografiaParlamentar || '',
      profissao: dadosBasicos.Profissao || '',
      dataNascimento: parseApiDate(dadosBasicos.DataNascimento),
      naturalidade: dadosBasicos.Naturalidade || '',
      ufNascimento: dadosBasicos.UfNaturalidade || '',
      mandatos,
      comissoes: comissoesNormalizadas,
      redes: {
        twitter: rawData.Twitter || '',
        facebook: rawData.Facebook || '',
        instagram: rawData.Instagram || '',
        site: rawData.Site || ''
      }
    };

    // Validar com o schema
    const result = senadorDetalhadoSchema.safeParse(senadorDetalhado);
    
    if (!result.success) {
      const errorFields: Record<string, string[]> = {};
      result.error.issues.forEach(issue => {
        const path = issue.path.join('.');
        if (!errorFields[path]) {
          errorFields[path] = [];
        }
        errorFields[path].push(issue.message);
      });
      
      throw new ValidationApiError(
        'Dados inválidos para senador detalhado',
        errorFields
      );
    }
    
    return result.data;
  } catch (error) {
    if (error instanceof ValidationApiError) {
      throw error;
    }
    
    throw new ServerApiError(
      'Erro ao normalizar dados detalhados do senador',
      error instanceof Error ? error.message : 'Erro desconhecido'
    );
  }
}

/**
 * Normaliza votação
 * @param data Dados brutos da votação
 * @returns Objeto Votacao normalizado
 */
export function normalizeVotacao(data: unknown) {
  try {
    const rawData = data as Record<string, any>;
    
    // Processar votos
    const votosRaw = Array.isArray(rawData.Votos?.Voto) 
      ? rawData.Votos.Voto 
      : rawData.Votos?.Voto 
        ? [rawData.Votos.Voto] 
        : [];

    const votos = votosRaw.map((voto: Record<string, any>) => ({
      senadorId: String(voto.IdentificacaoParlamentar?.CodigoParlamentar || ''),
      voto: voto.DescricaoVoto || '',
      data: parseApiDate(voto.DataVoto)
    }));

    const votacao = {
      id: String(rawData.CodigoSessaoVotacao || ''),
      data: parseApiDate(rawData.DataSessao) || new Date(),
      descricao: rawData.DescricaoVotacao || '',
      resultado: rawData.Resultado || '',
      votos,
      siglaMateria: rawData.SiglaMateria || '',
      numeroMateria: rawData.NumeroMateria || '',
      anoMateria: Number(rawData.AnoMateria) || 0
    };

    // Validar com o schema
    const result = votacaoSchema.safeParse(votacao);
    
    if (!result.success) {
      const errorFields: Record<string, string[]> = {};
      result.error.issues.forEach(issue => {
        const path = issue.path.join('.');
        if (!errorFields[path]) {
          errorFields[path] = [];
        }
        errorFields[path].push(issue.message);
      });
      
      throw new ValidationApiError(
        'Dados inválidos para votação',
        errorFields
      );
    }
    
    return result.data;
  } catch (error) {
    if (error instanceof ValidationApiError) {
      throw error;
    }
    
    throw new ServerApiError(
      'Erro ao normalizar votação',
      error instanceof Error ? error.message : 'Erro desconhecido'
    );
  }
}

/**
 * Normaliza matéria legislativa
 * @param data Dados brutos da matéria
 * @returns Objeto Materia normalizado
 */
export function normalizeMateria(data: unknown) {
  try {
    const rawData = data as Record<string, any>;
    
    const materia = {
      id: String(rawData.CodigoMateria || ''),
      sigla: rawData.SiglaMateria || '',
      numero: Number(rawData.NumeroMateria) || 0,
      ano: Number(rawData.AnoMateria) || 0,
      ementa: rawData.EmentaMateria || rawData.DescricaoIdentificacaoMateria || '',
      explicacao: rawData.ExplicacaoEmentaMateria || '',
      autor: rawData.AutorPrincipal?.NomeAutor || '',
      situacao: rawData.SituacaoAtual?.DescricaoSituacao || '',
      dataApresentacao: parseApiDate(rawData.DataApresentacao),
      ultimaAtualizacao: parseApiDate(rawData.DataUltimaAtualizacao)
    };

    // Validar com o schema
    const result = materiaSchema.safeParse(materia);
    
    if (!result.success) {
      const errorFields: Record<string, string[]> = {};
      result.error.issues.forEach(issue => {
        const path = issue.path.join('.');
        if (!errorFields[path]) {
          errorFields[path] = [];
        }
        errorFields[path].push(issue.message);
      });
      
      throw new ValidationApiError(
        'Dados inválidos para matéria',
        errorFields
      );
    }
    
    return result.data;
  } catch (error) {
    if (error instanceof ValidationApiError) {
      throw error;
    }
    
    throw new ServerApiError(
      'Erro ao normalizar matéria',
      error instanceof Error ? error.message : 'Erro desconhecido'
    );
  }
}

/**
 * Formata data para o formato da API
 * @param date Data a ser formatada
 * @returns String no formato YYYY-MM-DD
 */
export function formatDateToApi(date?: Date | string | null): string | undefined {
  if (!date) return undefined;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return undefined;
  }
  
  return dateObj.toISOString().split('T')[0];
}
