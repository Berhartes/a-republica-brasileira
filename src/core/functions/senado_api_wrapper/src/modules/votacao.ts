// src/modules/votacao.ts
import { HttpClient } from "../common/httpClient";
import { BaseApiFilters, Codigo, DataString, PagedResponse } from "../common/types";
import { handleApiError, WrapperError } from "../common/errors";

// Tipos Específicos para o Módulo de Votação

export interface Votacao {
  CodigoSessao?: Codigo; // Pode ser de comissão ou plenário
  CodigoSessaoVotacao?: Codigo; // Identificador único da votação na sessão
  SiglaDescricaoVotacao?: string;
  SequencialVotacao?: number;
  IndicadorVotacaoSecreta?: "Sim" | "Não";
  DescricaoVotacao?: string;
  Resultado?: string; // Ex: "Aprovado", "Rejeitado"
  // Outros campos
}

export interface DetalheVotacao extends Votacao {
  DescricaoIdentificacaoMateria?: string;
  CodigoMateria?: Codigo;
  SiglaCasa?: string;
  CodigoCasa?: Codigo;
  Votos?: {
    Parlamentar: VotoParlamentar[];
  };
  TotaisVotos?: {
    TotalSim: number;
    TotalNao: number;
    TotalAbstencao: number;
    TotalObstrucao?: number;
    Presentes?: number;
    Registrados?: number;
  };
  // Outros campos
}

export interface VotoParlamentar {
  CodigoParlamentar: Codigo;
  NomeParlamentar: string;
  SiglaPartido: string;
  SiglaUf: string;
  DescricaoVoto: "Sim" | "Não" | "Abstenção" | "Obstrução" | "Presidente" | "Não Votou";
}

export interface VotacaoComissao {
  CodigoReuniao: Codigo;
  DataReuniao?: string;
  CodigoComissao: Codigo;
  SiglaComissao?: string;
  NomeComissao?: string;
  Votacoes?: {
    Votacao: Votacao[] | Votacao;
  };
}

export interface TipoVotacao {
  Codigo: Codigo;
  Sigla: string;
  Descricao: string;
  IndicadorVotacaoSecreta?: "Sim" | "Não";
}

// Filtros
export interface FiltrosListarVotacoes extends BaseApiFilters {
  materiaId?: Codigo;
  dataInicio?: DataString; // YYYYMMDD
  dataFim?: DataString; // YYYYMMDD
  comissaoId?: Codigo;
  parlamentarId?: Codigo; // Para votações de um parlamentar específico
  sessaoId?: Codigo;
}

/**
 * Classe para interagir com os endpoints de Votação da API do Senado.
 */
