/**
 * Script para processar mesas diretoras (extração, transformação e carregamento)
 */
import { logger } from './utils/logger';
import { handleError } from './utils/error_handler';
import { mesaExtractor } from './extracao/mesas';
import { mesaTransformer } from './transformacao/mesas';
import { mesaLoader } from './carregamento/mesas';
import { obterNumeroLegislaturaAtual } from './utils/legislatura';

/**
 * Função para processar o fluxo completo de mesas diretoras
 */
async function processarMesas(): Promise<void> {
  try {
    logger.info('=== Iniciando processamento de mesas diretoras ===');
    
    // 0. Obter o número da legislatura atual
    logger.info('0. Obtendo legislatura atual');
    const legislaturaAtual = await obterNumeroLegislaturaAtual();
    
    if (!legislaturaAtual) {
      throw new Error('Não foi possível obter a legislatura atual. O processamento será abortado.');
    }
    
    logger.info(`Legislatura atual: ${legislaturaAtual}`);
    
    // 1. Extração
    logger.info('1. Iniciando etapa de extração');
    const dadosExtraidos = await mesaExtractor.extractAll();
    logger.info('Extração de mesas diretoras concluída');
    
    // 2. Transformação
    logger.info('2. Iniciando etapa de transformação');
    const dadosTransformados = mesaTransformer.transformMesas(dadosExtraidos);
    logger.info(`Transformação concluída: ${dadosTransformados.total} mesas transformadas`);
    
    // 3. Carregamento
    logger.info('3. Iniciando etapa de carregamento');
    const resultadoCarregamento = await mesaLoader.saveMesas(dadosTransformados, legislaturaAtual);
    logger.info(`Carregamento concluído: ${resultadoCarregamento.totalSalvos} mesas salvas no Firestore`);
    
    // 4. Histórico
    logger.info('4. Salvando histórico');
    await mesaLoader.saveMesasHistorico(dadosTransformados, legislaturaAtual);
    logger.info('Histórico salvo com sucesso');
    
    logger.info('=== Processamento de mesas diretoras concluído com sucesso ===');
  } catch (error) {
    handleError(error, 'processarMesas');
    throw error;
  }
}

// Executa o processamento se este arquivo for chamado diretamente
if (require.main === module) {
  (async () => {
    try {
      await processarMesas();
    } catch (error) {
      logger.error('Falha no processamento de mesas', error);
      process.exit(1);
    }
  })();
}

export { processarMesas };
