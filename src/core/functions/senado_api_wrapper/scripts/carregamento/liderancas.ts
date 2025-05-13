/**
 * Carregador de lideranças para o Firestore
 */
import { logger } from '../utils/logger';
import { createBatchManager } from '../utils/firestore';
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
    
    const batchManager = createBatchManager();
    const timestamp = new Date().toISOString();
    
    // Documento com metadados da extração
    const metadataRef = `congressoNacional/senadoFederal/metadata/liderancas`;
    
    batchManager.set(metadataRef, {
      ultimaAtualizacao: timestamp,
      totalLiderancas: transformedData.liderancas.total,
      totalTiposLideranca: transformedData.referencias.tiposLideranca.length,
      totalTiposUnidade: transformedData.referencias.tiposUnidade.length,
      totalTiposCargo: transformedData.referencias.tiposCargo.length,
      legislatura: legislaturaNumero,
      status: 'success'
    });
    
    // Salvar lideranças
    for (const lideranca of transformedData.liderancas.itens) {
      // Adiciona timestamp de atualização e legislatura
      const liderancaData = {
        ...lideranca,
        ultimaAtualizacao: timestamp,
        legislatura: legislaturaNumero
      };
      
      // Referência para a estrutura por legislatura
      const liderancaRef = `congressoNacional/senadoFederal/legislaturas/${legislaturaNumero}/liderancas/${lideranca.codigo}`;
      
      // Referência para a estrutura "atual" (acesso rápido)
      const liderancaAtualRef = `congressoNacional/senadoFederal/atual/liderancas/itens/${lideranca.codigo}`;
      
      // Salva nas duas coleções
      batchManager.set(liderancaRef, liderancaData);
      batchManager.set(liderancaAtualRef, liderancaData);
    }
    
    // Salvar tipos de liderança como referência
    for (const tipo of transformedData.referencias.tiposLideranca) {
      const tipoRef = `congressoNacional/senadoFederal/referencias/tiposLideranca/${tipo.codigo}`;
      batchManager.set(tipoRef, {
        ...tipo,
        ultimaAtualizacao: timestamp
      });
    }
    
    // Salvar tipos de unidade como referência
    for (const tipo of transformedData.referencias.tiposUnidade) {
      const tipoRef = `congressoNacional/senadoFederal/referencias/tiposUnidade/${tipo.codigo}`;
      batchManager.set(tipoRef, {
        ...tipo,
        ultimaAtualizacao: timestamp
      });
    }
    
    // Salvar tipos de cargo como referência
    for (const tipo of transformedData.referencias.tiposCargo) {
      const tipoRef = `congressoNacional/senadoFederal/referencias/tiposCargo/${tipo.codigo}`;
      batchManager.set(tipoRef, {
        ...tipo,
        ultimaAtualizacao: timestamp
      });
    }
    
    // Executa todas as operações como uma transação
    await batchManager.commit();
    
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
    const historicRef = `congressoNacional/senadoFederal/historico/liderancas/snapshots/${legislaturaNumero}_${timestamp}`;
    
    // No ambiente real, usaríamos o Firestore.
    // Na versão mock, apenas logamos a operação.
    logger.info(`Simulando salvamento de histórico em ${historicRef}`);
    logger.debug('Dados do snapshot:', { 
      timestamp, 
      legislatura: legislaturaNumero,
      totalLiderancas: transformedData.liderancas.total
    });
    
    // Simula um atraso para parecer mais realista
    await new Promise(resolve => setTimeout(resolve, 500));
    
    logger.info('Histórico de lideranças salvo no Firestore (mock)');
    
    return {
      timestamp,
      legislatura: legislaturaNumero,
      status: 'success'
    };
  }
}

// Exporta uma instância do carregador
export const liderancaLoader = new LiderancaLoader();
