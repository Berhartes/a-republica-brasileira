// examples/basic_usage.ts
import { SenadoApiWrapper, FiltrosListarParlamentares, Codigo } from "../src"; // Adjust path if running from dist

async function testApiWrapper() {
  console.log("Iniciando teste do Senado API Wrapper...");
  const senadoApi = new SenadoApiWrapper();

  try {
    // Teste 1: Listar Senadores Atuais
    console.log("\n--- Teste 1: Listando Senadores Atuais ---");
    const filtrosSenadores: FiltrosListarParlamentares = { emExercicio: true };
    const senadoresAtuais = await senadoApi.parlamentar.listarParlamentares(filtrosSenadores);
    if (senadoresAtuais.length > 0) {
      console.log(`Encontrados ${senadoresAtuais.length} senadores em exercício.`);
      console.log("Primeiro senador da lista:", senadoresAtuais[0]);
      const primeiroSenadorCodigo = senadoresAtuais[0].CodigoParlamentar;

      // Teste 2: Obter Detalhes de um Senador
      if (primeiroSenadorCodigo) {
        console.log("\n--- Teste 2: Detalhes do Senador com código " + primeiroSenadorCodigo + " ---");
        const detalhesSenador = await senadoApi.parlamentar.obterDetalhesParlamentar(primeiroSenadorCodigo);
        if (detalhesSenador) {
          console.log("Detalhes:", detalhesSenador.NomeParlamentar, "-", detalhesSenador.SiglaPartidoParlamentar);
        } else {
          console.log("Não foi possível obter detalhes do senador.");
        }
      }
    } else {
      console.log("Nenhum senador em exercício encontrado.");
    }

    // Teste 3: Listar Comissões
    console.log("\n--- Teste 3: Listando Comissões (ativas SF) ---");
    const comissoesAtivasSF = await senadoApi.comissao.listarComissoes({ casa: "SF", ativas: true });
    if (comissoesAtivasSF.length > 0) {
      console.log(`Encontradas ${comissoesAtivasSF.length} comissões ativas no Senado.`);
      console.log("Primeira comissão da lista:", comissoesAtivasSF[0]);
      const primeiraComissaoCodigo = comissoesAtivasSF[0].Codigo;

      // Teste 4: Obter Detalhes de uma Comissão
      if (primeiraComissaoCodigo) {
        console.log("\n--- Teste 4: Detalhes da Comissão com código " + primeiraComissaoCodigo + " ---");
        const detalhesComissao = await senadoApi.comissao.obterDetalhesComissao(primeiraComissaoCodigo);
        if (detalhesComissao) {
          console.log("Detalhes da Comissão:", detalhesComissao.Nome, "-", detalhesComissao.Sigla);
        } else {
          console.log("Não foi possível obter detalhes da comissão.");
        }
      }
    } else {
      console.log("Nenhuma comissão ativa do Senado encontrada.");
    }

    // Teste 5: Listar Partidos
    console.log("\n--- Teste 5: Listando Partidos Políticos ---");
    const partidos = await senadoApi.composicao.listarPartidos();
    if (partidos.length > 0) {
      console.log(`Encontrados ${partidos.length} partidos.`);
      console.log("Primeiro partido da lista:", partidos[0]);
    } else {
      console.log("Nenhum partido encontrado.");
    }

    // Teste 6: Obter Mesa Diretora do Senado
    console.log("\n--- Teste 6: Obtendo Composição da Mesa Diretora do Senado ---");
    const mesaSF = await senadoApi.composicao.obterComposicaoMesa("SF");
    if (mesaSF && mesaSF.Membros && mesaSF.Membros.Membro.length > 0) {
      console.log(`Encontrados ${mesaSF.Membros.Membro.length} membros na Mesa do Senado.`);
      console.log("Primeiro membro:", mesaSF.Membros.Membro[0].IdentificacaoParlamentar.NomeParlamentar, "-", mesaSF.Membros.Membro[0].DescricaoCargo);
    } else {
      console.log("Não foi possível obter a composição da Mesa do Senado.");
    }

    // Teste 7: Listar Sessões Plenárias (ex: últimos 7 dias)
    console.log("\n--- Teste 7: Listando Sessões Plenárias (ex: últimos 7 dias) ---");
    const hoje = new Date();
    const seteDiasAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dataFim = `${hoje.getFullYear()}${(hoje.getMonth() + 1).toString().padStart(2, '0')}${hoje.getDate().toString().padStart(2, '0')}`;
    const dataInicio = `${seteDiasAtras.getFullYear()}${(seteDiasAtras.getMonth() + 1).toString().padStart(2, '0')}${seteDiasAtras.getDate().toString().padStart(2, '0')}`;
    
    try {
      const sessoes = await senadoApi.plenario.listarSessoesPlenarias({ dataInicio, dataFim });
      if (sessoes.length > 0) {
        // Abaixo, a linha 84 original que causava erro foi modificada para usar concatenação de string normal
        console.log("Encontradas " + sessoes.length + " sessões plenárias nos últimos 7 dias.");
        console.log("Primeira sessão:", sessoes[0]);
      } else {
        console.log("Nenhuma sessão plenária encontrada nos últimos 7 dias.");
      }
    } catch (e: any) {
        console.error("Erro ao listar sessões plenárias:", e.message);
    }

  } catch (error) {
    console.error("\n### ERRO GERAL NO TESTE DO WRAPPER ###", error);
  }
}

testApiWrapper();

