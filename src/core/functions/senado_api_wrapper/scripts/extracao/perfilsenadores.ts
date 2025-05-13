/**
 * Extrator especializado para perfis de senadores da API do Senado Federal
 * Este módulo trata especificamente da extração de perfis completos,
 * complementando o extrator básico de senadores
 */
import { logger } from '../utils/logger';
import * as api from '../utils/api';
import { endpoints } from '../config/endpoints';
import { withRetry } from '../utils/error_handler';

// Interfaces para tipagem dos dados
export interface SenadoresLegislaturaResult {
  timestamp: string;
  origem: string;
  senadores: any[];
  metadados: any;
  erro?: string;
}

export interface PerfilSenadorResult {
  timestamp: string;
  origem: string;
  dados: any;
  metadados: any;
  erro?: string;
}

export interface PerfilCompletoResult {
  timestamp: string;
  codigo: string | number;
  dadosBasicos: PerfilSenadorResult;
  mandatos?: any;
  cargos?: any;
  comissoes?: any;
  filiacoes?: any;
  historicoAcademico?: any;
  licencas?: any;
  profissao?: any;
  apartes?: any;
  erro?: string;
}

/**
 * Classe para extração de perfis completos de senadores
 */
export class PerfilSenadoresExtractor {
  /**
   * Extrai a lista de senadores de uma legislatura específica
   * @param legislatura - Número da legislatura
   * @returns Dados dos senadores da legislatura
   */
  async extractSenadoresLegislatura(legislatura: number): Promise<SenadoresLegislaturaResult> {
    try {
      logger.info(`Extraindo lista de senadores da legislatura ${legislatura}`);
      
      // Obter a lista de senadores da legislatura específica
      const endpointConfig = endpoints.SENADORES.LISTA_LEGISLATURA;
      const endpoint = api.replacePath(endpointConfig.PATH, { legislatura: legislatura.toString() });
      const response = await withRetry(
        async () => api.get(endpoint, endpointConfig.PARAMS),
        endpoints.REQUEST.RETRY_ATTEMPTS,
        endpoints.REQUEST.RETRY_DELAY,
        `Extração lista de senadores da legislatura ${legislatura}`
      );
      
      // Verificação cuidadosa da estrutura de resposta
      if (!response) {
        logger.warn(`Resposta vazia para lista de senadores da legislatura ${legislatura}`);
        return {
          timestamp: new Date().toISOString(),
          origem: endpoint,
          senadores: [],
          metadados: {}
        };
      }
      
      // Extrai a lista de parlamentares, lidando com diferentes estruturas possíveis
      let parlamentares = [];
      
      // Verificar cada nível da estrutura com segurança
      if (response.ListaParlamentarLegislatura && 
          response.ListaParlamentarLegislatura.Parlamentares) {
        parlamentares = response.ListaParlamentarLegislatura.Parlamentares.Parlamentar || [];
      }
      
      // Garantir que seja um array
      parlamentares = Array.isArray(parlamentares) ? parlamentares : [parlamentares];
      
      // Filtrar itens nulos ou indefinidos
      parlamentares = parlamentares.filter(p => p);
      
      logger.info(`Encontrados ${parlamentares.length} senadores na legislatura ${legislatura}`);
      
      return {
        timestamp: new Date().toISOString(),
        origem: endpoint,
        senadores: parlamentares,
        metadados: response.ListaParlamentarLegislatura?.Metadados || {}
      };
    } catch (error: any) {
      const endpoint = api.replacePath(endpoints.SENADORES.LISTA_LEGISLATURA.PATH, { legislatura: legislatura.toString() });
      logger.error(`Erro ao extrair lista de senadores da legislatura ${legislatura}: ${error.message}`);
      
      // Retornar objeto vazio em vez de lançar erro
      return {
        timestamp: new Date().toISOString(),
        origem: endpoint,
        senadores: [],
        metadados: {},
        erro: error.message
      };
    }
  }
  
