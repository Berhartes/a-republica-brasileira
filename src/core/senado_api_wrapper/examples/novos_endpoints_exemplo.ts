// examples/novos_endpoints_exemplo.ts
import { SenadoApiWrapper, FiltrosAgendaMesComissao, FiltrosComposicaoResumida, FiltrosDocumentoComissao, FiltrosListarPorTipo } from "../src";

/**
 * Exemplo demonstrando o uso dos novos endpoints implementados no wrapper.
 */
async function demonstrarNovosEndpoints() {
  console.log("Iniciando demonstração dos novos endpoints do wrapper do Senado...");
  const senadoApi = new SenadoApiWrapper();

  try {
    // Exemplo 1: Listar tipos de colegiados
    console.log("\n--- Exemplo 1: Listando Tipos de Colegiados ---");
    const tiposColegiado = await senadoApi.comissao.listarTiposColegiado();
    console.log(`Encontrados ${tiposColegiado.length} tipos de colegiados.`);
    tiposColegiado.slice(0, 3).forEach(tipo => console.log(`- ${tipo.Sigla}: ${tipo.Descricao}`));

    // Exemplo 2: Obter agenda de comissões para um mês específico
    console.log("\n--- Exemplo 2: Obtendo Agenda de Comissões para um Mês Específico ---");
    const mesAtual = new Date();
    const mesReferencia = `${mesAtual.getFullYear()}${(mesAtual.getMonth() + 1).toString().padStart(2, '0')}`;
    const filtrosAgendaMes: FiltrosAgendaMesComissao = { mesReferencia };
    
    try {
      const agendaMes = await senadoApi.comissao.obterAgendaMes(filtrosAgendaMes);
      console.log(`Encontrados ${agendaMes.length} itens na agenda para o mês ${mesReferencia}.`);
      if (agendaMes.length > 0) {
        console.log("Primeiro item da agenda:", agendaMes[0]);
      }
    } catch (e: any) {
      console.error("Erro ao obter agenda do mês:", e.message);
    }

    // Exemplo 3: Listar tipos de liderança
    console.log("\n--- Exemplo 3: Listando Tipos de Liderança ---");
    const tiposLideranca = await senadoApi.composicao.listarTiposLideranca();
    console.log(`Encontrados ${tiposLideranca.length} tipos de liderança.`);
    tiposLideranca.slice(0, 3).forEach(tipo => console.log(`- ${tipo.Codigo}: ${tipo.Descricao}`));

    // Exemplo 4: Listar tipos de cargo
    console.log("\n--- Exemplo 4: Listando Tipos de Cargo ---");
    const tiposCargo = await senadoApi.composicao.listarTiposCargo();
    console.log(`Encontrados ${tiposCargo.length} tipos de cargo.`);
    tiposCargo.slice(0, 3).forEach(tipo => console.log(`- ${tipo.Codigo}: ${tipo.Descricao}`));

    // Exemplo 5: Obter detalhes de um bloco parlamentar (requer código válido)
    console.log("\n--- Exemplo 5: Detalhes de um Bloco Parlamentar ---");
    // Primeiro obtemos a lista de blocos para encontrar um código válido
    const blocos = await senadoApi.composicao.listarBlocosParlamentares();
    if (blocos.length > 0) {
      const primeiroBloco = blocos[0];
      console.log(`Obtendo detalhes do bloco: ${primeiroBloco.Nome} (Código: ${primeiroBloco.Codigo})`);
      
      const detalhesBloco = await senadoApi.composicao.obterDetalhesBloco(primeiroBloco.Codigo);
      if (detalhesBloco) {
        console.log("Detalhes do bloco:", detalhesBloco);
      } else {
        console.log("Não foi possível obter detalhes do bloco.");
      }
    } else {
      console.log("Não foram encontrados blocos parlamentares para detalhar.");
    }

    // Exemplo 6: Listar composição por tipo
    console.log("\n--- Exemplo 6: Listar Composição por Tipo ---");
    const filtrosComposicao: FiltrosListarPorTipo = { tipo: "titulares" };
    try {
      const composicao = await senadoApi.composicao.listarComposicaoPorTipo(filtrosComposicao);
      console.log(`Encontrados ${composicao.length} itens na composição do tipo "${filtrosComposicao.tipo}".`);
      if (composicao.length > 0) {
        console.log("Primeiro item:", composicao[0]);
      }
    } catch (e: any) {
      console.error(`Erro ao listar composição do tipo "${filtrosComposicao.tipo}":`, e.message);
    }

    // Exemplo 7: Obter notas taquigráficas de uma reunião (requer código válido)
    console.log("\n--- Exemplo 7: Notas Taquigráficas de Reunião ---");
    // Para este exemplo, precisaríamos de um código de reunião válido
    // Normalmente, seria obtido primeiro listando as reuniões
    const codigoReuniao = "123456"; // Substituir por um código válido
    try {
      const notas = await senadoApi.comissao.obterNotasTaquigraficas(codigoReuniao);
      if (notas) {
        console.log("Notas taquigráficas encontradas para a reunião", codigoReuniao);
        // As notas podem conter texto extenso, então vamos mostrar apenas um trecho
        console.log("Trecho da nota:", notas.Texto?.substring(0, 100) + "...");
      } else {
        console.log(`Não foram encontradas notas taquigráficas para a reunião ${codigoReuniao}.`);
      }
    } catch (e: any) {
      console.error(`Erro ao obter notas taquigráficas da reunião ${codigoReuniao}:`, e.message);
    }

  } catch (error: any) {
    console.error("\n### ERRO NA DEMONSTRAÇÃO ###", error);
  }
}

// Executar a demonstração
demonstrarNovosEndpoints()
  .then(() => console.log("\nDemonstração concluída."))
  .catch(error => console.error("Erro na execução da demonstração:", error));
