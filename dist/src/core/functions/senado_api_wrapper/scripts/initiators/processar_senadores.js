"use strict";
/**
 * Script para processar senadores em exercício
 *
 * Este script utiliza o sistema modular ETL para extrair,
 * transformar e carregar senadores em exercício do Senado Federal.
 *
 * Uso:
 *   npm run senado:senadores -- [legislatura] [opções]
 *
 * Exemplos:
 *   npm run senado:senadores                     # Processa senadores da legislatura atual
 *   npm run senado:senadores -- 57 --limite 10   # Legislatura 57, limitado a 10 senadores
 *   npm run senado:senadores -- --pc --verbose   # Salva no PC com logs detalhados
 *   npm run senado:senadores -- --emulator       # Usa Firestore Emulator
 *   npm run senado:senadores -- --partido PT     # Filtra apenas senadores do PT
 *   npm run senado:senadores -- --uf SP          # Filtra apenas senadores de SP
 *
 * Para mais opções, use: npm run senado:senadores -- --help
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.processarSenadores = main;
// IMPORTANTE: Configurar variáveis de ambiente ANTES de qualquer import do Firestore
const environment_config_1 = require("../config/environment.config");
(0, environment_config_1.configurarVariaveisAmbiente)();
const etl_cli_1 = require("../utils/cli/etl-cli");
const senadores_processor_1 = require("../processors/senadores.processor");
const logging_1 = require("../utils/logging");
const etl_types_1 = require("../types/etl.types");
/**
 * Função principal do script
 */
async function main() {
    const startTime = Date.now();
    try {
        // Configurar parser de linha de comando
        const cli = new etl_cli_1.ETLCommandParser('senado:senadores', 'Processa senadores em exercício do Senado Federal');
        // Adicionar opções customizadas específicas deste script
        cli.addCustomOption('--detalhes', () => true);
        cli.addCustomOption('--incluir-historico', () => true);
        // Fazer parse dos argumentos
        const options = cli.parse();
        // Configurar nível de log baseado nas opções
        if (options.verbose) {
            logging_1.logger.setLevel(logging_1.LogLevel.DEBUG);
        }
        // Exibir banner inicial
        exibirBanner();
        // Criar processador
        const processor = new senadores_processor_1.SenadoresProcessor(options);
        // Registrar callbacks de progresso se em modo verbose
        if (options.verbose) {
            processor.onProgress((event) => {
                if (event.status !== etl_types_1.ProcessingStatus.FINALIZADO) {
                    logging_1.logger.debug(`Progresso: ${event.mensagem}`);
                }
            });
        }
        // Executar processamento
        logging_1.logger.info('Iniciando processamento de senadores em exercício...');
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
║         👥  PROCESSADOR DE SENADORES EM EXERCÍCIO  👥        ║
║                                                               ║
║         Sistema ETL para dados do Senado Federal             ║
║         Versão 2.0 - Arquitetura Modular                     ║
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
        console.log('\n📊 Detalhamento de tempo:');
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
    // Estatísticas específicas de senadores
    if (resultado.detalhes && Array.isArray(resultado.detalhes)) {
        console.log('\n📈 Estatísticas específicas:');
        const senadores = resultado.detalhes.find((d) => d.id === 'senadores');
        const partidos = resultado.detalhes.filter((d) => d.id?.startsWith('partido_'));
        const ufs = resultado.detalhes.filter((d) => d.id?.startsWith('uf_'));
        if (senadores) {
            console.log(`   • Senadores processados: ${senadores.quantidade || senadores.status}`);
        }
        if (partidos.length > 0) {
            console.log(`   • Partidos representados: ${partidos.length}`);
        }
        if (ufs.length > 0) {
            console.log(`   • Estados representados: ${ufs.length}`);
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
//# sourceMappingURL=processar_senadores.js.map