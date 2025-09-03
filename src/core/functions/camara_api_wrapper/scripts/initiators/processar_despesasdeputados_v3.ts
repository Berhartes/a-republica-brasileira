/**
 * Script refatorado para processamento de despesas de deputados - Versão 3
 *
 * Sistema ETL Modular da Câmara dos Deputados v3.0
 * Segue o padrão arquitetural otimizado para Firestore
 */

// IMPORTANTE: Configurar variáveis de ambiente ANTES de qualquer import do Firestore
import { configurarVariaveisAmbiente } from '../config/environment.config';
import { initializeFirestore } from '../utils/storage/firestore/config'; // Importar initializeFirestore
configurarVariaveisAmbiente();
initializeFirestore(); // Chamar após configurar variáveis de ambiente

import { DespesasDeputadosV3Processor } from '../processors/despesas-deputados-v3.processor';
import { ETLCommandParser } from '../utils/cli/etl-cli';
import { logger } from '../utils/logging';

/**
 * Função principal
 */
async function main(): Promise<void> {
  let cli: ETLCommandParser;
  
  try {
    // Configurar CLI com opções específicas
    cli = new ETLCommandParser('camara:despesas-v3', 'Processador de Despesas de Deputados - v3 Otimizado');
    
    // Adicionar opções (pode reutilizar as da v2)
    cli.addCustomOption('--ano', {
      description: 'Filtrar despesas por ano específico (ex: 2023, 2024)',
      validator: (value: string) => {
        const ano = parseInt(value);
        return !isNaN(ano) && ano >= 2000 && ano <= new Date().getFullYear();
      },
      transformer: (value: string) => parseInt(value)
    })
    .addCustomOption('--mes', {
      description: 'Filtrar despesas por mês específico (1-12)',
      validator: (value: string) => {
        const mes = parseInt(value);
        return !isNaN(mes) && mes >= 1 && mes <= 12;
      },
      transformer: (value: string) => parseInt(value)
    })
    .addCustomOption('--atualizar', {
      description: 'Modo atualização incremental (últimos 2 meses)',
      defaultValue: false
    })
    .addCustomOption('--concorrencia', {
        description: 'Número de deputados processados em paralelo (padrão: 2)',
        validator: (value: string) => {
            const num = parseInt(value);
            return !isNaN(num) && num >= 1 && num <= 10;
        },
        transformer: (value: string) => parseInt(value),
        defaultValue: 2
    })
    .addCustomOption('--pc', {
      description: 'Salva os dados localmente no PC em vez do Firestore.',
      defaultValue: false
    });

    // Parse dos argumentos
    const options = cli.parse();
    
    // Usar legislatura atual se não especificada
    const legislaturaDefault = 57;
    const legislatura = options.legislatura || legislaturaDefault;
    
    const processorOptions = {
      ...options,
      legislatura,
    };

    // Log de configuração
    logger.info('🏛️ Sistema ETL - Câmara dos Deputados v3.0 (Otimizado)');
    logger.info('💰 Processador: Despesas de Deputados');
    logger.info(`📋 Legislatura: ${processorOptions.legislatura}ª`);

    // Criar e executar processador
    const processor = new DespesasDeputadosV3Processor(processorOptions);
    const resultado = await processor.process();

    // Log de resultado final
    logger.info('');
    logger.info('✅ ===== PROCESSAMENTO CONCLUÍDO (V3) =====');
    logger.info(`📊 Sucessos: ${resultado.sucessos}`);
    logger.info(`❌ Falhas: ${resultado.falhas}`);
    logger.info(`⏱️ Tempo total: ${resultado.tempoProcessamento}s`);
    logger.info(`💾 Destino: ${resultado.destino}`);
    if (resultado.detalhes) {
      logger.info(`👥 Deputados salvos: ${resultado.detalhes.deputadosSalvos || 0}`);
      logger.info(`💰 Despesas salvas: ${resultado.detalhes.despesasSalvas || 0}`);
    }
    logger.info('===========================================');

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
