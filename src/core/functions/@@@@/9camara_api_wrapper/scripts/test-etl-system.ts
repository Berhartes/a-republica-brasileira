/**
 * Sistema de Testes do ETL da Câmara dos Deputados v2.0
 * 
 * Valida se todo o sistema ETL modular está funcionando corretamente
 * Segue o padrão do sistema de testes do Senado Federal
 */

import { logger } from './utils/logging';
import { etlConfig } from './config/etl.config';
import { ETLCommandParser } from './utils/cli/etl-cli';

/**
 * Interface para resultado de teste
 */
interface TestResult {
  name: string;
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Classe para execução dos testes
 */
class ETLSystemTester {
  private results: TestResult[] = [];

  /**
   * Executa um teste individual
   */
  private async runTest(name: string, testFn: () => Promise<boolean> | boolean): Promise<void> {
    try {
      logger.info(`🧪 Executando teste: ${name}`);
      const success = await testFn();
      
      this.results.push({
        name,
        success,
        message: success ? '✅ Passou' : '❌ Falhou'
      });
      
      logger.info(`   ${success ? '✅' : '❌'} ${name}`);
    } catch (error: any) {
      this.results.push({
        name,
        success: false,
        message: `❌ Erro: ${error.message}`,
        details: error.stack
      });
      
      logger.error(`   ❌ ${name}: ${error.message}`);
    }
  }

  /**
   * Teste 1: Configurações do sistema
   */
  private async testConfigurations(): Promise<boolean> {
    // Verificar se configurações existem
    if (!etlConfig) {
      throw new Error('Configuração ETL não encontrada');
    }

    if (!etlConfig.camara) {
      throw new Error('Configuração da Câmara não encontrada');
    }

    // Verificar configurações básicas
    const required = ['concurrency', 'maxRetries', 'timeout', 'pauseBetweenRequests'];
    for (const key of required) {
      if (!(key in etlConfig.camara)) {
        throw new Error(`Configuração '${key}' não encontrada`);
      }
    }

    logger.info(`   📋 Configurações carregadas: ${Object.keys(etlConfig).length} seções`);
    return true;
  }

  /**
   * Teste 2: Sistema CLI
   */
  private async testCLISystem(): Promise<boolean> {
    try {
      // Testar criação de parser CLI
      const cli = new ETLCommandParser('test:command', 'Teste do CLI');
      
      // Testar adição de opções
      cli.addCustomOption('--teste', { description: 'Opção de teste' });
      
      // Simular parsing (sem argumentos reais)
      const originalArgv = process.argv;
      process.argv = ['node', 'script.js', '--help'];
      
      try {
        cli.parse();
      } catch (error) {
        // Esperado para --help
      } finally {
        process.argv = originalArgv;
      }
      
      logger.info(`   🖥️ CLI Parser funcionando`);
      return true;
    } catch (error: any) {
      throw new Error(`Falha no sistema CLI: ${error.message}`);
    }
  }

  /**
   * Teste 3: Sistema de Logging
   */
  private async testLoggingSystem(): Promise<boolean> {
    try {
      // Testar diferentes níveis de log
      logger.debug('Teste de debug');
      logger.info('Teste de info');
      logger.warn('Teste de warning');
      
      // Verificar se logger tem métodos necessários
      const requiredMethods = ['debug', 'info', 'warn', 'error'];
      for (const method of requiredMethods) {
        if (typeof logger[method as keyof typeof logger] !== 'function') {
          throw new Error(`Método logger.${method} não encontrado`);
        }
      }
      
      logger.info(`   📝 Sistema de logging funcionando`);
      return true;
    } catch (error: any) {
      throw new Error(`Falha no sistema de logging: ${error.message}`);
    }
  }

  /**
   * Teste 4: Importações dos processadores
   */
  private async testProcessorImports(): Promise<boolean> {
    try {
      const processorsToTest = [
        { name: 'PerfilDeputadosProcessor', path: './processors/perfil-deputados.processor' },
        { name: 'DespesasDeputadosProcessor', path: './processors/despesas-deputados.processor' },
        { name: 'DiscursosDeputadosProcessor', path: './processors/discursos-deputados.processor' }
      ];

      for (const processor of processorsToTest) {
        try {
          const module = await import(processor.path);
          const ProcessorClass = module[processor.name];
          
          if (!ProcessorClass) {
            throw new Error(`Classe ${processor.name} não exportada`);
          }

          // Verificar se é uma classe
          if (typeof ProcessorClass !== 'function') {
            throw new Error(`${processor.name} não é uma classe`);
          }

          logger.info(`   ✅ ${processor.name} importado com sucesso`);
        } catch (error: any) {
          throw new Error(`Falha ao importar ${processor.name}: ${error.message}`);
        }
      }

      return true;
    } catch (error: any) {
      throw new Error(`Falha nas importações: ${error.message}`);
    }
  }

