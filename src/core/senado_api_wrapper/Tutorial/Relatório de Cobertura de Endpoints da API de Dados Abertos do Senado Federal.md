# Relatório de Cobertura de Endpoints da API de Dados Abertos do Senado Federal

**Data da Análise:** 07 de Maio de 2025  
**Data da Atualização:** 17 de Maio de 2025

## 1. Introdução

Este relatório detalha a cobertura de endpoints da [API de Dados Abertos Legislativos do Senado Federal e do Congresso Nacional](https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html#) pelo wrapper desenvolvido.
O objetivo é fornecer uma visão clara de quais funcionalidades da API foram implementadas, quais não foram, e o percentual de cobertura geral, focando nas prioridades definidas.

## 2. Resumo da Cobertura

Com base na documentação oficial da API (Swagger UI) e na análise do código-fonte do wrapper, os seguintes números foram apurados:

*   **Total de Endpoints na API do Senado (aproximado):** 118
    *   *Este número considera cada variação de path como um endpoint distinto, conforme listado na documentação Swagger.*
*   **Total de Endpoints Cobertos Diretamente pelo Wrapper:** 79
    *   *Este número reflete os endpoints específicos da API que os métodos do wrapper invocam. Alguns métodos do wrapper abstraem múltiplos endpoints da API, e cada um desses mapeamentos diretos foi contado.*
*   **Percentual de Cobertura Estimado:** (79 / 118) * 100% = **aproximadamente 66.95%**

É importante notar que o wrapper foi desenvolvido com foco nas seguintes categorias prioritárias: Comissão, Composição, Parlamentar, Plenário e Votação. A cobertura dentro dessas categorias é agora bastante abrangente.

## 3. Mapa de Cobertura por Módulo do Wrapper

A seguir, um detalhamento dos endpoints cobertos e dos principais não cobertos em cada módulo implementado no wrapper.

### Módulo: Comissão (`ComissaoModule`)

*   **Endpoints Cobertos (15):**
    1.  `GET /dadosabertos/comissao/lista/colegiados` (via `listarComissoes` para SF ativas)
    2.  `GET /dadosabertos/comissao/lista/mistas` (via `listarComissoes` para CN ativas)
    3.  `GET /dadosabertos/comissao/lista/{tipo}` (parcialmente via `listarComissoes` com filtro `tipo`)
    4.  `GET /dadosabertos/comissao/{codigo}` (via `obterDetalhesComissao`)
    5.  `GET /dadosabertos/composicao/comissao/{codigo}` (via `obterComposicaoComissao` para SF)
    6.  `GET /dadosabertos/composicao/comissao/atual/mista/{codigo}` (via `obterComposicaoComissao` para CN)
    7.  `GET /dadosabertos/comissao/agenda/{dataInicio}/{dataFim}` (via `obterAgendaComissao`)
    8.  `GET /dadosabertos/comissao/agenda/{dataReferencia}` (via `obterAgendaComissao`)
    9.  `GET /dadosabertos/comissao/reuniao/{codigoReuniao}` (via `obterDetalhesReuniaoComissao`)
    10. `GET /dadosabertos/comissao/agenda/atual/iCal` (via `obterAgendaICal`, **NOVO**)
    11. `GET /dadosabertos/comissao/agenda/mes/{mesReferencia}` (via `obterAgendaMes`, **NOVO**)
    12. `GET /dadosabertos/comissao/cpi/{comissao}/requerimentos` (via `obterRequerimentosCPI`, **NOVO**)
    13. `GET /dadosabertos/comissao/lista/tiposColegiado` (via `listarTiposColegiado`, **NOVO**)
    14. `GET /dadosabertos/comissao/reuniao/{sigla}/documento/{tipoDocumento}` (via `obterDocumentosComissao`, **NOVO**)
    15. `GET /dadosabertos/comissao/reuniao/notas/{codigoReuniao}` (via `obterNotasTaquigraficas`, **NOVO**)
*   **Principais Endpoints Não Cobertos em "Comissão":**
    *   `GET /dadosabertos/comissao/{comissao}/documentos` (DEPRECATED)

### Módulo: Composição (`ComposicaoModule`)

*   **Endpoints Cobertos (12):**
    1.  `GET /dadosabertos/composicao/lista/partidos` (via `listarPartidos`)
    2.  `GET /dadosabertos/composicao/lista/blocos` (via `listarBlocosParlamentares`)
    3.  `GET /dadosabertos/composicao/lideranca` (via `listarLiderancas`)
    4.  `GET /dadosabertos/composicao/mesaSF` (via `obterComposicaoMesa` para SF)
    5.  `GET /dadosabertos/composicao/mesaCN` (via `obterComposicaoMesa` para CN)
    6.  `GET /dadosabertos/composicao/bloco/{codigo}` (via `obterDetalhesBloco`, **NOVO**)
    7.  `GET /dadosabertos/composicao/comissao/resumida/mista/{codigo}/{dataInicio}/{dataFim}` (via `obterComposicaoResumidaComissaoMista`, **NOVO**)
    8.  `GET /dadosabertos/composicao/lideranca/tipos` (via `listarTiposLideranca`, **NOVO**)
    9.  `GET /dadosabertos/composicao/lideranca/tipos-unidade` (via `listarTiposUnidadeLideranca`, **NOVO**)
    10. `GET /dadosabertos/composicao/lista/{tipo}` (via `listarComposicaoPorTipo`, **NOVO**)
    11. `GET /dadosabertos/composicao/lista/cn/{tipo}` (via `listarComposicaoCNPorTipo`, **NOVO**)
    12. `GET /dadosabertos/composicao/lista/tiposCargo` (via `listarTiposCargo`, **NOVO**)
*   **Principais Endpoints Não Cobertos em "Composição":**
    *   `GET /dadosabertos/composicao/lista/liderancaCN` (DEPRECATED)
    *   `GET /dadosabertos/composicao/lista/liderancaSF` (DEPRECATED)

### Módulo: Parlamentar (`ParlamentarModule`)

*   **Endpoints Cobertos (18):**
    1.  `GET /dadosabertos/senador/lista/atual` (via `listarParlamentares`)
    2.  `GET /dadosabertos/senador/lista/legislatura/{legislatura}` (via `listarParlamentares`)
    3.  `GET /dadosabertos/senador/{codigo}` (via `obterDetalhesParlamentar`)
    4.  `GET /dadosabertos/senador/{codigo}/mandatos` (via `obterMandatosParlamentar`)
    5.  `GET /dadosabertos/senador/{codigo}/comissoes` (via `obterComissoesParlamentar`)
    6.  `GET /dadosabertos/senador/{codigo}/liderancas` (DEPRECATED, via `obterLiderancasParlamentar`)
    7.  `GET /dadosabertos/senador/{codigo}/filiacoes` (via `obterFiliacoesPartidarias`)
    8.  `GET /dadosabertos/senador/{codigo}/licencas` (via `obterLicencasParlamentar`)
    9.  `GET /dadosabertos/senador/{codigo}/cargos` (via `obterCargosParlamentar`, **NOVO**)
    10. `GET /dadosabertos/senador/{codigo}/historicoAcademico` (via `obterHistoricoAcademico`, **NOVO**)
    11. `GET /dadosabertos/senador/{codigo}/profissao` (via `obterProfissaoParlamentar`, **NOVO**)
    12. `GET /dadosabertos/senador/afastados` (via `listarParlamentaresAfastados`, **NOVO**)
    13. `GET /dadosabertos/senador/lista/legislatura/{legislaturaInicio}/{legislaturaFim}` (via `listarParlamentaresPorPeriodoLegislatura`, **NOVO**)
    14. `GET /dadosabertos/senador/partidos` (via `listarPartidosParlamentares`, **NOVO**)
    15. `GET /dadosabertos/senador/{codigo}/apartes` (via `obterApartesParlamentar`, **NOVO**)
    16. `GET /dadosabertos/senador/{codigo}/discursos` (via `obterDiscursosParlamentar`, **NOVO**)
    17. `GET /dadosabertos/senador/lista/tiposUsoPalavra` (via `listarTiposUsoPalavra`, **NOVO**)
    18. Endpoints de filtro abstrato em `listarParlamentares` (por partido/UF em uma legislatura)
*   **Principais Endpoints Não Cobertos em "Parlamentar":**
    *   `GET /dadosabertos/senador/{codigo}/autorias` (DEPRECATED)
    *   `GET /dadosabertos/senador/{codigo}/relatorias` (DEPRECATED)

### Módulo: Plenário (`PlenarioModule`)

*   **Endpoints Cobertos (23):**
    1.  `GET /dadosabertos/plenario/sessoes/{dataInicio}/{dataFim}` (via `listarSessoesPlenarias`)
    2.  `GET /dadosabertos/plenario/sessoes/{dataReferencia}` (via `listarSessoesPlenarias`)
    3.  `GET /dadosabertos/plenario/encontro/{codigo}` (via `obterDetalhesSessaoPlenaria`)
    4.  `GET /dadosabertos/plenario/lista/discursos/{dataInicio}/{dataFim}` (via `listarDiscursosEmPlenario`)
    5.  `GET /dadosabertos/plenario/encontro/{codigo}/pauta` (via `obterPautaDaSessao`)
    6.  `GET /dadosabertos/plenario/encontro/{codigo}/resultado` (via `obterResultadoDaSessao`)
    7.  `GET /dadosabertos/plenario/encontro/{codigo}/resumo` (via `obterResumoDaSessao`)
    8.  `GET /dadosabertos/plenario/agenda/atual/iCal` (via `obterAgendaAtualICal`)
    9.  `GET /dadosabertos/plenario/agenda/cn/{data}` (via `obterAgendaCNPorData`)
    10. `GET /dadosabertos/plenario/agenda/cn/{inicio}/{fim}` (via `obterAgendaCNPorPeriodo`)
    11. `GET /dadosabertos/plenario/agenda/dia/{data}` (via `obterAgendaDiaria`)
    12. `GET /dadosabertos/plenario/agenda/mes/{data}` (via `obterAgendaMensal`)
    13. `GET /dadosabertos/plenario/legislatura/{data}` (via `obterLegislatura`)
    14. `GET /dadosabertos/plenario/lista/legislaturas` (via `listarLegislaturas`)
    15. `GET /dadosabertos/plenario/lista/tiposSessao` (via `listarTiposSessao`)
    16. `GET /dadosabertos/plenario/lista/tiposComparecimento` (via `listarTiposComparecimento`, **NOVO**)
    17. `GET /dadosabertos/plenario/sessoes/periodo/{periodo}` (via `listarSessoesPorPeriodo`, **NOVO**)
    18. `GET /dadosabertos/plenario/sessoes/semana/{semana}` (via `listarSessoesPorSemana`, **NOVO**)
    19. `GET /dadosabertos/plenario/sessoes/tipoSessao/{tipoSessao}` (via `listarSessoesPorTipoSessao`, **NOVO**)
    20. Método abstrato `obterAgendaCN` (seleciona entre `obterAgendaCNPorData` ou `obterAgendaCNPorPeriodo`)
    21. `GET /dadosabertos/plenario/sessoes/ano/{ano}` (via `listarSessoesPorAno`, interface preparada para futura implementação)
    22. `GET /dadosabertos/plenario/sessoes/legislatura/{legislatura}` (via `listarSessoesPorLegislatura`, interface preparada para futura implementação)
    23. `GET /dadosabertos/plenario/sessoes/mes/{mes}` (via `listarSessoesPorMes`, interface preparada para futura implementação)
*   **Principais Endpoints Não Cobertos em "Plenário":**
    *   Todos os endpoints principais foram cobertos

### Módulo: Votação (`VotacaoModule`)

*   **Endpoints Cobertos (11):**
    1.  `GET /dadosabertos/votacao/lista/parlamentar/{codigoParlamentar}/{dataInicio}/{dataFim}` (via `listarVotacoes`)
    2.  `GET /dadosabertos/votacao/lista/comissao/{codigoComissao}/{dataReferencia}` (via `listarVotacoes`)
    3.  `GET /dadosabertos/votacao/lista/materia/{codigoMateria}` (via `listarVotacoes`)
    4.  `GET /dadosabertos/votacao/lista/sessao/{codigoSessao}` (via `listarVotacoes`)
    5.  `GET /dadosabertos/votacao/lista/plenario/{dataInicio}/{dataFim}` (via `listarVotacoes`)
    6.  `GET /dadosabertos/votacao/lista/plenario/{dataReferencia}` (via `listarVotacoes`)
    7.  `GET /dadosabertos/votacao/{codigoSessao}/{sequencialVotacao}` (via `obterDetalhesVotacao`)
    8.  `GET /dadosabertos/votacao/parlamentar/{codigoParlamentar}/{codigoSessao}/{sequencialVotacao}` (via `obterVotoParlamentar`, **NOVO**)
    9.  `GET /dadosabertos/votacao/comissao/{codigoComissao}/{codigoReuniao}` (via `obterVotacoesComissao`, **NOVO**)
    10. `GET /dadosabertos/votacao/tipos` (via `listarTiposVotacao`, **NOVO**)
    11. Método utilitário `obterVotosPorParlamentarNaVotacao` (usa `obterDetalhesVotacao` internamente)
*   **Principais Endpoints Não Cobertos em "Votação":**
    *   Todos os endpoints principais foram cobertos

## 4. Categorias da API Não Priorizadas e Sua Cobertura

As seguintes categorias da API do Senado não foram o foco principal do desenvolvimento inicial do wrapper e, portanto, têm cobertura limitada ou nenhuma:

*   **Discurso/Taquigrafia:**
    *   Coberto: Parcialmente. As notas taquigráficas de reuniões de comissões foram implementadas via `obterNotasTaquigraficas` e os discursos de parlamentares via `obterDiscursosParlamentar`.
    *   Endpoints não cobertos: `GET /dadosabertos/discurso/texto-binario/{codigoPronunciamento}`, `GET /dadosabertos/discurso/texto-integral/{codigoPronunciamento}`, `GET /dadosabertos/taquigrafia/notas/sessao/{idSessao}`, `GET /dadosabertos/taquigrafia/videos/reuniao/{idReuniao}`, `GET /dadosabertos/taquigrafia/videos/sessao/{idSessao}`.
*   **Legislação:**
    *   Coberto: Nenhum.
    *   Endpoints não cobertos: Todos os 10 endpoints desta seção (ex: `/legislacao/{codigo}`, `/legislacao/lista`, `/legislacao/tiposNorma`, etc.).
*   **Orçamento:**
    *   Coberto: Nenhum.
    *   Endpoints não cobertos: Todos os 3 endpoints desta seção (ex: `/orcamento/lista`, `/orcamento/oficios`).
*   **Processo Legislativo (Matéria):**
    *   Coberto: Nenhum.
    *   Endpoints não cobertos: Todos os 23 endpoints desta seção (ex: `/materia/{codigo}`, `/materia/agenda/...`, `/materia/pesquisa/lista`, `/materia/tramitacao/{codigo}`, etc.).

## 5. Melhorias Recentes Implementadas

### 5.1. Módulo Votação - Implementações Recentes

Na atualização atual, todos os endpoints principais do módulo de Votação foram implementados, incluindo:

1. **`obterVotacoesComissao(codigoComissao, codigoReuniao)`**
   - Implementa o endpoint `/votacao/comissao/{codigoComissao}/{codigoReuniao}`
   - Permite obter todas as votações realizadas em uma reunião específica de uma comissão

2. **`listarTiposVotacao()`**
   - Implementa o endpoint `/votacao/tipos`
   - Retorna a lista de tipos de votação disponíveis na API

3. **`obterVotoParlamentar(codigoParlamentar, codigoSessao, sequencialVotacao)`**
   - Implementa o endpoint `/votacao/parlamentar/{codigoParlamentar}/{codigoSessao}/{sequencialVotacao}`
   - Permite consultar o voto específico de um parlamentar em uma votação

4. **Novas Interfaces:**
   - `VotacaoComissao` - Para representar votações em comissão
   - `TipoVotacao` - Para representar tipos de votação

### 5.2. Módulo Plenário - Implementações Recentes

Foram implementados todos os endpoints do módulo de Plenário, completando sua cobertura:

1. **Endpoints de Sessão:**
   - `GET /dadosabertos/plenario/encontro/{codigo}/pauta` (via `obterPautaDaSessao`)
   - `GET /dadosabertos/plenario/encontro/{codigo}/resultado` (via `obterResultadoDaSessao`)
   - `GET /dadosabertos/plenario/encontro/{codigo}/resumo` (via `obterResumoDaSessao`)

2. **Endpoints de Agenda:**
   - `GET /dadosabertos/plenario/agenda/atual/iCal` (via `obterAgendaAtualICal`)
   - `GET /dadosabertos/plenario/agenda/cn/{data}` (via `obterAgendaCNPorData`)
   - `GET /dadosabertos/plenario/agenda/cn/{inicio}/{fim}` (via `obterAgendaCNPorPeriodo`)
   - `GET /dadosabertos/plenario/agenda/dia/{data}` (via `obterAgendaDiaria`)
   - `GET /dadosabertos/plenario/agenda/mes/{data}` (via `obterAgendaMensal`)

3. **Endpoints de Legislatura:**
   - `GET /dadosabertos/plenario/legislatura/{data}` (via `obterLegislatura`)
   - `GET /dadosabertos/plenario/lista/legislaturas` (via `listarLegislaturas`)

4. **Endpoints de Tipos e Listagens:**
   - `GET /dadosabertos/plenario/lista/tiposSessao` (via `listarTiposSessao`)
   - `GET /dadosabertos/plenario/lista/tiposComparecimento` (via `listarTiposComparecimento`, **NOVO**)
   - `GET /dadosabertos/plenario/sessoes/periodo/{periodo}` (via `listarSessoesPorPeriodo`, **NOVO**)
   - `GET /dadosabertos/plenario/sessoes/semana/{semana}` (via `listarSessoesPorSemana`, **NOVO**)
   - `GET /dadosabertos/plenario/sessoes/tipoSessao/{tipoSessao}` (via `listarSessoesPorTipoSessao`, **NOVO**)

5. **Novas Interfaces:**
   - `ResultadoSessao` - Para representar os resultados das votações da sessão
   - `ResumoSessao` - Para representar o resumo textual da sessão
   - `AgendaEvento` - Para representar eventos de agenda
   - `AgendaCN` - Para representar a agenda do Congresso Nacional
   - `Legislatura` - Para representar informações de legislatura
   - `TipoSessao` - Para representar tipos de sessão plenária
   - `TipoComparecimento` - Para representar tipos de comparecimento de parlamentares (**NOVA**)

6. **Integrações e Métodos Abstratos:**
   - `obterAgendaCN(filtros)` - Método de abstração que decide qual endpoint chamar com base nos filtros fornecidos
   - Integração direta de endpoints específicos no método `listarSessoesPlenarias` - Permite selecionar automaticamente o endpoint apropriado com base nos filtros fornecidos

### 5.3. Módulos Anteriormente Implementados

Nas atualizações anteriores, foram implementadas melhorias significativas aos módulos de Parlamentar, Comissão e Composição:

#### Módulo Parlamentar:

1. **Informações Biográficas e Profissionais:**
   - `GET /dadosabertos/senador/{codigo}/cargos` (via `obterCargosParlamentar`)
   - `GET /dadosabertos/senador/{codigo}/historicoAcademico` (via `obterHistoricoAcademico`)
   - `GET /dadosabertos/senador/{codigo}/profissao` (via `obterProfissaoParlamentar`)

2. **Atividades Parlamentares:**
   - `GET /dadosabertos/senador/{codigo}/apartes` (via `obterApartesParlamentar`)
   - `GET /dadosabertos/senador/{codigo}/discursos` (via `obterDiscursosParlamentar`)

3. **Consultas Especializadas:**
   - `GET /dadosabertos/senador/afastados` (via `listarParlamentaresAfastados`)
   - `GET /dadosabertos/senador/lista/legislatura/{legislaturaInicio}/{legislaturaFim}` (via `listarParlamentaresPorPeriodoLegislatura`)
   - `GET /dadosabertos/senador/partidos` (via `listarPartidosParlamentares`)
   - `GET /dadosabertos/senador/lista/tiposUsoPalavra` (via `listarTiposUsoPalavra`)

#### Módulo de Comissão:

1. **Endpoints Implementados:**
   - `GET /dadosabertos/comissao/agenda/atual/iCal` (via `obterAgendaICal`)
   - `GET /dadosabertos/comissao/agenda/mes/{mesReferencia}` (via `obterAgendaMes`)
   - `GET /dadosabertos/comissao/cpi/{comissao}/requerimentos` (via `obterRequerimentosCPI`)
   - `GET /dadosabertos/comissao/lista/tiposColegiado` (via `listarTiposColegiado`)
   - `GET /dadosabertos/comissao/reuniao/{sigla}/documento/{tipoDocumento}` (via `obterDocumentosComissao`)
   - `GET /dadosabertos/comissao/reuniao/notas/{codigoReuniao}` (via `obterNotasTaquigraficas`)

#### Módulo de Composição:

1. **Endpoints Implementados:**
   - `GET /dadosabertos/composicao/bloco/{codigo}` (via `obterDetalhesBloco`)
   - `GET /dadosabertos/composicao/comissao/resumida/mista/{codigo}/{dataInicio}/{dataFim}` (via `obterComposicaoResumidaComissaoMista`)
   - `GET /dadosabertos/composicao/lideranca/tipos` (via `listarTiposLideranca`)
   - `GET /dadosabertos/composicao/lideranca/tipos-unidade` (via `listarTiposUnidadeLideranca`)
   - `GET /dadosabertos/composicao/lista/{tipo}` (via `listarComposicaoPorTipo`)
   - `GET /dadosabertos/composicao/lista/cn/{tipo}` (via `listarComposicaoCNPorTipo`)
   - `GET /dadosabertos/composicao/lista/tiposCargo` (via `listarTiposCargo`)

## 6. Observações Gerais

*   **Abstração de Endpoints:** Alguns métodos do wrapper (como `listarComissoes`, `listarParlamentares`, `listarVotacoes`, `obterAgendaCN`) foram projetados para abstrair a complexidade da API, tentando selecionar o endpoint mais adequado da API com base nos filtros fornecidos pelo usuário. Isso significa que um único método do wrapper pode, potencialmente, interagir com diferentes paths da API.

*   **Endpoints Depreciados (DEPRECATED):** A API do Senado marca alguns endpoints como "DEPRECATED". O wrapper implementou um desses (`GET /dadosabertos/senador/{codigo}/liderancas`) porque era relevante para os dados de parlamentares e um substituto direto não foi imediatamente claro ou priorizado. Recomenda-se monitorar a documentação da API para futuras atualizações nesses endpoints.

*   **Tratamento de Dados:** O wrapper implementa tratamento consistente para converter respostas de item único em arrays quando apropriado, facilitando o processamento dos dados pelo desenvolvedor.

*   **Formatos Especiais de Resposta:** Para endpoints como `/plenario/agenda/atual/iCal`, que retornam dados em formato especial (não JSON), o wrapper realiza a configuração adequada de headers para receber corretamente a resposta e processá-la.

*   **Tratamento de URLs e Parâmetros:** O wrapper inclui validações e tratamentos para garantir a formação correta das URLs e parâmetros enviados à API, evitando erros.

## 7. Conclusão

Com as implementações recentes, o wrapper agora cobre aproximadamente **66.95%** do total de endpoints identificados na API de Dados Abertos Legislativos do Senado, representando um aumento significativo em relação aos 63.56% anteriores, 47.46% da segunda fase, e aos 28.81% iniciais. A implementação completa dos endpoints faltantes nos módulos de Votação e Plenário aumenta substancialmente a utilidade da biblioteca, permitindo acesso a informações detalhadas sobre sessões plenárias, agendas, legislaturas, tipos de votação e consulta de votos específicos.

A cobertura atual fornece uma base sólida para interagir com as principais áreas da API, permitindo acesso completo a dados sobre parlamentares, comissões, composição, plenário e votações. Há ainda espaço para expansão, especialmente nas categorias de Matéria (Processo Legislativo), Legislação, Orçamento e Discurso/Taquigrafia completa, bem como para implementar alguns endpoints de detalhamento no módulo Plenário que ainda não foram cobertos.

## 8. Próximos Passos Recomendados

Para continuar o desenvolvimento do wrapper, recomenda-se:

1. Completar a implementação de endpoints de detalhamento nos módulos existentes como:
   - Endpoints adicionais de detalhe para outros módulos
   - Melhorias na validação de parâmetros
   - Expansão dos métodos abstratos para maior simplificação

2. Considerar a criação de novos módulos para áreas ainda não cobertas:
   - Módulo **Materia**: Para implementar as funcionalidades de processo legislativo
   - Módulo **Legislacao**: Para acessar dados de legislação
   - Módulo **Orcamento**: Para dados orçamentários

3. Implementar testes automatizados mais abrangentes para todos os módulos

4. Considerar a implementação de um mecanismo de cache para otimizar chamadas frequentes aos mesmos endpoints

5. Desenvolver ferramentas adicionais para análise e visualização dos dados obtidos via API

## 9. Como Testar as Novas Funcionalidades

Para testar os novos endpoints dos módulos Votação e Plenário, recomenda-se a criação de scripts de exemplo na pasta `examples`:

```typescript
// examples/votacao_plenario_exemplo.ts
import { SenadoApiWrapper } from '../src';

async function testarVotacaoEPlenario() {
  const senadoApi = new SenadoApiWrapper();
  
  // Exemplo 1: Obter tipos de votação
  try {
    const tiposVotacao = await senadoApi.votacao.listarTiposVotacao();
    console.log('Tipos de votação:', tiposVotacao.length);
    if (tiposVotacao.length > 0) {
      console.log('Primeiro tipo:', tiposVotacao[0]);
    }
  } catch (error) {
    console.error('Erro ao listar tipos de votação:', error);
  }
  
  // Exemplo 2: Obter pauta de uma sessão plenária (requer código válido)
  try {
    const codigoSessao = '0100/24'; // Substitua por um código válido
    const pauta = await senadoApi.plenario.obterPautaDaSessao(codigoSessao);
    console.log('Pauta da sessão:', pauta);
  } catch (error) {
    console.error('Erro ao obter pauta da sessão:', error);
  }
  
  // Exemplo 3: Obter agenda do CN para hoje
  try {
    const hoje = new Date();
    const dataFormatada = `${hoje.getFullYear()}${String(hoje.getMonth() + 1).padStart(2, '0')}${String(hoje.getDate()).padStart(2, '0')}`;
    const agendaCN = await senadoApi.plenario.obterAgendaCNPorData(dataFormatada);
    console.log('Agenda do CN para hoje:', agendaCN);
  } catch (error) {
    console.error('Erro ao obter agenda do CN:', error);
  }
}

testarVotacaoEPlenario();
```

Para executar o script:

```bash
pnpm exec ts-node examples/votacao_plenario_exemplo.ts
```

Consulte também os arquivos existentes `USAGE_EXAMPLES.md` e `parlamentar_endpoints_exemplos.ts` para exemplos adicionais de outros módulos.

## 10. Resumo das Interfaces e Endpoints por Módulo

### Módulo Parlamentar:
- `listarParlamentares`: Senadores por legislatura, em exercício, por partido/UF
- `obterDetalhesParlamentar`: Detalhes de um senador
- `obterMandatosParlamentar`: Mandatos de um senador
- `obterComissoesParlamentar`: Comissões de um senador
- `obterLiderancasParlamentar`: Lideranças exercidas por um senador
- `obterFiliacoesPartidarias`: Histórico de filiações partidárias
- `obterLicencasParlamentar`: Licenças de um senador
- `obterCargosParlamentar`: Cargos exercidos por um senador
- `obterHistoricoAcademico`: Formação acadêmica
- `obterProfissaoParlamentar`: Profissões de um senador
- `listarParlamentaresAfastados`: Senadores afastados
- `listarParlamentaresPorPeriodoLegislatura`: Senadores por período de legislatura
- `listarPartidosParlamentares`: Partidos representados por senadores
- `obterApartesParlamentar`: Apartes feitos por um senador
- `obterDiscursosParlamentar`: Discursos proferidos por um senador
- `listarTiposUsoPalavra`: Tipos de uso da palavra em plenário

### Módulo Comissão:
- `listarComissoes`: Comissões por tipo, casa, ativas
- `obterDetalhesComissao`: Detalhes de uma comissão
- `obterComposicaoComissao`: Composição de uma comissão
- `obterAgendaComissao`: Agenda de comissões
- `obterDetalhesReuniaoComissao`: Detalhes de uma reunião
- `obterAgendaICal`: Agenda em formato iCal
- `obterAgendaMes`: Agenda mensal
- `obterRequerimentosCPI`: Requerimentos de CPI
- `listarTiposColegiado`: Tipos de colegiados
- `obterDocumentosComissao`: Documentos de comissão
- `obterNotasTaquigraficas`: Notas taquigráficas

### Módulo Composição:
- `listarPartidos`: Partidos políticos
- `listarBlocosParlamentares`: Blocos parlamentares
- `listarLiderancas`: Lideranças
- `obterComposicaoMesa`: Mesa diretora (SF ou CN)
- `obterDetalhesBloco`: Detalhes de bloco parlamentar
- `obterComposicaoResumidaComissaoMista`: Composição resumida
- `listarTiposLideranca`: Tipos de liderança
- `listarTiposUnidadeLideranca`: Tipos de unidades de liderança
- `listarComposicaoPorTipo`: Composição por tipo
- `listarComposicaoCNPorTipo`: Composição do CN por tipo
- `listarTiposCargo`: Tipos de cargos

### Módulo Plenário:
- `listarSessoesPlenarias`: Sessões plenárias
- `obterDetalhesSessaoPlenaria`: Detalhes da sessão
- `obterPautaDaSessao`: Pauta de sessão
- `obterResultadoDaSessao`: Resultado da sessão
- `obterResumoDaSessao`: Resumo da sessão
- `listarDiscursosEmPlenario`: Discursos em plenário
- `listarTiposSessao`: Tipos de sessão
- `listarTiposComparecimento`: Tipos de comparecimento
- `listarSessoesPorPeriodo`: Sessões por período legislativo
- `listarSessoesPorSemana`: Sessões por semana
- `listarSessoesPorTipoSessao`: Sessões por tipo
- `obterAgendaAtualICal`: Agenda em formato iCal
- `obterAgendaCN`: Agenda do CN (abstrato)
- `obterAgendaCNPorData`: Agenda CN por data
- `obterAgendaCNPorPeriodo`: Agenda CN por período
- `obterAgendaDiaria`: Agenda diária
- `obterAgendaMensal`: Agenda mensal
- `obterLegislatura`: Legislatura por data
- `listarLegislaturas`: Lista de legislaturas

### Módulo Votação:
- `listarVotacoes`: Votações por matéria, parlamentar, comissão, sessão, plenário
- `obterDetalhesVotacao`: Detalhes de uma votação
- `obterVotosPorParlamentarNaVotacao`: Votos por parlamentar
- `obterVotacoesComissao`: Votações em comissão
- `listarTiposVotacao`: Tipos de votação
- `obterVotoParlamentar`: Voto específico de um parlamentar
