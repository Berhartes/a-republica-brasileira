/**
 * Configuração de endpoints da API da Câmara dos Deputados
 *
 * Centraliza todas as URLs e configurações de endpoints
 * da API de Dados Abertos da Câmara dos Deputados.
 */

/**
 * Configuração de endpoint
 */
interface EndpointConfig {
  PATH: string;
  PARAMS: Record<string, any>;
  TIMEOUT?: number;
  RETRY_ATTEMPTS?: number;
  RETRY_DELAY?: number;
}

/**
 * Configurações globais de request
 */
export const REQUEST_CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  DEFAULT_TIMEOUT: 30000,
  DEFAULT_ITEMS_PER_PAGE: 100
};

/**
 * Base URL da API (será sobrescrita pela configuração de ambiente)
 */
export const BASE_URL = 'https://dadosabertos.camara.leg.br/api/v2';

/**
 * Endpoints organizados por categoria
 */
export const endpoints = {
  // Configurações globais
  REQUEST: REQUEST_CONFIG,
  BASE_URL,

  // Endpoints de Deputados
  DEPUTADOS: {
    // Lista de deputados por legislatura
    LISTA: {
      PATH: '/deputados',
      PARAMS: {
        idLegislatura: '',
        nome: '',
        siglaPartido: '',
        siglaUf: '',
        ordem: 'ASC',
        ordenarPor: 'nome',
        pagina: '1',
        itens: '100'
      },
      TIMEOUT: 15000
    } as EndpointConfig,

    // Perfil de deputado específico
    PERFIL: {
      PATH: '/deputados/{codigo}',
      PARAMS: {},
      TIMEOUT: 15000
    } as EndpointConfig,

    // Despesas de deputado
    DESPESAS: {
      PATH: '/deputados/{codigo}/despesas',
      PARAMS: {
        idLegislatura: '',
        ano: '',
        mes: '',
        cnpjCpfFornecedor: '',
        pagina: '1',
        itens: '100',
        ordem: 'ASC',
        ordenarPor: 'numDocumento'
      },
      TIMEOUT: 45000
    } as EndpointConfig,

    // Discursos de deputado
    DISCURSOS: {
      PATH: '/deputados/{codigo}/discursos',
      PARAMS: {
        idLegislatura: '',
        dataInicio: '',
        dataFim: '',
        ordenarPor: 'dataHoraInicio',
        ordem: 'DESC',
        pagina: '1',
        itens: '100'
      },
      TIMEOUT: 30000
    } as EndpointConfig,

    // Eventos de deputado
    EVENTOS: {
      PATH: '/deputados/{codigo}/eventos',
      PARAMS: {
        idLegislatura: '',
        dataInicio: '',
        dataFim: '',
        pagina: '1',
        itens: '100'
      },
      TIMEOUT: 20000
    } as EndpointConfig,

    // Órgãos de deputado
    ORGAOS: {
      PATH: '/deputados/{codigo}/orgaos',
      PARAMS: {},
      TIMEOUT: 10000
    } as EndpointConfig,

    // Frentes parlamentares
    FRENTES: {
      PATH: '/deputados/{codigo}/frentes',
      PARAMS: {},
      TIMEOUT: 10000
    } as EndpointConfig,

    // Mandatos externos
    MANDATOS_EXTERNOS: {
      PATH: '/deputados/{codigo}/mandatosExternos',
      PARAMS: {},
      TIMEOUT: 10000
    } as EndpointConfig,

    // Histórico do deputado
    HISTORICO: {
      PATH: '/deputados/{codigo}/historico',
      PARAMS: {},
      TIMEOUT: 10000
    } as EndpointConfig,

    // Profissões do deputado
    PROFISSOES: {
      PATH: '/deputados/{codigo}/profissoes',
      PARAMS: {},
      TIMEOUT: 10000
    } as EndpointConfig,

    // Ocupações de deputado
    OCUPACOES: {
      PATH: '/deputados/{codigo}/ocupacoes',
      PARAMS: {},
      TIMEOUT: 10000
    } as EndpointConfig
  },

  // Endpoints de Proposições/Matérias
  PROPOSICOES: {
    // Lista de proposições
    LISTA: {
      PATH: '/proposicoes',
      PARAMS: {
        idLegislatura: '',
        siglaTipo: '',
        numero: '',
        ano: '',
        dataInicio: '',
        dataFim: '',
        dataApresentacaoInicio: '',
        dataApresentacaoFim: '',
        idDeputadoAutor: '',
        autor: '',
        siglaPartidoAutor: '',
        siglaUfAutor: '',
        keywords: '',
        tramitacaoSenado: '',
        ordem: 'ASC',
        ordenarPor: 'id',
        pagina: '1',
        itens: '100'
      },
      TIMEOUT: 30000
    } as EndpointConfig,

    // Proposição específica
    DETALHES: {
      PATH: '/proposicoes/{codigo}',
      PARAMS: {},
      TIMEOUT: 15000
    } as EndpointConfig,

    // Autores de proposição
    AUTORES: {
      PATH: '/proposicoes/{codigo}/autores',
      PARAMS: {},
      TIMEOUT: 10000
    } as EndpointConfig,

    // Relatores de proposição
    RELATORES: {
      PATH: '/proposicoes/{codigo}/relatores',
      PARAMS: {},
      TIMEOUT: 10000
    } as EndpointConfig,

    // Tramitações
    TRAMITACOES: {
      PATH: '/proposicoes/{codigo}/tramitacoes',
      PARAMS: {
        dataInicio: '',
        dataFim: '',
        pagina: '1',
        itens: '100'
      },
      TIMEOUT: 20000
    } as EndpointConfig,

    // Votações
    VOTACOES: {
      PATH: '/proposicoes/{codigo}/votacoes',
      PARAMS: {
        pagina: '1',
        itens: '100'
      },
      TIMEOUT: 25000
    } as EndpointConfig
  },

  // Endpoints de Votações
  VOTACOES: {
    // Lista de votações
    LISTA: {
      PATH: '/votacoes',
      PARAMS: {
        idLegislatura: '',
        dataInicio: '',
        dataFim: '',
        idProposicao: '',
        ordem: 'DESC',
        ordenarPor: 'dataHoraRegistro',
        pagina: '1',
        itens: '100'
      },
      TIMEOUT: 60000
    } as EndpointConfig,

    // Votação específica
    DETALHES: {
      PATH: '/votacoes/{codigo}',
      PARAMS: {},
      TIMEOUT: 30000
    } as EndpointConfig,

    // Votos de uma votação
    VOTOS: {
      PATH: '/votacoes/{codigo}/votos',
      PARAMS: {
        pagina: '1',
        itens: '100'
      },
      TIMEOUT: 45000
    } as EndpointConfig,

    // Orientações de bancada
    ORIENTACOES: {
      PATH: '/votacoes/{codigo}/orientacoes',
      PARAMS: {},
      TIMEOUT: 15000
    } as EndpointConfig
  },

  // Endpoints de Comissões
  COMISSOES: {
    // Lista de comissões
    LISTA: {
      PATH: '/orgaos',
      PARAMS: {
        idLegislatura: '',
        idTipoOrgao: '',
        sigla: '',
        dataInicio: '',
        dataFim: '',
        ordem: 'ASC',
        ordenarPor: 'sigla',
        pagina: '1',
        itens: '100'
      },
      TIMEOUT: 20000
    } as EndpointConfig,

    // Comissão específica
    DETALHES: {
      PATH: '/orgaos/{codigo}',
      PARAMS: {},
      TIMEOUT: 15000
    } as EndpointConfig,

    // Membros de comissão
    MEMBROS: {
      PATH: '/orgaos/{codigo}/membros',
      PARAMS: {
        dataInicio: '',
        dataFim: '',
        pagina: '1',
        itens: '100'
      },
      TIMEOUT: 20000
    } as EndpointConfig,

    // Eventos de comissão
    EVENTOS: {
      PATH: '/orgaos/{codigo}/eventos',
      PARAMS: {
        dataInicio: '',
        dataFim: '',
        pagina: '1',
        itens: '100'
      },
      TIMEOUT: 25000
    } as EndpointConfig,

    // Votações de comissão
    VOTACOES: {
      PATH: '/orgaos/{codigo}/votacoes',
      PARAMS: {
        dataInicio: '',
        dataFim: '',
        pagina: '1',
        itens: '100'
      },
      TIMEOUT: 30000
    } as EndpointConfig
  },

  // Endpoints de Eventos
  EVENTOS: {
    // Lista de eventos
    LISTA: {
      PATH: '/eventos',
      PARAMS: {
        idLegislatura: '',
        idTipoEvento: '',
        idSituacao: '',
        idOrgao: '',
        dataInicio: '',
        dataFim: '',
        horaInicio: '',
        horaFim: '',
        ordem: 'DESC',
        ordenarPor: 'dataHoraInicio',
        pagina: '1',
        itens: '100'
      },
      TIMEOUT: 25000
    } as EndpointConfig,

    // Evento específico
    DETALHES: {
      PATH: '/eventos/{codigo}',
      PARAMS: {},
      TIMEOUT: 15000
    } as EndpointConfig,

    // Deputados presentes no evento
    DEPUTADOS: {
      PATH: '/eventos/{codigo}/deputados',
      PARAMS: {
        pagina: '1',
        itens: '100'
      },
      TIMEOUT: 20000
    } as EndpointConfig,

    // Pauta do evento
    PAUTA: {
      PATH: '/eventos/{codigo}/pauta',
      PARAMS: {},
      TIMEOUT: 15000
    } as EndpointConfig
  },

  // Endpoints de Legislaturas
  LEGISLATURAS: {
    // Lista de legislaturas
    LISTA: {
      PATH: '/legislaturas',
      PARAMS: {
        data: '',
        ordem: 'DESC',
        ordenarPor: 'id',
        pagina: '1',
        itens: '100'
      },
      TIMEOUT: 10000
    } as EndpointConfig,

    // Legislatura específica
    DETALHES: {
      PATH: '/legislaturas/{codigo}',
      PARAMS: {},
      TIMEOUT: 10000
    } as EndpointConfig,

    // Mesa diretora da legislatura
    MESA: {
      PATH: '/legislaturas/{codigo}/mesa',
      PARAMS: {
        dataInicio: '',
        dataFim: '',
        pagina: '1',
        itens: '100'
      },
      TIMEOUT: 15000
    } as EndpointConfig
  },

  // Endpoints de Partidos
  PARTIDOS: {
    // Lista de partidos
    LISTA: {
      PATH: '/partidos',
      PARAMS: {
        idLegislatura: '',
        dataInicio: '',
        dataFim: '',
        ordem: 'ASC',
        ordenarPor: 'sigla',
        pagina: '1',
        itens: '100'
      },
      TIMEOUT: 15000
    } as EndpointConfig,

    // Partido específico
    DETALHES: {
      PATH: '/partidos/{codigo}',
      PARAMS: {},
      TIMEOUT: 10000
    } as EndpointConfig,

    // Membros do partido
    MEMBROS: {
      PATH: '/partidos/{codigo}/membros',
      PARAMS: {
        idLegislatura: '',
        dataInicio: '',
        dataFim: '',
        pagina: '1',
        itens: '100'
      },
      TIMEOUT: 20000
    } as EndpointConfig
  },

  // Endpoints de Blocos Parlamentares
  BLOCOS: {
    // Lista de blocos
    LISTA: {
      PATH: '/blocos',
      PARAMS: {
        idLegislatura: '',
        ordem: 'ASC',
        ordenarPor: 'nome',
        pagina: '1',
        itens: '100'
      },
      TIMEOUT: 15000
    } as EndpointConfig,

    // Bloco específico
    DETALHES: {
      PATH: '/blocos/{codigo}',
      PARAMS: {},
      TIMEOUT: 10000
    } as EndpointConfig
  },

  // Endpoints de Lideranças
  LIDERANCAS: {
    // Lista de lideranças
    LISTA: {
      PATH: '/liderancas',
      PARAMS: {
        idLegislatura: '',
        dataInicio: '',
        dataFim: '',
        pagina: '1',
        itens: '100'
      },
      TIMEOUT: 15000
    } as EndpointConfig,

    // Liderança específica
    DETALHES: {
      PATH: '/liderancas/{codigo}',
      PARAMS: {},
      TIMEOUT: 10000
    } as EndpointConfig
  },

  // Endpoints de Referências (dados auxiliares)
  REFERENCIAS: {
    // Situações de proposições
    SITUACOES_PROPOSICAO: {
      PATH: '/referencias/situacoesProposicao',
      PARAMS: {},
      TIMEOUT: 10000
    } as EndpointConfig,

    // Tipos de proposição
    TIPOS_PROPOSICAO: {
      PATH: '/referencias/tiposProposicao',
      PARAMS: {},
      TIMEOUT: 10000
    } as EndpointConfig,

    // Tipos de evento
    TIPOS_EVENTO: {
      PATH: '/referencias/tiposEvento',
      PARAMS: {},
      TIMEOUT: 10000
    } as EndpointConfig,

    // Tipos de órgão
    TIPOS_ORGAO: {
      PATH: '/referencias/tiposOrgao',
      PARAMS: {},
      TIMEOUT: 10000
    } as EndpointConfig,

    // UFs
    UFS: {
      PATH: '/referencias/uf',
      PARAMS: {},
      TIMEOUT: 10000
    } as EndpointConfig,

    // Partidos
    PARTIDOS: {
      PATH: '/referencias/partidos',
      PARAMS: {},
      TIMEOUT: 10000
    } as EndpointConfig,

    // Situações de deputado
    SITUACOES_DEPUTADO: {
      PATH: '/referencias/situacoesDeputado',
      PARAMS: {},
      TIMEOUT: 10000
    } as EndpointConfig
  }
};