  /**
   * Extrai perfil completo de um senador específico
   * @param codigoSenador - Código do senador na API
   * @returns Perfil completo do senador
   */
  async extractPerfilCompleto(codigoSenador: string | number): Promise<PerfilCompletoResult> {
    try {
      logger.info(`Extraindo perfil completo do senador código ${codigoSenador}`);
      
      // 1. Extrair dados básicos
      const dadosBasicos = await this.extractDadosBasicos(codigoSenador);
      
      // Verificar se os dados básicos foram obtidos com sucesso
      if (!dadosBasicos || !dadosBasicos.dados) {
        logger.warn(`Dados básicos não obtidos para o senador ${codigoSenador}, abortando perfil completo`);
        return {
          timestamp: new Date().toISOString(),
          codigo: codigoSenador,
          dadosBasicos: dadosBasicos,
          erro: "Dados básicos não obtidos, perfil incompleto"
        };
      }
      
      // 2. Extrair dados complementares (paralelização)
      const [
        mandatos,
        cargos,
        comissoes,
        filiacoes,
        historicoAcademico,
        licencas,
        profissao,
        apartes
      ] = await Promise.allSettled([
        this.extractMandatos(codigoSenador),
        this.extractCargos(codigoSenador),
        this.extractComissoes(codigoSenador),
        this.extractFiliacoes(codigoSenador),
        this.extractHistoricoAcademico(codigoSenador),
        this.extractLicencas(codigoSenador),
        this.extractProfissao(codigoSenador),
        this.extractApartes(codigoSenador)
      ]);
      
      // 3. Consolidar todos os dados
      const perfilCompleto: PerfilCompletoResult = {
        timestamp: new Date().toISOString(),
        codigo: codigoSenador,
        dadosBasicos: dadosBasicos,
        mandatos: mandatos.status === 'fulfilled' ? mandatos.value : {
          timestamp: new Date().toISOString(),
          origem: api.replacePath(endpoints.SENADORES.MANDATOS.PATH, { codigo: codigoSenador.toString() }),
          dados: null,
          erro: mandatos.status === 'rejected' ? mandatos.reason?.message : 'Informação não disponível'
        },
        cargos: cargos.status === 'fulfilled' ? cargos.value : {
          timestamp: new Date().toISOString(),
          origem: api.replacePath(endpoints.SENADORES.CARGOS.PATH, { codigo: codigoSenador.toString() }),
          dados: null,
          erro: cargos.status === 'rejected' ? cargos.reason?.message : 'Informação não disponível'
        },
        comissoes: comissoes.status === 'fulfilled' ? comissoes.value : {
          timestamp: new Date().toISOString(),
          origem: api.replacePath(endpoints.SENADORES.COMISSOES.PATH, { codigo: codigoSenador.toString() }),
          dados: null,
          erro: comissoes.status === 'rejected' ? comissoes.reason?.message : 'Informação não disponível'
        },
        filiacoes: filiacoes.status === 'fulfilled' ? filiacoes.value : {
          timestamp: new Date().toISOString(),
          origem: api.replacePath(endpoints.SENADORES.FILIACOES.PATH, { codigo: codigoSenador.toString() }),
          dados: null,
          erro: filiacoes.status === 'rejected' ? filiacoes.reason?.message : 'Informação não disponível'
        },
        historicoAcademico: historicoAcademico.status === 'fulfilled' ? historicoAcademico.value : {
          timestamp: new Date().toISOString(),
          origem: api.replacePath(endpoints.SENADORES.HISTORICO_ACADEMICO.PATH, { codigo: codigoSenador.toString() }),
          dados: null,
          erro: historicoAcademico.status === 'rejected' ? historicoAcademico.reason?.message : 'Informação não disponível'
        },
        licencas: licencas.status === 'fulfilled' ? licencas.value : {
          timestamp: new Date().toISOString(),
          origem: api.replacePath(endpoints.SENADORES.LICENCAS.PATH, { codigo: codigoSenador.toString() }),
          dados: null,
          erro: licencas.status === 'rejected' ? licencas.reason?.message : 'Informação não disponível'
        },
        profissao: profissao.status === 'fulfilled' ? profissao.value : {
          timestamp: new Date().toISOString(),
          origem: api.replacePath(endpoints.SENADORES.PROFISSAO.PATH, { codigo: codigoSenador.toString() }),
          dados: null,
          erro: profissao.status === 'rejected' ? profissao.reason?.message : 'Informação não disponível'
        },
        apartes: apartes.status === 'fulfilled' ? apartes.value : {
          timestamp: new Date().toISOString(),
          origem: api.replacePath(endpoints.SENADORES.APARTES.PATH, { codigo: codigoSenador.toString() }),
          dados: null,
          erro: apartes.status === 'rejected' ? apartes.reason?.message : 'Informação não disponível'
        }
      };
      
      logger.info(`Perfil completo do senador ${codigoSenador} extraído com sucesso`);
      
      return perfilCompleto;
    } catch (error: any) {
      logger.error(`Erro ao extrair perfil completo do senador ${codigoSenador}: ${error.message}`);
      
      // Retornar objeto mínimo para não quebrar o fluxo
      return {
        timestamp: new Date().toISOString(),
        codigo: codigoSenador,
        dadosBasicos: {
          timestamp: new Date().toISOString(),
          origem: api.replacePath(endpoints.SENADORES.PERFIL.PATH, { codigo: codigoSenador.toString() }),
          dados: null,
          metadados: {},
          erro: error.message
        },
        erro: error.message
      };
    }
  }
  
