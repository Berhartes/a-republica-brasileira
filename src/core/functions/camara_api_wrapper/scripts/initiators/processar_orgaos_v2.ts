/**
 * Script para processar órgãos da Câmara dos Deputados
 *
 * Sistema ETL Modular da Câmara dos Deputados v2.0
 * Segue o padrão arquitetural do sistema do Senado Federal
 *
 * Uso:
 *   npm run camara:orgaos -- [opções]
 *
 * Exemplos:
 *   npm run camara:orgaos                       # Processa todos os órgãos
 *   npm run camara:orgaos -- --limite 10        # Limita a 10 órgãos
 *   npm run camara:orgaos -- --pc --verbose     # Salva no PC com logs detalhados
 *   npm run camara:orgaos -- --emulator         # Usa Firestore Emulator
 */

// IMPORTANTE: Configurar variáveis de ambiente ANTES de qualquer import do Firestore
import { configurarVariaveisAmbiente } from '../config/environment.config';
import { initializeFirestore } from '../utils/storage/firestore/config';
configurarVariaveisAmbiente();
initializeFirestore();

import { OrgaosProcessor } from '../processors/orgaos.processor'; // Será criado
import { ETLCommandParser } from '../utils/cli/etl-cli';
import { logger } from '../utils/logging';
import { etlConfig } from '../config/etl.config';
import { getLegislaturaPeriodo, gerarPeriodosAnuais, Periodo } from '../utils/date/periodo-legislatura';

/**
 * Função principal
 */
