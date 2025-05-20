/**
 * Script para processar blocos parlamentares (extração, transformação e carregamento)
 */
import { logger } from './utils/logger';
import { handleError } from './utils/error_handler';
import { blocoExtractor } from './extracao/blocos';
import { blocoTransformer } from './transformacao/blocos';
import { blocoLoader } from './carregamento/blocos';
import { obterNumeroLegislaturaAtual } from './utils/legislatura';

/**
 * Função para processar o fluxo completo de blocos parlamentares
 */
async function processarBlocos(): Promise<void> {
  try {
    logger.info('=== Iniciando processamento de blocos parlamentares ===');
    
    // 0. Obter o número da legislatura atual
    logger.info('0. Obtendo legislatura atual');
    const legislaturaAtual = await obterNumeroLegislaturaAtual();
    
    if (!legislaturaAtual) {
      throw new Error('Não foi possível obter a legislatura atual. O processamento será abortado.');
    }
    
    logger.info(`Legislatura atual: ${legislaturaAtual}`);
    
    // 1. Extração
    logger.info('1. Iniciando etapa de extração');
    const dadosExtraidos = await blocoExtractor.extractAll();
    logger.info(`Extração concluída: ${dadosExtraidos.lista.total} blocos extraídos`);
    
    // 2. Transformação
    logger.info('2. Iniciando etapa de transformação');
    const dadosTransformados = blocoTransformer.transformBlocos(dadosExtraidos);
    logger.info(`Transformação concluída: ${dadosTransformados.total} blocos transformados`);
    
    // 3. Carregamento
    logger.info('3. Iniciando etapa de carregamento');
    const resultadoCarregamento = await blocoLoader.saveBlocos(dadosTransformados, legislaturaAtual);
    logger.info(`Carregamento concluído: ${resultadoCarregamento.totalSalvos} blocos salvos no Firestore`);
    
    // 4. Histórico
    logger.info('4. Salvando histórico');
    await blocoLoader.saveBlocosHistorico(dadosTransformados, legislaturaAtual);
    logger.info('Histórico salvo com sucesso');
    
    logger.info('=== Processamento de blocos parlamentares concluído com sucesso ===');
  } catch (error) {
    handleError(error, 'processarBlocos');
    throw error;
  }
}

// Executa o processamento se este arquivo for chamado diretamente
if (require.main === module) {
  (async () => {
    try {
      await processarBlocos();
    } catch (error) {
      logger.error('Falha no processamento de blocos', error);
      process.exit(1);
    }
  })();
}

export { processarBlocos };
