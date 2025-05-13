/**
 * Transformador para dados de Senadores em Exercício
 */
import { logger } from '../utils/logger';

// Interfaces para a estrutura de dados
interface ResultadoExtracao {
  timestamp: string;
  origem: string;
  senadores: any[];
  metadados: any;
  erro?: string;
}

// Interfaces para as estruturas internas
interface Telefone {
  NumeroTelefone: string;
  OrdemPublicacao: string;
  IndicadorFax: string;
}

interface Exercicio {
  CodigoExercicio: string | number;
  DataInicio: string | null;
  DataFim: string | null;
  SiglaCausaAfastamento?: string | null;
  DescricaoCausaAfastamento?: string | null;
}

interface Suplente {
  DescricaoParticipacao: string;
  CodigoParlamentar: string | number;
  NomeParlamentar: string;
}

// Interface para senador transformado
export interface SenadorTransformado {
  codigo: string | number;
  codigoPublico?: string;
  nome: string;
  nomeCompleto: string;
  genero: string;
  foto?: string;
  paginaOficial?: string;
  paginaParticular?: string | null;
  email?: string;
  partido: {
    sigla: string;
    nome: string | null;
  };
  uf: string;
  bloco: {
    codigo: string | number;
    nome: string;
    apelido?: string;
    dataCriacao?: string | null;
  } | null;
  telefones: Array<{
    numero: string;
    tipo: string;
    ordem: number;
  }>;
  situacao: {
    exercicio: Array<{
      codigo: string | number;
      dataInicio: string | null;
      dataFim: string | null;
      causaAfastamento: string | null;
      descricaoCausaAfastamento: string | null;
    }>;
    afastado: boolean;
    titular: boolean;
    suplente: boolean;
    cargoMesa: boolean;
    cargoLideranca: boolean;
  };
  mandatoAtual: {
    codigo: string | number;
    uf: string;
    participacao: string;
    primeiraLegislatura: {
      numero: string | number;
      dataInicio: string | null;
      dataFim: string | null;
    } | null;
    segundaLegislatura: {
      numero: string | number;
      dataInicio: string | null;
      dataFim: string | null;
    } | null;
    suplentes: Array<{
      participacao: string;
      codigo: string | number;
      nome: string;
    }>;
    titular: {
      participacao: string;
      codigo: string | number;
      nome: string;
    } | null;
  } | null;
  atualizadoEm: string;
}

// Interface para o resultado da transformação
export interface ResultadoTransformacao {
  timestamp: string;
  senadores: SenadorTransformado[];
  metadados: any;
}

/**
 * Classe para transformação de dados de senadores em exercício
 */
export class SenadoresTransformer {
  /**
   * Transforma os dados de senadores para formato otimizado
   */
  transformSenadoresAtuais(extractionResult: ResultadoExtracao): ResultadoTransformacao {
    logger.info('Transformando dados de senadores em exercício');
    
    const { senadores, metadados } = extractionResult;
    
    // Verificar se temos dados para transformar
    if (!senadores || !Array.isArray(senadores) || senadores.length === 0) {
      logger.warn('Nenhum senador para transformar');
      return {
        timestamp: new Date().toISOString(),
        senadores: [],
        metadados: metadados || {}
      };
    }
    
    // Transformar cada senador
    const senadoresTransformados = senadores
      .map(senador => this.transformSenadorBasico(senador))
      .filter(Boolean) as SenadorTransformado[];
    
    logger.info(`Transformados ${senadoresTransformados.length} senadores`);
    
    return {
      timestamp: new Date().toISOString(),
      senadores: senadoresTransformados,
      metadados: metadados || {}
    };
  }
  
  /**
   * Transforma dados básicos de um senador
   */
  private transformSenadorBasico(senador: any): SenadorTransformado | null {
    if (!senador || !senador.IdentificacaoParlamentar) {
      logger.warn('Dados incompletos de senador para transformação básica');
      return null;
    }
    
    const identificacao = senador.IdentificacaoParlamentar;
    const mandato = senador.Mandato || {};
    
    // Extrair dados principais
    const senadorTransformado: SenadorTransformado = {
      codigo: identificacao.CodigoParlamentar,
      codigoPublico: identificacao.CodigoPublicoNaLegAtual || '',
      nome: identificacao.NomeParlamentar || '',
      nomeCompleto: identificacao.NomeCompletoParlamentar || identificacao.NomeParlamentar || '',
      genero: identificacao.SexoParlamentar || '',
      foto: identificacao.UrlFotoParlamentar || '',
      paginaOficial: identificacao.UrlPaginaParlamentar || '',
      paginaParticular: identificacao.UrlPaginaParticular || null,
      email: identificacao.EmailParlamentar || '',
      partido: {
        sigla: identificacao.SiglaPartidoParlamentar || '',
        nome: null // Seria preenchido com dados detalhados
      },
      uf: identificacao.UfParlamentar || '',
      bloco: identificacao.Bloco ? {
        codigo: identificacao.Bloco.CodigoBloco || '',
        nome: identificacao.Bloco.NomeBloco || '',
        apelido: identificacao.Bloco.NomeApelido || '',
        dataCriacao: identificacao.Bloco.DataCriacao || null
      } : null,
      telefones: this.transformTelefones(identificacao.Telefones),
      situacao: {
        exercicio: mandato && mandato.Exercicios ? this.transformExercicios(mandato.Exercicios) : [],
        afastado: false, // Será atualizado com base nos exercícios
        titular: !mandato.DescricaoParticipacao || mandato.DescricaoParticipacao === 'Titular',
        suplente: mandato.DescricaoParticipacao && mandato.DescricaoParticipacao.includes('Suplente'),
        cargoMesa: identificacao.MembroMesa === 'Sim',
        cargoLideranca: identificacao.MembroLideranca === 'Sim'
      },
      mandatoAtual: this.transformMandatoBasico(mandato),
      atualizadoEm: new Date().toISOString()
    };
    
    // Verifica se está afastado
    if (senadorTransformado.situacao.exercicio.length > 0) {
      const ultimoExercicio = senadorTransformado.situacao.exercicio[0];
      senadorTransformado.situacao.afastado = ultimoExercicio.dataFim !== null;
    }
    
    return senadorTransformado;
  }
  