  /**
   * Extrai dados básicos de um senador
   * @param codigoSenador - Código do senador na API
   * @returns Dados básicos do senador
   */
  async extractDadosBasicos(codigoSenador: string | number): Promise<PerfilSenadorResult> {
    try {
      logger.info(`Extraindo dados básicos do senador código ${codigoSenador}`);
      
      const endpointConfig = endpoints.SENADORES.PERFIL;
      const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
      const response = await withRetry(
        async () => api.get(endpoint, endpointConfig.PARAMS),
        endpoints.REQUEST.RETRY_ATTEMPTS,
        endpoints.REQUEST.RETRY_DELAY,
        `Extração dados básicos do senador ${codigoSenador}`
      );
      
      // Verificação rigorosa da resposta
      if (!response) {
        logger.warn(`Resposta vazia para o senador ${codigoSenador}`);
        return {
          timestamp: new Date().toISOString(),
          origem: endpoint,
          dados: null,
          metadados: {},
          erro: "Resposta vazia da API"
        };
      }
      
      // Verificar se a resposta tem a estrutura esperada
      if (!response.DetalheParlamentar) {
        logger.warn(`Estrutura de dados inválida para o senador ${codigoSenador}`);
        return {
          timestamp: new Date().toISOString(),
          origem: endpoint,
          dados: null,
          metadados: {},
          erro: "Estrutura de dados inválida"
        };
      }
      
      return {
        timestamp: new Date().toISOString(),
        origem: endpoint,
        dados: response.DetalheParlamentar,
        metadados: response.DetalheParlamentar.Metadados || {}
      };
    } catch (error: any) {
      const endpoint = api.replacePath(endpoints.SENADORES.PERFIL.PATH, { codigo: codigoSenador.toString() });
      logger.error(`Erro ao extrair dados básicos do senador ${codigoSenador}: ${error.message}`);
      
      return {
        timestamp: new Date().toISOString(),
        origem: endpoint,
        dados: null,
        metadados: {},
        erro: error.message
      };
    }
  }
  
