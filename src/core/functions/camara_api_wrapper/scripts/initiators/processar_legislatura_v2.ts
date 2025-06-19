/**
 * Script para processar legislaturas da Câmara dos Deputados
 *
 * Sistema ETL Modular da Câmara dos Deputados v2.0
 * Segue o padrão arquitetural do sistema do Senado Federal
 *
 * Uso:
 *   npm run camara:legislaturas -- [opções]
 *
 * Exemplos:
 *   npm run camara:legislaturas                       # Processa todas as legislaturas
 *   npm run camara:legislaturas -- --limite 10        # Limita a 10 legislaturas
 *   npm run camara:legislaturas -- --pc --verbose     # Salva no PC com logs detalhados
 *   npm run camara:legislaturas -- --emulator         # Usa Firestore Emulator
 */

// IMPORTANTE: Configurar variáveis de ambiente ANTES de qualquer import do Firestore
import { configurarVariaveisAmbiente } from '../config/environment.config';
import { initializeFirestore } from '../utils/storage/firestore/config';
configurarVariaveisAmbiente();
initializeFirestore();

import { LegislaturasProcessor } from '../processors/legislaturas.processor'; // Será criado
import { ETLCommandParser } from '../utils/cli/etl-cli';
import { logger } from '../utils/logging';

/**
 * Função principal
 */
async function main(): Promise<void> {
  let cli: ETLCommandParser;

  try {
    // Configurar CLI com opções específicas
    cli = new ETLCommandParser('camara:legislaturas', 'Processador de Legislaturas da Câmara');

    // Adicionar opções customizadas se necessário para legislaturas
    // Exemplo:
    // cli.addCustomOption('--alguma-opcao-legislatura', {
    //   description: 'Descrição da opção específica para legislaturas',
    //   defaultValue: 'valorPadrao'
    // });

    // Parse dos argumentos
    const options = cli.parse();

    // Configurar opções específicas do processador
    const processorOptions = {
      ...options,
      // Adicionar outras opções específicas que o LegislaturasProcessor possa precisar
      // exemplo: algumaOpcaoLegislatura: options.algumaOpcaoLegislatura,
    };

    // Log de configuração
    logger.info('🏛️ Sistema ETL - Câmara dos Deputados v2.0');
    logger.info('📜 Processador: Legislaturas da Câmara');
    if (processorOptions.limite) logger.info(`🔢 Limite: ${processorOptions.limite} legislaturas`);
    // Adicionar logs para outras opções, se houver

    // Criar e executar processador
    const processor = new LegislaturasProcessor(processorOptions); // Usar o nome correto do Processor
    const resultado = await processor.process();

    // Log de resultado final
    logger.info('');
    logger.info('✅ ===== PROCESSAMENTO DE LEGISLATURAS CONCLUÍDO =====');
    logger.info(`📊 Sucessos: ${resultado.sucessos}`);
    logger.info(`❌ Falhas: ${resultado.falhas}`);
    logger.info(`⚠️ Avisos: ${resultado.avisos}`);
    logger.info(`⏱️ Tempo total: ${resultado.tempoProcessamento}s`);
    logger.info(`💾 Destino: ${resultado.destino}`);
    if (resultado.detalhes) {
      logger.info(`📜 Legislaturas processadas: ${resultado.detalhes.legislaturasProcessadas || 0}`);
      logger.info(`👥 Líderes encontrados: ${resultado.detalhes.lideresEncontrados || 0}`);
      logger.info(`🏛️ Membros da mesa encontrados: ${resultado.detalhes.membrosMesaEncontrados || 0}`);
    }
    logger.info('======================================================');

  } catch (error: any) {
    logger.error(`❌ Erro fatal no processamento de legislaturas: ${error.message}`);
    if (error.stack && process.env.DEBUG) {
      logger.error(`🔍 Stack trace: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Executar com tratamento de erro global
if (require.main === module) {
  main().catch((error) => {
    logger.error(`💥 Erro não capturado ao processar legislaturas: ${error.message}`);
    process.exit(1);
  });
}

export { main };
