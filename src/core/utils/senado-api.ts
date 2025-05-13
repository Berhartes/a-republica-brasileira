// src/core/utils/senado-api.ts
// Utilitário para facilitar o uso da API do Senado em todo o projeto

import { SenadoApiWrapper } from "../functions/senado_api_wrapper/dist";

// Cache para armazenar resultados temporariamente e reduzir chamadas repetidas à API
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos em milissegundos

/**
 * Classe utilitária para acessar dados da API do Senado com cache integrado
 */
export class SenadoApiUtil {
  private static instance: SenadoApiUtil;
  private api: SenadoApiWrapper;

  private constructor() {
    this.api = new SenadoApiWrapper({
      httpClientConfig: {
        timeout: 20000, // 20 segundos de timeout
      }
    });
  }

  /**
   * Obtém uma instância singleton do utilitário da API do Senado
   */
  public static getInstance(): SenadoApiUtil {
    if (!SenadoApiUtil.instance) {
      SenadoApiUtil.instance = new SenadoApiUtil();
    }
    return SenadoApiUtil.instance;
  }

  /**
   * Limpa o cache de um tipo específico ou todo o cache se nenhum tipo for especificado
   */
  public limparCache(tipo?: string): void {
    if (tipo) {
      // Remover apenas as entradas que começam com o tipo especificado
      for (const key of apiCache.keys()) {
        if (key.startsWith(`${tipo}:`)) {
          apiCache.delete(key);
        }
      }
      console.log(`Cache do tipo '${tipo}' foi limpo.`);
    } else {
      // Limpar todo o cache
      apiCache.clear();
      console.log("Todo o cache da API do Senado foi limpo.");
    }
  }

  /**
   * Método genérico para executar operações na API com cache
   * @param tipo Tipo da operação (para identificação no cache)
   * @param chave Chave específica da operação 
   * @param operacao Função assíncrona que realiza a chamada à API
   * @returns Resultado da operação (do cache ou da API)
   */
  private async executarComCache<T>(
    tipo: string,
    chave: string,
    operacao: () => Promise<T>
  ): Promise<T> {
    const cacheKey = `${tipo}:${chave}`;
    
    // Verificar se temos dados em cache e se ainda estão válidos
    if (apiCache.has(cacheKey)) {
      const cacheEntry = apiCache.get(cacheKey);
      const agora = Date.now();
      
      if (cacheEntry && agora - cacheEntry.timestamp < CACHE_DURATION) {
        console.log(`Usando dados em cache para ${cacheKey}`);
        return cacheEntry.data as T;
      }
      
      // Cache expirado
      if (cacheEntry) {
        console.log(`Cache expirado para ${cacheKey}`);
        apiCache.delete(cacheKey);
      }
    }
    
    // Executar a operação e armazenar no cache
    try {
      console.log(`Buscando dados frescos para ${cacheKey}`);
      const resultado = await operacao();
      
      // Armazenar no cache
      apiCache.set(cacheKey, {
        data: resultado,
        timestamp: Date.now()
      });
      
      return resultado;
    } catch (error) {
      console.error(`Erro ao executar operação ${cacheKey}:`, error);
      throw error;
    }
  }

  // ========== MÉTODOS PARA PARLAMENTARES ==========

  /**
   * Retorna a lista de parlamentares com filtros opcionais
   */
  public async obterParlamentares(emExercicio = true) {
    return this.executarComCache(
      'parlamentares',
      `lista:${emExercicio ? 'ativos' : 'todos'}`,
      () => this.api.parlamentar.listarParlamentares({ emExercicio })
    );
  }

  /**
   * Obtém detalhes de um parlamentar específico por código
   */
  public async obterDetalhesParlamentar(codigo: string) {
    return this.executarComCache(
      'parlamentar',
      `detalhes:${codigo}`,
      () => this.api.parlamentar.obterDetalhesParlamentar(codigo)
    );
  }

  /**
   * Obtém a lista de senadores por partido
   */
  public async obterSenadoresPorPartido(siglaPartido: string) {
    const parlamentares = await this.obterParlamentares(true) as any[];
    return parlamentares.filter((p: any) => 
      p.SiglaPartidoParlamentar?.toUpperCase() === siglaPartido.toUpperCase()
    );
  }

