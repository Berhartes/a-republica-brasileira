// teste-senado.cjs - Versão CommonJS
const { SenadoApiWrapper } = require('../core/functions/senado_api_wrapper/home/ubuntu/senado_api_wrapper/dist');

// Criar instância do wrapper
const senadoApi = new SenadoApiWrapper();

// Função para testar o wrapper
async function testarWrapper() {
  console.log("Iniciando teste do wrapper da API do Senado...");
  
  try {
    // Testar listagem de senadores
    console.log("\n=== Testando listagem de senadores ===");
    const senadores = await senadoApi.parlamentar.listarParlamentares({ emExercicio: true });
    console.log(`Encontrados ${senadores.length} senadores em exercício`);
    
    if (senadores.length > 0) {
      const primeiroSenador = senadores[0];
      console.log(`Exemplo: ${primeiroSenador.NomeParlamentar} (${primeiroSenador.SiglaPartidoParlamentar}/${primeiroSenador.UfParlamentar})`);
    }
    
    // Testar listagem de comissões
    console.log("\n=== Testando listagem de comissões ===");
    const comissoes = await senadoApi.comissao.listarComissoes({ casa: "SF", ativas: true });
    console.log(`Encontradas ${comissoes.length} comissões ativas`);
    
    if (comissoes.length > 0) {
      const primeiraComissao = comissoes[0];
      console.log(`Exemplo: ${primeiraComissao.Nome} (${primeiraComissao.Sigla})`);
    }
    
    console.log("\nTestes concluídos com sucesso!");
    
  } catch (error) {
    console.error("ERRO AO EXECUTAR TESTES:", error);
  }
}

// Executar o teste
testarWrapper();
