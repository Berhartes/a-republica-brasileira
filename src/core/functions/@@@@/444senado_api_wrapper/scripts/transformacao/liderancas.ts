/**
 * Transformador para dados de Lideranças do Senado Federal
 */
import { logger } from '../utils/logging/logger';

// Interface para a estrutura de dados extraída
interface ExtractionResult {
  timestamp: string;
  liderancas: any;
  referencias: {
    tiposUnidade: any;
    tiposLideranca: any;
    tiposCargo: any;
  };
}

// Interface para membro de liderança transformado
export interface MembroLiderancaTransformado {
  codigo: string | number;
  nome: string;
  cargo?: string;
  partido?: string;
  uf?: string;
}

// Interface para liderança transformada
export interface LiderancaTransformada {
  codigo: string | number;
  nome: string;
  descricao?: string;
  sigla?: string;
  tipo: {
    codigo: string | number;
    descricao: string;
  };
  parlamentar?: {
    codigo: string | number;
    nome: string;
    partido?: string;
    uf?: string;
  };
  unidade?: {
    codigo: string | number;
    descricao: string;
  };
  membros?: MembroLiderancaTransformado[];
  atualizadoEm: string;
}

// Interface para tipo de liderança transformado
export interface TipoLiderancaTransformado {
  codigo: string | number;
  descricao: string;
  atualizadoEm: string;
}

// Interface para tipo de unidade transformado
export interface TipoUnidadeTransformado {
  codigo: string | number;
  descricao: string;
  atualizadoEm: string;
}

// Interface para tipo de cargo transformado
export interface TipoCargoTransformado {
  codigo: string | number;
  descricao: string;
  atualizadoEm: string;
}

// Interface para o resultado da transformação
export interface ResultadoTransformacao {
  timestamp: string;
  liderancas: {
    itens: LiderancaTransformada[];
    total: number;
  };
  referencias: {
    tiposLideranca: TipoLiderancaTransformado[];
    tiposUnidade: TipoUnidadeTransformado[];
    tiposCargo: TipoCargoTransformado[];
  };
}

/**
 * Classe para transformação de dados de lideranças
 */
export class LiderancaTransformer {
  /**
   * Transforma os dados extraídos das lideranças em formato padronizado
   */
  transformLiderancas(extractionResult: ExtractionResult): ResultadoTransformacao {
    logger.info('Transformando dados de lideranças');
    
    const { liderancas, referencias } = extractionResult;
    const timestamp = new Date().toISOString();
    
    // Transformar lideranças
    const liderancasTransformadas = this.transformarListaLiderancas(liderancas, timestamp);
    
    // Transformar referências
    const tiposLiderancaTransformados = this.transformarTiposLideranca(referencias.tiposLideranca, timestamp);
    const tiposUnidadeTransformados = this.transformarTiposUnidade(referencias.tiposUnidade, timestamp);
    const tiposCargoTransformados = this.transformarTiposCargo(referencias.tiposCargo, timestamp);
    
    logger.info(`Transformadas ${liderancasTransformadas.length} lideranças`);
    logger.info(`Transformados ${tiposLiderancaTransformados.length} tipos de liderança`);
    logger.info(`Transformados ${tiposUnidadeTransformados.length} tipos de unidade`);
    logger.info(`Transformados ${tiposCargoTransformados.length} tipos de cargo`);
    
    return {
      timestamp,
      liderancas: {
        itens: liderancasTransformadas,
        total: liderancasTransformadas.length
      },
      referencias: {
        tiposLideranca: tiposLiderancaTransformados,
        tiposUnidade: tiposUnidadeTransformados,
        tiposCargo: tiposCargoTransformados
      }
    };
  }
  
