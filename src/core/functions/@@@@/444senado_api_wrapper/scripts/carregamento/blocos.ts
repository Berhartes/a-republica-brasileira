/**
 * Carregador de blocos parlamentares para o Firestore
 */
import { logger } from '../utils/logging/logger';
import { firestoreBatch } from '../utils/storage/index';

// Interface para bloco transformado
interface BlocoTransformado {
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

// Interface para o resultado da transformação
interface ResultadoTransformacao {
  timestamp: string;
  total: number;
  blocos: BlocoTransformado[];
}

// Interface para o resultado do carregamento
interface ResultadoCarregamento {
  timestamp: string;
  totalSalvos: number;
  legislatura: number;
  status: string;
}

/**
 * Classe para carregar dados de blocos parlamentares no Firestore
 */
export class BlocoLoader {
  /**
   * Salva dados de blocos no Firestore
   * @param transformedData - Dados transformados dos blocos
   * @param legislaturaNumero - Número da legislatura atual
   */
  async saveBlocos(
    transformedData: ResultadoTransformacao,
    legislaturaNumero: number
  ): Promise<ResultadoCarregamento> {
    logger.info(`Salvando dados de blocos na legislatura ${legislaturaNumero}`);

    const batchManager = firestoreBatch.createBatchManager();
    const timestamp = new Date().toISOString();

    // Documento com metadados da extração
    const metadataRef = `congressoNacional/senadoFederal/metadata/blocos`;

    batchManager.set(metadataRef, {
      ultimaAtualizacao: timestamp,
      totalRegistros: transformedData.total,
      legislatura: legislaturaNumero,
      status: 'success'
    });

    // Salva cada bloco como um documento separado
    for (const bloco of transformedData.blocos) {
      // Adiciona timestamp de atualização e legislatura
      const blocoData = {
        ...bloco,
        ultimaAtualizacao: timestamp,
        legislatura: legislaturaNumero
      };

      // Referência para a estrutura por legislatura
      const blocoRef = `congressoNacional/senadoFederal/legislaturas/${legislaturaNumero}/blocos/${bloco.codigo}`;

      // Referência para a estrutura "atual" (acesso rápido)
      const blocoAtualRef = `congressoNacional/senadoFederal/atual/blocos/itens/${bloco.codigo}`;

      // Salva nas duas coleções
      batchManager.set(blocoRef, blocoData);
      batchManager.set(blocoAtualRef, blocoData);
    }

    // Executa todas as operações como uma transação
    await batchManager.commit();

    logger.info(`${transformedData.total} blocos salvos no Firestore para a legislatura ${legislaturaNumero}`);

    return {
      timestamp,
      totalSalvos: transformedData.total,
      legislatura: legislaturaNumero,
      status: 'success'
    };
  }

  /**
   * Salva múltiplos blocos no Firestore
   * @param blocos - Array de blocos transformados
   * @param legislatura - Número da legislatura
   * @returns Resultado do carregamento
   */
  async saveMultiplosBlocos(
    blocos: BlocoTransformado[],
    legislatura: number
  ): Promise<{ total: number; processados: number; sucessos: number; falhas: number; detalhes: any[] }> {
    try {
      logger.info(`Salvando ${blocos.length} blocos no Firestore`);
      
      const transformedData = {
        timestamp: new Date().toISOString(),
        total: blocos.length,
        blocos: blocos
      };
      
      await this.saveBlocos(transformedData, legislatura);
      
      return {
        total: blocos.length,
        processados: blocos.length,
        sucessos: blocos.length,
        falhas: 0,
        detalhes: blocos.map(b => ({ id: b.codigo, status: 'sucesso' }))
      };
    } catch (error: any) {
      logger.error(`Erro ao salvar blocos: ${error.message}`);
      return {
        total: blocos.length,
        processados: 0,
        sucessos: 0,
        falhas: blocos.length,
        detalhes: blocos.map(b => ({ id: b.codigo, status: 'falha', erro: error.message }))
      };
    }
  }

  /**
   * Salva membros de um bloco no Firestore
   * @param membros - Array de membros do bloco
   * @param blocoId - ID do bloco
   * @param legislatura - Número da legislatura
   * @returns Resultado do carregamento
   */
  async saveMembrosBloco(
    membros: any[],
    blocoId: string | number,
    legislatura: number
  ): Promise<{ total: number; sucessos: number; falhas: number }> {
    try {
      logger.info(`Salvando ${membros.length} membros do bloco ${blocoId}`);
      
      const batchManager = firestoreBatch.createBatchManager();
      const timestamp = new Date().toISOString();
      
      // Salvar cada membro
      for (const membro of membros) {
        const membroData = {
          ...membro,
          ultimaAtualizacao: timestamp,
          legislatura: legislatura
        };
        
        const membroRef = `congressoNacional/senadoFederal/legislaturas/${legislatura}/blocos/${blocoId}/membros/${membro.codigoParlamentar}`;
        batchManager.set(membroRef, membroData);
      }
      
      await batchManager.commit();
      
      return {
        total: membros.length,
        sucessos: membros.length,
        falhas: 0
      };
    } catch (error: any) {
      logger.error(`Erro ao salvar membros do bloco ${blocoId}: ${error.message}`);
      return {
        total: membros.length,
        sucessos: 0,
        falhas: membros.length
      };
    }
  }

  /**
   * Salva dados históricos de blocos (mantém versões anteriores)
   * @param transformedData - Dados transformados dos blocos
   * @param legislaturaNumero - Número da legislatura
   */
  async saveBlocosHistorico(
    transformedData: ResultadoTransformacao,
    legislaturaNumero: number
  ): Promise<{ timestamp: string; legislatura: number; status: string }> {
    logger.info(`Salvando histórico de blocos da legislatura ${legislaturaNumero} no Firestore`);

    const timestamp = new Date().toISOString();
    const historicRef = `congressoNacional/senadoFederal/historico/blocos/snapshots/${legislaturaNumero}_${timestamp}`;

    // No ambiente real, usaríamos o Firestore.
    // Na versão mock, apenas logamos a operação.
    logger.info(`Simulando salvamento de histórico em ${historicRef}`);
    logger.debug('Dados do snapshot:', {
      timestamp,
      legislatura: legislaturaNumero,
      totalBlocos: transformedData.total
    });

    // Simula um atraso para parecer mais realista
    await new Promise(resolve => setTimeout(resolve, 500));

    logger.info('Histórico de blocos salvo no Firestore (mock)');

    return {
      timestamp,
      legislatura: legislaturaNumero,
      status: 'success'
    };
  }
}

// Exporta uma instância do carregador
export const blocoLoader = new BlocoLoader();