  /**
   * Extrai mandatos de um senador
   * @param codigoSenador - Código do senador na API
   * @returns Mandatos do senador
   */
  async extractMandatos(codigoSenador: string | number): Promise<PerfilSenadorResult> {
    try {
      logger.info(`Extraindo mandatos do senador código ${codigoSenador}`);
      
      const endpointConfig = endpoints.SENADORES.MANDATOS;
      const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
      const response = await withRetry(
        async () => api.get(endpoint, endpointConfig.PARAMS),
        endpoints.REQUEST.RETRY_ATTEMPTS,
        endpoints.REQUEST.RETRY_DELAY,
        `Extração mandatos do senador ${codigoSenador}`
      );
      
      // Verificação rigorosa da resposta
      if (!response) {
        logger.warn(`Resposta vazia ao buscar mandatos do senador ${codigoSenador}`);
        return {
          timestamp: new Date().toISOString(),
          origem: endpoint,
          dados: null,
          metadados: {},
          erro: "Resposta vazia da API"
        };
      }
      
      // Verificar estrutura da resposta
      if (!response.MandatoParlamentar) {
        logger.warn(`Estrutura de mandatos não encontrada para o senador ${codigoSenador}`);
        return {
          timestamp: new Date().toISOString(),
          origem: endpoint,
          dados: null,
          metadados: {},
          erro: "Estrutura de mandatos não encontrada"
        };
      }
      
      return {
        timestamp: new Date().toISOString(),
        origem: endpoint,
        dados: response.MandatoParlamentar,
        metadados: response.MandatoParlamentar.Metadados || {}
      };
    } catch (error: any) {
      const endpoint = api.replacePath(endpoints.SENADORES.MANDATOS.PATH, { codigo: codigoSenador.toString() });
      logger.error(`Erro ao extrair mandatos do senador ${codigoSenador}: ${error.message}`);
      
      return {
        timestamp: new Date().toISOString(),
        origem: endpoint,
        dados: null,
        metadados: {},
        erro: error.message
      };
    }
  }
  
  /**
   * Extrai cargos de um senador
   * @param codigoSenador - Código do senador na API
   * @returns Cargos do senador
   */
  async extractCargos(codigoSenador: string | number): Promise<PerfilSenadorResult> {
    try {
      logger.info(`Extraindo cargos do senador código ${codigoSenador}`);
      
      const endpointConfig = endpoints.SENADORES.CARGOS;
      const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
      const response = await withRetry(
        async () => api.get(endpoint, endpointConfig.PARAMS),
        endpoints.REQUEST.RETRY_ATTEMPTS,
        endpoints.REQUEST.RETRY_DELAY,
        `Extração cargos do senador ${codigoSenador}`
      );
      
      // Verificação rigorosa da resposta
      if (!response) {
        logger.warn(`Resposta vazia ao buscar cargos do senador ${codigoSenador}`);
        return {
          timestamp: new Date().toISOString(),
          origem: endpoint,
          dados: null,
          metadados: {},
          erro: "Resposta vazia da API"
        };
      }
      
      // Verificar estrutura da resposta
      if (!response.CargoParlamentar) {
        logger.warn(`Estrutura de cargos não encontrada para o senador ${codigoSenador}`);
        return {
          timestamp: new Date().toISOString(),
          origem: endpoint,
          dados: null,
          metadados: {},
          erro: "Estrutura de cargos não encontrada"
        };
      }
      
      return {
        timestamp: new Date().toISOString(),
        origem: endpoint,
        dados: response.CargoParlamentar,
        metadados: response.CargoParlamentar.Metadados || {}
      };
    } catch (error: any) {
      const endpoint = api.replacePath(endpoints.SENADORES.CARGOS.PATH, { codigo: codigoSenador.toString() });
      logger.error(`Erro ao extrair cargos do senador ${codigoSenador}: ${error.message}`);
      
      return {
        timestamp: new Date().toISOString(),
        origem: endpoint,
        dados: null,
        metadados: {},
        erro: error.message
      };
    }
  }
  