  /**
   * Transforma a lista de lideranças
   */
  private transformarListaLiderancas(liderancas: any, timestamp: string): LiderancaTransformada[] {
    try {
      // Obter a lista de lideranças da estrutura da API
      const listaLiderancas = this.extrairDadosLiderancas(liderancas);
      
      if (!listaLiderancas || !Array.isArray(listaLiderancas)) {
        logger.warn('Lista de lideranças inválida ou ausente');
        return [];
      }
      
      // Transformar cada liderança
      return listaLiderancas.map(lideranca => {
        try {
          // Extrair dados básicos da liderança
          const codigo = lideranca.Codigo || '';
          const nome = lideranca.Nome || '';
          const descricao = lideranca.Descricao || '';
          
          // Extrair tipo de liderança
          const tipoLideranca = lideranca.TipoLideranca || {};
          
          // Extrair parlamentar
          const parlamentar = lideranca.Parlamentar?.IdentificacaoParlamentar || {};
          
          // Extrair unidade
          const unidade = lideranca.Unidade || {};
          
          // Criar objeto transformado
          const liderancaTransformada: LiderancaTransformada = {
            codigo,
            nome,
            descricao,
            tipo: {
              codigo: tipoLideranca.Codigo || '',
              descricao: tipoLideranca.Descricao || ''
            },
            atualizadoEm: timestamp
          };
          
          // Adicionar parlamentar se existir
          if (parlamentar.CodigoParlamentar) {
            liderancaTransformada.parlamentar = {
              codigo: parlamentar.CodigoParlamentar,
              nome: parlamentar.NomeParlamentar || '',
              partido: parlamentar.SiglaPartidoParlamentar || '',
              uf: parlamentar.UfParlamentar || ''
            };
          }
          
          // Adicionar unidade se existir
          if (unidade.Codigo) {
            liderancaTransformada.unidade = {
              codigo: unidade.Codigo,
              descricao: unidade.Descricao || ''
            };
          }
          
          return liderancaTransformada;
        } catch (error: any) {
          logger.warn(`Erro ao transformar liderança: ${error.message}`);
          return {
            codigo: lideranca.Codigo || 'erro',
            nome: lideranca.Nome || 'Erro de processamento',
            tipo: {
              codigo: 'erro',
              descricao: 'Erro de processamento'
            },
            atualizadoEm: timestamp
          };
        }
      }).filter(l => l.codigo !== ''); // Filtrar itens sem código
    } catch (error: any) {
      logger.error(`Erro ao transformar lista de lideranças: ${error.message}`, error);
      return [];
    }
  }
  
  /**
   * Extrai a lista de lideranças da estrutura da API
   */
  private extrairDadosLiderancas(liderancas: any): any[] {
    try {
      // Considerando diferentes estruturas possíveis da API
      if (liderancas?.ListaLideranca?.Liderancas?.Lideranca) {
        const listaLiderancas = liderancas.ListaLideranca.Liderancas.Lideranca;
        return Array.isArray(listaLiderancas) ? listaLiderancas : [listaLiderancas];
      } else if (liderancas?.Liderancas?.Lideranca) {
        const listaLiderancas = liderancas.Liderancas.Lideranca;
        return Array.isArray(listaLiderancas) ? listaLiderancas : [listaLiderancas];
      } else if (liderancas?.Lista?.Liderancas) {
        const listaLiderancas = liderancas.Lista.Liderancas;
        return Array.isArray(listaLiderancas) ? listaLiderancas : [listaLiderancas];
      }
      
      // Tenta encontrar qualquer array no objeto que possa conter as lideranças
      for (const key in liderancas) {
        if (Array.isArray(liderancas[key])) {
          return liderancas[key];
        }
        
        if (typeof liderancas[key] === 'object' && liderancas[key] !== null) {
          for (const subKey in liderancas[key]) {
            if (Array.isArray(liderancas[key][subKey])) {
              return liderancas[key][subKey];
            }
            
            if (typeof liderancas[key][subKey] === 'object' && liderancas[key][subKey] !== null) {
              for (const deepKey in liderancas[key][subKey]) {
                if (Array.isArray(liderancas[key][subKey][deepKey])) {
                  return liderancas[key][subKey][deepKey];
                }
              }
            }
          }
        }
      }
      
      logger.warn('Estrutura de lideranças não reconhecida', { liderancas });
      
      return [];
    } catch (error: any) {
      logger.error(`Erro ao extrair dados de lideranças: ${error.message}`, error);
      return [];
    }
  }
  
