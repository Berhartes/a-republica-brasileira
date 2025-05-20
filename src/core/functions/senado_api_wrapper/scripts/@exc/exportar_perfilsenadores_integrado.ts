/**
 * Exemplo de utilização do módulo integrado de extração e exportação de perfis de senadores
 * 
 * Este exemplo demonstra como utilizar o processo completo ETL com exportação para múltiplos formatos
 */
import { logger } from '../utils/logger';
import { processarPerfilSenadoresComExportacao } from '../processar_perfilsenadores_export';
import { OpcoesExportacao } from '../utils/exportacao_avanc';

/**
 * Função principal para demonstrar o uso do processo integrado
 */
async function demonstrarExportacaoIntegrada(): Promise<void> {
  try {
    logger.info('=== Demonstração do módulo integrado de extração e exportação ===');
    
    // Configura opções de exportação
    const opcoesExportacao: OpcoesExportacao = {
      formato: 'ambos' as 'ambos' | 'json' | 'csv',        // Exporta tanto JSON quanto CSV
      comprimir: true,          // Comprime os arquivos
      nivelDetalhamento: 'ambos' as 'ambos' | 'completo' | 'resumido', // Gera versões completas e resumidas
      caminhoBase: 'demo_exportacao_integrada'  // Pasta personalizada
    };
    
    // Executa o processamento para a 55ª legislatura com exportação automática
    await processarPerfilSenadoresComExportacao({
      legislatura: 55,  // 55ª legislatura
      exportar: true,   // Ativar exportação
      opcoesExportacao  // Usar opções configuradas acima
    });
    
    logger.info('=== Demonstração concluída com sucesso ===');
    logger.info('Os dados foram exportados para a pasta "dados_extraidos/demo_exportacao_integrada"');
  } catch (error: any) {
    logger.error(`Falha na demonstração do módulo integrado: ${error.message}`);
  }
}

// Executar a demonstração
if (require.main === module) {
  demonstrarExportacaoIntegrada()
    .then(() => {
      logger.info('Exemplo finalizado com sucesso');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Erro no exemplo', error);
      process.exit(1);
    });
}