  /**
   * Extrai comissões de um senador
   * @param codigoSenador - Código do senador na API
   * @returns Comissões do senador
   */
  async extractComissoes(codigoSenador: string | number): Promise<PerfilSenadorResult> {
    try {
      logger.info(`Extraindo comissões do senador código ${codigoSenador}`);
      
      const endpointConfig = endpoints.SENADORES.COMISSOES;
      const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
      const response = await withRetry(
        async () => api.get(endpoint, endpointConfig.PARAMS),
        endpoints.REQUEST.RETRY_ATTEMPTS,
        endpoints.REQUEST.RETRY_DELAY,
        `Extração comissões do senador ${codigoSenador}`
      );
      
      // Verificação rigorosa da resposta
      if (!response) {
        logger.warn(`Resposta vazia ao buscar comissões do senador ${codigoSenador}`);
        return {
          timestamp: new Date().toISOString(),
          origem: endpoint,
          dados: null,
          metadados: {},
          erro: "Resposta vazia da API"
        };
      }
      
      // Verificar estrutura da resposta
      if (!response.MembroComissaoParlamentar) {
        logger.warn(`Estrutura de comissões não encontrada para o senador ${codigoSenador}`);
        return {
          timestamp: new Date().toISOString(),
          origem: endpoint,
          dados: null,
          metadados: {},
          erro: "Estrutura de comissões não encontrada"
        };
      }
      
      return {
        timestamp: new Date().toISOString(),
        origem: endpoint,
        dados: response.MembroComissaoParlamentar,
        metadados: response.MembroComissaoParlamentar.Metadados || {}
      };
    } catch (error: any) {
      const endpoint = api.replacePath(endpoints.SENADORES.COMISSOES.PATH, { codigo: codigoSenador.toString() });
      logger.error(`Erro ao extrair comissões do senador ${codigoSenador}: ${error.message}`);
      
      return {
        timestamp: new Date().toISOString(),
        origem: endpoint,
        dados: null,
        metadados: {},
        erro: error.message
      };
    }
  }
  
  /**
   * Extrai filiações partidárias de um senador
   * @param codigoSenador - Código do senador na API
   * @returns Filiações do senador
   */
  async extractFiliacoes(codigoSenador: string | number): Promise<PerfilSenadorResult> {
    try {
      logger.info(`Extraindo filiações do senador código ${codigoSenador}`);
      
      const endpointConfig = endpoints.SENADORES.FILIACOES;
      const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
      const response = await withRetry(
        async () => api.get(endpoint, endpointConfig.PARAMS),
        endpoints.REQUEST.RETRY_ATTEMPTS,
        endpoints.REQUEST.RETRY_DELAY,
        `Extração filiações do senador ${codigoSenador}`
      );
      
      // Verificação rigorosa da resposta
      if (!response) {
        logger.warn(`Resposta vazia ao buscar filiações do senador ${codigoSenador}`);
        return {
          timestamp: new Date().toISOString(),
          origem: endpoint,
          dados: null,
          metadados: {},
          erro: "Resposta vazia da API"
        };
      }
      
      // Verificar estrutura da resposta
      if (!response.FiliacaoParlamentar) {
        logger.warn(`Estrutura de filiações não encontrada para o senador ${codigoSenador}`);
        return {
          timestamp: new Date().toISOString(),
          origem: endpoint,
          dados: null,
          metadados: {},
          erro: "Estrutura de filiações não encontrada"
        };
      }
      
      return {
        timestamp: new Date().toISOString(),
        origem: endpoint,
        dados: response.FiliacaoParlamentar,
        metadados: response.FiliacaoParlamentar.Metadados || {}
      };
    } catch (error: any) {
      const endpoint = api.replacePath(endpoints.SENADORES.FILIACOES.PATH, { codigo: codigoSenador.toString() });
      logger.error(`Erro ao extrair filiações do senador ${codigoSenador}: ${error.message}`);
      
      return {
        timestamp: new Date().toISOString(),
        origem: endpoint,
        dados: null,
        metadados: {},
        erro: error.message
      };
    }
  }
  