  /**
   * Transforma os tipos de liderança
   */
  private transformarTiposLideranca(tiposLideranca: any, timestamp: string): TipoLiderancaTransformado[] {
    try {
      // Obter a lista de tipos de liderança da estrutura da API
      let listaTipos: any[] = [];
      
      if (tiposLideranca?.ListaTipoLideranca?.TiposLideranca?.TipoLideranca) {
        const tipos = tiposLideranca.ListaTipoLideranca.TiposLideranca.TipoLideranca;
        listaTipos = Array.isArray(tipos) ? tipos : [tipos];
      } else if (tiposLideranca?.TiposLideranca?.TipoLideranca) {
        const tipos = tiposLideranca.TiposLideranca.TipoLideranca;
        listaTipos = Array.isArray(tipos) ? tipos : [tipos];
      } else {
        // Busca recursiva por uma lista de tipos
        const buscarTipos = (obj: any): any[] => {
          if (!obj || typeof obj !== 'object') return [];
          
          for (const key in obj) {
            if (Array.isArray(obj[key])) {
              return obj[key];
            } else if (typeof obj[key] === 'object') {
              const result = buscarTipos(obj[key]);
              if (result.length > 0) return result;
            }
          }
          
          return [];
        };
        
        listaTipos = buscarTipos(tiposLideranca);
      }
      
      // Transformar cada tipo
      return listaTipos.map(tipo => ({
        codigo: tipo.Codigo || '',
        descricao: tipo.Descricao || '',
        atualizadoEm: timestamp
      })).filter(t => t.codigo !== ''); // Filtrar itens sem código
    } catch (error: any) {
      logger.error(`Erro ao transformar tipos de liderança: ${error.message}`, error);
      return [];
    }
  }
  
  /**
   * Transforma os tipos de unidade
   */
  private transformarTiposUnidade(tiposUnidade: any, timestamp: string): TipoUnidadeTransformado[] {
    try {
      // Obter a lista de tipos de unidade da estrutura da API
      let listaTipos: any[] = [];
      
      if (tiposUnidade?.ListaTipoUnidade?.TiposUnidade?.TipoUnidade) {
        const tipos = tiposUnidade.ListaTipoUnidade.TiposUnidade.TipoUnidade;
        listaTipos = Array.isArray(tipos) ? tipos : [tipos];
      } else if (tiposUnidade?.TiposUnidade?.TipoUnidade) {
        const tipos = tiposUnidade.TiposUnidade.TipoUnidade;
        listaTipos = Array.isArray(tipos) ? tipos : [tipos];
      } else {
        // Busca recursiva por uma lista de tipos
        const buscarTipos = (obj: any): any[] => {
          if (!obj || typeof obj !== 'object') return [];
          
          for (const key in obj) {
            if (Array.isArray(obj[key])) {
              return obj[key];
            } else if (typeof obj[key] === 'object') {
              const result = buscarTipos(obj[key]);
              if (result.length > 0) return result;
            }
          }
          
          return [];
        };
        
        listaTipos = buscarTipos(tiposUnidade);
      }
      
      // Transformar cada tipo
      return listaTipos.map(tipo => ({
        codigo: tipo.Codigo || '',
        descricao: tipo.Descricao || '',
        atualizadoEm: timestamp
      })).filter(t => t.codigo !== ''); // Filtrar itens sem código
    } catch (error: any) {
      logger.error(`Erro ao transformar tipos de unidade: ${error.message}`, error);
      return [];
    }
  }
  
  /**
   * Transforma os tipos de cargo
   */
  private transformarTiposCargo(tiposCargo: any, timestamp: string): TipoCargoTransformado[] {
    try {
      // Obter a lista de tipos de cargo da estrutura da API
      let listaTipos: any[] = [];
      
      if (tiposCargo?.ListaTipoCargo?.TiposCargo?.TipoCargo) {
        const tipos = tiposCargo.ListaTipoCargo.TiposCargo.TipoCargo;
        listaTipos = Array.isArray(tipos) ? tipos : [tipos];
      } else if (tiposCargo?.TiposCargo?.TipoCargo) {
        const tipos = tiposCargo.TiposCargo.TipoCargo;
        listaTipos = Array.isArray(tipos) ? tipos : [tipos];
      } else {
        // Busca recursiva por uma lista de tipos
        const buscarTipos = (obj: any): any[] => {
          if (!obj || typeof obj !== 'object') return [];
          
          for (const key in obj) {
            if (Array.isArray(obj[key])) {
              return obj[key];
            } else if (typeof obj[key] === 'object') {
              const result = buscarTipos(obj[key]);
              if (result.length > 0) return result;
            }
          }
          
          return [];
        };
        
        listaTipos = buscarTipos(tiposCargo);
      }
      
      // Transformar cada tipo
      return listaTipos.map(tipo => ({
        codigo: tipo.Codigo || '',
        descricao: tipo.Descricao || '',
        atualizadoEm: timestamp
      })).filter(t => t.codigo !== ''); // Filtrar itens sem código
    } catch (error: any) {
      logger.error(`Erro ao transformar tipos de cargo: ${error.message}`, error);
      return [];
    }
  }
}

// Exporta uma instância do transformador
export const liderancaTransformer = new LiderancaTransformer();