  /**
   * Teste 5: Disponibilidade dos processadores
   */
  private async testProcessorAvailability(): Promise<boolean> {
    try {
      // Testar criação de instâncias dos processadores
      const { PerfilDeputadosProcessor } = await import('./processors/perfil-deputados.processor');
      const { DespesasDeputadosProcessor } = await import('./processors/despesas-deputados.processor');
      const { DiscursosDeputadosProcessor } = await import('./processors/discursos-deputados.processor');

      // Opções mínimas para teste
      const testOptions = {
        legislatura: 57,
        dryRun: true,
        verbose: false,
        destino: 'pc' as 'pc' // Adicionado destino
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

      logger.info(`   🎯 Todos os processadores instanciados com sucesso`);
      return true;
    } catch (error: any) {
      throw new Error(`Falha na disponibilidade dos processadores: ${error.message}`);
    }
  }

  /**
   * Teste 6: Conectividade com API (opcional)
   */
  private async testAPIConnectivity(): Promise<boolean> {
    try {
      const { apiClient } = await import('./utils/api');
      
      // Teste simples de conectividade
      const connectivity = await apiClient.checkConnectivity();
      
      if (connectivity) {
        logger.info(`   🌐 Conectividade com API: OK`);
      } else {
        logger.warn(`   ⚠️ Conectividade com API: Falhou (pode ser temporário)`);
      }
      
      return true; // Não falha o teste se API estiver indisponível
    } catch (error: any) {
      logger.warn(`   ⚠️ Teste de conectividade pulado: ${error.message}`);
      return true; // Não falha o teste
    }
  }

  /**
   * Executa todos os testes
   */
  async runAllTests(): Promise<void> {
    logger.info('🧪 ========================================');
    logger.info('🧪 TESTES DO SISTEMA ETL CÂMARA v2.0');
    logger.info('🧪 ========================================');
    logger.info('');

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
  showReport(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    logger.info('');
    logger.info('📊 ========================================');
    logger.info('📊 RELATÓRIO DE TESTES');
    logger.info('📊 ========================================');
    logger.info(`✅ Testes aprovados: ${passedTests}/${totalTests}`);
    logger.info(`❌ Testes falharam: ${failedTests}/${totalTests}`);
    logger.info(`📈 Taxa de sucesso: ${Math.round((passedTests / totalTests) * 100)}%`);
    logger.info('');

    // Mostrar detalhes de falhas
    const failures = this.results.filter(r => !r.success);
    if (failures.length > 0) {
      logger.info('❌ FALHAS ENCONTRADAS:');
      failures.forEach(failure => {
        logger.error(`   • ${failure.name}: ${failure.message}`);
        if (failure.details && process.env.DEBUG) {
          logger.error(`     ${failure.details}`);
        }
      });
      logger.info('');
    }

    // Status final
    if (failedTests === 0) {
      logger.info('🎉 TODOS OS TESTES PASSARAM! Sistema ETL funcionando perfeitamente.');
      logger.info('');
      logger.info('✨ Próximos passos:');
      logger.info('   1. Execute: npm run camara:perfil -- --help');
      logger.info('   2. Teste: npm run camara:perfil -- --57 --limite 1 --dry-run');
      logger.info('   3. Configure suas credenciais no arquivo .env');
    } else {
      logger.error('💥 TESTES FALHARAM! Verifique os erros acima.');
      logger.info('');
      logger.info('🔧 Sugestões:');
      logger.info('   1. Verifique se todas as dependências estão instaladas');
      logger.info('   2. Verifique se os arquivos de configuração existem');
      logger.info('   3. Execute: npm install');
    }

    logger.info('📊 ========================================');
  }

  /**
   * Obtém resultado dos testes
   */
  getResults(): { passed: number; failed: number; total: number } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;

    return { passed, failed, total };
  }
}

/**
 * Função principal
 */
async function runTests(): Promise<void> {
  const tester = new ETLSystemTester();
  
  try {
    await tester.runAllTests();
    tester.showReport();

    // Exit code baseado nos resultados
    const results = tester.getResults();
    process.exit(results.failed > 0 ? 1 : 0);
    
  } catch (error: any) {
    logger.error(`💥 Erro fatal nos testes: ${error.message}`);
    process.exit(1);
  }
}

// Executar se for o arquivo principal
if (require.main === module) {
  runTests();
}

export { ETLSystemTester, runTests };