  /**
   * Extrai histórico acadêmico de um senador
   * @param codigoSenador - Código do senador na API
   * @returns Histórico acadêmico do senador
   */
  async extractHistoricoAcademico(codigoSenador: string | number): Promise<PerfilSenadorResult> {
    try {
      logger.info(`Extraindo histórico acadêmico do senador código ${codigoSenador}`);
      
      const endpointConfig = endpoints.SENADORES.HISTORICO_ACADEMICO;
      const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
      const response = await withRetry(
        async () => api.get(endpoint, endpointConfig.PARAMS),
        endpoints.REQUEST.RETRY_ATTEMPTS,
        endpoints.REQUEST.RETRY_DELAY,
        `Extração histórico acadêmico do senador ${codigoSenador}`
      );
      
      // Verificação rigorosa da resposta
      if (!response) {
        logger.warn(`Resposta vazia ao buscar histórico acadêmico do senador ${codigoSenador}`);
        return {
          timestamp: new Date().toISOString(),
          origem: endpoint,
          dados: null,
          metadados: {},
          erro: "Resposta vazia da API"
        };
      }
      
      // Verificar estrutura da resposta
      if (!response.HistoricoAcademicoParlamentar) {
        logger.warn(`Estrutura de histórico acadêmico não encontrada para o senador ${codigoSenador}`);
        return {
          timestamp: new Date().toISOString(),
          origem: endpoint,
          dados: null,
          metadados: {},
          erro: "Estrutura de histórico acadêmico não encontrada"
        };
      }
      
      return {
        timestamp: new Date().toISOString(),
        origem: endpoint,
        dados: response.HistoricoAcademicoParlamentar,
        metadados: response.HistoricoAcademicoParlamentar.Metadados || {}
      };
    } catch (error: any) {
      const endpoint = api.replacePath(endpoints.SENADORES.HISTORICO_ACADEMICO.PATH, { codigo: codigoSenador.toString() });
      logger.error(`Erro ao extrair histórico acadêmico do senador ${codigoSenador}: ${error.message}`);
      
      return {
        timestamp: new Date().toISOString(),
        origem: endpoint,
        dados: null,
        metadados: {},
        erro: error.message
      };
    }
  }
  
  /**
   * Extrai licenças de um senador
   * @param codigoSenador - Código do senador na API
   * @returns Licenças do senador
   */
  async extractLicencas(codigoSenador: string | number): Promise<PerfilSenadorResult> {
    try {
      logger.info(`Extraindo licenças do senador código ${codigoSenador}`);
      
      const endpointConfig = endpoints.SENADORES.LICENCAS;
      const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
      const response = await withRetry(
        async () => api.get(endpoint, endpointConfig.PARAMS),
        endpoints.REQUEST.RETRY_ATTEMPTS,
        endpoints.REQUEST.RETRY_DELAY,
        `Extração licenças do senador ${codigoSenador}`
      );
      
      // Verificação rigorosa da resposta
      if (!response) {
        logger.warn(`Resposta vazia ao buscar licenças do senador ${codigoSenador}`);
        return {
          timestamp: new Date().toISOString(),
          origem: endpoint,
          dados: null,
          metadados: {},
          erro: "Resposta vazia da API"
        };
      }
      
      // Verificar estrutura da resposta
      if (!response.LicencaParlamentar) {
        logger.warn(`Estrutura de licenças não encontrada para o senador ${codigoSenador}`);
        return {
          timestamp: new Date().toISOString(),
          origem: endpoint,
          dados: null,
          metadados: {},
          erro: "Estrutura de licenças não encontrada"
        };
      }
      
      return {
        timestamp: new Date().toISOString(),
        origem: endpoint,
        dados: response.LicencaParlamentar,
        metadados: response.LicencaParlamentar.Metadados || {}
      };
    } catch (error: any) {
      const endpoint = api.replacePath(endpoints.SENADORES.LICENCAS.PATH, { codigo: codigoSenador.toString() });
      logger.error(`Erro ao extrair licenças do senador ${codigoSenador}: ${error.message}`);
      
      return {
        timestamp: new Date().toISOString(),
        origem: endpoint,
        dados: null,
        metadados: {},
        erro: error.message
      };
    }
  }
  
