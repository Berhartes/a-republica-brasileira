"use strict";
/**
 * Script para processar perfis de deputados
 *
 * Este script utiliza o sistema modular ETL para extrair,
 * transformar e carregar perfis completos de deputados.
 *
 * Uso:
 *   npm run camara:perfil -- [legislatura] [opções]
 *
 * Exemplos:
 *   npm run camara:perfil                       # Processa legislatura atual
 *   npm run camara:perfil -- 56 --limite 10     # Legislatura 56, limitado a 10
 *   npm run camara:perfil -- --pc --verbose     # Salva no PC com logs detalhados
 *   npm run camara:perfil -- --emulator         # Usa Firestore Emulator
 *
 * Para mais opções, use: npm run camara:perfil -- --help
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.processarPerfilDeputados = main;
// IMPORTANTE: Configurar variáveis de ambiente ANTES de qualquer import do Firestore
const environment_config_1 = require("../config/environment.config");
const config_1 = require("../utils/storage/firestore/config"); // Importar initializeFirestore
(0, environment_config_1.configurarVariaveisAmbiente)();
(0, config_1.initializeFirestore)(); // Chamar após configurar variáveis de ambiente
const etl_cli_1 = require("../utils/cli/etl-cli");
const perfil_deputados_processor_1 = require("../processors/perfil-deputados.processor");
const logging_1 = require("../utils/logging");
const etl_types_1 = require("../types/etl.types");
/**
 * Função principal do script
 */
async function main() {
    const startTime = Date.now();
    try {
        // Configurar parser de linha de comando
        const cli = new etl_cli_1.ETLCommandParser('camara:perfil', 'Processa perfis completos de deputados da Câmara dos Deputados');
        // Adicionar opções customizadas específicas deste script
        cli.addCustomOption('--mandatos', () => true);
        cli.addCustomOption('--filiacoes', () => true);
        cli.addCustomOption('--fotos', () => true);
        cli.addCustomOption('--orgaos', () => true);
        cli.addCustomOption('--frentes', () => true);
        // Fazer parse dos argumentos
        const options = cli.parse();
        // Configurar nível de log baseado nas opções
        if (options.verbose) {
            logging_1.logger.setLevel(logging_1.LogLevel.DEBUG);
        }
        // Exibir banner inicial
        exibirBanner();
        // Exibir configurações
        logging_1.logger.info('🔧 Configurações de processamento:');
        logging_1.logger.info(`   📋 Legislatura: ${options.legislatura || 'atual'}`);
        logging_1.logger.info(`   🎯 Limite: ${options.limite || 'sem limite'}`);
        logging_1.logger.info(`   💾 Destino: ${options.destino}`);
        if (options.deputado) {
            logging_1.logger.info(`   👤 Deputado específico: ${options.deputado}`);
        }
        if (options.partido) {
            logging_1.logger.info(`   🏛️ Partido: ${options.partido}`);
        }
        if (options.uf) {
            logging_1.logger.info(`   📍 UF: ${options.uf}`);
        }
        // Exibir opções de extração
        logging_1.logger.info('🔧 Opções de extração:');
        logging_1.logger.info(`   📋 Mandatos: ${options.mandatos ? '✅ SIM' : '❌ NÃO'}`);
        logging_1.logger.info(`   🏛️ Filiações: ${options.filiacoes ? '✅ SIM' : '❌ NÃO'}`);
        logging_1.logger.info(`   📷 Fotos: ${options.fotos ? '✅ SIM' : '❌ NÃO'}`);
        logging_1.logger.info(`   🏢 Órgãos: ${options.orgaos !== false ? '✅ SIM' : '❌ NÃO'}`);
        logging_1.logger.info(`   👥 Frentes: ${options.frentes !== false ? '✅ SIM' : '❌ NÃO'}`);
        // Criar processador
        const processor = new perfil_deputados_processor_1.PerfilDeputadosProcessor(options);
        // Registrar callbacks de progresso se em modo verbose
        if (options.verbose) {
            processor.onProgress((event) => {
                if (event.status !== etl_types_1.ProcessingStatus.FINALIZADO) {
                    logging_1.logger.debug(`Progresso: ${event.mensagem}`);
                }
            });
        }
        // Executar processamento
        logging_1.logger.info('Iniciando processamento de perfis de deputados...');
        const resultado = await processor.process();
        // Exibir resumo final
        exibirResumo(resultado, startTime);
        // Sair com sucesso
        process.exit(0);
    }
    catch (error) {
        // Tratar erros
        logging_1.logger.error('❌ Erro fatal no processamento:', error);
        if (error.stack && logging_1.logger.getLevel() === logging_1.LogLevel.DEBUG) {
            logging_1.logger.debug('Stack trace:', error.stack);
        }
        // Exibir tempo decorrido mesmo em caso de erro
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        logging_1.logger.error(`⏱️ Tempo decorrido antes do erro: ${elapsed}s`);
        // Sair com erro
        process.exit(1);
    }
}
/**
 * Exibe o banner inicial do script
 */
function exibirBanner() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     🏛️  PROCESSADOR DE PERFIS DE DEPUTADOS  🏛️               ║
║                                                               ║
║     Sistema ETL para dados da Câmara dos Deputados           ║
║     Versão 2.0 - Arquitetura Modular                         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);
}
/**
 * Exibe o resumo do processamento
 */
function exibirResumo(resultado, startTime) {
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    RESUMO DO PROCESSAMENTO                    ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ✅ Processados com sucesso: ${String(resultado.sucessos).padEnd(30)} ║
║  ❌ Falhas no processamento: ${String(resultado.falhas).padEnd(30)} ║
║  ⚠️  Avisos durante processo: ${String(resultado.avisos || 0).padEnd(29)} ║
║                                                               ║
║  ⏱️  Tempo total: ${String(totalTime + 's').padEnd(41)} ║
║  💾 Destino dos dados: ${String(resultado.destino).padEnd(36)} ║
${resultado.legislatura ? `║  🏛️  Legislatura processada: ${String(resultado.legislatura).padEnd(30)} ║\n` : ''}║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

✨ Processamento concluído com sucesso!
`);
    // Detalhes adicionais se verbose
    if (resultado.tempoExtracao || resultado.tempoTransformacao || resultado.tempoCarregamento) {
        console.log('📊 Detalhamento de tempo:');
        if (resultado.tempoExtracao) {
            console.log(`   • Extração: ${resultado.tempoExtracao.toFixed(2)}s`);
        }
        if (resultado.tempoTransformacao) {
            console.log(`   • Transformação: ${resultado.tempoTransformacao.toFixed(2)}s`);
        }
        if (resultado.tempoCarregamento) {
            console.log(`   • Carregamento: ${resultado.tempoCarregamento.toFixed(2)}s`);
        }
    }
}
// Executar o script se chamado diretamente
if (require.main === module) {
    main().catch(error => {
        console.error('Erro não tratado:', error);
        process.exit(1);
    });
}
exports.default = main;
//# sourceMappingURL=processar_perfildeputados_v2.js.map