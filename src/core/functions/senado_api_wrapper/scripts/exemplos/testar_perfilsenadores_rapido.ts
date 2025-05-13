/**
 * Exemplo de teste rápido para perfis de senadores
 * Processa apenas um subconjunto limitado de senadores para testes rápidos
 */
import { logger } from '../utils/logger';
import { processarPerfilSenadoresComExportacao } from '../processar_perfilsenadores_export';
import { OpcoesExportacao } from '../utils/exportacao_avanc';

/**
 * Função para executar um teste rápido com apenas 20 senadores
 */
async function testarPerfilSenadoresRapido(): Promise<void> {
  try {
    const LIMITE_SENADORES = 20;
    
    logger.info('=== Iniciando teste rápido de processamento de perfis de senadores ===');
    logger.info(`Este teste processará apenas ${LIMITE_SENADORES} senadores para demonstração`);
    
    // Configurar opções para um processamento rápido
    const opcoesExportacao: OpcoesExportacao = {
      formato: 'ambos' as 'ambos' | 'json' | 'csv',
      comprimir: false,
      nivelDetalhamento: 'ambos' as 'ambos' | 'completo' | 'resumido',
      caminhoBase: 'teste_rapido'
    };
    
    // Executar o processamento para a legislatura 55 com limite
    await processarPerfilSenadoresComExportacao({
      legislatura: 55,
      exportar: true,
      opcoesExportacao,
      limiteSenadores: LIMITE_SENADORES
    });
    
    logger.info('=== Teste rápido concluído com sucesso ===');
    logger.info(`Foram processados ${LIMITE_SENADORES} perfis de senadores`);
    logger.info('Os dados completos foram exportados nos formatos JSON e CSV');
    logger.info('As estatísticas de qualidade foram geradas com base na amostra');
    logger.info('Para processar todos os perfis, use o comando "process:perfilsenadores:full"');
  } catch (erro: any) {
    logger.error(`Erro no teste rápido: ${erro.message}`);
    throw erro;
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testarPerfilSenadoresRapido()
    .then(() => {
      logger.info('Teste finalizado com sucesso.');
      process.exit(0);
    })
    .catch(erro => {
      logger.error('Falha no teste rápido', erro);
      process.exit(1);
    });
}

export { testarPerfilSenadoresRapido };
