/**
 * Sistema de Testes do ETL da Câmara dos Deputados v2.0
 *
 * Valida se todo o sistema ETL modular está funcionando corretamente
 * Segue o padrão do sistema de testes do Senado Federal
 */
/**
 * Classe para execução dos testes
 */
declare class ETLSystemTester {
    private results;
    /**
     * Executa um teste individual
     */
    private runTest;
    /**
     * Teste 1: Configurações do sistema
     */
    private testConfigurations;
    /**
     * Teste 2: Sistema CLI
     */
    private testCLISystem;
    /**
     * Teste 3: Sistema de Logging
     */
    private testLoggingSystem;
    /**
     * Teste 4: Importações dos processadores
     */
    private testProcessorImports;
    /**
     * Teste 5: Disponibilidade dos processadores
     */
    private testProcessorAvailability;
    /**
     * Teste 6: Conectividade com API (opcional)
     */
    private testAPIConnectivity;
    /**
     * Executa todos os testes
     */
    runAllTests(): Promise<void>;
    /**
     * Mostra o relatório final
     */
    showReport(): void;
    /**
     * Obtém resultado dos testes
     */
    getResults(): {
        passed: number;
        failed: number;
        total: number;
    };
}
/**
 * Função principal
 */
declare function runTests(): Promise<void>;
export { ETLSystemTester, runTests };
