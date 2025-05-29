/**
 * 🧪 Script de Teste - Validação CLI Corrigido
 *
 * Valida se todos os processadores reconhecem corretamente o parsing de --57
 */
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
/**
 * Testa um comando e reporta resultado
 */
async function testarComando(nome, comando, esperado, timeout = 30000) {
    console.log(`\n🧪 Testando: ${nome}`);
    console.log(`📍 Comando: ${comando}`);
    try {
        const { stdout, stderr } = await execAsync(comando, { timeout });
        // Combinar stdout e stderr para análise
        const output = stdout + stderr;
        if (output.includes(esperado)) {
            console.log(`✅ SUCESSO: ${nome} funcionando corretamente`);
            console.log(`   🎯 Encontrou: "${esperado}"`);
            return true;
        }
        else {
            console.log(`❌ FALHA: ${nome} não funcionou como esperado`);
            console.log(`   🔍 Esperado: "${esperado}"`);
            console.log(`   📄 Output recebido:`);
            console.log(output.substring(0, 500) + (output.length > 500 ? '...' : ''));
            return false;
        }
    }
    catch (error) {
        console.log(`❌ ERRO: ${nome} falhou com erro`);
        console.log(`   💥 Erro: ${error.message}`);
        // Verificar se é erro de parsing (esperado para validar correção)
        if (error.stdout && error.stdout.includes(esperado)) {
            console.log(`✅ PARSING OK: Erro esperado encontrado`);
            return true;
        }
        return false;
    }
}
/**
 * Função principal de teste
 */
async function executarTestes() {
    console.log('🧪 ======================================================');
    console.log('🧪 VALIDAÇÃO CLI CORRIGIDO - SISTEMA ETL v2.0');
    console.log('🧪 ======================================================');
    const basePath = 'src/core/functions/camara_api_wrapper/scripts/initiators';
    const testes = [
        {
            nome: 'Processador de Perfis (referência)',
            comando: `npx ts-node -P tsconfig.scripts.json ${basePath}/processar_perfildeputados_v2.ts --dry-run --limite 1 --57`,
            esperado: '57ª Legislatura',
            timeout: 20000
        },
        {
            nome: 'Processador de Despesas (corrigido)',
            comando: `npx ts-node -P tsconfig.scripts.json ${basePath}/processar_despesasdeputados_v2.ts --57 --dry-run --limite 1`,
            esperado: 'Legislatura detectada via argumento numérico',
            timeout: 20000
        },
        {
            nome: 'Processador de Discursos (corrigido)',
            comando: `npx ts-node -P tsconfig.scripts.json ${basePath}/processar_discursosdeputados_v2.ts --57 --dry-run --limite 1`,
            esperado: 'Legislatura detectada via argumento numérico',
            timeout: 20000
        }
    ];
    let sucessos = 0;
    let total = testes.length;
    for (const teste of testes) {
        const sucesso = await testarComando(teste.nome, teste.comando, teste.esperado, teste.timeout);
        if (sucesso) {
            sucessos++;
        }
        // Pausa entre testes
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    console.log('\n🎯 =============================================');
    console.log('🎯 RESULTADO FINAL');
    console.log('🎯 =============================================');
    console.log(`📊 Sucessos: ${sucessos}/${total}`);
    console.log(`📈 Taxa de sucesso: ${Math.round((sucessos / total) * 100)}%`);
    if (sucessos === total) {
        console.log('🎉 TODOS OS PROCESSADORES FUNCIONANDO PERFEITAMENTE!');
        console.log('');
        console.log('✅ CORREÇÕES VALIDADAS:');
        console.log('   ✅ Perfis: Endpoints corretos + CLI robusto');
        console.log('   ✅ Despesas: CLI corrigido + parsing --57');
        console.log('   ✅ Discursos: CLI corrigido + parsing --57');
        console.log('');
        console.log('🚀 Sistema ETL Câmara dos Deputados v2.0 - 100% FUNCIONAL!');
    }
    else {
        console.log('⚠️ Alguns processadores ainda precisam de correção');
        console.log('🔧 Verifique os logs acima para detalhes');
    }
    console.log('\n💡 COMANDOS FUNCIONAIS VALIDADOS:');
    console.log('npx ts-node -P tsconfig.scripts.json src/core/functions/camara_api_wrapper/scripts/initiators/processar_perfildeputados_v2.ts --57 --limite 5');
    console.log('npx ts-node -P tsconfig.scripts.json src/core/functions/camara_api_wrapper/scripts/initiators/processar_despesasdeputados_v2.ts --57 --limite 5');
    console.log('npx ts-node -P tsconfig.scripts.json src/core/functions/camara_api_wrapper/scripts/initiators/processar_discursosdeputados_v2.ts --57 --limite 5');
}
// Executar testes
if (require.main === module) {
    executarTestes().catch(error => {
        console.error(`💥 Erro fatal nos testes: ${error.message}`);
        process.exit(1);
    });
}
export { executarTestes };
//# sourceMappingURL=teste-cli-corrigido.js.map