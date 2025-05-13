// src/modules/parlamentar.ts
import { HttpClient } from "../common/httpClient";
import { BaseApiFilters, Codigo, DataString, PagedResponse } from "../common/types";
import { handleApiError, WrapperError, NotFoundError } from "../common/errors";

// Tipos Específicos para o Módulo de Parlamentar

export interface IdentificacaoBasicaParlamentar {
  CodigoParlamentar: Codigo;
  NomeParlamentar: string;
  NomeCompletoParlamentar?: string;
  SexoParlamentar?: string;
  FormaTratamento?: string;
  UrlFotoParlamentar?: string;
  UrlPaginaParlamentar?: string;
  EmailParlamentar?: string;
  SiglaPartidoParlamentar?: string;
  UfParlamentar?: string;
}

export interface Mandato {
  CodigoMandato: Codigo;
  DescricaoParticipacao: string; // Ex: "1ª Titular", "Suplente"
  IdentificacaoParlamentar: IdentificacaoBasicaParlamentar;
  PrimeiraLegislaturaDoMandato: {
    NumeroLegislatura: number;
    DataInicio: DataString;
    DataFim: DataString;
  };
  SegundaLegislaturaDoMandato?: {
    NumeroLegislatura: number;
    DataInicio: DataString;
    DataFim: DataString;
  } | null;
  DescricaoExercicios?: string[];
  // Outros campos do mandato
}

export interface DetalheParlamentar extends IdentificacaoBasicaParlamentar {
  DataNascimento?: DataString;
  Naturalidade?: string;
  UfNaturalidade?: string;
  MandatoAtual?: Mandato; // Pode ser um objeto mais simples ou um código para buscar detalhes
  // Outros dados biográficos e de contato
}

export interface FiliacaoPartidaria {
  Partido: {
    Codigo: Codigo;
    Sigla: string;
    Nome: string;
  };
  DataFiliacao?: DataString;
  DataDesfiliacao?: DataString | null;
}

export interface Licenca {
  Codigo: Codigo;
  TipoLicenca: string;
  DataInicio: DataString;
  DataFim?: DataString | null;
  DescricaoMotivo?: string;
}

export interface DiscursoParlamentar {
  CodigoPronunciamento: Codigo;
  DataPronunciamento: DataString;
  UrlTextoIntegral?: string;
  Sumario?: string;
  TipoUsoPalavra?: string;
  SessaoPlenaria?: {
    CodigoSessao: Codigo;
    DataSessao: DataString;
    TipoSessao: string;
  };
}

export interface AparteParlamentar {
  CodigoAparte: Codigo;
  DataAparte: DataString;
  Sumario?: string;
  SessaoPlenaria?: {
    CodigoSessao: Codigo;
    DataSessao: DataString;
    TipoSessao: string;
  };
  ParlamentarAparteado?: {
    CodigoParlamentar: Codigo;
    NomeParlamentar: string;
  };
}

export interface HistoricoAcademico {
  FormacaoAcademica?: {
    Formacao: {
      Curso: string;
      Instituicao?: string;
      Ano?: string;
      Grau?: string;
    }[] | {
      Curso: string;
      Instituicao?: string;
      Ano?: string;
      Grau?: string;
    };
  };
  OutrasInformacoes?: string;
}

export interface CargoParlamentar {
  CodigoCargo: Codigo;
  DescricaoCargo: string;
  DataInicio: DataString;
  DataFim?: DataString | null;
  Instituicao?: string;
}

export interface ProfissaoParlamentar {
  Profissao: {
    CodigoProfissao: Codigo;
    NomeProfissao: string;
  }[] | {
    CodigoProfissao: Codigo;
    NomeProfissao: string;
  };
}

export interface TipoUsoPalavra {
  Codigo: Codigo;
  Sigla: string;
  Descricao: string;
}

export interface PartidoInfo {
  Codigo: Codigo;
  Sigla: string;
  Nome: string;
  DataCriacao?: DataString;
  DataExtincao?: DataString | null;
  NumeroSenadores?: number;
}

// Filtros para listar parlamentares
export interface FiltrosListarParlamentares extends BaseApiFilters {
  legislatura?: number;
  uf?: string; // Sigla da UF
  partido?: string; // Sigla do partido
  emExercicio?: boolean; // Para /senador/lista/atual
  nome?: string; // Para busca por nome
}

