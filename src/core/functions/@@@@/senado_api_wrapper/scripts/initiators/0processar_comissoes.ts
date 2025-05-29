/**
 * Script para processar comissões do Senado (extração, transformação e carregamento)
 */
import { logger, handleError } from '../../utils/logging';
import { comissaoExtractor } from '../../extracao/comissoes';
import { comissoesTransformer } from '../../transformacao/comissoes';
import { comissaoLoader } from '../../carregamento/comissoes';
import { obterNumeroLegislaturaAtual } from '../../utils/date';

/**
 * Função para processar o fluxo completo de comissões
 */
async function processarComissoes(): Promise<void> {
  try {
    logger.info('=== Iniciando processamento de comissões do Senado ===');
    
    // 0. Obter o número da legislatura atual
    logger.info('0. Obtendo legislatura atual');
    const legislaturaAtual = await obterNumeroLegislaturaAtual();
    
    if (!legislaturaAtual) {
      throw new Error('Não foi possível obter a legislatura atual. O processamento será abortado.');
    }
    
    logger.info(`Legislatura atual: ${legislaturaAtual}`);
    
    // 1. Extração
    logger.info('1. Iniciando etapa de extração');
    const dadosExtraidos = await comissaoExtractor.extractAll();
    logger.info(`Extração concluída: ${dadosExtraidos.lista?.total || 0} comissões extraídas`);
    
    // 2. Transformação
    logger.info('2. Iniciando etapa de transformação');
    // Adaptar os dados para o formato esperado pelo transformador
    const dadosParaTransformar = {
      timestamp: new Date().toISOString(),
      lista: dadosExtraidos.lista,
      detalhes: dadosExtraidos.detalhes,
      composicoes: dadosExtraidos.composicoes,
      tipos: dadosExtraidos.tipos
    };
    const dadosTransformados = comissoesTransformer.transformComissoes(dadosParaTransformar);
    logger.info(`Transformação concluída: ${dadosTransformados.total} comissões transformadas`);
    
    // 3. Carregamento
    logger.info('3. Iniciando etapa de carregamento');
    const resultadoCarregamento = await comissaoLoader.saveComissoes(dadosTransformados, legislaturaAtual);
    logger.info(`Carregamento concluído: ${resultadoCarregamento.totalSalvos} novas comissões e ${resultadoCarregamento.totalAtualizados} atualizadas no Firestore`);

    // 4. Histórico
    logger.info('4. Salvando histórico');
    await comissaoLoader.saveComissoesHistorico(dadosTransformados, legislaturaAtual);
    logger.info('Histórico salvo com sucesso');

    logger.info('=== Processamento de comissões concluído com sucesso ===');
  } catch (error) {
    handleError(error, 'processarComissoes');
    throw error;
  }
}

// Executa o processamento se este arquivo for chamado diretamente
if (require.main === module) {
  (async () => {
    try {
      await processarComissoes();
    } catch (error) {
      logger.error('Falha no processamento de comissões', error);
      process.exit(1);
    }
  })();
}

export { processarComissoes };
