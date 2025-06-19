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
import { etlConfig } from '../config/etl.config'; // Para legislatura padrão e outras configs
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
    // Configurar CLI com opções específicas
    cli = new ETLCommandParser('camara:discursos', 'Processador de Discursos de Deputados');
    
    cli.addCustomOption('--data', {
      description: 'Processa a legislatura inteira, dividindo por ano. Ignora --data-inicio, --data-fim e --atualizar.'
    })
    .addCustomOption('--data-inicio', {
      description: 'Data início para filtrar discursos (YYYY-MM-DD). Ignorado se --data for usado.',
      validator: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value)
    })
    .addCustomOption('--data-fim', {
      description: 'Data fim para filtrar discursos (YYYY-MM-DD). Ignorado se --data for usado.',
      validator: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value)
    })
    .addCustomOption('--palavras-chave', {
      description: 'Palavras-chave para busca (separadas por vírgula)'
    })
    .addCustomOption('--tipo', {
      description: 'Tipo específico de discurso'
    })
    .addCustomOption('--atualizar', {
      description: 'Modo atualização incremental (últimos 60 dias). Ignorado se --data for usado.'
    })
    .addCustomOption('--concorrencia', {
      description: `Número de deputados processados em paralelo (padrão: ${etlConfig.camara.concorrenciaDiscursos || 2})`,
      validator: (value) => {
        const num = parseInt(value);
        return !isNaN(num) && num >= 1 && num <= 10;
      },
      transformer: (value) => parseInt(value),
      defaultValue: etlConfig.camara.concorrenciaDiscursos || 2
    })
    .addCustomOption('--pc', {
      description: 'Salva os dados localmente no PC em vez do Firestore. Os dados serão armazenados em src/core/BancoDadosLocal/',
      defaultValue: false
    });

    const options = cli.parse();
    const legislaturaDefault = etlConfig.camara.legislatura.atual || 57;
    const legislatura = options.legislatura || legislaturaDefault;

    logger.info('🏛️ Sistema ETL - Câmara dos Deputados v2.0');
    logger.info('🎤 Processador: Discursos de Deputados');

    // Processar palavras-chave se fornecidas (movido para antes da lógica condicional de --data)
    let palavrasChaveArray: string[] = [];
    if (options.palavrasChave) {
      palavrasChaveArray = options.palavrasChave
        .split(',')
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 0);
    }

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
        { context: `Lista de deputados da legislatura ${legislatura} para discursos (modo --data)`, maxPages: 10 }
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
        concorrencia: typeof options.concorrencia === 'number' ? options.concorrencia : (etlConfig.camara.concorrenciaDiscursos || 2),
        palavrasChave: palavrasChaveArray,
        tipo: options.tipo,
        atualizar: false, // --data ignora --atualizar
        // dataInicio e dataFim são ignorados pelo processador se periodosAnuaisParaVarredura for fornecido
        periodosAnuaisParaVarredura: periodosAnuais,
        listaDeputadosPreBuscada: listaDeputadosPreBuscada,
        pc: !!options.pc // Adicionar a flag pc
      };

      logger.info(`\n▶️ Iniciando processamento de discursos para toda a legislatura ${legislatura}ª (varredura anual interna)`);
      logger.info(`📋 Legislatura: ${processorOptionsUnico.legislatura}ª`);
      if (processorOptionsUnico.tipo) logger.info(`🎯 Tipo: ${processorOptionsUnico.tipo}`);
      if (palavrasChaveArray.length > 0) logger.info(`🔍 Palavras-chave: ${palavrasChaveArray.join(', ')}`);
      if (processorOptionsUnico.limite) logger.info(`🔢 Limite: ${processorOptionsUnico.limite} deputados (aplicado na lista pré-buscada)`);
      logger.info(`⚡ Concorrência: ${processorOptionsUnico.concorrencia} deputados simultâneos`);
      if (processorOptionsUnico.pc) logger.info('💻 Modo PC: Salvando dados localmente');
      logger.info(`👥 Total de deputados a serem processados (após filtros e limite, se houver): ${listaDeputadosPreBuscada.length > 0 ? 'Verificar logs do processador' : 0}`);
      logger.info(`🗓️ Períodos anuais para varredura: ${periodosAnuais.map(p => `${p.dataInicio}-${p.dataFim}`).join('; ')}`);
      
      const processor = new DiscursosDeputadosProcessor(processorOptionsUnico);
      const resultadoFinal = await processor.process();

      logger.info('\n✅ ===== PROCESSAMENTO DE DISCURSOS (MODO --data) CONCLUÍDO =====');
      logger.info(`🏛️ Legislatura Processada: ${legislatura}ª`);
      logger.info(`📊 Sucessos: ${resultadoFinal.sucessos}`);
      logger.info(`❌ Falhas: ${resultadoFinal.falhas}`);
      logger.info(`⚠️ Avisos: ${resultadoFinal.avisos}`);
      logger.info(`⏱️ Tempo Total: ${resultadoFinal.tempoProcessamento.toFixed(2)}s`);
      logger.info(`💾 Destino: ${resultadoFinal.destino}`);
      if (resultadoFinal.detalhes) {
        const detalhesDiscursos = resultadoFinal.detalhes as import('../types/etl.types').DiscursosBatchResultDetails;
        logger.info(`🎤 Discursos Totais Salvos: ${detalhesDiscursos.discursosSalvos || 0}`);
        logger.info(`👥 Deputados Processados: ${detalhesDiscursos.deputadosProcessados || 0}`);
        logger.info(`📝 Com transcrição (total): ${detalhesDiscursos.comTranscricao || 0}`);
      }
      logger.info('=================================================================');

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
        concorrencia: typeof options.concorrencia === 'number' ? options.concorrencia : (etlConfig.camara.concorrenciaDiscursos || 2),
        dataInicio: options.dataInicio,
        dataFim: options.dataFim,
        palavrasChave: palavrasChaveArray,
        tipo: options.tipo, // Adicionado explicitamente
        atualizar: !!options.atualizar,
        pc: !!options.pc // Adicionar a flag pc
      };

      logger.info(` Legislatura: ${processorOptions.legislatura}ª`);
      logger.info(`🔧 Modo: ${processorOptions.atualizar ? 'ATUALIZAÇÃO INCREMENTAL (60 dias)' : (processorOptions.dataInicio || processorOptions.dataFim ? 'PERÍODO ESPECÍFICO' : 'COMPLETO (sem filtro de data)')}`);
      if (processorOptions.dataInicio) logger.info(`📅 Data início: ${processorOptions.dataInicio}`);
      if (processorOptions.dataFim) logger.info(`📅 Data fim: ${processorOptions.dataFim}`);
      if (processorOptions.tipo) logger.info(`🎯 Tipo: ${processorOptions.tipo}`);
      if (palavrasChaveArray.length > 0) logger.info(`🔍 Palavras-chave: ${palavrasChaveArray.join(', ')}`);
      if (processorOptions.limite) logger.info(`🔢 Limite: ${processorOptions.limite} deputados`);
      logger.info(`⚡ Concorrência: ${processorOptions.concorrencia} deputados simultâneos`);
      if (processorOptions.pc) logger.info('💻 Modo PC: Salvando dados localmente');

      const processor = new DiscursosDeputadosProcessor(processorOptions);
      const resultado = await processor.process();

      logger.info('');
      logger.info('✅ ===== PROCESSAMENTO DE DISCURSOS CONCLUÍDO =====');
      logger.info(`📊 Sucessos: ${resultado.sucessos}`);
      logger.info(`❌ Falhas: ${resultado.falhas}`);
      logger.info(`⚠️ Avisos: ${resultado.avisos}`);
      logger.info(`⏱️ Tempo total: ${resultado.tempoProcessamento}s`);
      logger.info(`💾 Destino: ${resultado.destino}`);
      if (resultado.detalhes) {
        const detalhesDiscursos = resultado.detalhes as import('../types/etl.types').DiscursosBatchResultDetails;
        logger.info(`🎤 Discursos processados: ${detalhesDiscursos.discursosSalvos || 0}`);
        logger.info(`👥 Deputados processados: ${detalhesDiscursos.deputadosProcessados || 0}`);
        if (detalhesDiscursos.comTranscricao) {
          logger.info(`📝 Com transcrição: ${detalhesDiscursos.comTranscricao}`);
        }
      }
      logger.info('==================================================');
    }
  } catch (error: any) {
    logger.error(`❌ Erro fatal no processamento de discursos: ${error.message}`);
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
