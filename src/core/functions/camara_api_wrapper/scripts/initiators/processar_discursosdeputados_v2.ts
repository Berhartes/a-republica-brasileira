/**
 * Script refatorado para processamento de discursos de deputados
 * 
 * Sistema ETL Modular da Câmara dos Deputados v2.0
 * Segue o padrão arquitetural do sistema do Senado Federal
 */
import { configurarVariaveisAmbiente } from '../config/environment.config';
import { initializeFirestore } from '../utils/storage/firestore/config'; // Importar initializeFirestore
configurarVariaveisAmbiente();
initializeFirestore(); // Chamar após configurar variáveis de ambiente

import { DiscursosDeputadosProcessor } from '../processors/discursos-deputados.processor';
import { ETLCommandParser } from '../utils/cli/etl-cli';
import { logger } from '../utils/logging';

/**
 * Função principal
 */
async function main(): Promise<void> {
  let cli: ETLCommandParser;
  
  try {
    // Configurar CLI com opções específicas
    cli = new ETLCommandParser('camara:discursos', 'Processador de Discursos de Deputados');
    
    // Adicionar opções específicas de discursos
    cli.addCustomOption('--data-inicio', {
      description: 'Data início para filtrar discursos (YYYY-MM-DD)',
      validator: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value)
    })
    .addCustomOption('--data-fim', {
      description: 'Data fim para filtrar discursos (YYYY-MM-DD)',
      validator: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value)
    })
    .addCustomOption('--palavras-chave', {
      description: 'Palavras-chave para busca (separadas por vírgula)'
    })
    .addCustomOption('--tipo', {
      description: 'Tipo específico de discurso'
    })
    .addCustomOption('--atualizar', {
      description: 'Modo atualização incremental (últimos 60 dias)'
      // Remover defaultValue: false para que a flag seja tratada como true quando presente sem valor
    })
    .addCustomOption('--concorrencia', {
      description: 'Número de deputados processados em paralelo (padrão: 2)',
      validator: (value) => {
        const num = parseInt(value);
        return !isNaN(num) && num >= 1 && num <= 10;
      },
      transformer: (value) => parseInt(value),
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

    // Processar palavras-chave se fornecidas
    let palavrasChave: string[] = [];
    if (options.palavrasChave) {
      palavrasChave = options.palavrasChave
        .split(',')
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 0);
    }

    // Configurar opções específicas
    const processorOptions = {
      ...options,
      legislatura, // Usar a legislatura detectada corretamente
      concorrencia: typeof options.concorrencia === 'number' ? options.concorrencia : 2,
      dataInicio: options.dataInicio,
      dataFim: options.dataFim,
      palavrasChave,
      tipo: options.tipo,
      atualizar: !!options.atualizar
    };

    // Log de configuração
    logger.info('🏛️ Sistema ETL - Câmara dos Deputados v2.0');
    logger.info('🎤 Processador: Discursos de Deputados');
    logger.info(`📋 Legislatura: ${processorOptions.legislatura}ª`);
    logger.info(`🔧 Modo: ${processorOptions.atualizar ? 'ATUALIZAÇÃO INCREMENTAL (60 dias)' : 'COMPLETO'}`);
    if (processorOptions.dataInicio) logger.info(`📅 Data início: ${processorOptions.dataInicio}`);
    if (processorOptions.dataFim) logger.info(`📅 Data fim: ${processorOptions.dataFim}`);
    if (processorOptions.tipo) logger.info(`🎯 Tipo: ${processorOptions.tipo}`);
    if (palavrasChave.length > 0) logger.info(`🔍 Palavras-chave: ${palavrasChave.join(', ')}`);
    if (processorOptions.limite) logger.info(`🔢 Limite: ${processorOptions.limite} deputados`);
    logger.info(`⚡ Concorrência: ${processorOptions.concorrencia} deputados simultâneos`);

    // Criar e executar processador
    const processor = new DiscursosDeputadosProcessor(processorOptions);
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
      logger.info(`🎤 Discursos processados: ${resultado.detalhes.discursosSalvos || 0}`);
      logger.info(`👥 Deputados processados: ${resultado.detalhes.deputadosProcessados || 0}`);
      if (resultado.detalhes.comTranscricao) {
        logger.info(`📝 Com transcrição: ${resultado.detalhes.comTranscricao}`);
      }
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
