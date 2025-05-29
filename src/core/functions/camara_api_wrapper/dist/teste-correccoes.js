/**
 * Teste rápido das correções implementadas
 */
import { apiClient } from './utils/api';
import { endpoints } from './config/endpoints';
async function testeRapido() {
    console.log('🧪 Teste rápido das correções implementadas');
    console.log('');
    try {
        // Teste 1: Verificar se apiClient está disponível
        console.log('1️⃣ Testando apiClient:');
        console.log(`   - Existe: ${typeof apiClient}`);
        console.log(`   - getAllPages: ${typeof apiClient.getAllPages}`);
        console.log(`   - get: ${typeof apiClient.get}`);
        console.log('');
        // Teste 2: Verificar endpoints
        console.log('2️⃣ Testando endpoints:');
        console.log(`   - DEPUTADOS.LISTA: ${endpoints.DEPUTADOS?.LISTA?.PATH}`);
        console.log(`   - DEPUTADOS.DESPESAS: ${endpoints.DEPUTADOS?.DESPESAS?.PATH}`);
        console.log(`   - DEPUTADOS.DISCURSOS: ${endpoints.DEPUTADOS?.DISCURSOS?.PATH}`);
        console.log('');
        // Teste 3: Verificar conectividade básica
        console.log('3️⃣ Testando conectividade com a API:');
        try {
            const connected = await apiClient.checkConnectivity();
            console.log(`   - Conectividade: ${connected ? '✅ OK' : '❌ FALHA'}`);
        }
        catch (error) {
            console.log(`   - Conectividade: ❌ ERRO - ${error.message}`);
        }
        console.log('');
        // Teste 4: Teste básico de requisição
        console.log('4️⃣ Testando requisição básica:');
        try {
            const response = await apiClient.get('/legislaturas', { ordem: 'DESC', itens: '1' });
            console.log(`   - Resposta recebida: ${response ? '✅ OK' : '❌ VAZIA'}`);
            console.log(`   - Tem dados: ${response?.dados ? '✅ SIM' : '❌ NÃO'}`);
        }
        catch (error) {
            console.log(`   - Erro na requisição: ❌ ${error.message}`);
        }
        console.log('');
        console.log('🎉 Teste concluído!');
        console.log('');
        console.log('Se todos os itens mostraram ✅, as correções funcionaram.');
        console.log('Agora você pode testar os processadores de despesas e discursos.');
    }
    catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
        console.error('🔍 Stack:', error.stack);
    }
}
// Executar teste
if (require.main === module) {
    testeRapido();
}
export { testeRapido };
//# sourceMappingURL=teste-correccoes.js.map