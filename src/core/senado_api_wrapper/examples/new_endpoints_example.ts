// examples/new_endpoints_example.ts
import { SenadoApiWrapper } from '../src';

async function testNewEndpoints() {
  console.log("===== Testando os novos endpoints implementados =====");
  const senadoApi = new SenadoApiWrapper();

  try {
    // Primeiro, vamos obter alguns senadores ativos para usar nos testes
    console.log("\n1. Buscando senadores ativos...");
    const senadores = await senadoApi.parlamentar.listarParlamentares({ emExercicio: true });
    
    if (senadores.length === 0) {
      console.log("Nenhum senador ativo encontrado. Finalizando testes.");
      return;
    }
    
    const senador = senadores[0]; // Pegando o primeiro senador da lista
    console.log(`Senador selecionado para testes: ${senador.NomeParlamentar} (${senador.SiglaPartidoParlamentar}/${senador.UfParlamentar})`);
    
    // 2. Testando os novos endpoints do módulo parlamentar
    console.log("\n2. Testando novos endpoints do módulo parlamentar");
    
    console.log("\n2.1. Obtendo discursos do parlamentar");
    try {
      const discursos = await senadoApi.parlamentar.obterDiscursosParlamentar(senador.CodigoParlamentar);
      console.log(`Encontrados ${discursos.length} discursos.`);
      if (discursos.length > 0) {
        const discurso = discursos[0];
        console.log(`Exemplo de discurso: Data: ${discurso.DataPronunciamento}, Sumário: ${discurso.Sumario?.substring(0, 100)}...`);
      }
    } catch (error) {
      console.error("Erro ao obter discursos:", error);
    }
    
    console.log("\n2.2. Obtendo apartes do parlamentar");
    try {
      const apartes = await senadoApi.parlamentar.obterApartesParlamentar(senador.CodigoParlamentar);
      console.log(`Encontrados ${apartes.length} apartes.`);
      if (apartes.length > 0) {
        const aparte = apartes[0];
        console.log(`Exemplo de aparte: Data: ${aparte.DataAparte}, Sumário: ${aparte.Sumario?.substring(0, 100)}...`);
      }
    } catch (error) {
      console.error("Erro ao obter apartes:", error);
    }
    
    console.log("\n2.3. Obtendo histórico acadêmico do parlamentar");
    try {
      const historicoAcademico = await senadoApi.parlamentar.obterHistoricoAcademico(senador.CodigoParlamentar);
      if (historicoAcademico) {
        console.log("Histórico acadêmico encontrado:");
        if (historicoAcademico.FormacaoAcademica?.Formacao) {
          const formacoes = Array.isArray(historicoAcademico.FormacaoAcademica.Formacao)
            ? historicoAcademico.FormacaoAcademica.Formacao
            : [historicoAcademico.FormacaoAcademica.Formacao];
          
          formacoes.forEach(formacao => {
            console.log(`- ${formacao.Curso} (${formacao.Instituicao || 'Instituição não informada'})`);
          });
        } else {
          console.log("Nenhuma formação acadêmica encontrada.");
        }
      } else {
        console.log("Histórico acadêmico não encontrado.");
      }
    } catch (error) {
      console.error("Erro ao obter histórico acadêmico:", error);
    }

    // 3. Testando os novos endpoints do módulo plenário
    console.log("\n3. Testando novos endpoints do módulo plenário");
    
    console.log("\n3.1. Listando tipos de sessões plenárias");
    try {
      const tiposSessao = await senadoApi.plenario.listarTiposSessao();
      console.log(`Encontrados ${tiposSessao.length} tipos de sessões.`);
      tiposSessao.forEach(tipo => {
        console.log(`- ${tipo.Sigla}: ${tipo.Descricao}`);
      });
    } catch (error) {
      console.error("Erro ao listar tipos de sessões:", error);
    }
    
    // Vamos buscar uma sessão plenária para testar a pauta
    console.log("\n3.2. Buscando sessões plenárias recentes para obter pauta");
    const hoje = new Date();
    const mesPassado = new Date(hoje);
    mesPassado.setMonth(hoje.getMonth() - 1);
    
    const dataFim = `${hoje.getFullYear()}${(hoje.getMonth() + 1).toString().padStart(2, '0')}${hoje.getDate().toString().padStart(2, '0')}`;
    const dataInicio = `${mesPassado.getFullYear()}${(mesPassado.getMonth() + 1).toString().padStart(2, '0')}${mesPassado.getDate().toString().padStart(2, '0')}`;
    
    try {
      const sessoes = await senadoApi.plenario.listarSessoesPlenarias({ dataInicio, dataFim });
      console.log(`Encontradas ${sessoes.length} sessões plenárias no último mês.`);
      
      if (sessoes.length > 0) {
        const sessao = sessoes[0];
        console.log(`Testando obtenção de pauta para a sessão de código ${sessao.CodigoSessao} (${sessao.DataSessao})`);
        
        try {
          const pauta = await senadoApi.plenario.obterPautaDaSessao(sessao.CodigoSessao);
          if (pauta) {
            console.log(`Pauta encontrada com ${pauta.ItensPauta?.length || 0} itens.`);
            if (pauta.ItensPauta && pauta.ItensPauta.length > 0) {
              pauta.ItensPauta.slice(0, 3).forEach((item, i) => {
                console.log(`  ${i+1}. ${item.SiglaSubtipoMateria} ${item.NumeroMateria}/${item.AnoMateria} - ${item.DescricaoEmentaMateria?.substring(0, 100)}...`);
              });
              if (pauta.ItensPauta.length > 3) {
                console.log(`  ... e mais ${pauta.ItensPauta.length - 3} itens.`);
              }
            }
          } else {
            console.log("Pauta não encontrada para esta sessão.");
          }
        } catch (error) {
          console.error("Erro ao obter pauta da sessão:", error);
        }
      }
    } catch (error) {
      console.error("Erro ao listar sessões plenárias:", error);
    }
    
    // 4. Testando os novos endpoints do módulo votação
    console.log("\n4. Testando novos endpoints do módulo votação");
    
    console.log("\n4.1. Listando tipos de votação");
    try {
      const tiposVotacao = await senadoApi.votacao.listarTiposVotacao();
      console.log(`Encontrados ${tiposVotacao.length} tipos de votação.`);
      tiposVotacao.forEach(tipo => {
        console.log(`- ${tipo.Sigla}: ${tipo.Descricao} (Secreta: ${tipo.IndicadorVotacaoSecreta || 'Não informado'})`);
      });
    } catch (error) {
      console.error("Erro ao listar tipos de votação:", error);
    }
    
  } catch (error) {
    console.error("Erro geral durante os testes:", error);
  }
  
  console.log("\n===== Testes de novos endpoints concluídos =====");
}

// Executar testes
testNewEndpoints();
