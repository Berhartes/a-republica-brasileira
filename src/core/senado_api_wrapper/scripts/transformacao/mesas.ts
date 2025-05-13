/**
 * Transformador para dados de Mesas Diretoras
 */
import { logger } from '../utils/logger';
import { ResultadoCompletoExtracao } from '../extracao/mesas';

// Interface atualizada para compatibilidade
export interface ResultadoCompletoExtracaoModificado extends ResultadoCompletoExtracao {}

// Interface para a estrutura de dados extraída
interface ExtractionResult {
  timestamp: string;
  mesas: {
    senado: {
      timestamp: string;
      tipo: 'senado';
      dados: any;
    };
    congresso: {
      timestamp: string;
      tipo: 'congresso';
      dados: any;
    };
  };
}

// Interface para membro da mesa
interface MembroMesa {
  codigo: string | number;
  nome: string;
  cargo: {
    codigo: string | number;
    descricao: string;
  };
  partido?: string;
  uf?: string;
}

// Interface para mesa transformada
export interface MesaTransformada {
  codigo: string | number;
  nome: string;
  sigla?: string;
  tipo: 'senado' | 'congresso';
  atualizadoEm: string;
  cargos: Array<{
    codigo: string | number;
    descricao: string;
    parlamentar?: {
      codigo: string | number;
      nome: string;
      partido?: string;
      uf?: string;
    };
  }>;
  membros: Array<MembroMesa>;
}

// Interface para o resultado da transformação
export interface ResultadoTransformacao {
  timestamp: string;
  total: number;
  mesas: MesaTransformada[];
}

/**
 * Classe para transformação de dados de mesas diretoras
 */
export class MesaTransformer {
  /**
   * Transforma os dados extraídos das mesas em formato padronizado
   */
  transformMesas(extractionResult: ExtractionResult | ResultadoCompletoExtracao): ResultadoTransformacao {
    logger.info('Transformando dados de mesas diretoras');
    
    // Compatibilidade para aceitar ambos os tipos
    const mesas = (extractionResult as any).mesas || extractionResult;
    const mesasTransformadas: MesaTransformada[] = [];
    
    // Transformar Mesa do Senado
    try {
      const senado = this.transformMesaSenado(mesas.senado);
      if (senado) {
        mesasTransformadas.push(senado);
      }
    } catch (error: any) {
      logger.error(`Erro ao transformar Mesa do Senado: ${error.message}`, error);
    }
    
    // Transformar Mesa do Congresso
    try {
      const congresso = this.transformMesaCongresso(mesas.congresso);
      if (congresso) {
        mesasTransformadas.push(congresso);
      }
    } catch (error: any) {
      logger.error(`Erro ao transformar Mesa do Congresso: ${error.message}`, error);
    }
    
    logger.info(`Transformadas ${mesasTransformadas.length} mesas diretoras`);
    
    return {
      timestamp: new Date().toISOString(),
      total: mesasTransformadas.length,
      mesas: mesasTransformadas
    };
  }
  
  /**
   * Transforma especificamente a Mesa do Senado
   */
  private transformMesaSenado(mesaSenado: { timestamp: string; tipo: 'senado'; dados: any }): MesaTransformada | null {
    logger.info('Transformando dados da Mesa do Senado');
    
    try {
      // Extrair dados relevantes da estrutura da API
      const dados = mesaSenado.dados;
      
      // Acessar a estrutura correta da resposta - ajuste conforme a estrutura real
      const mesaSF = dados?.MesaComposicao?.Colegiado || {};
      
      if (!mesaSF) {
        logger.warn('Dados da Mesa do Senado inválidos ou ausentes');
        return null;
      }
      
      // Obter informações básicas do colegiado
      const codigoMesa = mesaSF.CodigoColegiado || '1'; // Valor padrão caso não exista
      const nomeMesa = mesaSF.NomeColegiado || 'Mesa do Senado Federal';
      const siglaMesa = mesaSF.SiglaColegiado || 'MSF';
      
      // Processar cargos e membros
      const cargosData = mesaSF.Cargos?.Cargo || [];
      const cargos = Array.isArray(cargosData) ? cargosData : [cargosData];
      
      const cargosTransformados = [];
      const membrosTransformados = [];
      
      for (const cargo of cargos) {
        // Dados do cargo
        const codigoCargo = cargo.CodigoCargo;
        const descricaoCargo = cargo.DescricaoCargo;
        
        // Dados do parlamentar no cargo
        const parlamentar = cargo.Parlamentar?.IdentificacaoParlamentar;
        
        if (parlamentar) {
          // Adicionar ao array de cargos
          cargosTransformados.push({
            codigo: codigoCargo,
            descricao: descricaoCargo,
            parlamentar: {
              codigo: parlamentar.CodigoParlamentar,
              nome: parlamentar.NomeParlamentar,
              partido: parlamentar.SiglaPartidoParlamentar,
              uf: parlamentar.UfParlamentar
            }
          });
          
          // Adicionar ao array de membros
          membrosTransformados.push({
            codigo: parlamentar.CodigoParlamentar,
            nome: parlamentar.NomeParlamentar,
            cargo: {
              codigo: codigoCargo,
              descricao: descricaoCargo
            },
            partido: parlamentar.SiglaPartidoParlamentar,
            uf: parlamentar.UfParlamentar
          });
        } else {
          // Adicionar cargo sem ocupante
          cargosTransformados.push({
            codigo: codigoCargo,
            descricao: descricaoCargo
          });
        }
      }
      
      return {
        codigo: codigoMesa,
        nome: nomeMesa,
        sigla: siglaMesa,
        tipo: 'senado',
        atualizadoEm: mesaSenado.timestamp,
        cargos: cargosTransformados,
        membros: membrosTransformados
      };
    } catch (error: any) {
      logger.error(`Erro ao transformar Mesa do Senado: ${error.message}`, error);
      return null;
    }
  }
  