export interface FiltrosDiscursosParlamentar extends BaseApiFilters {
  dataInicio?: DataString;
  dataFim?: DataString;
  tipoDiscurso?: string;
  ordenacao?: 'ASC' | 'DESC';
}

export interface FiltrosApartesParlamentar extends BaseApiFilters {
  dataInicio?: DataString;
  dataFim?: DataString;
  ordenacao?: 'ASC' | 'DESC';
}

/**
 * Classe para interagir com os endpoints de Parlamentar da API do Senado.
 */
export class ParlamentarModule {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Lista os parlamentares (senadores) com base nos filtros fornecidos.
   * Endpoints relevantes:
   *  - /senador/lista/atual
   *  - /senador/lista/legislatura/{numeroLegislatura}
   *  - /senador/lista/partido/{siglaPartido}/{numeroLegislatura} (OPCIONAL)
   *  - /senador/lista/uf/{siglaUf}/{numeroLegislatura} (OPCIONAL)
   * @param filtros - Filtros para a listagem.
   */
  public async listarParlamentares(filtros?: FiltrosListarParlamentares): Promise<IdentificacaoBasicaParlamentar[]> {
    let url = "/senador/lista";
    const params: any = {};

    if (filtros?.emExercicio) {
      url = "/senador/lista/atual";
    } else if (filtros?.legislatura) {
      url = `/senador/lista/legislatura/${filtros.legislatura}`;
      if (filtros.partido) {
        url = `/senador/lista/partido/${filtros.partido}/${filtros.legislatura}`;
      }
      if (filtros.uf) {
        // A API não parece suportar UF e Partido ao mesmo tempo neste formato de URL
        // Priorizar UF se ambos forem fornecidos com legislatura, ou tratar como erro/aviso.
        url = `/senador/lista/uf/${filtros.uf}/${filtros.legislatura}`;
      }
    } else {
      // Padrão: listar senadores atuais se nenhum filtro específico de legislatura for fornecido.
      url = "/senador/lista/atual";
    }
    
    // Adicionar outros filtros como query params se a API suportar (ex: nome)
    if (filtros?.nome) {
        // A API do Senado não tem um endpoint de busca direta por nome que seja óbvio na documentação principal.
        // Isso pode exigir uma busca em todos e filtrar no cliente, ou um endpoint específico não documentado aqui.
        // Por enquanto, este filtro de nome não será aplicado diretamente na URL.
        // O usuário pode filtrar o resultado posteriormente.
        console.warn("Filtro por nome não é diretamente suportado pela API neste método, liste todos e filtre no cliente.");
    }

    try {
      const response = await this.httpClient.get<any>(url, { params });
      // Estrutura comum: { ListaParlamentarEmExercicio: { Parlamentares: { Parlamentar: [...] } } }
      // Ou: { ListaParlamentarLegislatura: { Parlamentares: { Parlamentar: [...] } } }
      let parlamentares: IdentificacaoBasicaParlamentar[] = [];

      if (response?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar) {
        parlamentares = response.ListaParlamentarEmExercicio.Parlamentares.Parlamentar;
      } else if (response?.ListaParlamentarLegislatura?.Parlamentares?.Parlamentar) {
        parlamentares = response.ListaParlamentarLegislatura.Parlamentares.Parlamentar;
      } else if (response?.ListaParlamentarPartido?.Parlamentares?.Parlamentar) {
        parlamentares = response.ListaParlamentarPartido.Parlamentares.Parlamentar;
      } else if (response?.ListaParlamentarUf?.Parlamentares?.Parlamentar) {
        parlamentares = response.ListaParlamentarUf.Parlamentares.Parlamentar;
      }
      
      return Array.isArray(parlamentares) ? parlamentares : (parlamentares ? [parlamentares] : []);
    } catch (error: any) {
      throw handleApiError(error, url);
    }
  }