/**
 * Utilitários para trabalhar com endpoints
 */
export const endpointUtils = {
  /**
   * Obtém configuração de endpoint por categoria e nome
   */
  getEndpoint(category: string, name: string): EndpointConfig | undefined {
    const categoryEndpoints = (endpoints as any)[category];
    return categoryEndpoints ? categoryEndpoints[name] : undefined;
  },

  /**
   * Lista todas as categorias disponíveis
   */
  getCategories(): string[] {
    return Object.keys(endpoints).filter(key =>
      key !== 'REQUEST' && key !== 'BASE_URL'
    );
  },

  /**
   * Lista endpoints de uma categoria
   */
  getEndpointsInCategory(category: string): string[] {
    const categoryEndpoints = (endpoints as any)[category];
    return categoryEndpoints ? Object.keys(categoryEndpoints) : [];
  },

  /**
   * Valida se endpoint existe
   */
  endpointExists(category: string, name: string): boolean {
    return this.getEndpoint(category, name) !== undefined;
  },

  /**
   * Obtém URL completa do endpoint
   */
  getFullUrl(category: string, name: string, pathParams?: Record<string, string>): string {
    const endpoint = this.getEndpoint(category, name);
    if (!endpoint) {
      throw new Error(`Endpoint ${category}.${name} não encontrado`);
    }

    let path = endpoint.PATH;

    // Substituir parâmetros de path se fornecidos
    if (pathParams) {
      for (const [key, value] of Object.entries(pathParams)) {
        path = path.replace(`{${key}}`, encodeURIComponent(value));
      }
    }

    return `${BASE_URL}${path}`;
  },

  /**
   * Merge parâmetros com defaults do endpoint
   */
  mergeParams(
    category: string,
    name: string,
    customParams: Record<string, any> = {}
  ): Record<string, any> {
    const endpoint = this.getEndpoint(category, name);
    if (!endpoint) {
      throw new Error(`Endpoint ${category}.${name} não encontrado`);
    }

    // Filtrar parâmetros vazios dos defaults
    const defaultParams = Object.fromEntries(
      Object.entries(endpoint.PARAMS).filter(([_, value]) => value !== '')
    );

    return {
      ...defaultParams,
      ...customParams
    };
  },

  /**
   * Obtém timeout específico do endpoint
   */
  getTimeout(category: string, name: string): number {
    const endpoint = this.getEndpoint(category, name);
    return endpoint?.TIMEOUT || REQUEST_CONFIG.DEFAULT_TIMEOUT;
  },

  /**
   * Valida parâmetros obrigatórios
   */
  validateRequiredParams(
    category: string,
    name: string,
    params: Record<string, any>,
    requiredParams: string[]
  ): { valid: boolean; missing: string[] } {
    const missing = requiredParams.filter(param => !params[param]);

    return {
      valid: missing.length === 0,
      missing
    };
  }
};

