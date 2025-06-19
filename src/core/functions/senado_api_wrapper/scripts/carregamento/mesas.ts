/**
 * Carregador de mesas diretoras para o Firestore
 */
import { logger } from '../utils/logging';
import { firestoreBatch } from '../utils/storage';
import { ResultadoTransformacao } from '../transformacao/mesas';

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

    const batchManager = firestoreBatch.createBatchManager();
    const timestamp = new Date().toISOString();

    // Documento com metadados da extração
    batchManager.set(`congressoNacional/senadoFederal/legislaturas/${legislaturaNumero}/mesas/metadata`, {
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
      const mesaLegislaturaPath = `congressoNacional/senadoFederal/legislaturas/${legislaturaNumero}/mesas/${mesa.tipo}`;
      
      // Salva na coleção de legislatura
      batchManager.set(mesaLegislaturaPath, mesaData);

      // Salvar cada membro como subdocumento para facilitar consultas
      if (mesa.membros && Array.isArray(mesa.membros)) {
        for (const membro of mesa.membros) {
          if (!membro.codigo) continue;

          const membroData = {
            ...membro,
            mesaTipo: mesa.tipo,
            ultimaAtualizacao: timestamp,
            legislatura: legislaturaNumero
          };

          // Referência para o membro na estrutura por legislatura
          const membroLegislaturaPath = `congressoNacional/senadoFederal/legislaturas/${legislaturaNumero}/mesas/${mesa.tipo}/membros/${membro.codigo || 'sem_codigo'}`;

          // Salvar na coleção de legislatura
          batchManager.set(membroLegislaturaPath, membroData);
        }
      }
    }

    // Executar todas as operações
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

    try {
      // Salvar o snapshot completo no histórico usando a nova API
      const historicPath = `congressoNacional/senadoFederal/legislaturas/${legislaturaNumero}/mesas/historico/snapshots/${legislaturaNumero}_${timestamp.replace(/[:.]/g, '-')}`;
      
      const batchManager = firestoreBatch.createBatchManager();
      batchManager.set(historicPath, {
        timestamp,
        legislatura: legislaturaNumero,
        totalMesas: transformedData.total,
        mesas: transformedData.mesas.map(mesa => ({
          ...mesa,
          membros: mesa.membros.map(membro => ({
            ...membro,
            historico: true
          }))
        }))
      });
      
      await batchManager.commit();

      logger.info(`Histórico de mesas salvo no Firestore em ${historicPath}`);

      return {
        timestamp,
        legislatura: legislaturaNumero,
        status: 'success'
      };
    } catch (error: any) {
      logger.error(`Erro ao salvar histórico de mesas: ${error.message}`, error);

      return {
        timestamp,
        legislatura: legislaturaNumero,
        status: 'error'
      };
    }
  }
}

// Exporta uma instância do carregador
export const mesaLoader = new MesaLoader();