  /**
   * Transforma telefones em formato padronizado
   */
  private transformTelefones(telefones: any): Array<{numero: string; tipo: string; ordem: number}> {
    if (!telefones || !telefones.Telefone) {
      return [];
    }
    
    const telefonesArray = Array.isArray(telefones.Telefone) 
      ? telefones.Telefone 
      : [telefones.Telefone];
    
    return telefonesArray.map((tel: Telefone) => ({
      numero: tel.NumeroTelefone || '',
      tipo: tel.IndicadorFax === 'Sim' ? 'Fax' : 'Telefone',
      ordem: parseInt(tel.OrdemPublicacao || '0', 10)
    }));
  }
  
  /**
   * Transforma exercícios do mandato
   */
  private transformExercicios(exercicios: any): Array<{
    codigo: string | number;
    dataInicio: string | null;
    dataFim: string | null;
    causaAfastamento: string | null;
    descricaoCausaAfastamento: string | null;
  }> {
    if (!exercicios || !exercicios.Exercicio) {
      return [];
    }
    
    const exerciciosArray = Array.isArray(exercicios.Exercicio) 
      ? exercicios.Exercicio 
      : [exercicios.Exercicio];
    
    // Ordenar por data de início (mais recente primeiro)
    return exerciciosArray
      .map((exercicio: Exercicio) => ({
        codigo: exercicio.CodigoExercicio || '',
        dataInicio: exercicio.DataInicio || null,
        dataFim: exercicio.DataFim || null,
        causaAfastamento: exercicio.SiglaCausaAfastamento || null,
        descricaoCausaAfastamento: exercicio.DescricaoCausaAfastamento || null
      }))
      .sort((a: {dataInicio: string | null}, b: {dataInicio: string | null}) => {
        if (!a.dataInicio) return 1;
        if (!b.dataInicio) return -1;
        return new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime();
      });
  }
  
  /**
   * Transforma dados básicos do mandato
   */
  private transformMandatoBasico(mandato: any): SenadorTransformado['mandatoAtual'] {
    if (!mandato || !mandato.CodigoMandato) {
      return null;
    }
    
    // Extrai dados básicos do mandato
    const mandatoTransformado: SenadorTransformado['mandatoAtual'] = {
      codigo: mandato.CodigoMandato || '',
      uf: mandato.UfParlamentar || '',
      participacao: mandato.DescricaoParticipacao || '',
      primeiraLegislatura: mandato.PrimeiraLegislaturaDoMandato ? {
        numero: mandato.PrimeiraLegislaturaDoMandato.NumeroLegislatura || '',
        dataInicio: mandato.PrimeiraLegislaturaDoMandato.DataInicio || null,
        dataFim: mandato.PrimeiraLegislaturaDoMandato.DataFim || null
      } : null,
      segundaLegislatura: mandato.SegundaLegislaturaDoMandato ? {
        numero: mandato.SegundaLegislaturaDoMandato.NumeroLegislatura || '',
        dataInicio: mandato.SegundaLegislaturaDoMandato.DataInicio || null,
        dataFim: mandato.SegundaLegislaturaDoMandato.DataFim || null
      } : null,
      suplentes: [],
      titular: null
    };
    
    // Adiciona suplentes se existirem
    if (mandato.Suplentes && mandato.Suplentes.Suplente) {
      const suplentesArray = Array.isArray(mandato.Suplentes.Suplente) 
        ? mandato.Suplentes.Suplente 
        : [mandato.Suplentes.Suplente];
      
      mandatoTransformado.suplentes = suplentesArray.map((suplente: Suplente) => ({
        participacao: suplente.DescricaoParticipacao || '',
        codigo: suplente.CodigoParlamentar || '',
        nome: suplente.NomeParlamentar || ''
      }));
    }
    
    // Adiciona titular se for um suplente
    if (mandato.Titular) {
      mandatoTransformado.titular = {
        participacao: mandato.Titular.DescricaoParticipacao || '',
        codigo: mandato.Titular.CodigoParlamentar || '',
        nome: mandato.Titular.NomeParlamentar || ''
      };
    }
    
    return mandatoTransformado;
  }
}

// Exporta uma instância do transformador
export const senadoresTransformer = new SenadoresTransformer();
