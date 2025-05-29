/**
 * Script para processar lideranças parlamentares (extração, transformação e carregamento)
 */
import { logger, handleError } from '../../utils/logging';
import { liderancaExtractor } from '../../extracao/liderancas';
import { liderancaTransformer } from '../../transformacao/liderancas';
import { liderancaLoader } from '../../carregamento/liderancas';
import { obterNumeroLegislaturaAtual } from '../../utils/date';

/**
 * Função para processar o fluxo completo de lideranças parlamentares
 */
async function processarLiderancas(): Promise<void> {
  try {
    logger.info('=== Iniciando processamento de lideranças parlamentares ===');

    // 0. Obter o número da legislatura atual
    logger.info('0. Obtendo legislatura atual');
    const legislaturaAtual = await obterNumeroLegislaturaAtual();

    if (!legislaturaAtual) {
      throw new Error('Não foi possível obter a legislatura atual. O processamento será abortado.');
    }

    logger.info(`Legislatura atual: ${legislaturaAtual}`);

    // 1. Extração
    logger.info('1. Iniciando etapa de extração');
    const dadosExtraidos = await liderancaExtractor.extractAll();
    logger.info(`Extração concluída: dados de lideranças e referências extraídos`);

    // Verificar dados extraídos
    logger.info(`Dados de lideranças extraídos: ${JSON.stringify(dadosExtraidos.liderancas).substring(0, 200)}...`);
    logger.info(`Tipos de liderança extraídos: ${JSON.stringify(dadosExtraidos.referencias.tiposLideranca).substring(0, 200)}...`);
    logger.info(`Tipos de unidade extraídos: ${JSON.stringify(dadosExtraidos.referencias.tiposUnidade).substring(0, 200)}...`);
    logger.info(`Tipos de cargo extraídos: ${JSON.stringify(dadosExtraidos.referencias.tiposCargo).substring(0, 200)}...`);

    // 2. Transformação
    logger.info('2. Iniciando etapa de transformação');
    const dadosTransformados = liderancaTransformer.transformLiderancas(dadosExtraidos);

    // Verificar dados transformados
    logger.info(`Lideranças transformadas: ${dadosTransformados.liderancas.itens.length}`);
    logger.info(`Tipos de liderança transformados: ${dadosTransformados.referencias.tiposLideranca.length}`);
    logger.info(`Tipos de unidade transformados: ${dadosTransformados.referencias.tiposUnidade.length}`);
    logger.info(`Tipos de cargo transformados: ${dadosTransformados.referencias.tiposCargo.length}`);

    const totalMembros = dadosTransformados.liderancas.itens.reduce(
      (total: number, lideranca: any) => total + (lideranca.membros?.length || 0), 0
    );
    logger.info(`Transformação concluída: ${dadosTransformados.liderancas.itens.length} lideranças com ${totalMembros} membros transformados`);

    // 3. Carregamento
    logger.info('3. Iniciando etapa de carregamento');
    const resultadoCarregamento = await liderancaLoader.saveLiderancas(dadosTransformados, legislaturaAtual);
    logger.info(`Carregamento concluído: ${resultadoCarregamento.totalLiderancas} lideranças parlamentares salvas no Firestore`);

    // 4. Histórico
    logger.info('4. Salvando histórico');
    await liderancaLoader.saveLiderancasHistorico(dadosTransformados, legislaturaAtual);
    logger.info('Histórico salvo com sucesso');

    logger.info('=== Processamento de lideranças parlamentares concluído com sucesso ===');
  } catch (error) {
    handleError(error, 'processarLiderancas');
    throw error;
  }
}

// Executa o processamento se este arquivo for chamado diretamente
if (require.main === module) {
  (async () => {
    try {
      await processarLiderancas();
    } catch (error) {
      logger.error('Falha no processamento de lideranças parlamentares', error);
      process.exit(1);
    }
  })();
}

export { processarLiderancas };
