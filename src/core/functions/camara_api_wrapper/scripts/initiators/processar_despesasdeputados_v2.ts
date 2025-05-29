/**
 * Script refatorado para processamento de despesas de deputados
 * 
 * Sistema ETL Modular da Câmara dos Deputados v2.0
 * Segue o padrão arquitetural do sistema do Senado Federal
 */

// IMPORTANTE: Configurar variáveis de ambiente ANTES de qualquer import do Firestore
import { configurarVariaveisAmbiente } from '../config/environment.config';
import { initializeFirestore } from '../utils/storage/firestore/config'; // Importar initializeFirestore
configurarVariaveisAmbiente();
initializeFirestore(); // Chamar após configurar variáveis de ambiente

import { DespesasDeputadosProcessor } from '../processors/despesas-deputados.processor';
import { ETLCommandParser } from '../utils/cli/etl-cli';
import { logger } from '../utils/logging';

/**
 * Função principal
 */
async function main(): Promise<void> {
  let cli: ETLCommandParser;
  
  try {
    // Configurar CLI com opções específicas
    cli = new ETLCommandParser('camara:despesas', 'Processador de Despesas de Deputados');
    
    // Adicionar opções específicas de despesas
    cli.addCustomOption('--ano', {
      description: 'Filtrar despesas por ano específico (ex: 2023, 2024)',
      validator: (value: string) => { // Explicitly type value as string
        const ano = parseInt(value);
        return !isNaN(ano) && ano >= 2000 && ano <= new Date().getFullYear();
      },
      transformer: (value: string) => parseInt(value) // Explicitly type value as string
    })
    .addCustomOption('--mes', {
      description: 'Filtrar despesas por mês específico (1-12)',
      validator: (value: string) => { // Explicitly type value as string
        const mes = parseInt(value);
        return !isNaN(mes) && mes >= 1 && mes <= 12;
      },
      transformer: (value: string) => parseInt(value) // Explicitly type value as string
    })
    .addCustomOption('--atualizar', {
      description: 'Modo atualização incremental (últimos 2 meses)',
      defaultValue: false
    })
    .addCustomOption('--concorrencia', {
      description: 'Número de deputados processados em paralelo (padrão: 2)',
      validator: (value: string) => { // Explicitly type value as string
        const num = parseInt(value);
        return !isNaN(num) && num >= 1 && num <= 10;
      },
      transformer: (value: string) => parseInt(value), // Explicitly type value as string
      defaultValue: 2
    });

    // Parse dos argumentos
    const options = cli.parse();

    // Usar legislatura atual se não especificada (igual ao script de perfil)
    const legislaturaDefault = 57; // Legislatura atual da Câmara
    const legislatura = options.legislatura || legislaturaDefault;
    
    if (options.legislatura) {
      logger.info(`🏦 Legislatura especificada: ${legislatura}ª Legislatura`);
    } else {
      logger.info(`🏦 Usando legislatura padrão: ${legislatura}ª Legislatura`);
    }

    // Configurar opções específicas
    const processorOptions = {
      ...options,
      legislatura, // Usar a legislatura detectada corretamente
      concorrencia: options.concorrencia || 2, // Remover parseInt, já é number
      ano: options.ano,
      mes: options.mes,
      atualizar: !!options.atualizar
    };

    // Log de configuração
    logger.info('🏛️ Sistema ETL - Câmara dos Deputados v2.0');
    logger.info('💰 Processador: Despesas de Deputados');
    logger.info(`📋 Legislatura: ${processorOptions.legislatura}ª`);
    logger.info(`🔧 Modo: ${processorOptions.atualizar ? 'ATUALIZAÇÃO INCREMENTAL (últimos 2 meses)' : 'COMPLETO'}`);
    if (processorOptions.ano) logger.info(`📅 Ano: ${processorOptions.ano}`);
    if (processorOptions.mes) logger.info(`📅 Mês: ${processorOptions.mes}`);
    if (processorOptions.limite) logger.info(`🔢 Limite: ${processorOptions.limite} deputados`);
    logger.info(`⚡ Concorrência: ${processorOptions.concorrencia} deputados simultâneos`);

    // Criar e executar processador
    const processor = new DespesasDeputadosProcessor(processorOptions);
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
      logger.info(`💰 Despesas processadas: ${resultado.detalhes.despesasSalvas || 0}`);
      logger.info(`👥 Deputados processados: ${resultado.detalhes.deputadosProcessados || 0}`);
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
