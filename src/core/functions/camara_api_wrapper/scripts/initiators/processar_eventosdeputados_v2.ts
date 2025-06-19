/**
 * Script para processamento de eventos de deputados
 * 
 * Sistema ETL Modular da Câmara dos Deputados v2.0
 */
import { configurarVariaveisAmbiente } from '../config/environment.config';
import { initializeFirestore } from '../utils/storage/firestore/config';
configurarVariaveisAmbiente();
initializeFirestore();

import { EventosDeputadosProcessor } from '../processors/eventos-deputados.processor';
import { ETLCommandParser } from '../utils/cli/etl-cli';
import { logger } from '../utils/logging';
import { etlConfig } from '../config/etl.config'; // Para legislatura padrão
import { getLegislaturaPeriodo, gerarPeriodosAnuais } from '../utils/date/periodo-legislatura';
import { DeputadoBasico } from '../types/etl.types'; // Para DeputadoBasico
import { apiClient } from '../utils/api'; // Para buscar deputados
import { endpoints } from '../config/endpoints'; // Para buscar deputados

/**
 * Função principal
 */
async function main(): Promise<void> {
  let cli: ETLCommandParser;
  
  try {
    cli = new ETLCommandParser('camara:eventos', 'Processador de Eventos de Deputados');
    
    cli.addCustomOption('--data', {
      description: 'Processa a legislatura inteira, dividindo por ano. Ignora --data-inicio, --data-fim e --atualizar.'
    })
    .addCustomOption('--data-inicio', {
      description: 'Data início para filtrar eventos (YYYY-MM-DD). Ignorado se --data for usado.',
      validator: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value)
    })
    .addCustomOption('--data-fim', {
      description: 'Data fim para filtrar eventos (YYYY-MM-DD). Ignorado se --data for usado.',
      validator: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value)
    })
    .addCustomOption('--atualizar', {
      description: `Modo atualização incremental (últimos ${etlConfig.camara.diasAtualizacaoIncrementalEventos || 60} dias). Ignorado se --data for usado.`
    })
    .addCustomOption('--concorrencia', {
      description: `Número de deputados processados em paralelo (padrão: ${etlConfig.camara.concorrenciaEventos || 2})`,
      validator: (value) => {
        const num = parseInt(value);
        return !isNaN(num) && num >= 1 && num <= 10;
      },
      transformer: (value) => parseInt(value),
      defaultValue: etlConfig.camara.concorrenciaEventos || 2
    })
    .addCustomOption('--pc', {
      description: 'Salva os dados localmente no PC. Os dados serão armazenados em src/core/BancoDadosLocal/',
      defaultValue: false
    })
    .addCustomOption('--firestore', {
      description: 'Salva os dados no Firestore.',
      defaultValue: true
    });
    // Adicionar outras opções específicas para eventos se necessário (ex: tipoEvento, situacaoEvento)
    // .addCustomOption('--tipo-evento', {
    //   description: 'ID do tipo de evento para filtrar'
    // })
    // .addCustomOption('--situacao-evento', {
    //   description: 'Situação do evento para filtrar (Ex: Realizada, Cancelada)'
    // })

    const options = cli.parse();

    const legislaturaDefault = etlConfig.camara.legislatura.atual || 57; // Usar legislatura atual da config ou fallback
    const legislatura = options.legislatura || legislaturaDefault;
    
    logger.info('🏛️ Sistema ETL - Câmara dos Deputados v2.0');
    logger.info('📅 Processador: Eventos de Deputados');

    if (options.data) {
      logger.info(`🚩 Modo --data ATIVADO para legislatura ${legislatura}ª.`);
      if (options.dataInicio || options.dataFim || options.atualizar) {
        logger.warn('⚠️ Opções --data-inicio, --data-fim e --atualizar são ignoradas quando --data é usado.');
      }

      const periodoLeg = await getLegislaturaPeriodo(legislatura);
      if (!periodoLeg) {
        logger.error(`❌ Não foi possível obter o período da legislatura ${legislatura}. Abortando.`);
        process.exit(1);
      }

      const periodosAnuais = gerarPeriodosAnuais(periodoLeg.dataInicio, periodoLeg.dataFim);
      if (periodosAnuais.length === 0) {
        logger.warn(`⚠️ Nenhum período anual gerado para a legislatura ${legislatura}. Verifique as datas: ${periodoLeg.dataInicio} - ${periodoLeg.dataFim}`);
        process.exit(0);
      }
      
      logger.info(`🗓️ Processando legislatura ${legislatura}ª em ${periodosAnuais.length} períodos anuais.`);

      // Buscar lista de deputados da legislatura UMA VEZ
      logger.info(`🔎 Buscando lista de deputados para a ${legislatura}ª legislatura...`);
      const endpointConfigDeputados = endpoints.DEPUTADOS.LISTA;
      const paramsDeputados = {
        ...endpointConfigDeputados.PARAMS,
        idLegislatura: legislatura.toString(),
        ordem: 'ASC',
        ordenarPor: 'nome'
      };
      const deputadosDaLegislaturaApi = await apiClient.getAllPages(
        endpointConfigDeputados.PATH,
        paramsDeputados,
        { context: `Lista de deputados da legislatura ${legislatura} para eventos (modo --data)`, maxPages: 10 }
      );

      if (!deputadosDaLegislaturaApi || !Array.isArray(deputadosDaLegislaturaApi) || deputadosDaLegislaturaApi.length === 0) {
        logger.error(`❌ Nenhum deputado encontrado para a legislatura ${legislatura}. Abortando.`);
        process.exit(1);
      }
      
      const listaDeputadosPreBuscada: DeputadoBasico[] = deputadosDaLegislaturaApi.map((dep: any) => ({
        id: dep.id?.toString() || '',
        nome: dep.nome || '',
        nomeCivil: dep.nomeCivil,
        siglaPartido: dep.siglaPartido || '',
        siglaUf: dep.siglaUf || '',
        idLegislatura: legislatura, // Usar a legislatura principal do processamento
        urlFoto: dep.urlFoto
      }));
      logger.info(`✅ ${listaDeputadosPreBuscada.length} deputados encontrados para a legislatura ${legislatura}.`);
      
      // Opções para o processador único
      const processorOptionsUnico = {
        ...options,
        legislatura,
        concorrencia: typeof options.concorrencia === 'number' ? options.concorrencia : (etlConfig.camara.concorrenciaEventos || 2),
        atualizar: false, // --data ignora --atualizar
        // dataInicio e dataFim são ignorados pelo processador se periodosAnuaisParaVarredura for fornecido
        periodosAnuaisParaVarredura: periodosAnuais,
        listaDeputadosPreBuscada: listaDeputadosPreBuscada,
        pc: !!options.pc,
        firestore: !!options.firestore
      };

      logger.info(`\n▶️ Iniciando processamento de eventos para toda a legislatura ${legislatura}ª (varredura anual interna)`);
      logger.info(`📋 Legislatura: ${processorOptionsUnico.legislatura}ª`);
      if (processorOptionsUnico.limite) logger.info(`🔢 Limite: ${processorOptionsUnico.limite} deputados (aplicado na lista pré-buscada)`);
      logger.info(`⚡ Concorrência: ${processorOptionsUnico.concorrencia} deputados simultâneos`);
      if (processorOptionsUnico.pc) logger.info('💻 Modo PC: Salvando dados localmente');
      if (processorOptionsUnico.firestore) logger.info('☁️ Modo Firestore: Salvando dados na nuvem');
      else if (!processorOptionsUnico.pc) logger.warn('⚠️ Nenhum destino de salvamento especificado (nem --pc nem --firestore). Os dados não serão salvos.');
      logger.info(`👥 Total de deputados a serem processados (após filtros e limite, se houver): ${listaDeputadosPreBuscada.length > 0 ? 'Verificar logs do processador' : 0}`);
      logger.info(`🗓️ Períodos anuais para varredura: ${periodosAnuais.map(p => `${p.dataInicio}-${p.dataFim}`).join('; ')}`);

      const processor = new EventosDeputadosProcessor(processorOptionsUnico);
      const resultadoFinal = await processor.process();

      logger.info('\n✅ ===== PROCESSAMENTO DE EVENTOS (MODO --data) CONCLUÍDO =====');
      logger.info(`🏛️ Legislatura Processada: ${legislatura}ª`);
      logger.info(`📊 Sucessos: ${resultadoFinal.sucessos}`);
      logger.info(`❌ Falhas: ${resultadoFinal.falhas}`);
      logger.info(`⚠️ Avisos: ${resultadoFinal.avisos}`);
      logger.info(`⏱️ Tempo Total: ${resultadoFinal.tempoProcessamento.toFixed(2)}s`);
      logger.info(`💾 Destino: ${resultadoFinal.destino}`);
      if (resultadoFinal.detalhes) {
        const detalhesEventos = resultadoFinal.detalhes as import('../types/etl.types').EventosBatchResultDetails;
        logger.info(`📅 Eventos Totais Salvos: ${detalhesEventos.eventosSalvos || 0}`);
        logger.info(`👥 Deputados Processados: ${detalhesEventos.deputadosProcessados || 0}`);
      }
      logger.info('=============================================================');

    } else {
      // Lógica original sem a flag --data
      if (options.legislatura) {
        logger.info(`🏦 Legislatura especificada: ${legislatura}ª Legislatura`);
      } else {
        logger.info(`🏦 Usando legislatura padrão: ${legislatura}ª Legislatura (${legislaturaDefault === etlConfig.camara.legislatura.atual ? 'config' : 'fallback'})`);
      }

      const processorOptions = {
        ...options,
        legislatura,
        concorrencia: typeof options.concorrencia === 'number' ? options.concorrencia : (etlConfig.camara.concorrenciaEventos || 2),
        dataInicio: options.dataInicio,
        dataFim: options.dataFim,
        atualizar: !!options.atualizar,
        pc: !!options.pc,
        firestore: !!options.firestore
      };

      logger.info(`📋 Legislatura: ${processorOptions.legislatura}ª`);
      logger.info(`🔧 Modo: ${processorOptions.atualizar ? `ATUALIZAÇÃO INCREMENTAL (${etlConfig.camara.diasAtualizacaoIncrementalEventos || 60} dias)` : (processorOptions.dataInicio || processorOptions.dataFim ? 'PERÍODO ESPECÍFICO' : 'COMPLETO (sem filtro de data)')}`);
      if (processorOptions.dataInicio) logger.info(`📅 Data início: ${processorOptions.dataInicio}`);
      if (processorOptions.dataFim) logger.info(`📅 Data fim: ${processorOptions.dataFim}`);
      if (processorOptions.limite) logger.info(`🔢 Limite: ${processorOptions.limite} deputados`);
      logger.info(`⚡ Concorrência: ${processorOptions.concorrencia} deputados simultâneos`);
      if (processorOptions.pc) logger.info('💻 Modo PC: Salvando dados localmente');
      if (processorOptions.firestore) logger.info('☁️ Modo Firestore: Salvando dados na nuvem');
      else if (!processorOptions.pc) logger.warn('⚠️ Nenhum destino de salvamento especificado (nem --pc nem --firestore). Os dados não serão salvos.');

      const processor = new EventosDeputadosProcessor(processorOptions);
      const resultado = await processor.process();

      logger.info('');
      logger.info('✅ ===== PROCESSAMENTO DE EVENTOS CONCLUÍDO =====');
      logger.info(`📊 Sucessos: ${resultado.sucessos}`);
      logger.info(`❌ Falhas: ${resultado.falhas}`);
      logger.info(`⚠️ Avisos: ${resultado.avisos}`);
      logger.info(`⏱️ Tempo total: ${resultado.tempoProcessamento}s`);
      logger.info(`💾 Destino: ${resultado.destino}`);
      if (resultado.detalhes) {
        const detalhesEventos = resultado.detalhes as import('../types/etl.types').EventosBatchResultDetails;
        logger.info(`📅 Eventos processados: ${detalhesEventos.eventosSalvos || 0}`);
        logger.info(`👥 Deputados processados: ${detalhesEventos.deputadosProcessados || 0}`);
      }
      logger.info('===============================================');
    }

  } catch (error: any) {
    logger.error(`❌ Erro fatal no processamento de eventos: ${error.message}`);
    if (error.stack && process.env.DEBUG) {
      logger.error(`🔍 Stack trace: ${error.stack}`);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error(`💥 Erro não capturado em eventos: ${error.message}`);
    process.exit(1);
  });
}

export { main };
