/**
 * Carregador de mesas diretoras para o Firestore
 */
import { logger } from '../utils/logging';
import { firestoreBatch } from '../utils/storage';
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

    const batchManager = firestoreBatch.createBatchManager();
    const timestamp = new Date().toISOString();

    // Documento com metadados da extração
    batchManager.set('congressoNacional/lideranca/metadata/mesas', {
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
      const mesaLegislaturaPath = `congressoNacional/lideranca/legislaturas/${legislaturaNumero}/mesas/${mesa.tipo}`;
      
      // Referência para a estrutura "atual" (acesso rápido)
      const mesaAtualPath = `congressoNacional/lideranca/atual/mesas/itens/${mesa.tipo}`;

      // Salva nas duas coleções
      batchManager.set(mesaLegislaturaPath, mesaData);
      batchManager.set(mesaAtualPath, mesaData);

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
          const membroLegislaturaPath = `congressoNacional/lideranca/legislaturas/${legislaturaNumero}/mesas/${mesa.tipo}/membros/${membro.codigo || 'sem_codigo'}`;

          // Referência para o membro na estrutura "atual"
          const membroAtualPath = `congressoNacional/lideranca/atual/mesas/itens/${mesa.tipo}/membros/${membro.codigo || 'sem_codigo'}`;

          // Salvar nas duas coleções
          batchManager.set(membroLegislaturaPath, membroData);
          batchManager.set(membroAtualPath, membroData);
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
      const historicPath = `congressoNacional/lideranca/historico/mesas/snapshots/${legislaturaNumero}_${timestamp.replace(/[:.]/g, '-')}`;
      
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