/**
 * Configurações específicas por tipo de processamento
 */
export const processingConfigs = {
  perfis: {
    endpoints: ['DEPUTADOS.LISTA', 'DEPUTADOS.PERFIL', 'DEPUTADOS.ORGAOS', 'DEPUTADOS.FRENTES', 'DEPUTADOS.OCUPACOES', 'DEPUTADOS.MANDATOS_EXTERNOS', 'DEPUTADOS.HISTORICO', 'DEPUTADOS.PROFISSOES'],
    batchSize: 10,
    concurrency: 3
  },

  despesas: {
    endpoints: ['DEPUTADOS.LISTA', 'DEPUTADOS.DESPESAS'],
    batchSize: 5,
    concurrency: 2,
    itemsPerPage: 100
  },

  discursos: {
    endpoints: ['DEPUTADOS.LISTA', 'DEPUTADOS.DISCURSOS'],
    batchSize: 5,
    concurrency: 2,
    itemsPerPage: 100
  },

  comissoes: {
    endpoints: ['COMISSOES.LISTA', 'COMISSOES.DETALHES', 'COMISSOES.MEMBROS'],
    batchSize: 20,
    concurrency: 5
  },

  votacoes: {
    endpoints: ['VOTACOES.LISTA', 'VOTACOES.DETALHES', 'VOTACOES.VOTOS'],
    batchSize: 5,
    concurrency: 2
  },

  proposicoes: {
    endpoints: ['PROPOSICOES.LISTA', 'PROPOSICOES.DETALHES', 'PROPOSICOES.AUTORES'],
    batchSize: 15,
    concurrency: 3
  }
};
