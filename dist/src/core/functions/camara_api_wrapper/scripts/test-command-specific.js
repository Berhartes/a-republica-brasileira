"use strict";
/**
 * Teste específico para verificar se o parsing de argumentos está funcionando
 * para os comandos que estavam falhando
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSpecificCommands = testSpecificCommands;
const etl_cli_1 = require("./utils/cli/etl-cli");
async function testSpecificCommands() {
    console.log('🧪 Teste específico dos comandos que estavam falhando');
    console.log('📋 Argumentos originais:', process.argv.slice(2));
    console.log('');
    try {
        // Simular exatamente o comando que estava falhando:
        // npx ts-node ... processar_despesasdeputados_v2.ts --57
        // Sobrescrever process.argv para simular o comando exato
        const originalArgv = process.argv;
        // Teste 1: Comando de despesas que estava falhando
        console.log('1️⃣ Testando comando de DESPESAS com --57:');
        process.argv = ['node', 'script.js', '--57'];
        const cliDespesas = new etl_cli_1.ETLCommandParser('camara:despesas', 'Processador de Despesas de Deputados');
        cliDespesas.addCustomOption('--ano', {
            description: 'Filtrar despesas por ano específico (ex: 2023, 2024)',
            validator: (value) => {
                const ano = parseInt(value);
                return !isNaN(ano) && ano >= 2000 && ano <= new Date().getFullYear();
            },
            transformer: (value) => parseInt(value)
        })
            .addCustomOption('--mes', {
            description: 'Filtrar despesas por mês específico (1-12)',
            validator: (value) => {
                const mes = parseInt(value);
                return !isNaN(mes) && mes >= 1 && mes <= 12;
            },
            transformer: (value) => parseInt(value)
        })
            .addCustomOption('--atualizar', {
            description: 'Modo atualização incremental (últimos 60 dias)',
            defaultValue: false
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
        const resultDespesas = cliDespesas.parse();
        console.log('✅ Resultado do parsing:', {
            legislatura: resultDespesas.options.legislatura,
            ano: resultDespesas.options.ano,
            mes: resultDespesas.options.mes,
            concorrencia: resultDespesas.options.concorrencia,
            atualizar: resultDespesas.options.atualizar,
            destino: resultDespesas.options.destino
        });
        // Verificar se legislatura foi detectada
        if (resultDespesas.options.legislatura) {
            console.log(`🎉 SUCESSO: Legislatura ${resultDespesas.options.legislatura} detectada corretamente!`);
        }
        else {
            console.log('❌ FALHA: Legislatura não foi detectada');
        }
        console.log('');
        // Teste 2: Comando de discursos que estava falhando
        console.log('2️⃣ Testando comando de DISCURSOS com --57:');
        process.argv = ['node', 'script.js', '--57'];
        const cliDiscursos = new etl_cli_1.ETLCommandParser('camara:discursos', 'Processador de Discursos de Deputados');
        cliDiscursos.addCustomOption('--data-inicio', {
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
            description: 'Modo atualização incremental (últimos 60 dias)',
            defaultValue: false
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
        const resultDiscursos = cliDiscursos.parse();
        console.log('✅ Resultado do parsing:', {
            legislatura: resultDiscursos.options.legislatura,
            dataInicio: resultDiscursos.options.dataInicio,
            concorrencia: resultDiscursos.options.concorrencia,
            atualizar: resultDiscursos.options.atualizar,
            destino: resultDiscursos.options.destino
        });
        // Verificar se legislatura foi detectada
        if (resultDiscursos.options.legislatura) {
            console.log(`🎉 SUCESSO: Legislatura ${resultDiscursos.options.legislatura} detectada corretamente!`);
        }
        else {
            console.log('❌ FALHA: Legislatura não foi detectada');
        }
        console.log('');
        // Teste 3: Variações de comando
        console.log('3️⃣ Testando outras variações:');
        // Teste com número sem hífen
        process.argv = ['node', 'script.js', '57'];
        const testSemHifen = cliDespesas.parse();
        console.log(`   Teste '57': legislatura = ${testSemHifen.options.legislatura}`);
        // Teste com --legislatura
        process.argv = ['node', 'script.js', '--legislatura', '57'];
        const testComLegislatura = cliDespesas.parse();
        console.log(`   Teste '--legislatura 57': legislatura = ${testComLegislatura.options.legislatura}`);
        // Teste com múltiplos argumentos
        process.argv = ['node', 'script.js', '--57', '--limite', '10'];
        const testMultiplos = cliDespesas.parse();
        console.log(`   Teste '--57 --limite 10': legislatura = ${testMultiplos.options.legislatura}, limite = ${testMultiplos.options.limite}`);
        // Restaurar argv original
        process.argv = originalArgv;
        console.log('');
        console.log('🎉 Todos os testes de parsing foram executados!');
        console.log('✅ Se os testes mostraram legislatura detectada, o problema foi corrigido!');
    }
    catch (error) {
        console.error('❌ Erro durante os testes:', error.message);
        console.error('🔍 Stack:', error.stack);
    }
}
// Executar teste
if (require.main === module) {
    testSpecificCommands();
}
//# sourceMappingURL=test-command-specific.js.map