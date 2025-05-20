/**
 * Carregador de mesas diretoras para o Firestore
 */
import { logger } from '../utils/logger';
import { db } from '../utils/firebase-admin-config';
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

    const timestamp = new Date().toISOString();
    let batch = db.batch();
    let operationCount = 0;
    const MAX_BATCH_SIZE = 500;

    // Função para executar o batch atual e criar um novo
    const commitBatch = async () => {
      if (operationCount > 0) {
        await batch.commit();
        logger.info(`Batch com ${operationCount} operações executado com sucesso`);
        batch = db.batch();
        operationCount = 0;
      }
    };

    // Documento com metadados da extração
    const metadataRef = db.collection('congressoNacional').doc('lideranca').collection('metadata').doc('mesas');
    batch.set(metadataRef, {
      ultimaAtualizacao: timestamp,
      totalRegistros: transformedData.total,
      legislatura: legislaturaNumero,
      status: 'success'
    });
    operationCount++;

    // Salva cada mesa como um documento separado
    for (const mesa of transformedData.mesas) {
      // Adiciona timestamp de atualização e legislatura
      const mesaData = {
        ...mesa,
        ultimaAtualizacao: timestamp,
        legislatura: legislaturaNumero
      };

      // Referência para a estrutura por legislatura
      const mesaLegislaturaRef = db.collection('congressoNacional').doc('lideranca')
        .collection('legislaturas').doc(`${legislaturaNumero}`)
        .collection('mesas').doc(`${mesa.tipo}`);

      // Referência para a estrutura "atual" (acesso rápido)
      const mesaAtualRef = db.collection('congressoNacional').doc('lideranca')
        .collection('atual').doc('mesas')
        .collection('itens').doc(`${mesa.tipo}`);

      // Salva nas duas coleções
      batch.set(mesaLegislaturaRef, mesaData);
      batch.set(mesaAtualRef, mesaData);
      operationCount += 2;

      // Verificar se precisa executar o batch
      if (operationCount >= MAX_BATCH_SIZE) {
        await commitBatch();
      }

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
          const membroLegislaturaRef = db.collection('congressoNacional').doc('lideranca')
            .collection('legislaturas').doc(`${legislaturaNumero}`)
            .collection('mesas').doc(`${mesa.tipo}`)
            .collection('membros').doc(`${membro.codigo || 'sem_codigo'}`);

          // Referência para o membro na estrutura "atual"
          const membroAtualRef = db.collection('congressoNacional').doc('lideranca')
            .collection('atual').doc('mesas')
            .collection('itens').doc(`${mesa.tipo}`)
            .collection('membros').doc(`${membro.codigo || 'sem_codigo'}`);

          // Salvar nas duas coleções
          batch.set(membroLegislaturaRef, membroData);
          batch.set(membroAtualRef, membroData);
          operationCount += 2;

          // Verificar se precisa executar o batch
          if (operationCount >= MAX_BATCH_SIZE) {
            await commitBatch();
          }
        }
      }
    }

    // Executar o batch final se houver operações pendentes
    if (operationCount > 0) {
      await commitBatch();
    }

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
      // Salvar o snapshot completo no histórico
      const historicRef = db.collection('congressoNacional').doc('lideranca')
        .collection('historico').doc('mesas')
        .collection('snapshots').doc(`${legislaturaNumero}_${timestamp.replace(/[:.]/g, '-')}`);

      await historicRef.set({
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

      logger.info(`Histórico de mesas salvo no Firestore em ${historicRef.path}`);

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
