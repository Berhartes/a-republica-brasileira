# Exemplos de Uso Detalhados - Wrapper API Senado

Este arquivo contém exemplos mais detalhados de como utilizar cada módulo do `SenadoApiWrapper`.

## Importação e Instanciação

```typescript
import {
  SenadoApiWrapper,
  FiltrosListarParlamentares,
  FiltrosListarComissoes,
  FiltrosAgendaComissao,
  FiltrosAgendaMesComissao,
  FiltrosComposicaoResumida,
  FiltrosDocumentoComissao,
  FiltrosListarPorTipo,
  // ... importe outros tipos de filtros e respostas conforme necessário
} from './src'; // Ajuste o caminho se estiver usando a versão compilada em 'dist'

const senadoApi = new SenadoApiWrapper();
```

## Módulo: Parlamentar (`senadoApi.parlamentar`)

### 1. Listar Senadores Atuais

```typescript
async function listarSenadoresAtuais() {
  try {
    const senadores = await senadoApi.parlamentar.listarParlamentares({ emExercicio: true });
    console.log(`Encontrados ${senadores.length} senadores em exercício.`);
    senadores.forEach(s => console.log(`- ${s.NomeParlamentar} (${s.SiglaPartidoParlamentar}/${s.UfParlamentar})`));
  } catch (error) {
    console.error("Erro ao listar senadores atuais:", error);
  }
}
// listarSenadoresAtuais();
```

### 2. Listar Senadores por Legislatura

```typescript
async function listarSenadoresPorLegislatura(legislatura: number) {
  try {
    const senadores = await senadoApi.parlamentar.listarParlamentares({ legislatura });
    console.log(`Encontrados ${senadores.length} senadores na legislatura ${legislatura}.`);
    // Processar dados...
  } catch (error) {
    console.error(`Erro ao listar senadores da legislatura ${legislatura}:`, error);
  }
}
// listarSenadoresPorLegislatura(56); // Exemplo para legislatura 56
```

### 3. Obter Detalhes de um Parlamentar

```typescript
async function obterDetalhesSenador(codigoParlamentar: string | number) {
  try {
    const senador = await senadoApi.parlamentar.obterDetalhesParlamentar(codigoParlamentar);
    if (senador) {
      console.log("Detalhes do Senador:", senador.NomeCompletoParlamentar);
      console.log("Partido:", senador.SiglaPartidoParlamentar);
      console.log("Email:", senador.EmailParlamentar);
    } else {
      console.log("Senador não encontrado.");
    }
  } catch (error) {
    console.error("Erro ao obter detalhes do senador:", error);
  }
}
// obterDetalhesSenador(5970); // Substitua pelo código de um senador
```

### 4. Obter Mandatos de um Parlamentar

```typescript
async function obterMandatos(codigoParlamentar: string | number) {
  try {
    const mandatos = await senadoApi.parlamentar.obterMandatosParlamentar(codigoParlamentar);
    console.log(`Mandatos para o parlamentar ${codigoParlamentar}:`, mandatos.length);
    // Processar dados...
  } catch (error) {
    console.error("Erro ao obter mandatos:", error);
  }
}
// obterMandatos(5970);
```

## Módulo: Comissão (`senadoApi.comissao`)

### 1. Listar Comissões Ativas do Senado

```typescript
async function listarComissoesAtivasSF() {
  try {
    const comissoes = await senadoApi.comissao.listarComissoes({ casa: "SF", ativas: true });
    console.log(`Encontradas ${comissoes.length} comissões ativas no Senado.`);
    comissoes.forEach(c => console.log(`- ${c.Sigla} - ${c.Nome}`));
  } catch (error) {
    console.error("Erro ao listar comissões ativas do SF:", error);
  }
}
// listarComissoesAtivasSF();
```

### 2. Obter Detalhes de uma Comissão

```typescript
async function obterDetalhesDaComissao(codigoComissao: string | number) {
  try {
    const comissao = await senadoApi.comissao.obterDetalhesComissao(codigoComissao);
    if (comissao) {
      console.log("Detalhes da Comissão:", comissao.Nome);
      console.log("Tipo:", comissao.TipoComissao);
    } else {
      console.log("Comissão não encontrada.");
    }
  } catch (error) {
    console.error("Erro ao obter detalhes da comissão:", error);
  }
}
// obterDetalhesDaComissao(38); // CAE - Comissão de Assuntos Econômicos
```

