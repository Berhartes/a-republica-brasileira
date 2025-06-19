/**
 * Script para processar frentes parlamentares da Câmara dos Deputados
 *
 * Sistema ETL Modular da Câmara dos Deputados v2.0
 * Segue o padrão arquitetural do sistema do Senado Federal
 *
 * Uso:
 *   npm run camara:frentes -- [legislatura] [opções]
 *
 * Exemplos:
 *   npm run camara:frentes                       # Processa legislatura atual
 *   npm run camara:frentes -- 57 --limite 10     # Legislatura 57, limitado a 10
 *   npm run camara:frentes -- --pc --verbose     # Salva no PC com logs detalhados
 *   npm run camara:frentes -- --emulator         # Usa Firestore Emulator
 */

// IMPORTANTE: Configurar variáveis de ambiente ANTES de qualquer import do Firestore
import { configurarVariaveisAmbiente } from '../config/environment.config';
import { initializeFirestore } from '../utils/storage/firestore/config';
configurarVariaveisAmbiente();
initializeFirestore();

import { FrentesProcessor } from '../processors/frentes.processor';
import { ETLCommandParser } from '../utils/cli/etl-cli';
import { logger } from '../utils/logging';

/**
 * Função principal
 */
async function main(): Promise<void> {
  let cli: ETLCommandParser;
  
  try {
    // Configurar CLI com opções específicas
    cli = new ETLCommandParser('camara:frentes', 'Processador de Frentes Parlamentares');
    
    // Adicionar opções específicas de frentes
    cli.addCustomOption('--incluir-membros', {
      description: 'Incluir lista de membros de cada frente',
      defaultValue: true
    })
    .addCustomOption('--incluir-detalhes', {
      description: 'Incluir detalhes completos de cada frente',
      defaultValue: true
    })
    .addCustomOption('--atualizar', {
      description: 'Modo atualização incremental (apenas frentes novas)',
      defaultValue: false
    })
    .addCustomOption('--concorrencia', {
      description: 'Número de frentes processadas em paralelo (padrão: 3)',
      validator: (value: string) => {
        const num = parseInt(value);
        return !isNaN(num) && num >= 1 && num <= 10;
      },
      transformer: (value: string) => parseInt(value),
      defaultValue: 3
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
      concorrencia: options.concorrencia || 3,
      incluirMembros: options.incluirMembros !== false,
      incluirDetalhes: options.incluirDetalhes !== false,
      atualizar: !!options.atualizar
    };

    // Log de configuração
    logger.info('🏛️ Sistema ETL - Câmara dos Deputados v2.0');
    logger.info('👥 Processador: Frentes Parlamentares');
    logger.info(`📋 Legislatura: ${processorOptions.legislatura}ª`);
    logger.info(`🔧 Modo: ${processorOptions.atualizar ? 'ATUALIZAÇÃO INCREMENTAL' : 'COMPLETO'}`);
    logger.info(`📋 Incluir membros: ${processorOptions.incluirMembros ? 'SIM' : 'NÃO'}`);
    logger.info(`📋 Incluir detalhes: ${processorOptions.incluirDetalhes ? 'SIM' : 'NÃO'}`);
    if (processorOptions.limite) logger.info(`🔢 Limite: ${processorOptions.limite} frentes`);
    logger.info(`⚡ Concorrência: ${processorOptions.concorrencia} frentes simultâneas`);

    // Criar e executar processador
    const processor = new FrentesProcessor(processorOptions);
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
      logger.info(`👥 Frentes processadas: ${resultado.detalhes.frentesProcessadas || 0}`);
      logger.info(`👤 Total de membros: ${resultado.detalhes.totalMembros || 0}`);
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
