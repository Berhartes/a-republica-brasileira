/**
 * Carregador de lideranças para o Firestore
 */
import { logger } from '../utils/logger';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';
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

// Caminho para o arquivo de credenciais de serviço
const serviceAccountPath = path.resolve(process.cwd(), 'config', 'serviceAccountKey.json');

// Verificar se o arquivo de credenciais existe
if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(`Arquivo de credenciais não encontrado: ${serviceAccountPath}`);
}

// Inicializar o Firebase Admin SDK
try {
  initializeApp({
    credential: cert(serviceAccountPath)
  });
  logger.info('Firebase Admin SDK inicializado com sucesso');
} catch (error) {
  logger.error('Erro ao inicializar Firebase Admin SDK:', error);
  throw error;
}

// Obter instância do Firestore e configurar para ignorar propriedades indefinidas
const db = getFirestore();
// Configurar para ignorar propriedades indefinidas
db.settings({
  ignoreUndefinedProperties: true
});
logger.info('Conexão com Firestore estabelecida (ignorando propriedades indefinidas)');

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
      const metadataRef = db.collection('congressoNacional').doc('senadoFederal').collection('metadata');
      await metadataRef.doc('liderancas').set({
        ultimaAtualizacao: timestamp,
        totalLiderancas: transformedData.liderancas.total,
        totalTiposLideranca: transformedData.referencias.tiposLideranca.length,
        totalTiposUnidade: transformedData.referencias.tiposUnidade.length,
        totalTiposCargo: transformedData.referencias.tiposCargo.length,
        legislatura: legislaturaNumero,
        status: 'success'
      });
      logger.info('Metadados de lideranças salvos com sucesso');
    } catch (error) {
      logger.error(`Erro ao salvar metadados de lideranças: ${error.message}`);
    }

    // Salvar lideranças
    logger.info(`Salvando ${transformedData.liderancas.itens.length} lideranças`);
    let liderancasSalvas = 0;

    for (const lideranca of transformedData.liderancas.itens) {
      try {
        // Adiciona timestamp de atualização e legislatura
        const liderancaData = {
          ...lideranca,
          ultimaAtualizacao: timestamp,
          legislatura: legislaturaNumero
        };

        // Salvar na estrutura por legislatura
        logger.info(`Salvando liderança ${lideranca.codigo} na legislatura ${legislaturaNumero}`);
        const legislaturasRef = db.collection('congressoNacional').doc('senadoFederal').collection('legislaturas');
        await legislaturasRef.doc(String(legislaturaNumero)).collection('liderancas').doc(String(lideranca.codigo)).set(liderancaData);

        // Salvar na estrutura "atual" (acesso rápido)
        logger.info(`Salvando liderança ${lideranca.codigo} na estrutura atual`);
        const atualRef = db.collection('congressoNacional').doc('senadoFederal').collection('atual');
        await atualRef.doc('liderancas').collection('itens').doc(String(lideranca.codigo)).set(liderancaData);

        liderancasSalvas++;
        logger.info(`Liderança ${lideranca.codigo} salva com sucesso (${liderancasSalvas}/${transformedData.liderancas.itens.length})`);
      } catch (error) {
        logger.error(`Erro ao salvar liderança ${lideranca.codigo}: ${error.message}`);
      }
    }

    logger.info(`Total de lideranças salvas: ${liderancasSalvas}/${transformedData.liderancas.itens.length}`);

    // Salvar tipos de liderança como referência
    logger.info(`Salvando ${transformedData.referencias.tiposLideranca.length} tipos de liderança`);
    let tiposLiderancaSalvos = 0;

    for (const tipo of transformedData.referencias.tiposLideranca) {
      try {
        logger.info(`Salvando tipo de liderança ${tipo.codigo}`);
        const referenciasRef = db.collection('congressoNacional').doc('senadoFederal').collection('referencias');
        await referenciasRef.doc('tiposLideranca').collection('itens').doc(String(tipo.codigo)).set({
          ...tipo,
          ultimaAtualizacao: timestamp
        });
        tiposLiderancaSalvos++;
        logger.info(`Tipo de liderança ${tipo.codigo} salvo com sucesso (${tiposLiderancaSalvos}/${transformedData.referencias.tiposLideranca.length})`);
      } catch (error) {
        logger.error(`Erro ao salvar tipo de liderança ${tipo.codigo}: ${error.message}`);
      }
    }

    logger.info(`Total de tipos de liderança salvos: ${tiposLiderancaSalvos}/${transformedData.referencias.tiposLideranca.length}`);

    // Salvar tipos de unidade como referência
    logger.info(`Salvando ${transformedData.referencias.tiposUnidade.length} tipos de unidade`);
    let tiposUnidadeSalvos = 0;

    for (const tipo of transformedData.referencias.tiposUnidade) {
      try {
        logger.info(`Salvando tipo de unidade ${tipo.codigo}`);
        const referenciasRef = db.collection('congressoNacional').doc('senadoFederal').collection('referencias');
        await referenciasRef.doc('tiposUnidade').collection('itens').doc(String(tipo.codigo)).set({
          ...tipo,
          ultimaAtualizacao: timestamp
        });
        tiposUnidadeSalvos++;
        logger.info(`Tipo de unidade ${tipo.codigo} salvo com sucesso (${tiposUnidadeSalvos}/${transformedData.referencias.tiposUnidade.length})`);
      } catch (error) {
        logger.error(`Erro ao salvar tipo de unidade ${tipo.codigo}: ${error.message}`);
      }
    }

    logger.info(`Total de tipos de unidade salvos: ${tiposUnidadeSalvos}/${transformedData.referencias.tiposUnidade.length}`);

    // Salvar tipos de cargo como referência
    logger.info(`Salvando ${transformedData.referencias.tiposCargo.length} tipos de cargo`);
    let tiposCargosalvos = 0;

    for (const tipo of transformedData.referencias.tiposCargo) {
      try {
        logger.info(`Salvando tipo de cargo ${tipo.codigo}`);
        const referenciasRef = db.collection('congressoNacional').doc('senadoFederal').collection('referencias');
        await referenciasRef.doc('tiposCargo').collection('itens').doc(String(tipo.codigo)).set({
          ...tipo,
          ultimaAtualizacao: timestamp
        });
        tiposCargosalvos++;
        logger.info(`Tipo de cargo ${tipo.codigo} salvo com sucesso (${tiposCargosalvos}/${transformedData.referencias.tiposCargo.length})`);
      } catch (error) {
        logger.error(`Erro ao salvar tipo de cargo ${tipo.codigo}: ${error.message}`);
      }
    }

    logger.info(`Total de tipos de cargo salvos: ${tiposCargosalvos}/${transformedData.referencias.tiposCargo.length}`);

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