### 3. Obter Agenda de Comissões para um Período

```typescript
async function obterAgendaComissoes(dataInicio: string, dataFim: string) {
  try {
    const agendaItens = await senadoApi.comissao.obterAgendaComissao({ dataInicio, dataFim });
    console.log(`Encontrados ${agendaItens.length} itens na agenda de comissões entre ${dataInicio} e ${dataFim}.`);
    // Processar dados...
  } catch (error) {
    console.error("Erro ao obter agenda das comissões:", error);
  }
}
// obterAgendaComissoes("20240501", "20240507");
```

### 4. Listar Tipos de Colegiados 

```typescript
async function listarTiposColegiado() {
  try {
    const tipos = await senadoApi.comissao.listarTiposColegiado();
    console.log(`Encontrados ${tipos.length} tipos de colegiados.`);
    tipos.forEach(t => console.log(`- ${t.Sigla}: ${t.Descricao}`));
  } catch (error) {
    console.error("Erro ao listar tipos de colegiados:", error);
  }
}
// listarTiposColegiado();
```

### 5. Obter Agenda de Comissões para um Mês Específico

```typescript
async function obterAgendaMes(mesReferencia: string) {
  try {
    const agendaItens = await senadoApi.comissao.obterAgendaMes({ mesReferencia });
    console.log(`Encontrados ${agendaItens.length} itens na agenda para o mês ${mesReferencia}.`);
    // Processar dados...
  } catch (error) {
    console.error("Erro ao obter agenda do mês:", error);
  }
}
// obterAgendaMes("202405"); // Maio de 2024
```

### 6. Obter Agenda no Formato iCalendar

```typescript
async function obterAgendaICal() {
  try {
    const agendaICal = await senadoApi.comissao.obterAgendaICal();
    console.log("Agenda iCal obtida com sucesso. Tamanho:", agendaICal.length);
    console.log("Primeiros 200 caracteres:", agendaICal.substring(0, 200) + "...");
  } catch (error) {
    console.error("Erro ao obter agenda iCal:", error);
  }
}
// obterAgendaICal();
```

### 7. Obter Requerimentos de CPI

```typescript
async function obterRequerimentosCPI(codigoComissao: string | number) {
  try {
    const requerimentos = await senadoApi.comissao.obterRequerimentosCPI(codigoComissao);
    console.log(`Encontrados ${requerimentos.length} requerimentos para a CPI ${codigoComissao}.`);
    // Processar dados...
  } catch (error) {
    console.error("Erro ao obter requerimentos da CPI:", error);
  }
}
// obterRequerimentosCPI(1383); // Substitua pelo código de uma CPI válida
```

### 8. Obter Documentos de uma Comissão

```typescript
async function obterDocumentosComissao(sigla: string, tipoDocumento: string) {
  try {
    const documentos = await senadoApi.comissao.obterDocumentosComissao({ 
      siglaComissao: sigla, 
      tipoDocumento: tipoDocumento 
    });
    console.log(`Encontrados ${documentos.length} documentos do tipo "${tipoDocumento}" para a comissão ${sigla}.`);
    // Processar dados...
  } catch (error) {
    console.error("Erro ao obter documentos da comissão:", error);
  }
}
// obterDocumentosComissao("CAE", "PARECER"); // Comissão de Assuntos Econômicos, pareceres
```

### 9. Obter Notas Taquigráficas de uma Reunião

```typescript
async function obterNotasTaquigraficas(codigoReuniao: string | number) {
  try {
    const notas = await senadoApi.comissao.obterNotasTaquigraficas(codigoReuniao);
    if (notas) {
      console.log("Notas taquigráficas obtidas para a reunião", codigoReuniao);
      console.log("Data de publicação:", notas.DataPublicacao);
      // O texto completo pode ser muito grande
      console.log("Primeiros 200 caracteres:", notas.Texto?.substring(0, 200) + "...");
    } else {
      console.log("Notas taquigráficas não encontradas para esta reunião.");
    }
  } catch (error) {
    console.error("Erro ao obter notas taquigráficas:", error);
  }
}
// obterNotasTaquigraficas(12345); // Substitua pelo código de uma reunião válida
```