  /**
   * Extrai profissão de um senador
   * @param codigoSenador - Código do senador na API
   * @returns Profissão do senador
   */
  async extractProfissao(codigoSenador: string | number): Promise<PerfilSenadorResult> {
    try {
      logger.info(`Extraindo profissão do senador código ${codigoSenador}`);
      
      const endpointConfig = endpoints.SENADORES.PROFISSAO;
      const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
      const response = await withRetry(
        async () => api.get(endpoint, endpointConfig.PARAMS),
        endpoints.REQUEST.RETRY_ATTEMPTS,
        endpoints.REQUEST.RETRY_DELAY,
        `Extração profissão do senador ${codigoSenador}`
      );
      
      // Verificação rigorosa da resposta
      if (!response) {
        logger.warn(`Resposta vazia ao buscar profissão do senador ${codigoSenador}`);
        return {
          timestamp: new Date().toISOString(),
          origem: endpoint,
          dados: null,
          metadados: {},
          erro: "Resposta vazia da API"
        };
      }
      
      // A API pode retornar a estrutura errada (na documentação é ProfissaoParlamentar mas pode vir como HistoricoAcademicoParlamentar)
      // Então temos que lidar com os dois casos
      const dadosProfissao = response.ProfissaoParlamentar || response.HistoricoAcademicoParlamentar;
      
      // Verificar estrutura da resposta
      if (!dadosProfissao) {
        logger.warn(`Estrutura de profissão não encontrada para o senador ${codigoSenador}`);
        return {
          timestamp: new Date().toISOString(),
          origem: endpoint,
          dados: null,
          metadados: {},
          erro: "Estrutura de profissão não encontrada"
        };
      }
      
      return {
        timestamp: new Date().toISOString(),
        origem: endpoint,
        dados: dadosProfissao,
        metadados: dadosProfissao.Metadados || {}
      };
    } catch (error: any) {
      const endpoint = api.replacePath(endpoints.SENADORES.PROFISSAO.PATH, { codigo: codigoSenador.toString() });
      logger.error(`Erro ao extrair profissão do senador ${codigoSenador}: ${error.message}`);
      
      return {
        timestamp: new Date().toISOString(),
        origem: endpoint,
        dados: null,
        metadados: {},
        erro: error.message
      };
    }
  }
  
  /**
   * Extrai apartes de um senador
   * @param codigoSenador - Código do senador na API
   * @returns Apartes do senador
   */
  async extractApartes(codigoSenador: string | number): Promise<PerfilSenadorResult> {
    try {
      logger.info(`Extraindo apartes do senador código ${codigoSenador}`);
      
      const endpointConfig = endpoints.SENADORES.APARTES;
      const endpoint = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
      const response = await withRetry(
        async () => api.get(endpoint, endpointConfig.PARAMS),
        endpoints.REQUEST.RETRY_ATTEMPTS,
        endpoints.REQUEST.RETRY_DELAY,
        `Extração apartes do senador ${codigoSenador}`
      );
      
      // Verificação rigorosa da resposta
      if (!response) {
        logger.warn(`Resposta vazia ao buscar apartes do senador ${codigoSenador}`);
        return {
          timestamp: new Date().toISOString(),
          origem: endpoint,
          dados: null,
          metadados: {},
          erro: "Resposta vazia da API"
        };
      }
      
      // Verificar estrutura da resposta
      if (!response.ApartesParlamentar) {
        logger.warn(`Estrutura de apartes não encontrada para o senador ${codigoSenador}`);
        return {
          timestamp: new Date().toISOString(),
          origem: endpoint,
          dados: null,
          metadados: {},
          erro: "Estrutura de apartes não encontrada"
        };
      }
      
      return {
        timestamp: new Date().toISOString(),
        origem: endpoint,
        dados: response.ApartesParlamentar,
        metadados: response.ApartesParlamentar.Metadados || {}
      };
    } catch (error: any) {
      const endpoint = api.replacePath(endpoints.SENADORES.APARTES.PATH, { codigo: codigoSenador.toString() });
      logger.error(`Erro ao extrair apartes do senador ${codigoSenador}: ${error.message}`);
      
      return {
        timestamp: new Date().toISOString(),
        origem: endpoint,
        dados: null,
        metadados: {},
        erro: error.message
      };
    }
  }
  
