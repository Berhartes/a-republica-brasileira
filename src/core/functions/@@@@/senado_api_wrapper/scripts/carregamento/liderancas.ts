/**
 * Carregador de lideranças para o Firestore
 */
import { logger } from '../utils/logging';
import { firestoreBatch } from '../utils/storage';
import {
  ResultadoTransformacao,
  LiderancaTransformada,
  TipoLiderancaTransformado,
  TipoUnidadeTransformado,
  TipoCargoTransformado
} from '../transformacao/liderancas';

// Interface para o resultado do carregamento
interface ResultadoCarregamento {
  timestamp: string;
  totalLiderancas: number;
  totalTiposLideranca: number;
  totalTiposUnidade: number;
  totalTiposCargo: number;
  legislatura: number;
  status: string;
}

/**
 * Classe para carregar dados de lideranças no Firestore
 */
export class LiderancaLoader {
  /**
   * Salva dados de lideranças no Firestore
   * @param transformedData - Dados transformados das lideranças
   * @param legislaturaNumero - Número da legislatura atual
   */
  async saveLiderancas(
    transformedData: ResultadoTransformacao,
    legislaturaNumero: number
  ): Promise<ResultadoCarregamento> {
    logger.info(`Salvando dados de lideranças na legislatura ${legislaturaNumero}`);
    logger.info(`Total de lideranças a salvar: ${transformedData.liderancas.total}`);
    logger.info(`Total de tipos de liderança a salvar: ${transformedData.referencias.tiposLideranca.length}`);
    logger.info(`Total de tipos de unidade a salvar: ${transformedData.referencias.tiposUnidade.length}`);
    logger.info(`Total de tipos de cargo a salvar: ${transformedData.referencias.tiposCargo.length}`);

    const timestamp = new Date().toISOString();

    try {
      // Documento com metadados da extração
      logger.info('Salvando metadados de lideranças');
      const batchManager = firestoreBatch.createBatchManager();
      
      batchManager.set('congressoNacional/senadoFederal/metadata/liderancas', {
        ultimaAtualizacao: timestamp,
        totalLiderancas: transformedData.liderancas.total,
        totalTiposLideranca: transformedData.referencias.tiposLideranca.length,
        totalTiposUnidade: transformedData.referencias.tiposUnidade.length,
        totalTiposCargo: transformedData.referencias.tiposCargo.length,
        legislatura: legislaturaNumero,
        status: 'success'
      });
      
      await batchManager.commit();
      logger.info('Metadados de lideranças salvos com sucesso');
    } catch (error: any) {
      logger.error(`Erro ao salvar metadados de lideranças: ${error.message}`);
    }

    // Salvar lideranças usando batch
    logger.info(`Salvando ${transformedData.liderancas.itens.length} lideranças`);
    const batchManager = firestoreBatch.createBatchManager();
    
    for (const lideranca of transformedData.liderancas.itens) {
      const liderancaData = {
        ...lideranca,
        ultimaAtualizacao: timestamp,
        legislatura: legislaturaNumero
      };

      // Salvar na estrutura por legislatura
      batchManager.set(`congressoNacional/senadoFederal/legislaturas/${legislaturaNumero}/liderancas/${lideranca.codigo}`, liderancaData);

      // Salvar na estrutura "atual" (acesso rápido)
      batchManager.set(`congressoNacional/senadoFederal/atual/liderancas/itens/${lideranca.codigo}`, liderancaData);
    }
    
    await batchManager.commit();
    const liderancasSalvas = transformedData.liderancas.itens.length;

    logger.info(`Total de lideranças salvas: ${liderancasSalvas}/${transformedData.liderancas.itens.length}`);

    // Salvar referências em lote
    logger.info('Salvando referências (tipos de liderança, unidade e cargo)');
    const batchReferencias = firestoreBatch.createBatchManager();
    
    // Tipos de liderança
    for (const tipo of transformedData.referencias.tiposLideranca) {
      batchReferencias.set(`congressoNacional/senadoFederal/referencias/tiposLideranca/itens/${tipo.codigo}`, {
        ...tipo,
        ultimaAtualizacao: timestamp
      });
    }
    
    // Tipos de unidade
    for (const tipo of transformedData.referencias.tiposUnidade) {
      batchReferencias.set(`congressoNacional/senadoFederal/referencias/tiposUnidade/itens/${tipo.codigo}`, {
        ...tipo,
        ultimaAtualizacao: timestamp
      });
    }
    
    // Tipos de cargo
    for (const tipo of transformedData.referencias.tiposCargo) {
      batchReferencias.set(`congressoNacional/senadoFederal/referencias/tiposCargo/itens/${tipo.codigo}`, {
        ...tipo,
        ultimaAtualizacao: timestamp
      });
    }
    
    await batchReferencias.commit();
    
    const tiposLiderancaSalvos = transformedData.referencias.tiposLideranca.length;
    const tiposUnidadeSalvos = transformedData.referencias.tiposUnidade.length;
    const tiposCargosalvos = transformedData.referencias.tiposCargo.length;
    
    logger.info(`Referências salvas: ${tiposLiderancaSalvos} tipos de liderança, ${tiposUnidadeSalvos} tipos de unidade, ${tiposCargosalvos} tipos de cargo`);

    logger.info(`${transformedData.liderancas.total} lideranças salvas no Firestore para a legislatura ${legislaturaNumero}`);

    return {
      timestamp,
      totalLiderancas: transformedData.liderancas.total,
      totalTiposLideranca: transformedData.referencias.tiposLideranca.length,
      totalTiposUnidade: transformedData.referencias.tiposUnidade.length,
      totalTiposCargo: transformedData.referencias.tiposCargo.length,
      legislatura: legislaturaNumero,
      status: 'success'
    };
  }

  /**
   * Salva dados históricos de lideranças (mantém versões anteriores)
   * @param transformedData - Dados transformados das lideranças
   * @param legislaturaNumero - Número da legislatura
   */
  async saveLiderancasHistorico(
    transformedData: ResultadoTransformacao,
    legislaturaNumero: number
  ): Promise<{ timestamp: string; legislatura: number; status: string }> {
    logger.info(`Salvando histórico de lideranças da legislatura ${legislaturaNumero} no Firestore`);

    const timestamp = new Date().toISOString();
    const historicoId = `${legislaturaNumero}_${timestamp.replace(/[:.]/g, '-')}`;
    
    const dadosHistorico = {
      timestamp,
      legislatura: legislaturaNumero,
      totalLiderancas: transformedData.liderancas.total,
      dados: transformedData
    };

    const batchManager = firestoreBatch.createBatchManager();
    batchManager.set(`congressoNacional/senadoFederal/historico/liderancas/snapshots/${historicoId}`, dadosHistorico);
    await batchManager.commit();

    logger.info(`Histórico de lideranças salvo com ID: ${historicoId}`);

    return {
      timestamp,
      legislatura: legislaturaNumero,
      status: 'success'
    };
  }
}

// Exporta uma instância do carregador
export const liderancaLoader = new LiderancaLoader();