## Módulo: Composição (`senadoApi.composicao`)

### 1. Listar Partidos Políticos

```typescript
async function listarTodosPartidos() {
  try {
    const partidos = await senadoApi.composicao.listarPartidos();
    console.log(`Total de partidos (histórico incluído): ${partidos.length}`);
    // Processar dados...
  } catch (error) {
    console.error("Erro ao listar partidos:", error);
  }
}
// listarTodosPartidos();
```

### 2. Obter Composição da Mesa Diretora do Senado

```typescript
async function obterMesaSenado() {
  try {
    const mesa = await senadoApi.composicao.obterComposicaoMesa("SF");
    if (mesa && mesa.Membros) {
      console.log("Membros da Mesa Diretora do Senado:");
      mesa.Membros.Membro.forEach(m => console.log(`- ${m.DescricaoCargo}: ${m.IdentificacaoParlamentar.NomeParlamentar}`));
    }
  } catch (error) {
    console.error("Erro ao obter mesa do Senado:", error);
  }
}
// obterMesaSenado();
```

### 3. Listar Tipos de Liderança

```typescript
async function listarTiposLideranca() {
  try {
    const tipos = await senadoApi.composicao.listarTiposLideranca();
    console.log(`Encontrados ${tipos.length} tipos de liderança.`);
    tipos.forEach(t => console.log(`- ${t.Codigo}: ${t.Descricao}`));
  } catch (error) {
    console.error("Erro ao listar tipos de liderança:", error);
  }
}
// listarTiposLideranca();
```

### 4. Listar Tipos de Unidade de Liderança

```typescript
async function listarTiposUnidadeLideranca() {
  try {
    const tipos = await senadoApi.composicao.listarTiposUnidadeLideranca();
    console.log(`Encontrados ${tipos.length} tipos de unidade de liderança.`);
    tipos.forEach(t => console.log(`- ${t.Codigo}: ${t.Descricao}`));
  } catch (error) {
    console.error("Erro ao listar tipos de unidade de liderança:", error);
  }
}
// listarTiposUnidadeLideranca();
```

### 5. Listar Tipos de Cargo

```typescript
async function listarTiposCargo() {
  try {
    const tipos = await senadoApi.composicao.listarTiposCargo();
    console.log(`Encontrados ${tipos.length} tipos de cargo.`);
    tipos.forEach(t => console.log(`- ${t.Codigo}: ${t.Descricao}`));
  } catch (error) {
    console.error("Erro ao listar tipos de cargo:", error);
  }
}
// listarTiposCargo();
```

### 6. Obter Detalhes de um Bloco Parlamentar

```typescript
async function obterDetalhesBloco(codigoBloco: string | number) {
  try {
    const bloco = await senadoApi.composicao.obterDetalhesBloco(codigoBloco);
    if (bloco) {
      console.log("Detalhes do Bloco:", bloco.Nome);
      if (bloco.Partido) {
        console.log("Partidos que compõem o bloco:");
        bloco.Partido.forEach(p => console.log(`- ${p.Sigla}: ${p.Nome}`));
      }
      if (bloco.Lider) {
        console.log("Líder:", bloco.Lider.IdentificacaoParlamentar.NomeParlamentar);
      }
    } else {
      console.log("Bloco não encontrado.");
    }
  } catch (error) {
    console.error("Erro ao obter detalhes do bloco:", error);
  }
}
// obterDetalhesBloco(123); // Substitua pelo código de um bloco válido
```

### 7. Listar Composição por Tipo

```typescript
async function listarComposicaoPorTipo(tipo: string) {
  try {
    const composicao = await senadoApi.composicao.listarComposicaoPorTipo({ tipo });
    console.log(`Encontrados ${composicao.length} itens na composição do tipo "${tipo}".`);
    // Processar dados...
  } catch (error) {
    console.error(`Erro ao listar composição do tipo "${tipo}":`, error);
  }
}
// listarComposicaoPorTipo("titulares"); // Exemplo: titulares, suplentes, liderancas, etc.
```

