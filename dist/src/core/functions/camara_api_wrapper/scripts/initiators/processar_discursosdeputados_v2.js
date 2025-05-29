"use strict";
/**
 * Script refatorado para processamento de discursos de deputados
 *
 * Sistema ETL Modular da Câmara dos Deputados v2.0
 * Segue o padrão arquitetural do sistema do Senado Federal
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
// Importar e executar a configuração de ambiente PRIMEIRO
const environment_config_1 = require("../config/environment.config");
(0, environment_config_1.configurarVariaveisAmbiente)(); // ESSENCIAL: Configura vars de ambiente ANTES de outros imports
const discursos_deputados_processor_1 = require("../processors/discursos-deputados.processor");
const etl_cli_1 = require("../utils/cli/etl-cli");
const logging_1 = require("../utils/logging");
/**
 * Função principal
 */
async function main() {
    let cli;
    try {
        // Configurar CLI com opções específicas
        cli = new etl_cli_1.ETLCommandParser('camara:discursos', 'Processador de Discursos de Deputados');
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
            description: 'Modo atualização incremental (últimos 2 meses)',
            transformer: () => true, // Garante que a presença da flag resulte em true
            defaultValue: false // Usado se a flag não estiver presente
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
            logging_1.logger.info(`🏦 Legislatura especificada: ${legislatura}ª Legislatura`);
        }
        else {
            logging_1.logger.info(`🏦 Usando legislatura padrão: ${legislatura}ª Legislatura`);
        }
        // Processar palavras-chave se fornecidas
        let palavrasChave = [];
        if (options.palavrasChave) {
            palavrasChave = options.palavrasChave
                .split(',')
                .map((p) => p.trim())
                .filter((p) => p.length > 0);
        }
        // Configurar opções específicas
        const processorOptions = {
            ...options,
            legislatura, // Usar a legislatura detectada corretamente
            concorrencia: options.concorrencia || 2, // Já é number devido ao transformer
            dataInicio: options.dataInicio,
            dataFim: options.dataFim,
            palavrasChave,
            tipo: options.tipo,
            atualizar: !!options.atualizar
        };
        // Log de configuração
        logging_1.logger.info('🏛️ Sistema ETL - Câmara dos Deputados v2.0');
        logging_1.logger.info('🎤 Processador: Discursos de Deputados');
        logging_1.logger.info(`📋 Legislatura: ${processorOptions.legislatura}ª`);
        logging_1.logger.info(`🔧 Modo: ${processorOptions.atualizar ? 'ATUALIZAÇÃO INCREMENTAL (últimos 2 meses)' : 'COMPLETO'}`);
        if (processorOptions.dataInicio)
            logging_1.logger.info(`📅 Data início: ${processorOptions.dataInicio}`);
        if (processorOptions.dataFim)
            logging_1.logger.info(`📅 Data fim: ${processorOptions.dataFim}`);
        if (processorOptions.tipo)
            logging_1.logger.info(`🎯 Tipo: ${processorOptions.tipo}`);
        if (palavrasChave.length > 0)
            logging_1.logger.info(`🔍 Palavras-chave: ${palavrasChave.join(', ')}`);
        if (processorOptions.limite)
            logging_1.logger.info(`🔢 Limite: ${processorOptions.limite} deputados`);
        logging_1.logger.info(`⚡ Concorrência: ${processorOptions.concorrencia} deputados simultâneos`);
        // Criar e executar processador
        const processor = new discursos_deputados_processor_1.DiscursosDeputadosProcessor(processorOptions);
        const resultado = await processor.process();
        // Log de resultado final
        logging_1.logger.info('');
        logging_1.logger.info('✅ ===== PROCESSAMENTO CONCLUÍDO =====');
        logging_1.logger.info(`📊 Sucessos: ${resultado.sucessos}`);
        logging_1.logger.info(`❌ Falhas: ${resultado.falhas}`);
        logging_1.logger.info(`⚠️ Avisos: ${resultado.avisos}`);
        logging_1.logger.info(`⏱️ Tempo total: ${resultado.tempoProcessamento}s`);
        logging_1.logger.info(`💾 Destino: ${resultado.destino}`);
        if (resultado.detalhes) { // resultado.detalhes agora é o objeto retornado pelo load do DiscursosDeputadosProcessor
            logging_1.logger.info(`🎤 Discursos salvos/atualizados: ${resultado.detalhes.discursosSalvos || 0}`);
            logging_1.logger.info(`👥 Deputados com discursos processados: ${resultado.detalhes.deputadosProcessados || 0}`);
            if (typeof resultado.detalhes.comTranscricao === 'number') {
                logging_1.logger.info(`📝 Discursos com transcrição: ${resultado.detalhes.comTranscricao}`);
            }
            if (typeof resultado.detalhes.comPalavrasChave === 'number') {
                logging_1.logger.info(`🏷️ Discursos com palavras-chave: ${resultado.detalhes.comPalavrasChave}`);
            }
            if (resultado.detalhes.batchInfo) {
                logging_1.logger.info(`📦 Operações de batch: ${resultado.detalhes.batchInfo.sucessos} sucessos, ${resultado.detalhes.batchInfo.falhas} falhas.`);
            }
        }
        logging_1.logger.info('=====================================');
    }
    catch (error) {
        logging_1.logger.error(`❌ Erro fatal no processamento: ${error.message}`);
        if (error.stack && process.env.DEBUG) {
            logging_1.logger.error(`🔍 Stack trace: ${error.stack}`);
        }
        process.exit(1);
    }
}
// Executar com tratamento de erro global
if (require.main === module) {
    main().catch((error) => {
        logging_1.logger.error(`💥 Erro não capturado: ${error.message}`);
        process.exit(1);
    });
}
//# sourceMappingURL=processar_discursosdeputados_v2.js.map