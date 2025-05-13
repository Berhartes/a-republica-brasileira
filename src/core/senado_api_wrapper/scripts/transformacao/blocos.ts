/**
 * Transformador para dados de Blocos Parlamentares
 */
import { logger } from '../utils/logger';

// Interface para a estrutura de dados extraída
interface ExtractionResult {
  lista: {
    timestamp: string;
    total: number;
    blocos: Array<any>;
  };
  detalhes: Array<{
    timestamp: string;
    codigo: string | number;
    detalhes: any;
  }>;
}

// Interface para membro/partido do bloco
interface MembroBloco {
  Partido: {
    CodigoPartido: string | number;
    NomePartido: string;
    SiglaPartido: string;
  };
  DataAdesao?: string;
  DataDesligamento?: string | null;
}

// Interface para bloco transformado
export interface BlocoTransformado {
  codigo: string | number;
  nome: string;
  sigla?: string;
  dataCriacao?: string;
  dataExtincao?: string | null;
  atualizadoEm: string;
  detalhesAtualizadosEm?: string;
  partidos: Array<{
    codigo: string | number;
    nome: string;
    sigla: string;
    dataAdesao?: string;
    dataDesligamento?: string | null;
  }>;
  composicao?: any;
  liderancas?: any;
  lider?: {
    codigo: string | number;
    nome: string;
    partido?: string;
    uf?: string;
  };
}

// Interface para resultado da transformação
export interface ResultadoTransformacao {
  timestamp: string;
  total: number;
  blocos: BlocoTransformado[];
}

/**
 * Classe para transformação de dados de blocos parlamentares
 */
export class BlocoTransformer {
  /**
   * Transforma os dados de blocos em formato otimizado para Firestore
   */
  transformBlocos(extractionResult: ExtractionResult): ResultadoTransformacao {
    logger.info('Transformando dados de blocos parlamentares');
    
    const { lista, detalhes } = extractionResult;
    
    // Mapa para armazenar os dados transformados
    const blocosMapa: Record<string, BlocoTransformado> = {};
    
    // Primeiro, processar a lista básica
    lista.blocos.forEach(bloco => {
      const codigo = bloco.CodigoBloco;
      if (!codigo) return;
      
      blocosMapa[String(codigo)] = {
        codigo: codigo,
        nome: bloco.NomeBloco,
        sigla: bloco.NomeApelido,
        dataCriacao: bloco.DataCriacao,
        dataExtincao: bloco.DataExtincao,
        atualizadoEm: lista.timestamp,
        partidos: [],
      };
      
      // Processar membros/partidos se existirem
      if (bloco.Membros && bloco.Membros.Membro) {
        const membros = Array.isArray(bloco.Membros.Membro) 
          ? bloco.Membros.Membro 
          : [bloco.Membros.Membro];
        
        membros.forEach((membro: MembroBloco) => {
          const partido = membro.Partido;
          if (!partido) return;
          
          blocosMapa[String(codigo)].partidos.push({
            codigo: partido.CodigoPartido,
            nome: partido.NomePartido,
            sigla: partido.SiglaPartido,
            dataAdesao: membro.DataAdesao,
            dataDesligamento: membro.DataDesligamento || null
          });
        });
      }
    });
    
    // Em seguida, enriquecer com detalhes quando disponíveis
    detalhes.forEach(detalhe => {
      const codigo = detalhe.codigo;
      if (!codigo || !blocosMapa[String(codigo)]) return;
      
      // Adicionar campos extras dos detalhes
      if (detalhe.detalhes) {
        blocosMapa[String(codigo)].detalhesAtualizadosEm = detalhe.timestamp;
        
        // Adicionar dados da composição se existir
        if (detalhe.detalhes.composicaoBloco) {
          blocosMapa[String(codigo)].composicao = detalhe.detalhes.composicaoBloco;
        }
        
        // Adicionar dados das lideranças se existir
        if (detalhe.detalhes.unidadesLiderancaBloco) {
          blocosMapa[String(codigo)].liderancas = detalhe.detalhes.unidadesLiderancaBloco;
        }
        
        // Adicionar mais campos que possam ser úteis dos detalhes
        if (detalhe.detalhes.Lider) {
          blocosMapa[String(codigo)].lider = {
            codigo: detalhe.detalhes.Lider.IdentificacaoParlamentar?.CodigoParlamentar,
            nome: detalhe.detalhes.Lider.IdentificacaoParlamentar?.NomeParlamentar,
            partido: detalhe.detalhes.Lider.IdentificacaoParlamentar?.SiglaPartido,
            uf: detalhe.detalhes.Lider.IdentificacaoParlamentar?.UfParlamentar
          };
        }
      }
    });
    
    // Converter o mapa em array
    const blocosArray = Object.values(blocosMapa);
    
    logger.info(`Transformados ${blocosArray.length} blocos parlamentares`);
    
    return {
      timestamp: new Date().toISOString(),
      total: blocosArray.length,
      blocos: blocosArray
    };
  }
}

// Exporta uma instância do transformador
export const blocoTransformer = new BlocoTransformer();