export class VotacaoModule {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Lista as votações com base nos filtros.
   * Endpoints relevantes:
   *  - /votacao/lista/parlamentar/{codigoParlamentar}/{dataInicio}/{dataFim}
   *  - /votacao/lista/comissao/{codigoComissao}/{dataReferencia}
   *  - /votacao/lista/materia/{codigoMateria}
   *  - /votacao/lista/sessao/{codigoSessao}
   *  - /votacao/lista/plenario/{dataReferencia}
   *  - /votacao/lista/plenario/{dataInicio}/{dataFim}
   * @param filtros - Filtros para a listagem.
   */
  public async listarVotacoes(filtros: FiltrosListarVotacoes): Promise<Votacao[]> {
    let url = "/votacao/lista";
    const params: any = {};

    if (filtros.parlamentarId && filtros.dataInicio && filtros.dataFim) {
      url = `/votacao/lista/parlamentar/${filtros.parlamentarId}/${filtros.dataInicio}/${filtros.dataFim}`;
    } else if (filtros.comissaoId && filtros.dataInicio) { // dataInicio como dataReferencia
      url = `/votacao/lista/comissao/${filtros.comissaoId}/${filtros.dataInicio}`;
    } else if (filtros.materiaId) {
      url = `/votacao/lista/materia/${filtros.materiaId}`;
    } else if (filtros.sessaoId) {
      url = `/votacao/lista/sessao/${filtros.sessaoId}`;
    } else if (filtros.dataInicio && filtros.dataFim) { // Votações em plenário por período
      url = `/votacao/lista/plenario/${filtros.dataInicio}/${filtros.dataFim}`;
    } else if (filtros.dataInicio) { // Votações em plenário por data de referência
      url = `/votacao/lista/plenario/${filtros.dataInicio}`;
    } else {
      throw new WrapperError("Filtros insuficientes para listar votações. Forneça parlamentar+datas, comissao+data, materia, sessao, ou datas para plenário.");
    }

    try {
      const response = await this.httpClient.get<any>(url, { params });
      // A estrutura da resposta para votações pode variar bastante.
      // Ex: { ListaVotacoesParlamentar: { Parlamentar: ..., Votacoes: { Votacao: [...] } } }
      // Ex: { ListaVotacoesComissao: { Comissao: ..., Votacoes: { Votacao: [...] } } }
      // Ex: { ListaVotacoesMateria: { Materia: ..., Votacoes: { Votacao: [...] } } }
      // Ex: { ListaVotacoesSessao: { Sessao: ..., Votacoes: { Votacao: [...] } } }
      // Ex: { ListaVotacoesPlenario: { Votacoes: { Votacao: [...] } } }
      let votacoes: Votacao[] = [];

      if (response?.ListaVotacoesParlamentar?.Votacoes?.Votacao) {
        votacoes = response.ListaVotacoesParlamentar.Votacoes.Votacao;
      } else if (response?.ListaVotacoesComissao?.Votacoes?.Votacao) {
        votacoes = response.ListaVotacoesComissao.Votacoes.Votacao;
      } else if (response?.ListaVotacoesMateria?.Votacoes?.Votacao) {
        votacoes = response.ListaVotacoesMateria.Votacoes.Votacao;
      } else if (response?.ListaVotacoesSessao?.Votacoes?.Votacao) {
        votacoes = response.ListaVotacoesSessao.Votacoes.Votacao;
      } else if (response?.ListaVotacoesPlenario?.Votacoes?.Votacao) {
        votacoes = response.ListaVotacoesPlenario.Votacoes.Votacao;
      }
      
      return Array.isArray(votacoes) ? votacoes : (votacoes ? [votacoes] : []);
    } catch (error: any) {
      throw handleApiError(error, url);
    }
  }

  /**
   * Obtém os detalhes de uma votação específica.
   * Endpoint: /votacao/{codigoSessao}/{sequencialVotacao}
   * A API do Senado usa este endpoint para obter detalhes de uma votação específica por sessão e sequencial.
   * Há também o endpoint /votacao/parlamentar/{codigoParlamentar}/{codigoSessao}/{sequencialVotacao} para consultar
   * o voto específico de um parlamentar.
   * 
   * A documentação sugere que a combinação de sessão + sequencial é a chave para identificar uma votação.
   * @param codigoSessao - Código da sessão onde ocorreu a votação.
   * @param sequencialVotacao - Número sequencial da votação dentro da sessão.
   */
  public async obterDetalhesVotacao(codigoSessao: Codigo, sequencialVotacao: number): Promise<DetalheVotacao | null> {
    const url = `/votacao/${codigoSessao}/${sequencialVotacao}`;
    try {
      const response = await this.httpClient.get<any>(url);
      // Estrutura: { Votacao: { DetalheVotacao: { ... } } }
      if (response?.Votacao?.DetalheVotacao) {
        return response.Votacao.DetalheVotacao;
      }
      return null;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw handleApiError(error, url);
    }
  }

