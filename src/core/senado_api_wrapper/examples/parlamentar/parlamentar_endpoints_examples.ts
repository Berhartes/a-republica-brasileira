// examples/parlamentar/parlamentar_endpoints_examples.ts
import { SenadoApiWrapper, Codigo } from "../../src";

/**
 * Demonstra o uso dos endpoints de Parlamentar do wrapper da API do Senado
 */
async function testParlamentarEndpoints() {
  console.log("Iniciando testes dos endpoints de Parlamentar...");
  const senadoApi = new SenadoApiWrapper();

  try {
    // Teste 1: Listar Senadores Afastados
    console.log("\n--- Teste 1: Listando Senadores Afastados ---");
    const senadoresAfastados = await senadoApi.parlamentar.listarParlamentaresAfastados();
    console.log(`Encontrados ${senadoresAfastados.length} senadores afastados.`);
    if (senadoresAfastados.length > 0) {
      console.log("Primeiros 3 senadores afastados:");
      senadoresAfastados.slice(0, 3).forEach(s => {
        console.log(`- ${s.NomeParlamentar} (${s.SiglaPartidoParlamentar}/${s.UfParlamentar})`);
      });
    }

    // Teste 2: Listar Senadores por Período de Legislatura
    console.log("\n--- Teste 2: Listando Senadores por Período de Legislatura (55 a 57) ---");
    const senadoresPorLegislatura = await senadoApi.parlamentar.listarParlamentaresPorPeriodoLegislatura(55, 57);
    console.log(`Encontrados ${senadoresPorLegislatura.length} senadores nas legislaturas 55 a 57.`);
    if (senadoresPorLegislatura.length > 0) {
      console.log("Primeiros 3 senadores do período:");
      senadoresPorLegislatura.slice(0, 3).forEach(s => {
        console.log(`- ${s.NomeParlamentar} (${s.SiglaPartidoParlamentar}/${s.UfParlamentar})`);
      });
    }

    // Obter um código de parlamentar para os testes seguintes
    let codigoParlamentar: Codigo;
    if (senadoresPorLegislatura.length > 0) {
      codigoParlamentar = senadoresPorLegislatura[0].CodigoParlamentar;
    } else {
      // Use um código conhecido de um senador (exemplo: Rodrigo Pacheco)
      codigoParlamentar = 5895; 
    }

    console.log(`\nUsando parlamentar com código ${codigoParlamentar} para os próximos testes`);

    // Teste 3: Obter Cargos do Parlamentar
    console.log("\n--- Teste 3: Obtendo Cargos do Parlamentar ---");
    const cargos = await senadoApi.parlamentar.obterCargosParlamentar(codigoParlamentar);
    console.log(`Encontrados ${cargos.length} cargos para o parlamentar.`);
    if (cargos.length > 0) {
      console.log("Exemplos de cargos:");
      cargos.slice(0, 3).forEach(c => {
        console.log(`- ${c.DescricaoCargo} (${c.DataInicio} a ${c.DataFim || 'atual'})`);
      });
    }

    // Teste 4: Obter Histórico Acadêmico do Parlamentar
    console.log("\n--- Teste 4: Obtendo Histórico Acadêmico do Parlamentar ---");
    const historicoAcademico = await senadoApi.parlamentar.obterHistoricoAcademico(codigoParlamentar);
    if (historicoAcademico && historicoAcademico.FormacaoAcademica) {
      const formacoes = Array.isArray(historicoAcademico.FormacaoAcademica.Formacao) 
        ? historicoAcademico.FormacaoAcademica.Formacao 
        : [historicoAcademico.FormacaoAcademica.Formacao];
      
      console.log(`Encontradas ${formacoes.length} formações acadêmicas.`);
      formacoes.forEach(f => {
        console.log(`- ${f.Curso}${f.Instituicao ? ` (${f.Instituicao})` : ''}`);
      });
    } else {
      console.log("Histórico acadêmico não encontrado ou vazio para este parlamentar.");
    }

    // Teste 5: Obter Profissão do Parlamentar
    console.log("\n--- Teste 5: Obtendo Profissão do Parlamentar ---");
    const profissao = await senadoApi.parlamentar.obterProfissaoParlamentar(codigoParlamentar);
    if (profissao) {
      const profissoes = Array.isArray(profissao.Profissao) 
        ? profissao.Profissao 
        : [profissao.Profissao];
      
      console.log(`Encontradas ${profissoes.length} profissões.`);
      profissoes.forEach(p => {
        console.log(`- ${p.NomeProfissao} (Código: ${p.CodigoProfissao})`);
      });
    } else {
      console.log("Profissão não encontrada ou vazia para este parlamentar.");
    }

    // Teste 6: Obter Discursos do Parlamentar
    console.log("\n--- Teste 6: Obtendo Discursos do Parlamentar ---");
    const discursos = await senadoApi.parlamentar.obterDiscursosParlamentar(codigoParlamentar);
    console.log(`Encontrados ${discursos.length} discursos para o parlamentar.`);
    if (discursos.length > 0) {
      console.log("Exemplos de discursos:");
      discursos.slice(0, 3).forEach(d => {
        console.log(`- Data: ${d.DataPronunciamento}, Tipo: ${d.TipoUsoPalavra || 'Não especificado'}`);
        console.log(`  Sumário: ${d.Sumario || 'Não disponível'}`);
      });
    }

    // Teste 7: Obter Apartes do Parlamentar
    console.log("\n--- Teste 7: Obtendo Apartes do Parlamentar ---");
    const apartes = await senadoApi.parlamentar.obterApartesParlamentar(codigoParlamentar);
    console.log(`Encontrados ${apartes.length} apartes para o parlamentar.`);
    if (apartes.length > 0) {
      console.log("Exemplos de apartes:");
      apartes.slice(0, 3).forEach(a => {
        console.log(`- Data: ${a.DataAparte}`);
        if (a.ParlamentarAparteado) {
          console.log(`  Aparteado: ${a.ParlamentarAparteado.NomeParlamentar}`);
        }
        console.log(`  Sumário: ${a.Sumario || 'Não disponível'}`);
      });
    }

    // Teste 8: Listar Partidos dos Parlamentares
    console.log("\n--- Teste 8: Listando Partidos Parlamentares ---");
    const partidos = await senadoApi.parlamentar.listarPartidosParlamentares();
    console.log(`Encontrados ${partidos.length} partidos parlamentares.`);
    if (partidos.length > 0) {
      console.log("Exemplos de partidos:");
      partidos.slice(0, 5).forEach(p => {
        console.log(`- ${p.Sigla} - ${p.Nome}${p.NumeroSenadores ? ` (${p.NumeroSenadores} senadores)` : ''}`);
      });
    }

    // Teste 9: Listar Tipos de Uso da Palavra
    console.log("\n--- Teste 9: Listando Tipos de Uso da Palavra ---");
    const tiposUsoPalavra = await senadoApi.parlamentar.listarTiposUsoPalavra();
    console.log(`Encontrados ${tiposUsoPalavra.length} tipos de uso da palavra.`);
    if (tiposUsoPalavra.length > 0) {
      console.log("Todos os tipos de uso da palavra:");
      tiposUsoPalavra.forEach(t => {
        console.log(`- ${t.Sigla}: ${t.Descricao} (Código: ${t.Codigo})`);
      });
    }

  } catch (error) {
    console.error("\n### ERRO GERAL NOS TESTES DE PARLAMENTAR ###", error);
  }
}

// Executar os testes
testParlamentarEndpoints().then(() => {
  console.log("\nTestes de endpoints de Parlamentar concluídos!");
});
