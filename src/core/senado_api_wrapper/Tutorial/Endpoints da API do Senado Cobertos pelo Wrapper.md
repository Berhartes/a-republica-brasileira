# Endpoints da API do Senado Cobertos pelo Wrapper

Esta lista foi compilada a partir da análise do código-fonte do wrapper em 07 de Maio de 2025.

## Módulo: Comissao (`ComissaoModule`)

*   **`listarComissoes` (abstrai múltiplos endpoints):**
    *   GET /dadosabertos/comissao/lista/{tipo} (parcialmente, dependendo do filtro `tipo`)
    *   GET /dadosabertos/comissao/lista/colegiados (usado como padrão para SF ativas)
    *   GET /dadosabertos/comissao/lista/mistas (usado para CN ativas)
    *   *Observação: A lógica de seleção do endpoint exato é baseada nos filtros fornecidos.*
*   **`obterDetalhesComissao`:**
    *   GET /dadosabertos/comissao/{codigo}
*   **`obterComposicaoComissao` (abstrai dois endpoints):**
    *   GET /dadosabertos/composicao/comissao/{codigo} (para `casa: 'SF'`)
    *   GET /dadosabertos/composicao/comissao/atual/mista/{codigo} (para `casa: 'CN'`)
*   **`obterAgendaComissao` (abstrai múltiplos endpoints):**
    *   GET /dadosabertos/comissao/agenda/{dataInicio}/{dataFim}
    *   GET /dadosabertos/comissao/agenda/{dataReferencia} (usando `dataInicio` como `dataReferencia`)
*   **`obterDetalhesReuniaoComissao`:**
    *   GET /dadosabertos/comissao/reuniao/{codigoReuniao}

## Módulo: Composicao (`ComposicaoModule`)

*   **`listarPartidos`:**
    *   GET /dadosabertos/composicao/lista/partidos
*   **`listarBlocosParlamentares`:**
    *   GET /dadosabertos/composicao/lista/blocos
*   **`listarLiderancas`:**
    *   GET /dadosabertos/composicao/lideranca
*   **`obterComposicaoMesa` (abstrai dois endpoints):**
    *   GET /dadosabertos/composicao/mesaSF (para `casa: 'SF'`)
    *   GET /dadosabertos/composicao/mesaCN (para `casa: 'CN'`)

## Módulo: Parlamentar (`ParlamentarModule`)

*   **`listarParlamentares` (abstrai múltiplos endpoints):**
    *   GET /dadosabertos/senador/lista/atual (padrão ou com `emExercicio: true`)
    *   GET /dadosabertos/senador/lista/legislatura/{legislatura}
    *   *Observação: A API tem endpoints como `/senador/lista/partido/{siglaPartido}/{numeroLegislatura}` e `/senador/lista/uf/{siglaUf}/{numeroLegislatura}` que o wrapper tenta mapear se os filtros `partido` ou `uf` forem fornecidos junto com `legislatura`, mas a lógica de combinação pode precisar de revisão para cobrir todos os casos da API.* 
*   **`obterDetalhesParlamentar`:**
    *   GET /dadosabertos/senador/{codigo}
*   **`obterMandatosParlamentar`:**
    *   GET /dadosabertos/senador/{codigo}/mandatos (No código do wrapper está `/senador/mandatos/{codigoParlamentar}`, mas o endpoint correto da API é `/senador/{codigo}/mandatos`)
*   **`obterComissoesParlamentar`:**
    *   GET /dadosabertos/senador/{codigo}/comissoes
*   **`obterLiderancasParlamentar`:**
    *   GET /dadosabertos/senador/{codigo}/liderancas (DEPRECATED na API, mas o wrapper o implementa)
*   **`obterFiliacoesPartidarias`:**
    *   GET /dadosabertos/senador/{codigo}/filiacoes
*   **`obterLicencasParlamentar`:**
    *   GET /dadosabertos/senador/{codigo}/licencas

## Módulo: Plenario (`PlenarioModule`)

*   **`listarSessoesPlenarias` (abstrai múltiplos endpoints):**
    *   GET /dadosabertos/plenario/sessoes/{dataInicio}/{dataFim}
    *   GET /dadosabertos/plenario/sessoes/{dataReferencia} (usando `dataInicio` como `dataReferencia`)
*   **`obterDetalhesSessaoPlenaria`:**
    *   GET /dadosabertos/plenario/sessao/{codigoSessao} (No código do wrapper está `/plenario/sessao/{codigoSessao}`, mas o endpoint correto da API é `/plenario/encontro/{codigo}` para detalhes de uma sessão/encontro)
*   **`listarDiscursosEmPlenario`:**
    *   GET /dadosabertos/plenario/lista/discursos/{dataInicio}/{dataFim}

## Módulo: Votacao (`VotacaoModule`)

*   **`listarVotacoes` (abstrai múltiplos endpoints):**
    *   GET /dadosabertos/votacao/lista/parlamentar/{codigoParlamentar}/{dataInicio}/{dataFim}
    *   GET /dadosabertos/votacao/lista/comissao/{codigoComissao}/{dataReferencia} (usando `dataInicio` como `dataReferencia`)
    *   GET /dadosabertos/votacao/lista/materia/{codigoMateria}
    *   GET /dadosabertos/votacao/lista/sessao/{codigoSessao}
    *   GET /dadosabertos/votacao/lista/plenario/{dataInicio}/{dataFim}
    *   GET /dadosabertos/votacao/lista/plenario/{dataReferencia} (usando `dataInicio` como `dataReferencia`)
*   **`obterDetalhesVotacao`:**
    *   GET /dadosabertos/votacao/sessao/{codigoSessao}/{sequencialVotacao} (No código do wrapper está `/votacao/sessao/{codigoSessao}/{sequencialVotacao}`, mas o endpoint correto da API é `/votacao/{codigoSessao}/{sequencialVotacao}`)
*   **`obterVotosPorParlamentarNaVotacao` (usa `obterDetalhesVotacao` internamente):**
    *   Indireto: GET /dadosabertos/votacao/{codigoSessao}/{sequencialVotacao}

---
**Observações sobre a Cobertura:**

*   O wrapper foca nos endpoints prioritários definidos pelo usuário (Comissão, Composição, Parlamentar, Plenário, Votação).
*   Alguns métodos do wrapper abstraem múltiplos endpoints da API, selecionando o mais apropriado com base nos filtros fornecidos.
*   Endpoints marcados como (DEPRECATED) na API foram, em alguns casos, implementados se não havia um substituto claro ou se ainda eram funcionais (ex: `/senador/{codigo}/liderancas`).
*   Há algumas divergências entre os caminhos de URL usados no código do wrapper e os caminhos exatos na documentação da API (ex: `/senador/mandatos/{codigo}` vs `/senador/{codigo}/mandatos`). Isso será corrigido na análise de cobertura.
*   Endpoints não implementados incluem, mas não se limitam a: muitos da seção "Matéria" (Processo Legislativo), "Legislação", "Orçamento", "Discurso" (endpoints de texto binário/integral, taquigrafia), e vários endpoints de listagem mais específicos ou de detalhe dentro das categorias cobertas.