  /**
   * Obtém os votos por parlamentar em uma votação específica.
   * Este método é um alias ou complemento para obterDetalhesVotacao, pois os detalhes já incluem os votos.
   * Se for necessário um endpoint específico apenas para votos, ele precisaria ser identificado.
   * O endpoint /votacao/parlamentar/{codigoParlamentar}/{codigoSessao}/{sequencialVotacao} retorna o voto de UM parlamentar.
   * Para todos os votos, os detalhes da votação são mais adequados.
   * @param codigoSessao - Código da sessão onde ocorreu a votação.
   * @param sequencialVotacao - Número sequencial da votação dentro da sessão.
   */
  public async obterVotosPorParlamentarNaVotacao(codigoSessao: Codigo, sequencialVotacao: number): Promise<VotoParlamentar[]> {
    const detalhes = await this.obterDetalhesVotacao(codigoSessao, sequencialVotacao);
    if (detalhes && detalhes.Votos && detalhes.Votos.Parlamentar) {
      return Array.isArray(detalhes.Votos.Parlamentar) ? detalhes.Votos.Parlamentar : [detalhes.Votos.Parlamentar];
    }
    return [];
  }

  /**
   * Obtém as votações realizadas em uma reunião de comissão.
   * Endpoint: /votacao/comissao/{codigoComissao}/{codigoReuniao}
   * @param codigoComissao - Código da comissão.
   * @param codigoReuniao - Código da reunião da comissão.
   */
  public async obterVotacoesComissao(codigoComissao: Codigo, codigoReuniao: Codigo): Promise<Votacao[]> {
    const url = `/votacao/comissao/${codigoComissao}/${codigoReuniao}`;
    try {
      const response = await this.httpClient.get<any>(url);
      // Estrutura: { VotacoesComissao: { Comissao: ..., Reuniao: ..., Votacoes: { Votacao: [...] } } }
      if (response?.VotacoesComissao?.Votacoes?.Votacao) {
        const votacoes = response.VotacoesComissao.Votacoes.Votacao;
        return Array.isArray(votacoes) ? votacoes : [votacoes];
      }
      return [];
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return [];
      }
      throw handleApiError(error, url);
    }
  }

  /**
   * Lista os tipos de votação disponíveis na API.
   * Endpoint: /votacao/tipos
   */
  public async listarTiposVotacao(): Promise<TipoVotacao[]> {
    const url = "/votacao/tipos";
    try {
      const response = await this.httpClient.get<any>(url);
      // Estrutura: { TiposVotacao: { TipoVotacao: [...] } }
      if (response?.TiposVotacao?.TipoVotacao) {
        return Array.isArray(response.TiposVotacao.TipoVotacao)
          ? response.TiposVotacao.TipoVotacao
          : [response.TiposVotacao.TipoVotacao];
      }
      return [];
    } catch (error: any) {
      throw handleApiError(error, url);
    }
  }

  /**
   * Obtém o voto específico de um parlamentar em uma votação.
   * Endpoint: /votacao/parlamentar/{codigoParlamentar}/{codigoSessao}/{sequencialVotacao}
   * @param codigoParlamentar - Código do parlamentar.
   * @param codigoSessao - Código da sessão onde ocorreu a votação.
   * @param sequencialVotacao - Número sequencial da votação dentro da sessão.
   */
  public async obterVotoParlamentar(codigoParlamentar: Codigo, codigoSessao: Codigo, sequencialVotacao: number): Promise<VotoParlamentar | null> {
    const url = `/votacao/parlamentar/${codigoParlamentar}/${codigoSessao}/${sequencialVotacao}`;
    try {
      const response = await this.httpClient.get<any>(url);
      // Estrutura: { VotoParlamentar: { Parlamentar: { ... }, Votacao: { ... } } }
      if (response?.VotoParlamentar?.Parlamentar) {
        const parlamentar = response.VotoParlamentar.Parlamentar;
        const votacao = response.VotoParlamentar.Votacao;
        
        return {
          CodigoParlamentar: parlamentar.CodigoParlamentar,
          NomeParlamentar: parlamentar.NomeParlamentar,
          SiglaPartido: parlamentar.SiglaPartido,
          SiglaUf: parlamentar.SiglaUF,
          DescricaoVoto: votacao.DescricaoVoto
        };
      }
      return null;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      throw handleApiError(error, url);
    }
  }
}