  /**
   * Extrai perfil completo de múltiplos senadores
   * @param senadores - Lista de códigos de senadores
   * @param concurrency - Número de requisições simultâneas
   * @param maxRetries - Número máximo de retentativas por senador
   * @returns Perfis completos extraídos
   */
  async extractMultiplosPerfis(senadores: (string | number)[], concurrency = 3, maxRetries = 3): Promise<PerfilCompletoResult[]> {
    logger.info(`Extraindo perfis completos de ${senadores.length} senadores (concorrência: ${concurrency})`);
    
    const resultados: PerfilCompletoResult[] = [];
    const totalSenadores = senadores.length;
    
    // Processar em lotes para controlar a concorrência
    for (let i = 0; i < totalSenadores; i += concurrency) {
      const lote = senadores.slice(i, i + concurrency);
      
      // Adicionar um atraso maior entre lotes para evitar sobrecarga na API
      if (i > 0) {
        logger.info(`Aguardando 3 segundos antes de processar o próximo lote de senadores...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // Extrair perfis do lote em paralelo
      const promessas = lote.map(codigo => {
        // Adiciona retentativas para cada senador
        return this.extractPerfilCompletoComRetry(codigo, maxRetries);
      });
      
      try {
        // Aguardar conclusão do lote
        const resultadosLote = await Promise.allSettled(promessas);
        
        // Filtrar apenas os resultados bem-sucedidos
        resultadosLote.forEach(resultado => {
          if (resultado.status === 'fulfilled' && resultado.value) {
            resultados.push(resultado.value);
          } else if (resultado.status === 'rejected') {
            logger.warn(`Falha ao extrair perfil: ${resultado.reason}`);
          }
        });
        
        logger.info(`Progresso: ${Math.min(i + concurrency, totalSenadores)}/${totalSenadores} senadores`);
      } catch (error: any) {
        logger.error(`Erro ao processar lote de senadores: ${error.message}`);
        // Continua o processamento mesmo com erro
      }
    }
    
    logger.info(`Extração concluída: ${resultados.length}/${totalSenadores} perfis extraídos com sucesso`);
    
    return resultados;
  }
  
  /**
   * Extrai perfil completo de um senador com retentativas
   * @param codigoSenador - Código do senador
   * @param maxRetries - Número máximo de retentativas
   * @returns Perfil completo
   */
  private async extractPerfilCompletoComRetry(codigoSenador: string | number, maxRetries = 3): Promise<PerfilCompletoResult> {
    let tentativas = 0;
    
    while (tentativas < maxRetries) {
      try {
        tentativas++;
        return await this.extractPerfilCompleto(codigoSenador);
      } catch (error: any) {
        logger.warn(`Tentativa ${tentativas}/${maxRetries} falhou para senador ${codigoSenador}: ${error.message}`);
        
        if (tentativas >= maxRetries) {
          // Retorna objeto mínimo em vez de lançar erro depois de todas as tentativas
          return {
            timestamp: new Date().toISOString(),
            codigo: codigoSenador,
            dadosBasicos: {
              timestamp: new Date().toISOString(),
              origem: api.replacePath(endpoints.SENADORES.PERFIL.PATH, { codigo: codigoSenador.toString() }),
              dados: null,
              metadados: {},
              erro: error.message
            },
            erro: `Falha após ${maxRetries} tentativas: ${error.message}`
          };
        }
        
        // Espera antes de tentar novamente (tempo crescente entre tentativas)
        const tempoEspera = 2000 * tentativas;
        logger.info(`Aguardando ${tempoEspera/1000} segundos antes de tentar novamente para o senador ${codigoSenador}...`);
        await new Promise(resolve => setTimeout(resolve, tempoEspera));
      }
    }
    
    // Isso nunca deve ser alcançado por causa da condicional acima,
    // mas o TypeScript precisa de um retorno explícito
    throw new Error(`Não foi possível extrair o perfil do senador ${codigoSenador} após ${maxRetries} tentativas`);
  }
}

// Exporta uma instância do extrator
export const perfilSenadoresExtractor = new PerfilSenadoresExtractor();
