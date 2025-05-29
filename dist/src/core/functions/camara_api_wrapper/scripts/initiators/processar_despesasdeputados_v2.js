"use strict";
/**
 * Script refatorado para processamento de despesas de deputados
 *
 * Sistema ETL Modular da Câmara dos Deputados v2.0
 * Segue o padrão arquitetural do sistema do Senado Federal
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
// IMPORTANTE: Configurar variáveis de ambiente ANTES de qualquer import do Firestore
const environment_config_1 = require("../config/environment.config");
const config_1 = require("../utils/storage/firestore/config"); // Importar initializeFirestore
(0, environment_config_1.configurarVariaveisAmbiente)();
(0, config_1.initializeFirestore)(); // Chamar após configurar variáveis de ambiente
const despesas_deputados_processor_1 = require("../processors/despesas-deputados.processor");
const etl_cli_1 = require("../utils/cli/etl-cli");
const logging_1 = require("../utils/logging");
/**
 * Função principal
 */
async function main() {
    let cli;
    try {
        // Configurar CLI com opções específicas
        cli = new etl_cli_1.ETLCommandParser('camara:despesas', 'Processador de Despesas de Deputados');
        // Adicionar opções específicas de despesas
        cli.addCustomOption('--ano', {
            description: 'Filtrar despesas por ano específico (ex: 2023, 2024)',
            validator: (value) => {
                const ano = parseInt(value);
                return !isNaN(ano) && ano >= 2000 && ano <= new Date().getFullYear();
            },
            transformer: (value) => parseInt(value) // Explicitly type value as string
        })
            .addCustomOption('--mes', {
            description: 'Filtrar despesas por mês específico (1-12)',
            validator: (value) => {
                const mes = parseInt(value);
                return !isNaN(mes) && mes >= 1 && mes <= 12;
            },
            transformer: (value) => parseInt(value) // Explicitly type value as string
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
            transformer: (value) => parseInt(value), // Explicitly type value as string
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
        logging_1.logger.info('🏛️ Sistema ETL - Câmara dos Deputados v2.0');
        logging_1.logger.info('💰 Processador: Despesas de Deputados');
        logging_1.logger.info(`📋 Legislatura: ${processorOptions.legislatura}ª`);
        logging_1.logger.info(`🔧 Modo: ${processorOptions.atualizar ? 'ATUALIZAÇÃO INCREMENTAL (últimos 2 meses)' : 'COMPLETO'}`);
        if (processorOptions.ano)
            logging_1.logger.info(`📅 Ano: ${processorOptions.ano}`);
        if (processorOptions.mes)
            logging_1.logger.info(`📅 Mês: ${processorOptions.mes}`);
        if (processorOptions.limite)
            logging_1.logger.info(`🔢 Limite: ${processorOptions.limite} deputados`);
        logging_1.logger.info(`⚡ Concorrência: ${processorOptions.concorrencia} deputados simultâneos`);
        // Criar e executar processador
        const processor = new despesas_deputados_processor_1.DespesasDeputadosProcessor(processorOptions);
        const resultado = await processor.process();
        // Log de resultado final
        logging_1.logger.info('');
        logging_1.logger.info('✅ ===== PROCESSAMENTO CONCLUÍDO =====');
        logging_1.logger.info(`📊 Sucessos: ${resultado.sucessos}`);
        logging_1.logger.info(`❌ Falhas: ${resultado.falhas}`);
        logging_1.logger.info(`⚠️ Avisos: ${resultado.avisos}`);
        logging_1.logger.info(`⏱️ Tempo total: ${resultado.tempoProcessamento}s`);
        logging_1.logger.info(`💾 Destino: ${resultado.destino}`);
        if (resultado.detalhes) {
            logging_1.logger.info(`💰 Despesas processadas: ${resultado.detalhes.despesasSalvas || 0}`);
            logging_1.logger.info(`👥 Deputados processados: ${resultado.detalhes.deputadosProcessados || 0}`);
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
//# sourceMappingURL=processar_despesasdeputados_v2.js.map