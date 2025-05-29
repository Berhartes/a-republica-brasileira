/**
 * Configuração centralizada dos endpoints da API da Câmara dos Deputados
 */

export const endpoints = {
  BASE_URL: 'https://dadosabertos.camara.leg.br/api/v2',

  // Informações sobre Legislatura
  LEGISLATURA: {
    ATUAL: {
      PATH: '/legislaturas/atual',
      PARAMS: {}
    },
    LISTA: {
      PATH: '/legislaturas',
      PARAMS: {}
    },
    DETALHES: {
      PATH: '/legislaturas/{legislatura}',
      PARAMS: {}
    }
  },

  // Partidos Políticos
  PARTIDOS: {
    LISTA: {
      PATH: '/partidos',
      PARAMS: {}
    },
    DETALHES: {
      PATH: '/partidos/{id}',
      PARAMS: {}
    }
  },

  // Deputados
  DEPUTADOS: {
    LISTA_ATUAL: {
      PATH: '/deputados',
      PARAMS: {}
    },
    LISTA_LEGISLATURA: {
      PATH: '/deputados',
      PARAMS: { idLegislatura: '{legislatura}' }
    },
    PERFIL: {
      PATH: '/deputados/{codigo}',
      PARAMS: {}
    },
    DESPESAS: {
      PATH: '/deputados/{codigo}/despesas',
      PARAMS: {}
    },
    DISCURSOS: {
      PATH: '/deputados/{codigo}/discursos',
      PARAMS: {}
    },
    EVENTOS: {
      PATH: '/deputados/{codigo}/eventos',
      PARAMS: {}
    },
    ORGAOS: {
      PATH: '/deputados/{codigo}/orgaos',
      PARAMS: {}
    },
    FRENTES: {
      PATH: '/deputados/{codigo}/frentes',
      PARAMS: {}
    },
    OCUPACOES: {
      PATH: '/deputados/{codigo}/ocupacoes',
      PARAMS: {}
    },
    MANDATOS_EXTERNOS: {
      PATH: '/deputados/{codigo}/mandatosExternos',
      PARAMS: {}
    },
    HISTORICO: {
      PATH: '/deputados/{codigo}/historico',
      PARAMS: {}
    },
    PROFISSOES: {
      PATH: '/deputados/{codigo}/profissoes',
      PARAMS: {}
    }
  },

  // Órgãos (Comissões, etc)
  ORGAOS: {
    LISTA: {
      PATH: '/orgaos',
      PARAMS: {}
    },
    DETALHES: {
      PATH: '/orgaos/{id}',
      PARAMS: {}
    },
    EVENTOS: {
      PATH: '/orgaos/{id}/eventos',
      PARAMS: {}
    },
    MEMBROS: {
      PATH: '/orgaos/{id}/membros',
      PARAMS: {}
    }
  },

  // Proposições
  PROPOSICOES: {
    LISTA: {
      PATH: '/proposicoes',
      PARAMS: {}
    },
    DETALHES: {
      PATH: '/proposicoes/{id}',
      PARAMS: {}
    },
    AUTORES: {
      PATH: '/proposicoes/{id}/autores',
      PARAMS: {}
    },
    TRAMITACAO: {
      PATH: '/proposicoes/{id}/tramitacoes',
      PARAMS: {}
    }
  },

  // Eventos
  EVENTOS: {
    LISTA: {
      PATH: '/eventos',
      PARAMS: {}
    },
    DETALHES: {
      PATH: '/eventos/{id}',
      PARAMS: {}
    }
  },

  // Configurações de requisição
  REQUEST: {
    TIMEOUT: 45000,  // 45 segundos
    RETRY_ATTEMPTS: 5,
    RETRY_DELAY: 3000  // 3 segundos
  }
};
