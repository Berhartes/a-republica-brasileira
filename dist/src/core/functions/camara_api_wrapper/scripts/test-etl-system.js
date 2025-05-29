"use strict";
/**
 * Sistema de Testes do ETL da Câmara dos Deputados v2.0
 *
 * Valida se todo o sistema ETL modular está funcionando corretamente
 * Segue o padrão do sistema de testes do Senado Federal
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ETLSystemTester = void 0;
exports.runTests = runTests;
const logging_1 = require("./utils/logging");
const etl_config_1 = require("./config/etl.config");
const etl_cli_1 = require("./utils/cli/etl-cli");
/**
 * Classe para execução dos testes
 */
class ETLSystemTester {
    constructor() {
        this.results = [];
    }
    /**
     * Executa um teste individual
     */
    async runTest(name, testFn) {
        try {
            logging_1.logger.info(`🧪 Executando teste: ${name}`);
            const success = await testFn();
            this.results.push({
                name,
                success,
                message: success ? '✅ Passou' : '❌ Falhou'
            });
            logging_1.logger.info(`   ${success ? '✅' : '❌'} ${name}`);
        }
        catch (error) {
            this.results.push({
                name,
                success: false,
                message: `❌ Erro: ${error.message}`,
                details: error.stack
            });
            logging_1.logger.error(`   ❌ ${name}: ${error.message}`);
        }
    }
    /**
     * Teste 1: Configurações do sistema
     */
    async testConfigurations() {
        // Verificar se configurações existem
        if (!etl_config_1.etlConfig) {
            throw new Error('Configuração ETL não encontrada');
        }
        if (!etl_config_1.etlConfig.camara) {
            throw new Error('Configuração da Câmara não encontrada');
        }
        // Verificar configurações básicas
        const required = ['concurrency', 'maxRetries', 'timeout', 'pauseBetweenRequests'];
        for (const key of required) {
            if (!(key in etl_config_1.etlConfig.camara)) {
                throw new Error(`Configuração '${key}' não encontrada`);
            }
        }
        logging_1.logger.info(`   📋 Configurações carregadas: ${Object.keys(etl_config_1.etlConfig).length} seções`);
        return true;
    }
    /**
     * Teste 2: Sistema CLI
     */
    async testCLISystem() {
        try {
            // Testar criação de parser CLI
            const cli = new etl_cli_1.ETLCommandParser('test:command', 'Teste do CLI');
            // Testar adição de opções
            cli.addCustomOption('--teste', { description: 'Opção de teste' });
            // Simular parsing (sem argumentos reais)
            const originalArgv = process.argv;
            process.argv = ['node', 'script.js', '--help'];
            try {
                cli.parse();
            }
            catch (error) {
                // Esperado para --help
            }
            finally {
                process.argv = originalArgv;
            }
            logging_1.logger.info(`   🖥️ CLI Parser funcionando`);
            return true;
        }
        catch (error) {
            throw new Error(`Falha no sistema CLI: ${error.message}`);
        }
    }
    /**
     * Teste 3: Sistema de Logging
     */
    async testLoggingSystem() {
        try {
            // Testar diferentes níveis de log
            logging_1.logger.debug('Teste de debug');
            logging_1.logger.info('Teste de info');
            logging_1.logger.warn('Teste de warning');
            // Verificar se logger tem métodos necessários
            const requiredMethods = ['debug', 'info', 'warn', 'error'];
            for (const method of requiredMethods) {
                if (typeof logging_1.logger[method] !== 'function') {
                    throw new Error(`Método logger.${method} não encontrado`);
                }
            }
            logging_1.logger.info(`   📝 Sistema de logging funcionando`);
            return true;
        }
        catch (error) {
            throw new Error(`Falha no sistema de logging: ${error.message}`);
        }
    }
    /**
     * Teste 4: Importações dos processadores
     */
    async testProcessorImports() {
        try {
            const processorsToTest = [
                { name: 'PerfilDeputadosProcessor', path: './processors/perfil-deputados.processor' },
                { name: 'DespesasDeputadosProcessor', path: './processors/despesas-deputados.processor' },
                { name: 'DiscursosDeputadosProcessor', path: './processors/discursos-deputados.processor' }
            ];
            for (const processor of processorsToTest) {
                try {
                    const module = await Promise.resolve(`${processor.path}`).then(s => __importStar(require(s)));
                    const ProcessorClass = module[processor.name];
                    if (!ProcessorClass) {
                        throw new Error(`Classe ${processor.name} não exportada`);
                    }
                    // Verificar se é uma classe
                    if (typeof ProcessorClass !== 'function') {
                        throw new Error(`${processor.name} não é uma classe`);
                    }
                    logging_1.logger.info(`   ✅ ${processor.name} importado com sucesso`);
                }
                catch (error) {
                    throw new Error(`Falha ao importar ${processor.name}: ${error.message}`);
                }
            }
            return true;
        }
        catch (error) {
            throw new Error(`Falha nas importações: ${error.message}`);
        }
    }
    /**
     * Teste 5: Disponibilidade dos processadores
     */
    async testProcessorAvailability() {
        try {
            // Testar criação de instâncias dos processadores
            const { PerfilDeputadosProcessor } = await Promise.resolve().then(() => __importStar(require('./processors/perfil-deputados.processor')));
            const { DespesasDeputadosProcessor } = await Promise.resolve().then(() => __importStar(require('./processors/despesas-deputados.processor')));
            const { DiscursosDeputadosProcessor } = await Promise.resolve().then(() => __importStar(require('./processors/discursos-deputados.processor')));
            // Opções mínimas para teste
            const testOptions = {
                legislatura: 57,
                dryRun: true,
                verbose: false,
                destino: 'pc' // Adicionado destino
            };
            // Testar instanciação
            const perfilProcessor = new PerfilDeputadosProcessor(testOptions);
            const despesasProcessor = new DespesasDeputadosProcessor(testOptions);
            const discursosProcessor = new DiscursosDeputadosProcessor(testOptions);
            // Verificar se têm o método process
            if (typeof perfilProcessor.process !== 'function') {
                throw new Error('PerfilDeputadosProcessor.process não é função');
            }
            if (typeof despesasProcessor.process !== 'function') {
                throw new Error('DespesasDeputadosProcessor.process não é função');
            }
            if (typeof discursosProcessor.process !== 'function') {
                throw new Error('DiscursosDeputadosProcessor.process não é função');
            }
            logging_1.logger.info(`   🎯 Todos os processadores instanciados com sucesso`);
            return true;
        }
        catch (error) {
            throw new Error(`Falha na disponibilidade dos processadores: ${error.message}`);
        }
    }
    /**
     * Teste 6: Conectividade com API (opcional)
     */
    async testAPIConnectivity() {
        try {
            const { apiClient } = await Promise.resolve().then(() => __importStar(require('./utils/api')));
            // Teste simples de conectividade
            const connectivity = await apiClient.checkConnectivity();
            if (connectivity) {
                logging_1.logger.info(`   🌐 Conectividade com API: OK`);
            }
            else {
                logging_1.logger.warn(`   ⚠️ Conectividade com API: Falhou (pode ser temporário)`);
            }
            return true; // Não falha o teste se API estiver indisponível
        }
        catch (error) {
            logging_1.logger.warn(`   ⚠️ Teste de conectividade pulado: ${error.message}`);
            return true; // Não falha o teste
        }
    }
    /**
     * Executa todos os testes
     */
    async runAllTests() {
        logging_1.logger.info('🧪 ========================================');
        logging_1.logger.info('🧪 TESTES DO SISTEMA ETL CÂMARA v2.0');
        logging_1.logger.info('🧪 ========================================');
        logging_1.logger.info('');
        await this.runTest('Configurações do Sistema', () => this.testConfigurations());
        await this.runTest('Sistema CLI', () => this.testCLISystem());
        await this.runTest('Sistema de Logging', () => this.testLoggingSystem());
        await this.runTest('Importações dos Processadores', () => this.testProcessorImports());
        await this.runTest('Disponibilidade dos Processadores', () => this.testProcessorAvailability());
        await this.runTest('Conectividade com API', () => this.testAPIConnectivity());
    }
    /**
     * Mostra o relatório final
     */
    showReport() {
        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        logging_1.logger.info('');
        logging_1.logger.info('📊 ========================================');
        logging_1.logger.info('📊 RELATÓRIO DE TESTES');
        logging_1.logger.info('📊 ========================================');
        logging_1.logger.info(`✅ Testes aprovados: ${passedTests}/${totalTests}`);
        logging_1.logger.info(`❌ Testes falharam: ${failedTests}/${totalTests}`);
        logging_1.logger.info(`📈 Taxa de sucesso: ${Math.round((passedTests / totalTests) * 100)}%`);
        logging_1.logger.info('');
        // Mostrar detalhes de falhas
        const failures = this.results.filter(r => !r.success);
        if (failures.length > 0) {
            logging_1.logger.info('❌ FALHAS ENCONTRADAS:');
            failures.forEach(failure => {
                logging_1.logger.error(`   • ${failure.name}: ${failure.message}`);
                if (failure.details && process.env.DEBUG) {
                    logging_1.logger.error(`     ${failure.details}`);
                }
            });
            logging_1.logger.info('');
        }
        // Status final
        if (failedTests === 0) {
            logging_1.logger.info('🎉 TODOS OS TESTES PASSARAM! Sistema ETL funcionando perfeitamente.');
            logging_1.logger.info('');
            logging_1.logger.info('✨ Próximos passos:');
            logging_1.logger.info('   1. Execute: npm run camara:perfil -- --help');
            logging_1.logger.info('   2. Teste: npm run camara:perfil -- --57 --limite 1 --dry-run');
            logging_1.logger.info('   3. Configure suas credenciais no arquivo .env');
        }
        else {
            logging_1.logger.error('💥 TESTES FALHARAM! Verifique os erros acima.');
            logging_1.logger.info('');
            logging_1.logger.info('🔧 Sugestões:');
            logging_1.logger.info('   1. Verifique se todas as dependências estão instaladas');
            logging_1.logger.info('   2. Verifique se os arquivos de configuração existem');
            logging_1.logger.info('   3. Execute: npm install');
        }
        logging_1.logger.info('📊 ========================================');
    }
    /**
     * Obtém resultado dos testes
     */
    getResults() {
        const total = this.results.length;
        const passed = this.results.filter(r => r.success).length;
        const failed = total - passed;
        return { passed, failed, total };
    }
}
exports.ETLSystemTester = ETLSystemTester;
/**
 * Função principal
 */
async function runTests() {
    const tester = new ETLSystemTester();
    try {
        await tester.runAllTests();
        tester.showReport();
        // Exit code baseado nos resultados
        const results = tester.getResults();
        process.exit(results.failed > 0 ? 1 : 0);
    }
    catch (error) {
        logging_1.logger.error(`💥 Erro fatal nos testes: ${error.message}`);
        process.exit(1);
    }
}
// Executar se for o arquivo principal
if (require.main === module) {
    runTests();
}
//# sourceMappingURL=test-etl-system.js.map