  /**
   * Obtém a lista de senadores por estado
   */
  public async obterSenadoresPorEstado(uf: string) {
    const parlamentares = await this.obterParlamentares(true) as any[];
    return parlamentares.filter((p: any) => 
      p.UfParlamentar?.toUpperCase() === uf.toUpperCase()
    );
  }

  /**
   * Obtém mandatos de um parlamentar específico
   */
  public async obterMandatosParlamentar(id: string) {
    return this.executarComCache(
      'mandatos',
      `senador:${id}`,
      () => this.api.parlamentar.obterMandatosParlamentar(id)
    );
  }

  /**
   * Obtém comissoes de um parlamentar específico
   */
  public async obterComissoesParlamentar(id: string) {
    return this.executarComCache(
      'comissoes',
      `senador:${id}`,
      () => this.api.parlamentar.obterComissoesParlamentar(id)
    );
  }

  // ========== MÉTODOS PARA COMISSÕES ==========

  /**
   * Retorna a lista de comissões com filtros opcionais
   */
  public async obterComissoes(casa: 'SF' | 'CN' | 'CD' = 'SF', ativas = true) {
    return this.executarComCache(
      'comissoes',
      `lista:${casa}:${ativas ? 'ativas' : 'todas'}`,
      () => this.api.comissao.listarComissoes({ casa, ativas })
    );
  }

  /**
   * Obtém detalhes de uma comissão específica por código
   */
  public async obterDetalhesComissao(codigo: string) {
    return this.executarComCache(
      'comissao',
      `detalhes:${codigo}`,
      () => this.api.comissao.obterDetalhesComissao(codigo)
    );
  }

  // ========== MÉTODOS PARA COMPOSIÇÃO ==========

  /**
   * Retorna a lista de partidos políticos
   */
  public async obterPartidos() {
    return this.executarComCache(
      'partidos',
      'lista',
      () => this.api.composicao.listarPartidos()
    );
  }

  /**
   * Obtém a composição da mesa diretora (SF = Senado Federal, CN = Congresso Nacional)
   */
  public async obterMesaDiretora(casa: "SF" | "CN") {
    return this.executarComCache(
      'mesa',
      `composicao:${casa}`,
      () => this.api.composicao.obterComposicaoMesa(casa)
    );
  }

  // ========== MÉTODOS PARA SESSÕES PLENÁRIAS ==========

  /**
   * Obtém sessões plenárias por período
   * Datas no formato YYYYMMDD (ex: 20230101)
   */
  public async obterSessoesPlenarias(dataInicio: string, dataFim: string) {
    return this.executarComCache(
      'sessoes',
      `periodo:${dataInicio}-${dataFim}`,
      () => this.api.plenario.listarSessoesPlenarias({ dataInicio, dataFim })
    );
  }

  /**
   * Formata uma data no padrão esperado pela API (YYYYMMDD)
   */
  public formatarData(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}${mes}${dia}`;
  }

  /**
   * Obtém sessões plenárias dos últimos N dias
   */
  public async obterSessoesPlenariasRecentesPorDias(dias: number) {
    const hoje = new Date();
    const dataFim = this.formatarData(hoje);
    
    const dataInicial = new Date();
    dataInicial.setDate(dataInicial.getDate() - dias);
    const dataInicio = this.formatarData(dataInicial);
    
    return this.obterSessoesPlenarias(dataInicio, dataFim);
  }

  // ========== MÉTODOS PARA VOTAÇÕES ==========

  /**
   * Obtém votações por período
   * Datas no formato YYYYMMDD (ex: 20230101)
   */
  public async obterVotacoesPorPeriodo(dataInicio: string, dataFim: string) {
    return this.executarComCache(
      'votacoes',
      `periodo:${dataInicio}-${dataFim}`,
      () => this.api.votacao.listarVotacoes({ dataInicio, dataFim })
    );
  }

  /**
   * Obtém votações de um parlamentar específico
   */
  // public async obterVotacoesParlamentar(codigoParlamentar: string) {
  //   return this.executarComCache(
  //     'votacoes',
  //     `parlamentar:${codigoParlamentar}`,
  //     () => this.api.votacao.obterVotacoesParlamentar(codigoParlamentar)
  //   );
  // }
}

// Exportar uma instância já pronta para uso
export const senadoApi = SenadoApiUtil.getInstance();

// Exemplo de uso:
// import { senadoApi } from './path/to/senado-api';
// 
// async function getSenadoresAtivos() {
//   const senadores = await senadoApi.obterParlamentares(true);
//   return senadores;
// }
