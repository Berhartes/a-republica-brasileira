/**
 * Script para processar senadores em exercício (extração, transformação e carregamento)
 */
import { logger } from './utils/logger';
import { handleError } from './utils/error_handler';
import { senadoresExtractor } from './extracao/senadores';
import { senadoresTransformer } from './transformacao/senadores';
import { senadoresLoader } from './carregamento/senadores';
import { obterNumeroLegislaturaAtual } from './utils/legislatura';

/**
 * Função para processar o fluxo completo de senadores em exercício
 */
async function processarSenadores(): Promise<void> {
  try {
    logger.info('=== Iniciando processamento de senadores em exercício ===');
    
    // 0. Obter o número da legislatura atual
    logger.info('0. Obtendo legislatura atual');
    const legislaturaAtual = await obterNumeroLegislaturaAtual();
    
    if (!legislaturaAtual) {
      throw new Error('Não foi possível obter a legislatura atual. O processamento será abortado.');
    }
    
    logger.info(`Legislatura atual: ${legislaturaAtual}`);
    
    // 1. Extração
    logger.info('1. Iniciando etapa de extração');
    const dadosExtraidos = await senadoresExtractor.extractSenadoresAtuais();
    logger.info(`Extração concluída: ${dadosExtraidos.senadores.length} senadores extraídos`);
    
    // 2. Transformação
    logger.info('2. Iniciando etapa de transformação');
    const dadosTransformados = senadoresTransformer.transformSenadoresAtuais(dadosExtraidos);
    logger.info(`Transformação concluída: ${dadosTransformados.senadores.length} senadores transformados`);
    
    // 3. Carregamento
    logger.info('3. Iniciando etapa de carregamento');
    const resultadoCarregamento = await senadoresLoader.saveSenadoresAtuais(dadosTransformados, legislaturaAtual);
    logger.info(`Carregamento concluído: ${resultadoCarregamento.totalSalvos} senadores salvos no Firestore`);
    
    // 4. Histórico
    logger.info('4. Salvando histórico');
    await senadoresLoader.saveSenadoresHistorico(dadosTransformados, legislaturaAtual);
    logger.info('Histórico salvo com sucesso');
    
    logger.info('=== Processamento de senadores em exercício concluído com sucesso ===');
  } catch (error) {
    handleError(error, 'processarSenadores');
    throw error;
  }
}

// Executa o processamento se este arquivo for chamado diretamente
if (require.main === module) {
  (async () => {
    try {
      await processarSenadores();
    } catch (error) {
      logger.error('Falha no processamento de senadores', error);
      process.exit(1);
    }
  })();
}

export { processarSenadores };
