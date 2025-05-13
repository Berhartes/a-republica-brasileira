# Lista Completa de Endpoints da API de Dados Abertos do Senado Federal (Legislativos)

Esta lista foi compilada a partir da documentação Swagger UI da API em [https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html#](https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html#) em 07 de Maio de 2025.

## Comissão

*   GET /dadosabertos/comissao/{codigo}
*   GET /dadosabertos/comissao/{comissao}/documentos (DEPRECATED)
*   GET /dadosabertos/comissao/agenda/{dataInicio}/{dataFim}
*   GET /dadosabertos/comissao/agenda/{dataReferencia}
*   GET /dadosabertos/comissao/agenda/atual/iCal
*   GET /dadosabertos/comissao/agenda/mes/{mesReferencia}
*   GET /dadosabertos/comissao/cpi/{comissao}/requerimentos
*   GET /dadosabertos/comissao/lista/{tipo}
*   GET /dadosabertos/comissao/lista/colegiados
*   GET /dadosabertos/comissao/lista/mistas
*   GET /dadosabertos/comissao/lista/tiposColegiado
*   GET /dadosabertos/comissao/reuniao/{codigoReuniao}
*   GET /dadosabertos/comissao/reuniao/{sigla}/documento/{tipoDocumento}
*   GET /dadosabertos/comissao/reuniao/notas/{codigoReuniao}

## Composição

*   GET /dadosabertos/composicao/bloco/{codigo}
*   GET /dadosabertos/composicao/comissao/{codigo}
*   GET /dadosabertos/composicao/comissao/atual/mista/{codigo}
*   GET /dadosabertos/composicao/comissao/resumida/mista/{codigo}/{dataInicio}/{dataFim}
*   GET /dadosabertos/composicao/lideranca
*   GET /dadosabertos/composicao/lideranca/tipos
*   GET /dadosabertos/composicao/lideranca/tipos-unidade
*   GET /dadosabertos/composicao/lista/{tipo}
*   GET /dadosabertos/composicao/lista/blocos
*   GET /dadosabertos/composicao/lista/cn/{tipo}
*   GET /dadosabertos/composicao/lista/liderancaCN (DEPRECATED)
*   GET /dadosabertos/composicao/lista/liderancaSF (DEPRECATED)
*   GET /dadosabertos/composicao/lista/partidos
*   GET /dadosabertos/composicao/lista/tiposCargo
*   GET /dadosabertos/composicao/mesaCN
*   GET /dadosabertos/composicao/mesaSF

## Discurso (Conforme agrupado na Swagger UI, pode incluir endpoints de outras categorias)

*   GET /dadosabertos/discurso/texto-binario/{codigoPronunciamento}
*   GET /dadosabertos/discurso/texto-integral/{codigoPronunciamento}
*   GET /dadosabertos/taquigrafia/notas/reuniao/{idReuniao}
*   GET /dadosabertos/taquigrafia/notas/sessao/{idSessao}
*   GET /dadosabertos/taquigrafia/videos/reuniao/{idReuniao}
*   GET /dadosabertos/taquigrafia/videos/sessao/{idSessao}
*   *Nota: A seção "Discurso" na Swagger UI também lista endpoints que são funcionalmente de "Comissão", "Plenário" e "Parlamentar". Estes estão listados em suas respectivas categorias para evitar duplicidade e para melhor organização.* 
    *   `/dadosabertos/comissao/reuniao/notas/{codigoReuniao}` (Listado em Comissão)
    *   `/dadosabertos/plenario/lista/discursos/{dataInicio}/{dataFim}` (Listado em Plenário)
    *   `/dadosabertos/senador/{codigo}/apartes` (Listado em Parlamentar)
    *   `/dadosabertos/senador/{codigo}/discursos` (Listado em Parlamentar)
    *   `/dadosabertos/senador/lista/tiposUsoPalavra` (Listado em Parlamentar)

## Legislação

*   GET /dadosabertos/legislacao/{codigo}
*   GET /dadosabertos/legislacao/{tipo}/{numdata}/{anoseq}
*   GET /dadosabertos/legislacao/classes
*   GET /dadosabertos/legislacao/lista
*   GET /dadosabertos/legislacao/termos
*   GET /dadosabertos/legislacao/tiposdeclaracao/detalhe
*   GET /dadosabertos/legislacao/tiposNorma
*   GET /dadosabertos/legislacao/tiposPublicacao
*   GET /dadosabertos/legislacao/tiposVide
*   GET /dadosabertos/legislacao/urn

## Orçamento

*   GET /dadosabertos/orcamento/lista
*   GET /dadosabertos/orcamento/oficios
*   GET /dadosabertos/orcamento/oficios/{numeroSedol}

## Parlamentar

*   GET /dadosabertos/senador/{codigo}
*   GET /dadosabertos/senador/{codigo}/autorias (DEPRECATED)
*   GET /dadosabertos/senador/{codigo}/cargos
*   GET /dadosabertos/senador/{codigo}/comissoes
*   GET /dadosabertos/senador/{codigo}/filiacoes
*   GET /dadosabertos/senador/{codigo}/historicoAcademico
*   GET /dadosabertos/senador/{codigo}/licencas
*   GET /dadosabertos/senador/{codigo}/liderancas (DEPRECATED)
*   GET /dadosabertos/senador/{codigo}/mandatos
*   GET /dadosabertos/senador/{codigo}/profissao
*   GET /dadosabertos/senador/{codigo}/relatorias (DEPRECATED)
*   GET /dadosabertos/senador/afastados
*   GET /dadosabertos/senador/lista/atual
*   GET /dadosabertos/senador/lista/legislatura/{legislatura}
*   GET /dadosabertos/senador/lista/legislatura/{legislaturaInicio}/{legislaturaFim}
*   GET /dadosabertos/senador/partidos
*   GET /dadosabertos/senador/{codigo}/apartes
*   GET /dadosabertos/senador/{codigo}/discursos
*   GET /dadosabertos/senador/lista/tiposUsoPalavra

## Plenário

*   GET /dadosabertos/plenario/agenda/atual/iCal
*   GET /dadosabertos/plenario/agenda/cn/{data}
*   GET /dadosabertos/plenario/agenda/cn/{inicio}/{fim}
*   GET /dadosabertos/plenario/agenda/dia/{data}
*   GET /dadosabertos/plenario/agenda/mes/{data}
*   GET /dadosabertos/plenario/encontro/{codigo}
*   GET /dadosabertos/plenario/encontro/{codigo}/pauta
*   GET /dadosabertos/plenario/encontro/{codigo}/resultado
*   GET /dadosabertos/plenario/encontro/{codigo}/resumo
*   GET /dadosabertos/plenario/legislatura/{data}
*   GET /dadosabertos/plenario/lista/discursos/{dataInicio}/{dataFim}
*   GET /dadosabertos/plenario/lista/legislaturas
*   GET /dadosabertos/plenario/lista/tiposComparecimento
*   GET /dadosabertos/plenario/lista/tiposSessao
*   GET /dadosabertos/plenario/sessoes/{dataInicio}/{dataFim}
*   GET /dadosabertos/plenario/sessoes/ano/{ano}
*   GET /dadosabertos/plenario/sessoes/legislatura/{legislatura}
*   GET /dadosabertos/plenario/sessoes/mes/{mes}
*   GET /dadosabertos/plenario/sessoes/periodo/{periodo}
*   GET /dadosabertos/plenario/sessoes/semana/{semana}
*   GET /dadosabertos/plenario/sessoes/tipoSessao/{tipoSessao}

## Processo Legislativo (Matéria)

*   GET /dadosabertos/materia/{codigo}
*   GET /dadosabertos/materia/agenda/{dataInicio}/{dataFim}
*   GET /dadosabertos/materia/agenda/dia/{data}
*   GET /dadosabertos/materia/agenda/mes/{mes}
*   GET /dadosabertos/materia/agenda/semana/{semana}
*   GET /dadosabertos/materia/assunto/{codigo}
*   GET /dadosabertos/materia/assuntos
*   GET /dadosabertos/materia/autoria/{codigo}
*   GET /dadosabertos/materia/documento/{codigo}
*   GET /dadosabertos/materia/emenda/{codigo}
*   GET /dadosabertos/materia/local/{codigo}
*   GET /dadosabertos/materia/local/atual/{codigo}
*   GET /dadosabertos/materia/natureza/{codigo}
*   GET /dadosabertos/materia/pesquisa/lista
*   GET /dadosabertos/materia/relatoria/{codigo}
*   GET /dadosabertos/materia/situacao/{codigo}
*   GET /dadosabertos/materia/situacao/atual/{codigo}
*   GET /dadosabertos/materia/texto/{codigo}
*   GET /dadosabertos/materia/tipos
*   GET /dadosabertos/materia/tramitacao/{codigo}
*   GET /dadosabertos/materia/tramitacao/atual/{codigo}
*   GET /dadosabertos/materia/urn/{urn}
*   GET /dadosabertos/materia/veto/{codigo}

## Votação

*   GET /dadosabertos/votacao/{codigoSessao}/{sequencialVotacao}
*   GET /dadosabertos/votacao/comissao/{codigoComissao}/{codigoReuniao}
*   GET /dadosabertos/votacao/lista/parlamentar/{codigoParlamentar}
*   GET /dadosabertos/votacao/lista/sessao/{codigoSessao}
*   GET /dadosabertos/votacao/materia/{codigoMateria}
*   GET /dadosabertos/votacao/tipos

