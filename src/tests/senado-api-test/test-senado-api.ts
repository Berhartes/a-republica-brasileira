// test-senado-api.ts
// Este arquivo testa o wrapper da API do Senado Federal

import { SenadoApiWrapper } from "../../core/functions/senado_api_wrapper/dist";

/**
 * Testa as principais funcionalidades do wrapper
 */
async function testarWrapperSenadoAPI() {
  console.log("Iniciando testes do wrapper da API do Senado Federal...");
  
  // Criar instância do wrapper
  const senadoApi = new SenadoApiWrapper();
  
  try {
    // 1. Testar obtenção dos senadores em exercício
    console.log("\n### Teste 1: Listar Senadores em Exercício ###");
    const senadores = await senadoApi.parlamentar.listarParlamentares({ emExercicio: true });
    console.log(`Encontrados ${senadores.length} senadores em exercício.`);
    
    if (senadores.length > 0) {
      // Mostrar detalhes do primeiro senador
      const primeiroSenador = senadores[0];
      console.log(`Exemplo: ${primeiroSenador.NomeParlamentar} (${primeiroSenador.SiglaPartidoParlamentar}/${primeiroSenador.UfParlamentar})`);
      
      // 2. Testar obtenção de detalhes de um senador específico
      console.log(`\n### Teste 2: Detalhes do Senador ${primeiroSenador.NomeParlamentar} ###`);
      const detalhesSenador = await senadoApi.parlamentar.obterDetalhesParlamentar(primeiroSenador.CodigoParlamentar);
      
      console.log("Detalhes obtidos:");
      console.log(`- Nome: ${detalhesSenador?.NomeCompletoParlamentar || 'N/A'}`);
      console.log(`- E-mail: ${detalhesSenador?.EmailParlamentar || 'N/A'}`);
      console.log(`- Sexo: ${detalhesSenador?.SexoParlamentar || 'N/A'}`);
    }
    
    // 3. Testar obtenção de comissões
    console.log("\n### Teste 3: Listar Comissões Ativas do Senado ###");
    const comissoes = await senadoApi.comissao.listarComissoes({ 
      casa: "SF",
      ativas: true 
    });
    
    console.log(`Encontradas ${comissoes.length} comissões ativas.`);
    if (comissoes.length > 0) {
      const primeiraComissao = comissoes[0];
      console.log(`Exemplo: ${primeiraComissao.Nome} (${primeiraComissao.Sigla})`);
    }
    
    // 4. Testar obtenção da Mesa Diretora
    console.log("\n### Teste 4: Composição da Mesa Diretora do Senado ###");
    const mesaDiretora = await senadoApi.composicao.obterComposicaoMesa("SF");
    
    const membros = mesaDiretora?.Membros?.Membro;
    if (Array.isArray(membros) && membros.length > 0) {
      console.log(`Encontrados ${membros.length} membros na Mesa Diretora.`);
      console.log("Cargos na Mesa Diretora:");
      membros.forEach((membro: any) => {
        console.log(`- ${membro.DescricaoCargo}: ${membro.IdentificacaoParlamentar.NomeParlamentar}`);
      });
    } else {
      console.log("Não foi possível obter dados da Mesa Diretora.");
    }
    
    // 5. Testar obtenção de partidos
    console.log("\n### Teste 5: Listar Partidos Políticos ###");
    const partidos = await senadoApi.composicao.listarPartidos();
    
    console.log(`Encontrados ${partidos.length} partidos políticos.`);
    console.log("Primeiros 5 partidos da lista:");
    partidos.slice(0, 5).forEach((partido: any) => {
      console.log(`- ${partido.Nome} (${partido.Sigla})`);
    });
    
    console.log("\nTodos os testes foram concluídos com sucesso!");
  } catch (error) {
    console.error("ERRO AO EXECUTAR TESTES:", error);
  }
}

// Executar os testes
testarWrapperSenadoAPI();