### 8. Listar Composição do Congresso Nacional por Tipo

```typescript
async function listarComposicaoCNPorTipo(tipo: string) {
  try {
    const composicao = await senadoApi.composicao.listarComposicaoCNPorTipo({ tipo });
    console.log(`Encontrados ${composicao.length} itens na composição CN do tipo "${tipo}".`);
    // Processar dados...
  } catch (error) {
    console.error(`Erro ao listar composição CN do tipo "${tipo}":`, error);
  }
}
// listarComposicaoCNPorTipo("titulares"); // Exemplo: titulares, suplentes, etc.
```

### 9. Obter Composição Resumida de Comissão Mista

```typescript
async function obterComposicaoResumidaComissaoMista(codigoComissao: string | number, dataInicio: string, dataFim: string) {
  try {
    const composicao = await senadoApi.composicao.obterComposicaoResumidaComissaoMista({
      codigo: codigoComissao,
      dataInicio,
      dataFim
    });
    if (composicao) {
      console.log("Composição resumida da comissão mista:", composicao.IdentificacaoComissao.NomeComissao);
      if (composicao.Membros.Titular) {
        console.log(`Titulares: ${composicao.Membros.Titular.length}`);
      }
      if (composicao.Membros.Suplente) {
        console.log(`Suplentes: ${composicao.Membros.Suplente.length}`);
      }
    } else {
      console.log("Composição resumida não encontrada.");
    }
  } catch (error) {
    console.error("Erro ao obter composição resumida:", error);
  }
}
// obterComposicaoResumidaComissaoMista(123, "20240101", "20240531"); // Substitua pelos códigos válidos
```

## Módulo: Plenário (`senadoApi.plenario`)

### 1. Listar Sessões Plenárias em um Período

```typescript
async function listarSessoes(dataInicio: string, dataFim: string) {
  try {
    const sessoes = await senadoApi.plenario.listarSessoesPlenarias({ dataInicio, dataFim });
    console.log(`Encontradas ${sessoes.length} sessões plenárias entre ${dataInicio} e ${dataFim}.`);
    // Processar dados...
  } catch (error) {
    console.error("Erro ao listar sessões plenárias:", error);
  }
}
// listarSessoes("20240501", "20240507");
```

## Módulo: Votação (`senadoApi.votacao`)

### 1. Listar Votações de uma Matéria (Requer Código de Matéria Válido)

```typescript
async function listarVotacoesMateria(codigoMateria: string | number) {
  try {
    const votacoes = await senadoApi.votacao.listarVotacoes({ materiaId: codigoMateria });
    console.log(`Encontradas ${votacoes.length} votações para a matéria ${codigoMateria}.`);
    // Processar dados...
  } catch (error) {
    console.error(`Erro ao listar votações da matéria ${codigoMateria}:`, error);
  }
}
// listarVotacoesMateria(154014); // Exemplo de código de matéria
```

### 2. Obter Detalhes de uma Votação (Requer Código da Sessão e Sequencial da Votação)

```typescript
async function obterDetalhesDaVotacao(codigoSessao: string | number, sequencialVotacao: number) {
  try {
    const detalheVotacao = await senadoApi.votacao.obterDetalhesVotacao(codigoSessao, sequencialVotacao);
    if (detalheVotacao) {
      console.log("Detalhes da Votação:", detalheVotacao.DescricaoVotacao);
      console.log("Resultado:", detalheVotacao.Resultado);
      if (detalheVotacao.Votos && detalheVotacao.Votos.Parlamentar) {
        console.log("Votos Individuais:", detalheVotacao.Votos.Parlamentar.length);
      }
    } else {
      console.log("Votação não encontrada.");
    }
  } catch (error) {
    console.error("Erro ao obter detalhes da votação:", error);
  }
}
// obterDetalhesDaVotacao("0001/24", 1); // Substitua por códigos válidos
```

Lembre-se de que alguns endpoints da API do Senado podem estar indisponíveis ou retornar dados vazios dependendo dos parâmetros fornecidos ou da disponibilidade atual dos dados.
