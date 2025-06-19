/**
 * Script para processar grupos parlamentares da Câmara dos Deputados
 *
 * Sistema ETL Modular da Câmara dos Deputados v2.0
 * Segue o padrão arquitetural do sistema do Senado Federal
 *
 * Uso:
 *   npm run camara:grupos -- [opções]
 *
 * Exemplos:
 *   npm run camara:grupos                       # Processa todos os grupos
 *   npm run camara:grupos -- --limite 10        # Limita a 10 grupos
 *   npm run camara:grupos -- --pc --verbose     # Salva no PC com logs detalhados
 *   npm run camara:grupos -- --emulator         # Usa Firestore Emulator
 */

// IMPORTANTE: Configurar variáveis de ambiente ANTES de qualquer import do Firestore
import { configurarVariaveisAmbiente } from '../config/environment.config';
import { initializeFirestore } from '../utils/storage/firestore/config';
configurarVariaveisAmbiente();
initializeFirestore(); // Inicializa o Firestore com as configurações de ambiente

import { GruposProcessor } from '../processors/grupos.processor';
import { ETLCommandParser } from '../utils/cli/etl-cli';
import { logger } from '../utils/logging';

/**
 * Função principal
 */
async function main(): Promise<void> {
  let cli: ETLCommandParser;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsedCliArgs: any; // Para armazenar as opções parseadas e usá-las no catch

  try {
    // Configurar CLI com opções específicas
    cli = new ETLCommandParser('camara:grupos', 'Processador de Grupos Parlamentares');
    
    // Adicionar opções específicas de grupos (se houver, por enquanto usaremos as comuns)
    // cli.addCustomOption('--incluir-historico', {
    //   description: 'Incluir histórico de cada grupo',
    //   defaultValue: true
    // })
    // .addCustomOption('--incluir-membros', {
    //   description: 'Incluir membros de cada grupo',
    //   defaultValue: true
    // })
    cli.addCustomOption('--atualizar', { // Manter opção de atualização, embora a lógica específica precise ser implementada no processor
      description: 'Modo atualização incremental (ainda não implementado para grupos)',
      defaultValue: false
    })
    .addCustomOption('--concorrencia', {
      description: 'Número de grupos processados em paralelo (padrão: 2)',
      validator: (value: string) => {
        const num = parseInt(value);
        return !isNaN(num) && num >= 1 && num <= 10;
      },
      transformer: (value: string) => parseInt(value),
      defaultValue: 2
    })
    .addCustomOption('--max-pages-api', {
      description: 'Número máximo de páginas a serem buscadas na API para listas principais (padrão: 50)',
      validator: (value: string) => parseInt(value) > 0,
      transformer: (value: string) => parseInt(value),
      defaultValue: 50,
    })
    .addCustomOption('--max-pages-api-historico', {
      description: 'Número máximo de páginas a serem buscadas na API para histórico de grupos (padrão: 10)',
      validator: (value: string) => parseInt(value) > 0,
      transformer: (value: string) => parseInt(value),
      defaultValue: 10,
    })
    .addCustomOption('--max-pages-api-membros', {
      description: 'Número máximo de páginas a serem buscadas na API para membros de grupos (padrão: 20)',
      validator: (value: string) => parseInt(value) > 0,
      transformer: (value: string) => parseInt(value),
      defaultValue: 20,
    });


    // Parse dos argumentos
    parsedCliArgs = cli.parse();
    
    // Configurar opções específicas do processador
    // Grupos não são filtrados por legislatura na API principal, então removemos essa lógica daqui.
    // Se for necessário filtrar por legislatura em algum momento (ex: nos membros),
    // essa lógica pode ser adicionada ao processor ou como opção.
    const processorOptions = {
      ...parsedCliArgs,
      concorrencia: parsedCliArgs.concorrencia || 2,
      // incluirHistorico: parsedCliArgs.incluirHistorico !== false, // Se a opção for adicionada
      // incluirMembros: parsedCliArgs.incluirMembros !== false,   // Se a opção for adicionada
      atualizar: !!parsedCliArgs.atualizar, // Lógica de atualização precisa ser implementada no processor
      maxPagesApi: parsedCliArgs.maxPagesApi || 50,
      maxPagesApiHistorico: parsedCliArgs.maxPagesApiHistorico || 10,
      maxPagesApiMembros: parsedCliArgs.maxPagesApiMembros || 20,
    };

    // Log de configuração
    logger.info('🏛️ Sistema ETL - Câmara dos Deputados v2.0');
    logger.info('🔷 Processador: Grupos Parlamentares');
    logger.info(`🔧 Modo: ${processorOptions.atualizar ? 'ATUALIZAÇÃO INCREMENTAL (NÃO IMPLEMENTADO)' : 'COMPLETO'}`);
    // logger.info(`📋 Incluir histórico: ${processorOptions.incluirHistorico ? 'SIM' : 'NÃO'}`); // Se a opção for adicionada
    // logger.info(`📋 Incluir membros: ${processorOptions.incluirMembros ? 'SIM' : 'NÃO'}`);   // Se a opção for adicionada
    if (processorOptions.limite) logger.info(`🔢 Limite: ${processorOptions.limite} grupos`);
    logger.info(`⚡ Concorrência: ${processorOptions.concorrencia} grupos simultâneos`);
    logger.info(`📄 Max Páginas API (Lista): ${processorOptions.maxPagesApi}`);
    logger.info(`📄 Max Páginas API (Histórico): ${processorOptions.maxPagesApiHistorico}`);
    logger.info(`📄 Max Páginas API (Membros): ${processorOptions.maxPagesApiMembros}`);


    // Criar e executar processador
    const processor = new GruposProcessor(processorOptions);
    const resultado = await processor.process();

    // Log de resultado final
    logger.info('');
    logger.info('✅ ===== PROCESSAMENTO DE GRUPOS CONCLUÍDO =====');
    logger.info(`📊 Sucessos: ${resultado.sucessos}`);
    logger.info(`❌ Falhas: ${resultado.falhas}`);
    logger.info(`⚠️ Avisos: ${resultado.avisos}`);
    logger.info(`⏱️ Tempo total: ${resultado.tempoProcessamento}s`);
    logger.info(`💾 Destino: ${resultado.destino}`);
    if (resultado.detalhes) {
      logger.info(`🔷 Grupos processados: ${resultado.detalhes.gruposProcessados || 0}`);
      logger.info(`📜 Itens de Histórico processados: ${resultado.detalhes.historicoItemsProcessados || 0}`);
      logger.info(`👥 Membros processados: ${resultado.detalhes.membrosProcessados || 0}`);
    }
    logger.info('===============================================');

  } catch (error: any) {
    logger.error(`❌ Erro fatal no processamento de grupos: ${error.message}`);
    if (error.stack && (process.env.DEBUG === 'true' || parsedCliArgs?.verbose)) { // Mostrar stack se DEBUG ou verbose
      logger.error(`🔍 Stack trace: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Executar com tratamento de erro global
if (require.main === module) {
  main().catch((error) => {
    logger.error(`💥 Erro não capturado no main de grupos: ${error.message}`);
    if (error.stack && process.env.DEBUG === 'true') {
      logger.error(`🔍 Stack trace: ${error.stack}`);
    }
    process.exit(1);
  });
}

export { main as mainProcessarGrupos }; // Exportar com nome diferente para evitar conflitos se importado junto