  /**
   * Transforma especificamente a Mesa do Congresso
   */
  private transformMesaCongresso(mesaCongresso: { timestamp: string; tipo: 'congresso'; dados: any }): MesaTransformada | null {
    logger.info('Transformando dados da Mesa do Congresso');
    
    try {
      // Extrair dados relevantes da estrutura da API
      const dados = mesaCongresso.dados;
      
      // Acessar a estrutura correta da resposta - ajuste conforme a estrutura real
      const mesaCN = dados?.MesaComposicao?.Colegiado || {};
      
      if (!mesaCN) {
        logger.warn('Dados da Mesa do Congresso inválidos ou ausentes');
        return null;
      }
      
      // Obter informações básicas do colegiado
      const codigoMesa = mesaCN.CodigoColegiado || '2'; // Valor padrão caso não exista
      const nomeMesa = mesaCN.NomeColegiado || 'Mesa do Congresso Nacional';
      const siglaMesa = mesaCN.SiglaColegiado || 'MCN';
      
      // Processar cargos e membros
      const cargosData = mesaCN.Cargos?.Cargo || [];
      const cargos = Array.isArray(cargosData) ? cargosData : [cargosData];
      
      const cargosTransformados = [];
      const membrosTransformados = [];
      
      for (const cargo of cargos) {
        // Dados do cargo
        const codigoCargo = cargo.CodigoCargo;
        const descricaoCargo = cargo.DescricaoCargo;
        
        // Dados do parlamentar no cargo
        const parlamentar = cargo.Parlamentar?.IdentificacaoParlamentar;
        
        if (parlamentar) {
          // Adicionar ao array de cargos
          cargosTransformados.push({
            codigo: codigoCargo,
            descricao: descricaoCargo,
            parlamentar: {
              codigo: parlamentar.CodigoParlamentar,
              nome: parlamentar.NomeParlamentar,
              partido: parlamentar.SiglaPartidoParlamentar,
              uf: parlamentar.UfParlamentar
            }
          });
          
          // Adicionar ao array de membros
          membrosTransformados.push({
            codigo: parlamentar.CodigoParlamentar,
            nome: parlamentar.NomeParlamentar,
            cargo: {
              codigo: codigoCargo,
              descricao: descricaoCargo
            },
            partido: parlamentar.SiglaPartidoParlamentar,
            uf: parlamentar.UfParlamentar
          });
        } else {
          // Adicionar cargo sem ocupante
          cargosTransformados.push({
            codigo: codigoCargo,
            descricao: descricaoCargo
          });
        }
      }
      
      return {
        codigo: codigoMesa,
        nome: nomeMesa,
        sigla: siglaMesa,
        tipo: 'congresso',
        atualizadoEm: mesaCongresso.timestamp,
        cargos: cargosTransformados,
        membros: membrosTransformados
      };
    } catch (error: any) {
      logger.error(`Erro ao transformar Mesa do Congresso: ${error.message}`, error);
      return null;
    }
  }
}

// Exporta uma instância do transformador
export const mesaTransformer = new MesaTransformer();
