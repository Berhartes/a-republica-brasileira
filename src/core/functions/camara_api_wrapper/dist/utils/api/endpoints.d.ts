/**
 * Configuração centralizada dos endpoints da API do Senado
 */
export declare const endpoints: {
    BASE_URL: string;
    LEGISLATURA: {
        POR_DATA: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        LISTA: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
    };
    COMPOSICAO: {
        BLOCOS: {
            LISTA: {
                PATH: string;
                PARAMS: {
                    v: number;
                    format: string;
                };
            };
            DETALHE: {
                PATH: string;
                PARAMS: {
                    v: number;
                    format: string;
                };
            };
        };
        PARTIDOS: {
            LISTA: {
                PATH: string;
                PARAMS: {
                    v: number;
                    format: string;
                };
            };
        };
        MESAS: {
            SENADO: {
                PATH: string;
                PARAMS: {
                    v: number;
                    format: string;
                };
            };
            CONGRESSO: {
                PATH: string;
                PARAMS: {
                    v: number;
                    format: string;
                };
            };
        };
        LIDERANCAS: {
            LISTA: {
                PATH: string;
                PARAMS: {
                    v: number;
                    format: string;
                };
            };
            TIPOS_UNIDADE: {
                PATH: string;
                PARAMS: {
                    v: number;
                    format: string;
                };
            };
            TIPOS_LIDERANCA: {
                PATH: string;
                PARAMS: {
                    v: number;
                    format: string;
                };
            };
            TIPOS_CARGO: {
                PATH: string;
                PARAMS: {
                    v: number;
                    format: string;
                };
            };
        };
    };
    COMISSOES: {
        TIPOS: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        LISTA_ATIVAS: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        LISTA_POR_TIPO_SENADO: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        LISTA_POR_TIPO_CONGRESSO: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        DETALHES: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        COMPOSICAO_SENADO: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        COMPOSICAO_CONGRESSO: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        MISTAS: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
    };
    SENADORES: {
        LISTA_ATUAL: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        LISTA_LEGISLATURA: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        PERFIL: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        MANDATOS: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        CARGOS: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        COMISSOES: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        FILIACOES: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        HISTORICO_ACADEMICO: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        LICENCAS: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        PROFISSAO: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        APARTES: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        DISCURSOS: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        VOTACOES: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        LIDERANCAS: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
    };
    PROCESSO: {
        AUTORIAS: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        RELATORIAS: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        DETALHES: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
        TRAMITACAO: {
            PATH: string;
            PARAMS: {
                v: number;
                format: string;
            };
        };
    };
    FORMAT: string;
    REQUEST: {
        TIMEOUT: number;
        RETRY_ATTEMPTS: number;
        RETRY_DELAY: number;
    };
};
