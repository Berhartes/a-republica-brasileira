/**
 * Script de debug para testar o parsing de argumentos CLI
 */
import { ETLCommandParser } from './utils/cli/etl-cli';
async function testCLIParsing() {
    console.log('🧪 Testando parsing de argumentos CLI');
    console.log('📋 Argumentos recebidos:', process.argv.slice(2));
    try {
        // Teste 1: Despesas
        console.log('\n1️⃣ Testando parser de DESPESAS:');
        const cliDespesas = new ETLCommandParser('camara:despesas', 'Processador de Despesas de Deputados');
        cliDespesas.addCustomOption('--ano', {
            description: 'Filtrar despesas por ano específico',
            validator: (value) => {
                const ano = parseInt(value);
                return !isNaN(ano) && ano >= 2000 && ano <= new Date().getFullYear();
            },
            transformer: (value) => parseInt(value)
        })
            .addCustomOption('--concorrencia', {
            description: 'Número de deputados processados em paralelo',
            validator: (value) => {
                const num = parseInt(value);
                return !isNaN(num) && num >= 1 && num <= 10;
            },
            transformer: (value) => parseInt(value),
            defaultValue: 2
        });
        const resultDespesas = cliDespesas.parse();
        console.log('✅ Resultado parsing despesas:', {
            legislatura: resultDespesas.options.legislatura,
            ano: resultDespesas.options.ano,
            concorrencia: resultDespesas.options.concorrencia,
            limite: resultDespesas.options.limite,
            destino: resultDespesas.options.destino
        });
        // Teste 2: Discursos
        console.log('\n2️⃣ Testando parser de DISCURSOS:');
        const cliDiscursos = new ETLCommandParser('camara:discursos', 'Processador de Discursos de Deputados');
        cliDiscursos.addCustomOption('--data-inicio', {
            description: 'Data início para filtrar discursos',
            validator: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value)
        })
            .addCustomOption('--concorrencia', {
            description: 'Número de deputados processados em paralelo',
            validator: (value) => {
                const num = parseInt(value);
                return !isNaN(num) && num >= 1 && num <= 10;
            },
            transformer: (value) => parseInt(value),
            defaultValue: 2
        });
        const resultDiscursos = cliDiscursos.parse();
        console.log('✅ Resultado parsing discursos:', {
            legislatura: resultDiscursos.options.legislatura,
            dataInicio: resultDiscursos.options.dataInicio,
            concorrencia: resultDiscursos.options.concorrencia,
            limite: resultDiscursos.options.limite,
            destino: resultDiscursos.options.destino
        });
        // Teste 3: Perfis
        console.log('\n3️⃣ Testando parser de PERFIS:');
        const cliPerfis = new ETLCommandParser('camara:perfil', 'Processador de Perfis de Deputados');
        cliPerfis.addCustomOption('--incluir-orgaos', {
            description: 'Incluir órgãos dos deputados',
            defaultValue: false
        })
            .addCustomOption('--concorrencia', {
            description: 'Número de deputados processados em paralelo',
            validator: (value) => {
                const num = parseInt(value);
                return !isNaN(num) && num >= 1 && num <= 10;
            },
            transformer: (value) => parseInt(value),
            defaultValue: 3
        });
        const resultPerfis = cliPerfis.parse();
        console.log('✅ Resultado parsing perfis:', {
            legislatura: resultPerfis.options.legislatura,
            incluirOrgaos: resultPerfis.options.incluirOrgaos,
            concorrencia: resultPerfis.options.concorrencia,
            limite: resultPerfis.options.limite,
            destino: resultPerfis.options.destino
        });
        console.log('\n🎉 Todos os testes de parsing foram executados!');
    }
    catch (error) {
        console.error('❌ Erro no teste de parsing:', error.message);
        console.error('🔍 Stack:', error.stack);
    }
}
// Executar teste
if (require.main === module) {
    testCLIParsing();
}
export { testCLIParsing };
//# sourceMappingURL=test-cli-debug.js.map