  /**
   * Obtém os detalhes de um parlamentar (senador) específico.
   * Endpoint: /senador/{codigoParlamentar}
   * @param codigoParlamentar - O código do parlamentar.
   */
  public async obterDetalhesParlamentar(codigoParlamentar: Codigo): Promise<DetalheParlamentar | null> {
    const url = `/senador/${codigoParlamentar}`;
    try {
      const response = await this.httpClient.get<any>(url);
      // Estrutura: { DetalheParlamentar: { Parlamentar: { ... } } }
      if (response?.DetalheParlamentar?.Parlamentar) {
        return response.DetalheParlamentar.Parlamentar;
      }
      return null;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null; // Recurso não encontrado
      }
      throw handleApiError(error, url);
    }
  }

  /**
   * Obtém os mandatos de um senador.
   * Endpoint: /senador/{codigoParlamentar}/mandatos
   * @param codigoParlamentar - O código do parlamentar.
   */
  public async obterMandatosParlamentar(codigoParlamentar: Codigo): Promise<Mandato[]> {
    const url = `/senador/${codigoParlamentar}/mandatos`;
    try {
      const response = await this.httpClient.get<any>(url);
      // Estrutura: { MandatoParlamentar: { Parlamentar: ..., Mandatos: { Mandato: [...] } } }
      if (response?.MandatoParlamentar?.Mandatos?.Mandato) {
        return Array.isArray(response.MandatoParlamentar.Mandatos.Mandato) 
          ? response.MandatoParlamentar.Mandatos.Mandato 
          : [response.MandatoParlamentar.Mandatos.Mandato];
      }
      return [];
    } catch (error: any) {
      throw handleApiError(error, url);
    }
  }

  /**
   * Obtém as comissões em que um senador participa ou participou.
   * Endpoint: /senador/comissoes/{codigoParlamentar}
   * @param codigoParlamentar - O código do parlamentar.
   */
  public async obterComissoesParlamentar(codigoParlamentar: Codigo): Promise<any[]> { // Definir tipo para MembroComissaoParlamentar
    const url = `/senador/comissoes/${codigoParlamentar}`;
    try {
      const response = await this.httpClient.get<any>(url);
      // Estrutura: { MembroComissaoParlamentar: { Parlamentar: ..., Comissoes: { Comissao: [...] } } }
      if (response?.MembroComissaoParlamentar?.Comissoes?.Comissao) {
        return Array.isArray(response.MembroComissaoParlamentar.Comissoes.Comissao)
        ? response.MembroComissaoParlamentar.Comissoes.Comissao
        : [response.MembroComissaoParlamentar.Comissoes.Comissao];
      }
      return [];
    } catch (error: any) {
      throw handleApiError(error, url);
    }
  }

  /**
   * Obtém as lideranças exercidas por um senador.
   * Endpoint: /senador/liderancas/{codigoParlamentar}
   * @param codigoParlamentar - O código do parlamentar.
   */
  public async obterLiderancasParlamentar(codigoParlamentar: Codigo): Promise<any[]> { // Definir tipo para LiderancaParlamentar
    const url = `/senador/liderancas/${codigoParlamentar}`;
    try {
      const response = await this.httpClient.get<any>(url);
      // Estrutura: { LiderancaParlamentar: { Parlamentar: ..., Liderancas: { Lideranca: [...] } } }
      if (response?.LiderancaParlamentar?.Liderancas?.Lideranca) {
        return Array.isArray(response.LiderancaParlamentar.Liderancas.Lideranca)
        ? response.LiderancaParlamentar.Liderancas.Lideranca
        : [response.LiderancaParlamentar.Liderancas.Lideranca];
      }
      return [];
    } catch (error: any) {
      throw handleApiError(error, url);
    }
  }
  
  /**
   * Obtém as filiações partidárias de um senador.
   * Endpoint: /senador/filiacoes/{codigoParlamentar}
   */
  public async obterFiliacoesPartidarias(codigoParlamentar: Codigo): Promise<FiliacaoPartidaria[]> {
    const url = `/senador/filiacoes/${codigoParlamentar}`;
    try {
      const response = await this.httpClient.get<any>(url);
      // Estrutura: { FiliacaoParlamentar: { Parlamentar: ..., FiliacoesPartidarias: { Filiacao: [...] } } }
      if (response?.FiliacaoParlamentar?.FiliacoesPartidarias?.Filiacao) {
        return Array.isArray(response.FiliacaoParlamentar.FiliacoesPartidarias.Filiacao)
        ? response.FiliacaoParlamentar.FiliacoesPartidarias.Filiacao
        : [response.FiliacaoParlamentar.FiliacoesPartidarias.Filiacao];
      }
      return [];
    } catch (error: any) {
      throw handleApiError(error, url);
    }
  }

  /**
   * Obtém as licenças de um senador.
   * Endpoint: /senador/licencas/{codigoParlamentar}
   */
  public async obterLicencasParlamentar(codigoParlamentar: Codigo): Promise<Licenca[]> {
    const url = `/senador/licencas/${codigoParlamentar}`;
    try {
      const response = await this.httpClient.get<any>(url);
      // Estrutura: { LicencaParlamentar: { Parlamentar: ..., Licencas: { Licenca: [...] } } }
      if (response?.LicencaParlamentar?.Licencas?.Licenca) {
        return Array.isArray(response.LicencaParlamentar.Licencas.Licenca)
        ? response.LicencaParlamentar.Licencas.Licenca
        : [response.LicencaParlamentar.Licencas.Licenca];
      }
      return [];
    } catch (error: any) {
      throw handleApiError(error, url);
    }
  }

  /**
   * Obtém os discursos proferidos por um senador.
   * Endpoint: /senador/{codigo}/discursos
   * @param codigoParlamentar - O código do parlamentar.
   */
  public async obterDiscursosParlamentar(codigoParlamentar: Codigo): Promise<DiscursoParlamentar[]> {
    const url = `/senador/${codigoParlamentar}/discursos`;
    try {
      const response = await this.httpClient.get<any>(url);
      // Estrutura: { DiscursosParlamentar: { Parlamentar: ..., Pronunciamentos: { Pronunciamento: [...] } } }
      if (response?.DiscursosParlamentar?.Pronunciamentos?.Pronunciamento) {
        return Array.isArray(response.DiscursosParlamentar.Pronunciamentos.Pronunciamento)
          ? response.DiscursosParlamentar.Pronunciamentos.Pronunciamento
          : [response.DiscursosParlamentar.Pronunciamentos.Pronunciamento];
      }
      return [];
    } catch (error: any) {
      throw handleApiError(error, url);
    }
  }

  /**
   * Obtém os apartes feitos por um senador.
   * Endpoint: /senador/{codigo}/apartes
   * @param codigoParlamentar - O código do parlamentar.
   */
  public async obterApartesParlamentar(codigoParlamentar: Codigo): Promise<AparteParlamentar[]> {
    const url = `/senador/${codigoParlamentar}/apartes`;
    try {
      const response = await this.httpClient.get<any>(url);
      // Estrutura: { ApartesParlamentar: { Parlamentar: ..., Apartes: { Aparte: [...] } } }
      if (response?.ApartesParlamentar?.Apartes?.Aparte) {
        return Array.isArray(response.ApartesParlamentar.Apartes.Aparte)
          ? response.ApartesParlamentar.Apartes.Aparte
          : [response.ApartesParlamentar.Apartes.Aparte];
      }
      return [];
    } catch (error: any) {
      throw handleApiError(error, url);
    }
  }

  /**
   * Obtém o histórico acadêmico de um senador.
   * Endpoint: /senador/{codigo}/historicoAcademico
   * @param codigoParlamentar - O código do parlamentar.
   */
  public async obterHistoricoAcademico(codigoParlamentar: Codigo): Promise<HistoricoAcademico | null> {
    const url = `/senador/${codigoParlamentar}/historicoAcademico`;
    try {
      const response = await this.httpClient.get<any>(url);
      // Estrutura: { HistoricoAcademicoParlamentar: { Parlamentar: ..., HistoricoAcademico: { ... } } }
      if (response?.HistoricoAcademicoParlamentar?.HistoricoAcademico) {
        return response.HistoricoAcademicoParlamentar.HistoricoAcademico;
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
   * Obtém os cargos exercidos por um senador.
   * Endpoint: /senador/{codigo}/cargos
   * @param codigoParlamentar - O código do parlamentar.
   */
  public async obterCargosParlamentar(codigoParlamentar: Codigo): Promise<CargoParlamentar[]> {
    const url = `/senador/${codigoParlamentar}/cargos`;
    try {
      const response = await this.httpClient.get<any>(url);
      // Estrutura: { CargoParlamentar: { Parlamentar: ..., Cargos: { Cargo: [...] } } }
      if (response?.CargoParlamentar?.Cargos?.Cargo) {
        return Array.isArray(response.CargoParlamentar.Cargos.Cargo)
          ? response.CargoParlamentar.Cargos.Cargo
          : [response.CargoParlamentar.Cargos.Cargo];
      }
      return [];
    } catch (error: any) {
      throw handleApiError(error, url);
    }
  }

  /**
   * Obtém as profissões de um senador.
   * Endpoint: /senador/{codigo}/profissao
   * @param codigoParlamentar - O código do parlamentar.
   */
  public async obterProfissaoParlamentar(codigoParlamentar: Codigo): Promise<ProfissaoParlamentar | null> {
    const url = `/senador/${codigoParlamentar}/profissao`;
    try {
      const response = await this.httpClient.get<any>(url);
      // Estrutura: { ProfissaoParlamentar: { Parlamentar: ..., Profissoes: { ... } } }
      if (response?.ProfissaoParlamentar?.Profissoes) {
        return response.ProfissaoParlamentar.Profissoes;
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
   * Lista os senadores afastados/licenciados.
   * Endpoint: /senador/afastados
   */
  public async listarParlamentaresAfastados(): Promise<IdentificacaoBasicaParlamentar[]> {
    const url = `/senador/afastados`;
    try {
      const response = await this.httpClient.get<any>(url);
      // Estrutura: { AfastamentoAtual: { Parlamentares: { Parlamentar: [...] } } }
      if (response?.AfastamentoAtual?.Parlamentares?.Parlamentar) {
        return Array.isArray(response.AfastamentoAtual.Parlamentares.Parlamentar)
          ? response.AfastamentoAtual.Parlamentares.Parlamentar
          : [response.AfastamentoAtual.Parlamentares.Parlamentar];
      }
      return [];
    } catch (error: any) {
      throw handleApiError(error, url);
    }
  }

  /**
   * Lista parlamentares por um período de legislaturas.
   * Endpoint: /senador/lista/legislatura/{legislaturaInicio}/{legislaturaFim}
   * @param legislaturaInicio - Início do período de legislaturas.
   * @param legislaturaFim - Fim do período de legislaturas.
   */
  public async listarParlamentaresPorPeriodoLegislatura(legislaturaInicio: number, legislaturaFim: number): Promise<IdentificacaoBasicaParlamentar[]> {
    const url = `/senador/lista/legislatura/${legislaturaInicio}/${legislaturaFim}`;
    try {
      const response = await this.httpClient.get<any>(url);
      // Estrutura: { ListaParlamentarLegislatura: { Parlamentares: { Parlamentar: [...] } } }
      if (response?.ListaParlamentarLegislatura?.Parlamentares?.Parlamentar) {
        return Array.isArray(response.ListaParlamentarLegislatura.Parlamentares.Parlamentar)
          ? response.ListaParlamentarLegislatura.Parlamentares.Parlamentar
          : [response.ListaParlamentarLegislatura.Parlamentares.Parlamentar];
      }
      return [];
    } catch (error: any) {
      throw handleApiError(error, url);
    }
  }

  /**
   * Lista os partidos dos senadores.
   * Endpoint: /senador/partidos
   */
  public async listarPartidosParlamentares(): Promise<PartidoInfo[]> {
    const url = `/senador/partidos`;
    try {
      const response = await this.httpClient.get<any>(url);
      // Estrutura: { ListaPartidos: { Partidos: { Partido: [...] } } }
      if (response?.ListaPartidos?.Partidos?.Partido) {
        return Array.isArray(response.ListaPartidos.Partidos.Partido)
          ? response.ListaPartidos.Partidos.Partido
          : [response.ListaPartidos.Partidos.Partido];
      }
      return [];
    } catch (error: any) {
      throw handleApiError(error, url);
    }
  }

  /**
   * Lista os tipos de uso da palavra (tipos de discursos).
   * Endpoint: /senador/lista/tiposUsoPalavra
   */
  public async listarTiposUsoPalavra(): Promise<TipoUsoPalavra[]> {
    const url = `/senador/lista/tiposUsoPalavra`;
    try {
      const response = await this.httpClient.get<any>(url);
      // Estrutura: { ListaTiposUsoPalavra: { TiposUsoPalavra: { TipoUsoPalavra: [...] } } }
      if (response?.ListaTiposUsoPalavra?.TiposUsoPalavra?.TipoUsoPalavra) {
        return Array.isArray(response.ListaTiposUsoPalavra.TiposUsoPalavra.TipoUsoPalavra)
          ? response.ListaTiposUsoPalavra.TiposUsoPalavra.TipoUsoPalavra
          : [response.ListaTiposUsoPalavra.TiposUsoPalavra.TipoUsoPalavra];
      }
      return [];
    } catch (error: any) {
      throw handleApiError(error, url);
    }
  }
}

