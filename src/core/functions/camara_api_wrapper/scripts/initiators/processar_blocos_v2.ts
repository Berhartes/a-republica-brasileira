/**
 * Script para processar blocos parlamentares da Câmara dos Deputados
 *
 * Sistema ETL Modular da Câmara dos Deputados v2.0
 * Segue o padrão arquitetural do sistema do Senado Federal
 *
 * Uso:
 *   npm run camara:blocos -- [legislatura] [opções]
 *
 * Exemplos:
 *   npm run camara:blocos                       # Processa legislatura atual
 *   npm run camara:blocos -- 57 --limite 10     # Legislatura 57, limitado a 10
 *   npm run camara:blocos -- --pc --verbose     # Salva no PC com logs detalhados
 *   npm run camara:blocos -- --emulator         # Usa Firestore Emulator
 */

// IMPORTANTE: Configurar variáveis de ambiente ANTES de qualquer import do Firestore
import { configurarVariaveisAmbiente } from '../config/environment.config';
import { initializeFirestore } from '../utils/storage/firestore/config';
configurarVariaveisAmbiente();
initializeFirestore();

import { BlocosProcessor } from '../processors/blocos.processor';
import { ETLCommandParser } from '../utils/cli/etl-cli';
import { logger } from '../utils/logging';

/**
 * Função principal
 */
async function main(): Promise<void> {
  let cli: ETLCommandParser;
  
  try {
    // Configurar CLI com opções específicas
    cli = new ETLCommandParser('camara:blocos', 'Processador de Blocos Parlamentares');
    
    // Adicionar opções específicas de blocos
    cli.addCustomOption('--incluir-partidos', {
      description: 'Incluir partidos membros de cada bloco',
      defaultValue: true
    })
    .addCustomOption('--incluir-membros', {
      description: 'Incluir deputados membros de cada partido',
      defaultValue: true
    })
    .addCustomOption('--atualizar', {
      description: 'Modo atualização incremental',
      defaultValue: false
    })
    .addCustomOption('--concorrencia', {
      description: 'Número de blocos processados em paralelo (padrão: 2)',
      validator: (value: string) => {
        const num = parseInt(value);
        return !isNaN(num) && num >= 1 && num <= 10;
      },
      transformer: (value: string) => parseInt(value),
      defaultValue: 2
    });

    // Parse dos argumentos
    const options = cli.parse();

    // Usar legislatura atual se não especificada
    const legislaturaDefault = 57; // Legislatura atual da Câmara
    const legislatura = options.legislatura || legislaturaDefault;
    
    if (options.legislatura) {
      logger.info(`🏛️ Legislatura especificada: ${legislatura}ª Legislatura`);
    } else {
      logger.info(`🏛️ Usando legislatura padrão: ${legislatura}ª Legislatura`);
    }

    // Configurar opções específicas
    const processorOptions = {
      ...options,
      legislatura,
      concorrencia: options.concorrencia || 2,
      incluirPartidos: options.incluirPartidos !== false,
      incluirMembros: options.incluirMembros !== false,
      atualizar: !!options.atualizar
    };

    // Log de configuração
    logger.info('🏛️ Sistema ETL - Câmara dos Deputados v2.0');
    logger.info('🔷 Processador: Blocos Parlamentares');
    logger.info(`📋 Legislatura: ${processorOptions.legislatura}ª`);
    logger.info(`🔧 Modo: ${processorOptions.atualizar ? 'ATUALIZAÇÃO INCREMENTAL' : 'COMPLETO'}`);
    logger.info(`📋 Incluir partidos: ${processorOptions.incluirPartidos ? 'SIM' : 'NÃO'}`);
    logger.info(`📋 Incluir membros: ${processorOptions.incluirMembros ? 'SIM' : 'NÃO'}`);
    if (processorOptions.limite) logger.info(`🔢 Limite: ${processorOptions.limite} blocos`);
    logger.info(`⚡ Concorrência: ${processorOptions.concorrencia} blocos simultâneos`);

    // Criar e executar processador
    const processor = new BlocosProcessor(processorOptions);
    const resultado = await processor.process();

    // Log de resultado final
    logger.info('');
    logger.info('✅ ===== PROCESSAMENTO CONCLUÍDO =====');
    logger.info(`📊 Sucessos: ${resultado.sucessos}`);
    logger.info(`❌ Falhas: ${resultado.falhas}`);
    logger.info(`⚠️ Avisos: ${resultado.avisos}`);
    logger.info(`⏱️ Tempo total: ${resultado.tempoProcessamento}s`);
    logger.info(`💾 Destino: ${resultado.destino}`);
    if (resultado.detalhes) {
      logger.info(`🔷 Blocos processados: ${resultado.detalhes.blocosProcessados || 0}`);
      logger.info(`🏛️ Partidos processados: ${resultado.detalhes.partidosProcessados || 0}`);
      logger.info(`👥 Membros processados: ${resultado.detalhes.membrosProcessados || 0}`);
    }
    logger.info('=====================================');

  } catch (error: any) {
    logger.error(`❌ Erro fatal no processamento: ${error.message}`);
    if (error.stack && process.env.DEBUG) {
      logger.error(`🔍 Stack trace: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Executar com tratamento de erro global
if (require.main === module) {
  main().catch((error) => {
    logger.error(`💥 Erro não capturado: ${error.message}`);
    process.exit(1);
  });
}

export { main };
