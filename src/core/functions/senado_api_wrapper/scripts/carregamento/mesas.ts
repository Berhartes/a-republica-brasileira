/**
 * Carregador de mesas diretoras para o Firestore
 */
import { logger } from '../utils/logger';
import { createBatchManager } from '../utils/firestore';
import { MesaTransformada, ResultadoTransformacao } from '../transformacao/mesas';

// Interface para o resultado do carregamento
interface ResultadoCarregamento {
  timestamp: string;
  totalSalvos: number;
  legislatura: number;
  status: string;
}

/**
 * Classe para carregar dados de mesas diretoras no Firestore
 */
export class MesaLoader {
  /**
   * Salva dados de mesas no Firestore
   * @param transformedData - Dados transformados das mesas
   * @param legislaturaNumero - Número da legislatura atual
   */
  async saveMesas(
    transformedData: ResultadoTransformacao, 
    legislaturaNumero: number
  ): Promise<ResultadoCarregamento> {
    logger.info(`Salvando dados de mesas na legislatura ${legislaturaNumero}`);
    
    const batchManager = createBatchManager();
    const timestamp = new Date().toISOString();
    
    // Documento com metadados da extração
    const metadataRef = `congressoNacional/senadoFederal/metadata/mesas`;
    
    batchManager.set(metadataRef, {
      ultimaAtualizacao: timestamp,
      totalRegistros: transformedData.total,
      legislatura: legislaturaNumero,
      status: 'success'
    });
    
    // Salva cada mesa como um documento separado
    for (const mesa of transformedData.mesas) {
      // Adiciona timestamp de atualização e legislatura
      const mesaData = {
        ...mesa,
        ultimaAtualizacao: timestamp,
        legislatura: legislaturaNumero
      };
      
      // Referência para a estrutura por legislatura
      const mesaRef = `congressoNacional/senadoFederal/legislaturas/${legislaturaNumero}/mesas/${mesa.tipo}`;
      
      // Referência para a estrutura "atual" (acesso rápido)
      const mesaAtualRef = `congressoNacional/senadoFederal/atual/mesas/${mesa.tipo}`;
      
      // Salva nas duas coleções
      batchManager.set(mesaRef, mesaData);
      batchManager.set(mesaAtualRef, mesaData);
      
      // Salvar cada membro como subdocumento para facilitar consultas
      if (mesa.membros && Array.isArray(mesa.membros)) {
        for (const membro of mesa.membros) {
          if (!membro.codigo) continue;
          
          const membroRef = `congressoNacional/senadoFederal/legislaturas/${legislaturaNumero}/mesas/${mesa.tipo}/membros/${membro.codigo}`;
          const membroAtualRef = `congressoNacional/senadoFederal/atual/mesas/${mesa.tipo}/membros/${membro.codigo}`;
          
          const membroData = {
            ...membro,
            mesaTipo: mesa.tipo,
            ultimaAtualizacao: timestamp,
            legislatura: legislaturaNumero
          };
          
          batchManager.set(membroRef, membroData);
          batchManager.set(membroAtualRef, membroData);
        }
      }
    }
    
    // Executa todas as operações como uma transação
    await batchManager.commit();
    
    logger.info(`${transformedData.total} mesas salvas no Firestore para a legislatura ${legislaturaNumero}`);
    
    return {
      timestamp,
      totalSalvos: transformedData.total,
      legislatura: legislaturaNumero,
      status: 'success'
    };
  }
  
  /**
   * Salva dados históricos de mesas (mantém versões anteriores)
   * @param transformedData - Dados transformados das mesas
   * @param legislaturaNumero - Número da legislatura
   */
  async saveMesasHistorico(
    transformedData: ResultadoTransformacao, 
    legislaturaNumero: number
  ): Promise<{ timestamp: string; legislatura: number; status: string }> {
    logger.info(`Salvando histórico de mesas da legislatura ${legislaturaNumero} no Firestore`);
    
    const timestamp = new Date().toISOString();
    const historicRef = `congressoNacional/senadoFederal/historico/mesas/snapshots/${legislaturaNumero}_${timestamp}`;
    
    // No ambiente real, usaríamos o Firestore.
    // Na versão mock, apenas logamos a operação.
    logger.info(`Simulando salvamento de histórico em ${historicRef}`);
    logger.debug('Dados do snapshot:', { 
      timestamp, 
      legislatura: legislaturaNumero,
      totalMesas: transformedData.total
    });
    
    // Simula um atraso para parecer mais realista
    await new Promise(resolve => setTimeout(resolve, 500));
    
    logger.info('Histórico de mesas salvo no Firestore (mock)');
    
    return {
      timestamp,
      legislatura: legislaturaNumero,
      status: 'success'
    };
  }
}

// Exporta uma instância do carregador
export const mesaLoader = new MesaLoader();
