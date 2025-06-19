/**
 * Script para processar partidos políticos da Câmara dos Deputados
 *
 * Sistema ETL Modular da Câmara dos Deputados v2.0
 * Segue o padrão arquitetural do sistema do Senado Federal
 *
 * Uso:
 *   npm run camara:partidos -- [legislatura] [opções]
 *
 * Exemplos:
 *   npm run camara:partidos                       # Processa legislatura atual
 *   npm run camara:partidos -- 57 --limite 5      # Legislatura 57, limitado a 5 partidos
 *   npm run camara:partidos -- --pc --verbose     # Salva no PC com logs detalhados
 *   npm run camara:partidos -- --emulator         # Usa Firestore Emulator
 */

// IMPORTANTE: Configurar variáveis de ambiente ANTES de qualquer import do Firestore
import { configurarVariaveisAmbiente } from '../config/environment.config';
import { initializeFirestore } from '../utils/storage/firestore/config';
configurarVariaveisAmbiente();
initializeFirestore();

import { PartidosProcessor } from '../processors/partidos.processor'; // Será criado
import { ETLCommandParser } from '../utils/cli/etl-cli';
import { logger } from '../utils/logging';
// import { obterNumeroLegislaturaAtual } from '../utils/date/legislatura'; // Usaremos uma constante por enquanto

/**
 * Função principal
 */
async function main(): Promise<void> {
  let cli: ETLCommandParser;

  try {
    // Configurar CLI com opções específicas
    cli = new ETLCommandParser('camara:partidos', 'Processador de Partidos Políticos');

    // Adicionar opções específicas de partidos (se necessário no futuro, por enquanto usaremos as comuns)
    // cli.addCustomOption('--incluir-detalhes-completos', {
    //   description: 'Incluir todos os detalhes disponíveis para cada partido',
    //   defaultValue: true
    // })
    cli.addCustomOption('--concorrencia', {
      description: 'Número de partidos processados em paralelo para busca de detalhes (padrão: 3)',
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
    // TODO: Considerar buscar dinamicamente a legislatura atual se necessário,
    // mas para manter a simplicidade e consistência com outros scripts, usamos uma constante.
    const legislaturaDefault = 57; // Exemplo: Legislatura 57. Ajustar conforme necessário ou implementar busca dinâmica.
    const legislatura = options.legislatura || legislaturaDefault;

    if (options.legislatura) {
      logger.info(`🏛️ Legislatura especificada: ${legislatura}ª Legislatura`);
    } else {
      logger.info(`🏛️ Usando legislatura padrão: ${legislatura}ª Legislatura`);
    }

    // Configurar opções específicas do processador
    const processorOptions = {
      ...options,
      legislatura,
      concorrencia: options.concorrencia || 3,
      // incluirDetalhesCompletos: options.incluirDetalhesCompletos !== false, // Exemplo
    };

    // Log de configuração
    logger.info('🏛️ Sistema ETL - Câmara dos Deputados v2.0');
    logger.info('🔷 Processador: Partidos Políticos');
    logger.info(`📋 Legislatura: ${processorOptions.legislatura}ª`);
    if (processorOptions.limite) logger.info(`🔢 Limite: ${processorOptions.limite} partidos`);
    logger.info(`⚡ Concorrência (detalhes): ${processorOptions.concorrencia} partidos simultâneos`);

    // Criar e executar processador
    const processor = new PartidosProcessor(processorOptions);
    const resultado = await processor.process();

    // Log de resultado final
    logger.info('');
    logger.info('✅ ===== PROCESSAMENTO DE PARTIDOS CONCLUÍDO =====');
    logger.info(`📊 Sucessos: ${resultado.sucessos}`);
    logger.info(`❌ Falhas: ${resultado.falhas}`);
    logger.info(`⚠️ Avisos: ${resultado.avisos}`);
    logger.info(`⏱️ Tempo total: ${resultado.tempoProcessamento}s`);
    logger.info(`💾 Destino: ${resultado.destino}`);
    if (resultado.detalhes) {
      logger.info(`🔷 Partidos processados: ${resultado.detalhes.partidosProcessados || 0}`);
      logger.info(`👥 Líderes encontrados: ${resultado.detalhes.lideresEncontrados || 0}`);
      logger.info(`👥 Membros encontrados: ${resultado.detalhes.membrosEncontrados || 0}`);
    }
    logger.info('=================================================');

  } catch (error: any) {
    logger.error(`❌ Erro fatal no processamento de partidos: ${error.message}`);
    if (error.stack && process.env.DEBUG) {
      logger.error(`🔍 Stack trace: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Executar com tratamento de erro global
if (require.main === module) {
  main().catch((error) => {
    logger.error(`💥 Erro não capturado ao processar partidos: ${error.message}`);
    process.exit(1);
  });
}

export { main };