async function main(): Promise<void> {
  let cli: ETLCommandParser;

  try {
    // Configurar CLI com opções específicas
    cli = new ETLCommandParser('camara:orgaos', 'Processador de Órgãos da Câmara');

    // As opções de legislatura (ex: --56) são adicionadas por padrão pelo ETLCommandParser,
    // ou o parser é configurado para reconhecê-las.
    // Não é necessário adicionar --id-legislatura como custom option se options.legislatura já é populado.
    cli.addCustomOption('--data', {
      description: 'Processa usando o período completo da legislatura especificada (ou padrão). Ignora --data-inicio-*, --data-fim-*.'
    })
    .addCustomOption('--concorrencia', {
      description: 'Número de órgãos processados em paralelo para busca de detalhes (padrão: 3)',
      validator: (value: string) => {
        const num = parseInt(value);
        return !isNaN(num) && num >= 1 && num <= 10;
      },
      transformer: (value: string) => parseInt(value),
      defaultValue: 3
    });

    cli.addCustomOption('--data-inicio-eventos', {
        description: 'Data de início para busca de eventos (YYYY-MM-DD, padrão: 2025-02-02)',
        defaultValue: '2025-02-02'
    });
    cli.addCustomOption('--data-fim-eventos', {
        description: 'Data de fim para busca de eventos (YYYY-MM-DD, padrão: 2025-05-05)',
        defaultValue: '2025-05-05'
    });
    cli.addCustomOption('--data-inicio-votacoes', {
        description: 'Data de início para busca de votações (YYYY-MM-DD, padrão: 2025-01-01)',
        defaultValue: '2025-01-01'
    });
    cli.addCustomOption('--data-fim-votacoes', {
        description: 'Data de fim para busca de votações (YYYY-MM-DD, padrão: 2025-05-05)',
        defaultValue: '2025-05-05'
    });


    // Parse dos argumentos
    const options = cli.parse();

    // Determinar idLegislatura
    // ETLCommandParser popula options.legislatura se flags como --56, --57 são usadas.
    const legislaturaSelecionada = options.legislatura; // Pode ser undefined se nenhuma flag de legislatura foi passada
    const idLegislatura = legislaturaSelecionada || etlConfig.camara.legislatura.atual || etlConfig.camara.legislatura.max;
    
    logger.info(`🏛️ Sistema ETL - Câmara dos Deputados v2.0`);
    logger.info(`🔷 Processador: Órgãos da Câmara`);
    logger.info(`🏛️ Legislatura selecionada: ${idLegislatura}ª`);

    let dataInicioEventos_param: string | undefined = options.dataInicioEventos;
    let dataFimEventos_param: string | undefined = options.dataFimEventos;
    let dataInicioVotacoes_param: string | undefined = options.dataInicioVotacoes;
    let dataFimVotacoes_param: string | undefined = options.dataFimVotacoes;
    let periodosAnuaisParaVarredura: Periodo[] | undefined = undefined;

    if (options.data) {
      logger.info('🚩 Modo --data ATIVADO. Iniciando varredura anual da legislatura.');
      if (options.dataInicioEventos || options.dataFimEventos || options.dataInicioVotacoes || options.dataFimVotacoes) {
        logger.warn('⚠️ Opções --data-inicio-* e --data-fim-* são ignoradas quando --data é usado.');
      }
      const periodoLegislatura = await getLegislaturaPeriodo(idLegislatura);
      if (periodoLegislatura) {
        periodosAnuaisParaVarredura = gerarPeriodosAnuais(periodoLegislatura.dataInicio, periodoLegislatura.dataFim);
        logger.info(`📅 Período da legislatura ${idLegislatura}ª: ${periodoLegislatura.dataInicio} a ${periodoLegislatura.dataFim}`);
        if (periodosAnuaisParaVarredura.length > 0) {
          logger.info(`🗓️ Processando em ${periodosAnuaisParaVarredura.length} períodos anuais:`);
          periodosAnuaisParaVarredura.forEach(p => logger.info(`   - ${p.dataInicio} a ${p.dataFim}`));
        } else {
          logger.warn(`⚠️ Nenhum período anual gerado para a legislatura ${idLegislatura}. Verifique as datas.`);
        }
        // Limpar datas individuais para que o processador use periodosAnuaisParaVarredura
        dataInicioEventos_param = undefined;
        dataFimEventos_param = undefined;
        dataInicioVotacoes_param = undefined;
        dataFimVotacoes_param = undefined;
      } else {
        logger.error(`❌ Não foi possível obter o período para a legislatura ${idLegislatura}. Verifique a configuração e a API. Datas explícitas ou padrão serão usadas se fornecidas.`);
      }
    }

    // Configurar opções específicas do processador
    const processorOptions: any = { // Usar 'any' temporariamente ou ajustar ETLOptions
      ...options,
      idLegislatura,
      legislatura: idLegislatura,
      concorrencia: options.concorrencia || 3,
    };

    if (periodosAnuaisParaVarredura && periodosAnuaisParaVarredura.length > 0) {
      processorOptions.periodosAnuaisParaVarredura = periodosAnuaisParaVarredura;
    } else {
      processorOptions.dataInicioEventos = dataInicioEventos_param;
      processorOptions.dataFimEventos = dataFimEventos_param;
      processorOptions.dataInicioVotacoes = dataInicioVotacoes_param;
      processorOptions.dataFimVotacoes = dataFimVotacoes_param;
    }
    
    // Log de configuração
    if (processorOptions.limite) logger.info(`🔢 Limite: ${processorOptions.limite} órgãos`);
    logger.info(`⚡ Concorrência (detalhes): ${processorOptions.concorrencia} órgãos simultâneos`);
    if (processorOptions.periodosAnuaisParaVarredura) {
      logger.info(`🔄 Varredura anual ativada para eventos e votações.`);
    } else {
      logger.info(`📅 Período para Eventos: ${processorOptions.dataInicioEventos || 'N/A'} a ${processorOptions.dataFimEventos || 'N/A'}`);
      logger.info(`�️ Período para Votações: ${processorOptions.dataInicioVotacoes || 'N/A'} a ${processorOptions.dataFimVotacoes || 'N/A'}`);
    }

    // Criar e executar processador
    const processor = new OrgaosProcessor(processorOptions);
    const resultado = await processor.process();

    // Log de resultado final
    logger.info('');
    logger.info('✅ ===== PROCESSAMENTO DE ÓRGÃOS CONCLUÍDO =====');
    logger.info(`📊 Sucessos: ${resultado.sucessos}`);
    logger.info(`❌ Falhas: ${resultado.falhas}`);
    logger.info(`⚠️ Avisos: ${resultado.avisos}`);
    logger.info(`⏱️ Tempo total: ${resultado.tempoProcessamento}s`);
    logger.info(`💾 Destino: ${resultado.destino}`);
    if (resultado.detalhes) {
      logger.info(`🔷 Órgãos processados: ${resultado.detalhes.orgaosProcessados || 0}`);
      logger.info(`�📅 Eventos encontrados: ${resultado.detalhes.eventosEncontrados || 0}`);
      logger.info(`👥 Membros encontrados: ${resultado.detalhes.membrosEncontrados || 0}`);
      logger.info(`🗳️ Votações encontradas: ${resultado.detalhes.votacoesEncontradas || 0}`);
    }
    logger.info('=================================================');

  } catch (error: any) {
    logger.error(`❌ Erro fatal no processamento de órgãos: ${error.message}`);
    if (error.stack && process.env.DEBUG) {
      logger.error(`🔍 Stack trace: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Executar com tratamento de erro global
if (require.main === module) {
  main().catch((error) => {
    logger.error(`💥 Erro não capturado ao processar órgãos: ${error.message}`);
    process.exit(1);
  });
}

export { main };
