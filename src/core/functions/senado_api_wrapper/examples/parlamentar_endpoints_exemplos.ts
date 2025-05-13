// examples/parlamentar_endpoints_exemplos.ts
import { SenadoApiWrapper, Codigo } from "../src";

async function exemploEndpointsParlamentar() {
  console.log("=== Exemplos de uso dos endpoints do módulo Parlamentar ===");
  
  const senadoApi = new SenadoApiWrapper();
  
  try {
    // Exemplo 1: Listar parlamentares afastados
    console.log("\n1. Listando parlamentares afastados:");
    const parlamentaresAfastados = await senadoApi.parlamentar.listarParlamentaresAfastados();
    console.log(`Encontrados ${parlamentaresAfastados.length} parlamentares afastados.`);
    if (parlamentaresAfastados.length > 0) {
      console.log("Primeiro parlamentar afastado:", 
        parlamentaresAfastados[0].NomeParlamentar, 
        parlamentaresAfastados[0].SiglaPartidoParlamentar, 
        parlamentaresAfastados[0].UfParlamentar);
    }
    
    // Exemplo 2: Listar parlamentares por período de legislatura
    console.log("\n2. Listando parlamentares por período de legislatura (56 a 57):");
    const parlamentaresPorPeriodo = await senadoApi.parlamentar.listarParlamentaresPorPeriodoLegislatura(56, 57);
    console.log(`Encontrados ${parlamentaresPorPeriodo.length} parlamentares no período.`);
    
    // Exemplo 3: Listar partidos dos parlamentares
    console.log("\n3. Listando partidos dos parlamentares:");
    const partidos = await senadoApi.parlamentar.listarPartidosParlamentares();
    console.log(`Encontrados ${partidos.length} partidos.`);
    if (partidos.length > 0) {
      console.log("Exemplos de partidos:");
      for (let i = 0; i < Math.min(3, partidos.length); i++) {
        console.log(`- ${partidos[i].Sigla}: ${partidos[i].Nome}`);
      }
    }
    
    // Exemplo 4: Listar tipos de uso da palavra
    console.log("\n4. Listando tipos de uso da palavra:");
    const tiposUsoPalavra = await senadoApi.parlamentar.listarTiposUsoPalavra();
    console.log(`Encontrados ${tiposUsoPalavra.length} tipos de uso da palavra.`);
    if (tiposUsoPalavra.length > 0) {
      console.log("Exemplos de tipos de uso da palavra:");
      for (let i = 0; i < Math.min(3, tiposUsoPalavra.length); i++) {
        console.log(`- ${tiposUsoPalavra[i].Sigla}: ${tiposUsoPalavra[i].Descricao}`);
      }
    }
    
    // Para os exemplos abaixo, vamos buscar o código de um parlamentar
    console.log("\n5. Buscando parlamentares em exercício para usar em exemplos:");
    const parlamentaresAtuais = await senadoApi.parlamentar.listarParlamentares({ emExercicio: true });
    
    if (parlamentaresAtuais.length > 0) {
      const parlamentarExemplo = parlamentaresAtuais[0];
      console.log(`Usando parlamentar de exemplo: ${parlamentarExemplo.NomeParlamentar} (${parlamentarExemplo.CodigoParlamentar})`);
      
      // Exemplo 5: Obter cargos do parlamentar
      console.log("\n6. Cargos do parlamentar:");
      const cargos = await senadoApi.parlamentar.obterCargosParlamentar(parlamentarExemplo.CodigoParlamentar);
      console.log(`Encontrados ${cargos.length} cargos.`);
      if (cargos.length > 0) {
        console.log("Primeiro cargo:", cargos[0].DescricaoCargo);
      }
      
      // Exemplo 6: Obter histórico acadêmico do parlamentar
      console.log("\n7. Histórico acadêmico do parlamentar:");
      const historicoAcademico = await senadoApi.parlamentar.obterHistoricoAcademico(parlamentarExemplo.CodigoParlamentar);
      if (historicoAcademico && historicoAcademico.FormacaoAcademica) {
        const formacoes = Array.isArray(historicoAcademico.FormacaoAcademica.Formacao) 
          ? historicoAcademico.FormacaoAcademica.Formacao 
          : [historicoAcademico.FormacaoAcademica.Formacao];
          
        console.log(`Encontradas ${formacoes.length} formações acadêmicas.`);
        if (formacoes.length > 0) {
          console.log("Primeira formação:", formacoes[0].Curso);
        }
      } else {
        console.log("Nenhum histórico acadêmico encontrado ou dados incompletos.");
      }
      
      // Exemplo 7: Obter profissão do parlamentar
      console.log("\n8. Profissão do parlamentar:");
      const profissao = await senadoApi.parlamentar.obterProfissaoParlamentar(parlamentarExemplo.CodigoParlamentar);
      if (profissao) {
        const profissoes = Array.isArray(profissao.Profissao) ? profissao.Profissao : [profissao.Profissao];
        console.log(`Encontradas ${profissoes.length} profissões.`);
        if (profissoes.length > 0) {
          console.log("Primeira profissão:", profissoes[0].NomeProfissao);
        }
      } else {
        console.log("Nenhuma profissão encontrada ou dados incompletos.");
      }
      
      // Exemplo 8: Obter discursos do parlamentar
      console.log("\n9. Discursos do parlamentar:");
      const discursos = await senadoApi.parlamentar.obterDiscursosParlamentar(parlamentarExemplo.CodigoParlamentar);
      console.log(`Encontrados ${discursos.length} discursos.`);
      if (discursos.length > 0) {
        console.log("Exemplo de discurso:");
        console.log(`- Data: ${discursos[0].DataPronunciamento}`);
        console.log(`- Tipo: ${discursos[0].TipoUsoPalavra || 'Não especificado'}`);
        console.log(`- Sumário: ${discursos[0].Sumario?.substring(0, 100)}...`);
      }
      
      // Exemplo 9: Obter apartes do parlamentar
      console.log("\n10. Apartes do parlamentar:");
      const apartes = await senadoApi.parlamentar.obterApartesParlamentar(parlamentarExemplo.CodigoParlamentar);
      console.log(`Encontrados ${apartes.length} apartes.`);
      if (apartes.length > 0) {
        console.log("Exemplo de aparte:");
        console.log(`- Data: ${apartes[0].DataAparte}`);
        console.log(`- Sumário: ${apartes[0].Sumario?.substring(0, 100)}...`);
      }
    } else {
      console.log("Não foi possível encontrar parlamentares para os exemplos.");
    }
    
  } catch (error) {
    console.error("Erro ao executar exemplos:", error);
  }
}

// Executar os exemplos
exemploEndpointsParlamentar().catch(console.error);
