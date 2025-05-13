// teste-senado-ajustado.js - Versão com inspeção dos campos
import { SenadoApiWrapper } from '../core/functions/senado_api_wrapper/home/ubuntu/senado_api_wrapper/dist/index.js';

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
      
      // Inspecionar a estrutura do objeto para ver os campos disponíveis
      console.log("Estrutura do objeto senador:");
      Object.keys(primeiroSenador).forEach(key => {
        console.log(`- ${key}: ${primeiroSenador[key]}`);
      });
      
      // Tentar usar os campos corretos (adaptando se necessário)
      const nome = primeiroSenador.NomeParlamentar || primeiroSenador.Nome || primeiroSenador.nomeParlamentar || primeiroSenador.nome;
      const partido = primeiroSenador.SiglaPartidoParlamentar || primeiroSenador.Partido || primeiroSenador.siglaPartido || primeiroSenador.partido;
      const uf = primeiroSenador.UfParlamentar || primeiroSenador.UF || primeiroSenador.uf || primeiroSenador.estado;
      
      console.log(`Exemplo (usando campos adaptados): ${nome} (${partido}/${uf})`);
    }
    
    // Testar listagem de comissões
    console.log("\n=== Testando listagem de comissões ===");
    const comissoes = await senadoApi.comissao.listarComissoes({ casa: "SF", ativas: true });
    console.log(`Encontradas ${comissoes.length} comissões ativas`);
    
    if (comissoes.length > 0) {
      const primeiraComissao = comissoes[0];
      console.log(`Exemplo: ${primeiraComissao.Nome} (${primeiraComissao.Sigla})`);
      
      // Inspecionar a estrutura da comissão para comparação
      console.log("Estrutura do objeto comissão:");
      Object.keys(primeiraComissao).forEach(key => {
        console.log(`- ${key}: ${primeiraComissao[key]}`);
      });
    }
    
    console.log("\nTestes concluídos com sucesso!");
    
  } catch (error) {
    console.error("ERRO AO EXECUTAR TESTES:", error);
  }
}

// Executar o teste
testarWrapper();
