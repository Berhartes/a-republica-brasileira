#!/usr/bin/env node
/**
 * MCP Server generated from OpenAPI spec for dados-abertos-legislativos-do-senado-federal-e-congresso-nacional v4.0.3.15
 * Generated on: 2025-05-22T17:47:34.555Z
 */

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
  type CallToolResult,
  type CallToolRequest
} from "@modelcontextprotocol/sdk/types.js";
import { setupWebServer } from "./web-server.js";

import { z, ZodError } from 'zod';
import { jsonSchemaToZod } from 'json-schema-to-zod';
import axios, { type AxiosRequestConfig, type AxiosError } from 'axios';

/**
 * Type definition for JSON objects
 */
type JsonObject = Record<string, any>;

/**
 * Interface for MCP Tool Definition
 */
interface McpToolDefinition {
    name: string;
    description: string;
    inputSchema: any;
    method: string;
    pathTemplate: string;
    executionParameters: { name: string, in: string }[];
    requestBodyContentType?: string;
    securityRequirements: any[];
}

/**
 * Server configuration
 */
export const SERVER_NAME = "dados-abertos-legislativos-do-senado-federal-e-congresso-nacional";
export const SERVER_VERSION = "4.0.3.15";
export const API_BASE_URL = "https://legis.senado.leg.br";

/**
 * MCP Server instance
 */
const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { tools: {} } }
);

/**
 * Map of tool definitions by name
 */
const toolDefinitionMap: Map<string, McpToolDefinition> = new Map([

  ["votacaoporparlamentar", {
    name: "votacaoporparlamentar",
    description: `Votações nas Comissões por Parlamentar`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int32","description":"Código do Parlamentar"},"comissao":{"type":"string","description":"Sigla da Comissão"},"dataInicio":{"type":"string","description":"Data de início para pesquisa no formato AAAAMMDD"},"dataFim":{"type":"string","description":"Data de fim para pesquisa no formato AAAAMMDD"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/votacaoComissao/parlamentar/{codigo}",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"comissao","in":"query"},{"name":"dataInicio","in":"query"},{"name":"dataFim","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["votacaoporproposicao", {
    name: "votacaoporproposicao",
    description: `Votações de Matérias nas Comissões por Identificação da Matéria`,
    inputSchema: {"type":"object","properties":{"sigla":{"type":"string","description":"Sigla do Tipo da Proposição"},"numero":{"type":"string","description":"Número da Proposição"},"ano":{"type":"number","format":"int32","description":"Ano da Proposição"},"comissao":{"type":"string","description":"Sigla da Comissão"},"dataInicio":{"type":"string","description":"Data de início para pesquisa no formato AAAAMMDD"},"dataFim":{"type":"string","description":"Data de fim para pesquisa no formato AAAAMMDD"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}},"required":["sigla","numero","ano"]},
    method: "get",
    pathTemplate: "/dadosabertos/votacaoComissao/materia/{sigla}/{numero}/{ano}",
    executionParameters: [{"name":"sigla","in":"path"},{"name":"numero","in":"path"},{"name":"ano","in":"path"},{"name":"comissao","in":"query"},{"name":"dataInicio","in":"query"},{"name":"dataFim","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["votacaoporcomissao", {
    name: "votacaoporcomissao",
    description: `Votações de Matérias nas Comissões do Senado Federal e Congresso Nacional`,
    inputSchema: {"type":"object","properties":{"siglaComissao":{"type":"string","description":"Sigla da Comissão"},"dataInicio":{"type":"string","description":"Data de início para pesquisa no formato AAAAMMDD"},"dataFim":{"type":"string","description":"Data de fim para pesquisa no formato AAAAMMDD"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}},"required":["siglaComissao"]},
    method: "get",
    pathTemplate: "/dadosabertos/votacaoComissao/comissao/{siglaComissao}",
    executionParameters: [{"name":"siglaComissao","in":"path"},{"name":"dataInicio","in":"query"},{"name":"dataFim","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["votacoes", {
    name: "votacoes",
    description: `Permite filtrar pela Sessão, Proposição, Parlamentar e Voto.
É obrigatório informar pelo menos um dos seguintes parâmetros:
 * codigoSessao
 * idProcesso
 * codigoMateria
 * numero
 * ano
 * codigoParlamentar
 * dataInicio + dataFim (intervalo deve ser de até 1 ano no máximo se nenhum outro parâmetro
   obrigatório for informado)

Caso nenhum desses parâmetros for informado, retornará somente as votações dos últimos 12
meses (dataFim=HOJE).
`,
    inputSchema: {"type":"object","properties":{"codigoSessao":{"type":"number","format":"int64","description":"Código da sessão da votação"},"dataInicio":{"type":"string","format":"date","description":"Votações realizadas a partir desta data, no formato AAAA-MM-DD"},"dataFim":{"type":"string","format":"date","description":"Votações realizadas até esta data, no formato AAAA-MM-DD"},"idProcesso":{"type":"number","format":"int64","description":"ID do processo votado"},"codigoMateria":{"type":"number","format":"int64","description":"Código legado da matéria do MATE"},"sigla":{"type":"string","description":"Sigla da proposição"},"numero":{"type":"string","description":"Número da proposição"},"ano":{"type":"number","format":"int32","description":"Ano da proposição"},"codigoParlamentar":{"type":"number","format":"int64","description":"Código do parlamentar votante"},"nomeParlamentar":{"type":"string","description":"Nome do parlamentar votante"},"siglaVotoParlamentar":{"type":"string","description":"Sigla do voto"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}}},
    method: "get",
    pathTemplate: "/dadosabertos/votacao",
    executionParameters: [{"name":"codigoSessao","in":"query"},{"name":"dataInicio","in":"query"},{"name":"dataFim","in":"query"},{"name":"idProcesso","in":"query"},{"name":"codigoMateria","in":"query"},{"name":"sigla","in":"query"},{"name":"numero","in":"query"},{"name":"ano","in":"query"},{"name":"codigoParlamentar","in":"query"},{"name":"nomeParlamentar","in":"query"},{"name":"siglaVotoParlamentar","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["videossessao", {
    name: "videossessao",
    description: `Recupera as falas dos Parlamentares ao longo da Sessão Plenária, associadas aos trechos de vídeos que ocorreram.`,
    inputSchema: {"type":"object","properties":{"idSessao":{"type":"number","format":"int64","description":"Código do Encontro Legislativo (Sessão Plenária)"},"v":{"type":"number","format":"int32","default":1,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["idSessao"]},
    method: "get",
    pathTemplate: "/dadosabertos/taquigrafia/videos/sessao/{idSessao}",
    executionParameters: [{"name":"idSessao","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["videosreuniao", {
    name: "videosreuniao",
    description: `Recupera as falas dos Parlamentares ao longo da Reunião, associadas aos trechos de vídeos que ocorreram.`,
    inputSchema: {"type":"object","properties":{"idReuniao":{"type":"number","format":"int64","description":"Código do Encontro Legislativo (Reunião de Colegiado)"},"v":{"type":"number","format":"int32","default":1,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["idReuniao"]},
    method: "get",
    pathTemplate: "/dadosabertos/taquigrafia/videos/reuniao/{idReuniao}",
    executionParameters: [{"name":"idReuniao","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["notassessao", {
    name: "notassessao",
    description: `Recupera os dados estruturados das Notas Taquigráficas da Sessão Plenária informada no parâmetro.`,
    inputSchema: {"type":"object","properties":{"idSessao":{"type":"number","format":"int64","description":"Código do Encontro Legislativo (Sessão Plenária)"},"v":{"type":"number","format":"int32","default":1,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["idSessao"]},
    method: "get",
    pathTemplate: "/dadosabertos/taquigrafia/notas/sessao/{idSessao}",
    executionParameters: [{"name":"idSessao","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["notasreuniao", {
    name: "notasreuniao",
    description: `Recupera os dados estruturados das Notas Taquigráficas da Reunião de Comissão ou Colegiado informada no parâmetro.`,
    inputSchema: {"type":"object","properties":{"idReuniao":{"type":"number","format":"int64","description":"Código do Encontro Legislativo (Reunião de Colegiado)"},"v":{"type":"number","format":"int32","default":1,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["idReuniao"]},
    method: "get",
    pathTemplate: "/dadosabertos/taquigrafia/notas/reuniao/{idReuniao}",
    executionParameters: [{"name":"idReuniao","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["detalhessenador", {
    name: "detalhessenador",
    description: `Obtém informações de um Senador`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código do Senador"},"v":{"type":"number","format":"int32","default":6,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/senador/{codigo}",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["votacaosenador", {
    name: "votacaosenador",
    description: `Substitua pelo serviço de listagem de votos disponível em [/dadosabertos/votacao](#/Votação/votacoes)`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código do Senador"},"sigla":{"type":"string","description":"Filtra votações pela sigla da matéria"},"numero":{"type":"string","description":"Filtra votações pelo número da matéria"},"ano":{"type":"number","format":"int32","description":"Filtra votações pelo ano da matéria"},"tramitando":{"type":"string","description":"Filtra votações de matérias que estão tramitando (S) ou com tramitação encerrada (N)"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/senador/{codigo}/votacoes",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"sigla","in":"query"},{"name":"numero","in":"query"},{"name":"ano","in":"query"},{"name":"tramitando","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["relatoriasenador", {
    name: "relatoriasenador",
    description: `Substitua pelo serviço disponível em [/dadosabertos/processo/relatoria](#/Processo/relatorias)`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código do Senador"},"sigla":{"type":"string","description":"Filtra relatoria pela sigla da matéria"},"numero":{"type":"string","description":"Filtra relatoria pelo número da matéria"},"ano":{"type":"number","format":"int32","description":"Filtra relatoria pelo ano da matéria"},"tramitando":{"type":"string","description":"Filtra relatoria de matérias que estão tramitando (S) ou com tramitação encerrada (N)"},"comissao":{"type":"string","description":"Filtra relatoria na Comissão pela sigla"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/senador/{codigo}/relatorias",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"sigla","in":"query"},{"name":"numero","in":"query"},{"name":"ano","in":"query"},{"name":"tramitando","in":"query"},{"name":"comissao","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["profissaosenador", {
    name: "profissaosenador",
    description: `Obtém as Profissões de um Senador`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código do Senador"},"v":{"type":"number","format":"int32","default":1,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/senador/{codigo}/profissao",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["mandatosenador", {
    name: "mandatosenador",
    description: `Obtém os Mandatos Parlamentares de um Senador`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código do Senador"},"v":{"type":"number","format":"int32","default":5,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/senador/{codigo}/mandatos",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["liderancasenador", {
    name: "liderancasenador",
    description: `Substitua pelo serviço de Lideranças disponível em [/dadosabertos/composicao/lideranca](#/Composição/liderancas)`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código do Senador"},"ativo":{"type":"string","description":"Se 'S' retorna apenas as Lideranças em exercício, se 'N' retorna também as já finalizadas"},"v":{"type":"number","format":"int32","default":5,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/senador/{codigo}/liderancas",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"ativo","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["licencasenador", {
    name: "licencasenador",
    description: `Obtém as Licenças oficiais de um Senador`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código do Senador"},"dataInicio":{"type":"string","description":"Data de início de referência para pesquisa no formato AAAAMMDD."},"dataFim":{"type":"string","description":"Data de término de referência para pesquisa no formato AAAAMMDD. Se não informado considera-se a data atual."},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/senador/{codigo}/licencas",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"dataInicio","in":"query"},{"name":"dataFim","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["historicoacademicosenador", {
    name: "historicoacademicosenador",
    description: `Retorna a relação de Cursos feitos pelo Senador.`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código do Senador"},"v":{"type":"number","format":"int32","default":1,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/senador/{codigo}/historicoAcademico",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["filiacaosenador", {
    name: "filiacaosenador",
    description: `Obtém as Filiações Partidárias de um Senador`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código do Senador"},"v":{"type":"number","format":"int32","default":5,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/senador/{codigo}/filiacoes",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["discursosenador", {
    name: "discursosenador",
    description: `Retorna a relação de Discursos do Senador proferidos no período máximo de 1 ano.
Se não informar o período, serão retornados os discursos dos últimos 30 dias.
`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código do Senador"},"casa":{"type":"string","description":"Sigla da Casa onde ocorre o pronunciamento - SF (Senado Federal), CD (Câmara dos Deputados), CN (Congresso Nacional),\nPR (Presidência), CR (Comissão Representativa do Congresso), AC (Assembléia Constituinte)\n"},"dataInicio":{"type":"string","format":"date","description":"Data de início do período da pesquisa no formato AAAAMMDD.\nSe não for informada, dataFim = data atual - 1 mês\n"},"dataFim":{"type":"string","format":"date","description":"Data de fim do período da pesquisa no formato AAAAMMDD.\nSe não for informada, dataFim = data atual\n"},"numeroSessao":{"type":"number","format":"int64","description":"Número da Sessão Plenária"},"tipoSessao":{"type":"string","description":"Tipo da Sessão Plenária (veja serviço que lista os Tipos de Sessão: /dadosabertos/plenario/tiposSessao)"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/senador/{codigo}/discursos",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"casa","in":"query"},{"name":"dataInicio","in":"query"},{"name":"dataFim","in":"query"},{"name":"numeroSessao","in":"query"},{"name":"tipoSessao","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["comissaosenador", {
    name: "comissaosenador",
    description: `Obtém a relação das Comissões que um Senador é membro`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int32","description":"Código do Senador"},"ativo":{"type":"string","description":"Se 'S' retorna apenas as Comissões atuais, se 'N' retorna apenas as já finalizadas"},"comissao":{"type":"string","description":"Sigla da Comissão - retorna apenas a Comissão informada"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/senador/{codigo}/comissoes",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"ativo","in":"query"},{"name":"comissao","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["cargosenador", {
    name: "cargosenador",
    description: `Obtém a relação de Cargos ocupados por um Senador`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código do Senador"},"ativo":{"type":"string","description":"Exibe apenas cargos ativos 'S' ou exibe os cargos finalizados 'N'"},"comissao":{"type":"string","description":"Sigla da Comissão - retorna apenas os cargos na Comissão informada"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/senador/{codigo}/cargos",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"ativo","in":"query"},{"name":"comissao","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["autoriasenador", {
    name: "autoriasenador",
    description: `Substitua pelo serviço de listagem de processos em [/dadosabertos/processo](#/Processo/processos)`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int32","description":"Código do Senador"},"sigla":{"type":"string","description":"Filtra autoria pela sigla da matéria"},"numero":{"type":"string","description":"Filtra autoria pelo número da matéria"},"ano":{"type":"number","format":"int32","description":"Filtra autoria pelo ano da matéria"},"tramitando":{"type":"string","description":"Filtra autoria de matérias que estão tramitando (S) ou com tramitação encerrada (N)"},"primeiro":{"type":"string","description":"Filtra autorias onde o Senador é o primeiro autor (S) ou que seja coautor (N)"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/senador/{codigo}/autorias",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"sigla","in":"query"},{"name":"numero","in":"query"},{"name":"ano","in":"query"},{"name":"tramitando","in":"query"},{"name":"primeiro","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["apartesenador", {
    name: "apartesenador",
    description: `Apartes feitos por um Senador`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código do Senador"},"casa":{"type":"string","description":"Sigla da Casa onde ocorre o pronunciamento - SF (Senado Federal), CD (Câmara dos Deputados), CN (Congresso Nacional),\nPR (Presidência), CR (Comissão Representativa do Congresso), AC (Assembléia Constituinte)\n"},"dataInicio":{"type":"string","format":"date","description":"Data de início do período da pesquisa no formato AAAAMMDD.\nSe não for informada, dataFim = data atual - 1 mês\n"},"dataFim":{"type":"string","format":"date","description":"Data de fim do período da pesquisa no formato AAAAMMDD.\nSe não for informada, dataFim = data atual\n"},"numeroSessao":{"type":"number","format":"int64","description":"Número da Sessão Plenária"},"tipoSessao":{"type":"string","description":"Tipo da Sessão Plenária (veja serviço que lista os Tipos de Sessão: /dadosabertos/plenario/tiposSessao)"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/senador/{codigo}/apartes",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"casa","in":"query"},{"name":"dataInicio","in":"query"},{"name":"dataFim","in":"query"},{"name":"numeroSessao","in":"query"},{"name":"tipoSessao","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listatiposprazos", {
    name: "listatiposprazos",
    description: `Lista os Partidos Políticos em atividade e/ou extintos`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/senador/partidos",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listatiposusopalavra", {
    name: "listatiposusopalavra",
    description: `Lista os Tipos de Uso da Palavra (Modalidades de Discursos)`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/senador/lista/tiposUsoPalavra",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listalegislaturainifimsenador", {
    name: "listalegislaturainifimsenador",
    description: `Retorna a lista de Senadores com mandatos dentro do período das Legislaturas informadas.`,
    inputSchema: {"type":"object","properties":{"legislaturaInicio":{"type":"number","format":"int32","description":"Número da Legislatura inicial. O mandato deverá iniciar após a Legislatura informada."},"legislaturaFim":{"type":"number","format":"int32","description":"Número da Legislatura final. O mandato deverá finalizar antes da Legislatura informada."},"uf":{"type":"string","description":"Filtra pela sigla da UF do mandato"},"participacao":{"type":"string","description":"Filtra pelo tipo de participação no mandato. (T)itular ou (S)uplente"},"exercicio":{"type":"string","description":"Filtra apenas parlamentares que entraram em exercício (S)im ou apenas os que não entraram (N)ão"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}},"required":["legislaturaInicio","legislaturaFim"]},
    method: "get",
    pathTemplate: "/dadosabertos/senador/lista/legislatura/{legislaturaInicio}/{legislaturaFim}",
    executionParameters: [{"name":"legislaturaInicio","in":"path"},{"name":"legislaturaFim","in":"path"},{"name":"uf","in":"query"},{"name":"participacao","in":"query"},{"name":"exercicio","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listalegislaturasenador", {
    name: "listalegislaturasenador",
    description: `Obtém a lista de Senadores de uma determinada Legislatura`,
    inputSchema: {"type":"object","properties":{"legislatura":{"type":"number","format":"int32","description":"Número da Legislatura de referência. O Mandato deverá abranger a Legislatura informada."},"uf":{"type":"string","description":"Filtra pela sigla da UF do mandato"},"participacao":{"type":"string","description":"Filtra pelo tipo de participação no mandato. (T)itular ou (S)uplente"},"exercicio":{"type":"string","description":"Filtra apenas parlamentares que entraram em exercício (S)im ou apenas os que não entraram (N)ão"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}},"required":["legislatura"]},
    method: "get",
    pathTemplate: "/dadosabertos/senador/lista/legislatura/{legislatura}",
    executionParameters: [{"name":"legislatura","in":"path"},{"name":"uf","in":"query"},{"name":"participacao","in":"query"},{"name":"exercicio","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listasenadoresemexercicio", {
    name: "listasenadoresemexercicio",
    description: `Lista de Senadores em Exercício. Permite filtrar por UF e tipo de participação.`,
    inputSchema: {"type":"object","properties":{"uf":{"type":"string","description":"UF de mandato do Senador - sigla com dois caracteres"},"participacao":{"type":"string","enum":["T","S"],"description":"Tipo de participação no mandato: (T)itular ou (S)uplente"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}}},
    method: "get",
    pathTemplate: "/dadosabertos/senador/lista/atual",
    executionParameters: [{"name":"uf","in":"query"},{"name":"participacao","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listaafastados", {
    name: "listaafastados",
    description: `Obtém a lista dos Senadores atualmente afastados (Fora de Exercício)`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/senador/afastados",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["detalhesprocesso", {
    name: "detalhesprocesso",
    description: `Detalhes de um Processo Legislativo, como identificação, ementa, explicação da ementa,
indexação, autoria, data de apresentação, data de leitura, classificação, assunto,
outros números, materias anexadas, materias relacionadas, decisão, destino,
norma gerada, entre outros.
`,
    inputSchema: {"type":"object","properties":{"id":{"type":"number","format":"int64","description":"ID do Processo"},"v":{"type":"number","format":"int32","default":1,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["id"]},
    method: "get",
    pathTemplate: "/dadosabertos/processo/{id}",
    executionParameters: [{"name":"id","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["tipossituacao", {
    name: "tipossituacao",
    description: `Tipos de Situações (estado) possíveis em Processos Legislativos`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/processo/tipos-situacao",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["tiposdecisao", {
    name: "tiposdecisao",
    description: `Tipos de Decisões que podem ocorrer em Processos Legislativos`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/processo/tipos-decisao",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["tiposautor", {
    name: "tiposautor",
    description: `Tipos de Autores de Documentos e Processos Legislativos`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/processo/tipos-autor",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["tiposatualizacao", {
    name: "tiposatualizacao",
    description: `Tipos de Atualização que podem ocorrer em Processos Legislativos`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/processo/tipos-atualizacao",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["siglasidentificacao", {
    name: "siglasidentificacao",
    description: `Tipos e Siglas de Documentos e Processos Legislativos`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/processo/siglas",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["relatorias", {
    name: "relatorias",
    description: `Lista os Relatores designados para Processos Legislativos nas Comissões ou Plenário.
É obrigatório informar pelo menos um dos seguintes parâmetros:
 * idProcesso
 * codigoMateria
 * codigoParlamentar
 * dataReferencia (filtro padrão com data atual se nenhum dos outros parâmetros obrigatórios for
   informado)
 * dataInicio + dataFim (intervalo deve ser de até 1 ano no máximo se nenhum outro parâmetro
   obrigatório for informado)

Caso nenhum desses parâmetros for informado, retornará somente Relatorias atualmente
abertas (dataReferencia=HOJE).
`,
    inputSchema: {"type":"object","properties":{"idProcesso":{"type":"number","format":"int64","description":"Id do processo relatado"},"codigoMateria":{"type":"number","format":"int64","description":"Código legado da matéria do MATE"},"dataReferencia":{"type":"string","format":"date","description":"Relatorias abertas nesta data, no formato AAAA-MM-DD"},"dataInicio":{"type":"string","format":"date","description":"Relatorias designadas a partir desta data, no formato AAAA-MM-DD"},"dataFim":{"type":"string","format":"date","description":"Relatorias designadas até esta data, no formato AAAA-MM-DD"},"codigoParlamentar":{"type":"number","format":"int64","description":"Código do parlamentar relator"},"codigoColegiado":{"type":"number","format":"int64","description":"Código do colegiado da relatoria"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}}},
    method: "get",
    pathTemplate: "/dadosabertos/processo/relatoria",
    executionParameters: [{"name":"idProcesso","in":"query"},{"name":"codigoMateria","in":"query"},{"name":"dataReferencia","in":"query"},{"name":"dataInicio","in":"query"},{"name":"dataFim","in":"query"},{"name":"codigoParlamentar","in":"query"},{"name":"codigoColegiado","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["tiposprazo", {
    name: "tiposprazo",
    description: `Lista os Tipos de Prazos aos quais os Processos podem estar sujeitos`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/processo/prazo/tipos",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["prazos", {
    name: "prazos",
    description: `Lista os prazos estabelecidos para processos legislativos.
É obrigatório informar pelo menos um dos seguintes parâmetros:
 * idProcesso
 * codigoMateria
 * dataReferencia (filtro padrão com data atual se nenhum dos outros parâmetros obrigatórios for
   informado)
 * dataInicio + dataFim (intervalo deve ser de até 1 ano no máximo se nenhum outro parâmetro
   obrigatório for informado)

Caso nenhum desses parâmetros for informado, retornará somente Prazos atualmente
vigentes (dataReferencia=HOJE).
`,
    inputSchema: {"type":"object","properties":{"idProcesso":{"type":"number","format":"int64","description":"Id do Processo sobre o qual o prazo foi estabelecido"},"codigoMateria":{"type":"number","format":"int64","description":"Código legado da Matéria"},"idTipoPrazo":{"type":"number","format":"int64","description":"Id do Tipo de Prazo"},"dataReferencia":{"type":"string","format":"date","description":"Prazos vigentes nesta data, no formato AAAA-MM-DD"},"dataInicio":{"type":"string","format":"date","description":"Prazos iniciados a partir desta data, no formato AAAA-MM-DD"},"dataFim":{"type":"string","format":"date","description":"Prazos iniciados até esta data, no formato AAAA-MM-DD"},"codigoColegiado":{"type":"number","format":"int64","description":"Código do Colegiado no qual o Prazo foi determinado"},"sigla":{"type":"string","description":"Sigla da Identificação do Processo"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}}},
    method: "get",
    pathTemplate: "/dadosabertos/processo/prazo",
    executionParameters: [{"name":"idProcesso","in":"query"},{"name":"codigoMateria","in":"query"},{"name":"idTipoPrazo","in":"query"},{"name":"dataReferencia","in":"query"},{"name":"dataInicio","in":"query"},{"name":"dataFim","in":"query"},{"name":"codigoColegiado","in":"query"},{"name":"sigla","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["entesjuridicos", {
    name: "entesjuridicos",
    description: `Lista os Entes Jurídicos que podem participar como autores ou instâncias de tramitação ou de expedição de Documentos e Processos`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/processo/entes",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["emendasprocesso", {
    name: "emendasprocesso",
    description: `Lista as Emendas apresentadas à Proposição.
É obrigatório informar pelo menos um dos parâmetros.
Caso nenhum dos parâmetros for informado, retornará somente documentos apresentados
em um dos seguintes intervalos de 1 ano:
 * HOJE - 1 ano, se dataInicio e dataFim não forem informadas
 * dataFim - 1 ano, se dataInicio não for informada
 * dataInicio + 1 ano, se dataFim não for informada
`,
    inputSchema: {"type":"object","properties":{"idEmenda":{"type":"number","format":"int64","description":"Id da emenda"},"idDocumento":{"type":"number","format":"int64","description":"Id do documento da emenda"},"idProcesso":{"type":"number","format":"int64","description":"Id do processo emendado"},"codigoMateria":{"type":"number","format":"int64","description":"Código legado da matéria emendada do MATE"},"dataInicio":{"type":"string","format":"date","description":"Emendas apresentadas a partir desta data, no formato AAAA-MM-DD"},"dataFim":{"type":"string","format":"date","description":"Emendas apresentadas até esta data, no formato AAAA-MM-DD"},"codigoParlamentarAutor":{"type":"number","format":"int64","description":"Código do parlamentar autor da emenda"},"codigoColegiado":{"type":"number","format":"int64","description":"Código do colegiado no qual a emenda foi apresentada"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}}},
    method: "get",
    pathTemplate: "/dadosabertos/processo/emenda",
    executionParameters: [{"name":"idEmenda","in":"query"},{"name":"idDocumento","in":"query"},{"name":"idProcesso","in":"query"},{"name":"codigoMateria","in":"query"},{"name":"dataInicio","in":"query"},{"name":"dataFim","in":"query"},{"name":"codigoParlamentarAutor","in":"query"},{"name":"codigoColegiado","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["tiposconteudodocumento", {
    name: "tiposconteudodocumento",
    description: `Lista os Tipos de Conteúdo Informacional que os Documentos Legislativos podem conter`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/processo/documento/tipos-conteudo",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["tiposdocumento", {
    name: "tiposdocumento",
    description: `Lista os Tipos de Documentos que podem ser apresentados em Processos Legislativos`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/processo/documento/tipos",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["documentosprocesso", {
    name: "documentosprocesso",
    description: `Lista os Documentos apresentados em Processos Legislativos.
É obrigatório informar pelo menos um dos seguintes parâmetros:
 * idDocumento
 * idProcesso
 * codigoMateria
 * dataInicio + dataFim (intervalo deve ser de até 6 meses no máximo se nenhum outro parâmetro
   obrigatório for informado)
 * codigoParlamentarAutor
 * idEnteAutor
 * codigoColegiado + sigla
 * codigoColegiado + siglaTipo
 * siglaColegiado + sigla
 * siglaColegiado + siglaTipo

Caso nenhum desses parâmetros for informado, retornará somente documentos apresentados em um dos
seguintes intervalos de 6 meses:
 * HOJE - 6 meses, se dataInicio e dataFim não forem informadas
 * dataFim - 6 meses, se dataInicio não for informada
 * dataInicio + 6 meses, se dataFim não for informada
`,
    inputSchema: {"type":"object","properties":{"idDocumento":{"type":"number","format":"int64","description":"Id do documento"},"idProcesso":{"type":"number","format":"int64","description":"Id do processo no qual o documento foi apresentado"},"codigoMateria":{"type":"number","format":"int64","description":"Código legado da matéria do MATE"},"dataInicio":{"type":"string","format":"date","description":"Documentos apresentados a partir desta data, no formato AAAA-MM-DD"},"dataFim":{"type":"string","format":"date","description":"Documentos apresentados até esta data, no formato AAAA-MM-DD"},"codigoParlamentarAutor":{"type":"number","format":"int64","description":"Código do parlamentar autor do documento"},"idEnteAutor":{"type":"number","format":"int64","description":"Id do ente autor"},"codigoColegiado":{"type":"number","format":"int64","description":"Código do colegiado no qual o documento foi apresentado"},"siglaColegiado":{"type":"string","description":"Sigla do colegiado no qual o documento foi apresentado"},"sigla":{"type":"string","description":"Sigla da identificação do documento"},"siglaTipo":{"type":"string","description":"Sigla do tipo de documento"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}}},
    method: "get",
    pathTemplate: "/dadosabertos/processo/documento",
    executionParameters: [{"name":"idDocumento","in":"query"},{"name":"idProcesso","in":"query"},{"name":"codigoMateria","in":"query"},{"name":"dataInicio","in":"query"},{"name":"dataFim","in":"query"},{"name":"codigoParlamentarAutor","in":"query"},{"name":"idEnteAutor","in":"query"},{"name":"codigoColegiado","in":"query"},{"name":"siglaColegiado","in":"query"},{"name":"sigla","in":"query"},{"name":"siglaTipo","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["destinosprocesso", {
    name: "destinosprocesso",
    description: `Lista os Destinos possíveis de Processos Legislativos`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/processo/destinos",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["classesprocesso", {
    name: "classesprocesso",
    description: `Lista a Hierarquia de Classificações de Processos Legislativos`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/processo/classes",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["assuntosprocesso", {
    name: "assuntosprocesso",
    description: `Lista os Assuntos Gerais e Específicos de que tratam os Processos Legislativos`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/processo/assuntos",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["processos", {
    name: "processos",
    description: `Processos Legislativos que tramitam ou já tramitaram no Senado Federal ou Congresso Nacional.
É obrigatório informar pelo menos um dos seguintes parâmetros:
 * numero
 * ano
 * idProcesso
 * codigoMateria
 * tramitando (com valor S - default se nenhum outro parâmetro obrigatório for informado)
 * tramitouLegislaturaAtual (com valor S)
 * codigoParlamentarAutor
 * codigoClasse
 * codigoAssuntoEspecifico
 * sigla + siglaEnteIdentificador
 * dataInicioApresentacao
 * dataFimApresentacao
 * numeroNorma
 * anoNorma
 * numdias

 Caso nenhum desses parâmetros seja informado, retornará somente Processos que atualmente estão em
tramitação (tramitando=S).
`,
    inputSchema: {"type":"object","properties":{"sigla":{"type":"string","description":"Sigla identificadora do processo - veja a lista de siglas em /processo/siglas"},"numero":{"type":"string","description":"Número do processo"},"ano":{"type":"number","format":"int32","description":"Ano do processo"},"idProcesso":{"type":"array","items":{"type":"number","format":"int64"},"maxItems":100,"minItems":0,"description":"Id do processo"},"codigoMateria":{"type":"number","format":"int64","description":"Código legado da matéria do MATE"},"tramitando":{"type":"string","description":"Processo está tramitando atualmente? S - Sim, N - Não (Encerrado)"},"tramitouLegislaturaAtual":{"type":"string","description":"Processo tramitou na legislatura atual? S - Sim, N - Não"},"codigoColegiadoTramitando":{"type":"number","format":"int64","description":"Código do colegiado onde o processo tramita atualmente - veja a lista de colegiados em /comissao/lista"},"siglaSituacao":{"type":"string","description":"Sigla da situação do processo - veja a lista de situações em /processo/tipos-situacao"},"autor":{"type":"string","description":"Nome do autor do processo"},"codigoParlamentarAutor":{"type":"number","format":"int64","description":"Código do parlamentar autor"},"siglaTipoDocumento":{"type":"string","description":"Sigla do tipo do documento iniciador do processo - veja a lista de tipos em /processo/documento/tipos"},"siglaTipoConteudo":{"type":"string","description":"Sigla do tipo de conteúdo do documento iniciador do processo - veja a lista de tipos em /processo/documento/tipos-conteudo"},"codigoClasse":{"type":"number","format":"int64","description":"Código da classe do processo. Veja a lista de classes em /processo/classes"},"codAssuntoGeral":{"type":"number","format":"int64","description":"Código do assunto geral - veja a lista de tipos em /processo/assuntos"},"codAssuntoEspecifico":{"type":"number","format":"int64","description":"Código do assunto específico - veja a lista de tipos em /processo/assuntos"},"termo":{"type":"string","description":"Termo livre a ser consultado entre as palavras-chaves do processo"},"siglaEnteIdentificador":{"type":"string","description":"Sigla do ente/comissão/colegiado identificador do processo - veja a lista de entes em /processo/entes"},"dataInicioApresentacao":{"type":"string","format":"date","description":"    Apresentados a partir da data informada, no formato AAAA-MM-DD. Retorna até no máximo 1 ano após a\n    data informada se nenhum outro parâmetro obrigatório for informado\n"},"dataFimApresentacao":{"type":"string","format":"date","description":"    Apresentados até a data informada, no formato AAAA-MM-DD. Retorna até no máximo 1 ano antes da data\n    informada se nenhum outro parâmetro obrigatório for informado.\n"},"tipoNorma":{"type":"string","description":"Tipo da norma gerada - veja a lista de tipos em /legislacao/tiposNorma"},"numeroNorma":{"type":"string","description":"Número da norma gerada"},"anoNorma":{"type":"number","format":"int32","description":"Ano da norma gerada"},"numdias":{"type":"number","format":"int32","maximum":30,"description":"Atualizadas nos últimos N dias. O máximo é 30."},"alteracao":{"type":"string","description":"Tipo de atualização - veja a lista de tipos em /processo/tipos-atualizacao. Considerado apenas quando numdias é informado."},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}}},
    method: "get",
    pathTemplate: "/dadosabertos/processo",
    executionParameters: [{"name":"sigla","in":"query"},{"name":"numero","in":"query"},{"name":"ano","in":"query"},{"name":"idProcesso","in":"query"},{"name":"codigoMateria","in":"query"},{"name":"tramitando","in":"query"},{"name":"tramitouLegislaturaAtual","in":"query"},{"name":"codigoColegiadoTramitando","in":"query"},{"name":"siglaSituacao","in":"query"},{"name":"autor","in":"query"},{"name":"codigoParlamentarAutor","in":"query"},{"name":"siglaTipoDocumento","in":"query"},{"name":"siglaTipoConteudo","in":"query"},{"name":"codigoClasse","in":"query"},{"name":"codAssuntoGeral","in":"query"},{"name":"codAssuntoEspecifico","in":"query"},{"name":"termo","in":"query"},{"name":"siglaEnteIdentificador","in":"query"},{"name":"dataInicioApresentacao","in":"query"},{"name":"dataFimApresentacao","in":"query"},{"name":"tipoNorma","in":"query"},{"name":"numeroNorma","in":"query"},{"name":"anoNorma","in":"query"},{"name":"numdias","in":"query"},{"name":"alteracao","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["orientacaobancadadata", {
    name: "orientacaobancadadata",
    description: `Orientação de Bancada para Votação de Matéria das Sessões que ocorreram em uma data`,
    inputSchema: {"type":"object","properties":{"dataSessao":{"type":"string","description":"Data de referência da consulta no formato AAAAMMDD"},"v":{"type":"number","format":"int32","default":1,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["dataSessao"]},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/votacao/orientacaoBancada/{dataSessao}",
    executionParameters: [{"name":"dataSessao","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["orientacaobancadaperiodo", {
    name: "orientacaobancadaperiodo",
    description: `Orientação de Bancada para Votação de Matéria das Sessões que ocorreram em um período`,
    inputSchema: {"type":"object","properties":{"dataInicio":{"type":"string","description":"Data de início do período da consulta no formato AAAAMMDD"},"dataFim":{"type":"string","description":"Data de fim do período da consulta no formato AAAAMMDD"},"v":{"type":"number","format":"int32","default":1,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["dataInicio","dataFim"]},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/votacao/orientacaoBancada/{dataInicio}/{dataFim}",
    executionParameters: [{"name":"dataInicio","in":"path"},{"name":"dataFim","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listavotacoesano", {
    name: "listavotacoesano",
    description: `Substitua pelo serviço de listagem de votos disponível em [/dadosabertos/votacao](#/Votação/votacoes)`,
    inputSchema: {"type":"object","properties":{"ano":{"type":"number","format":"int32","description":"Ano de referência desejado, no formato AAAA."}},"required":["ano"]},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/votacao/nominal/{ano}",
    executionParameters: [{"name":"ano","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listatipossessao", {
    name: "listatipossessao",
    description: `Lista os Tipos de Sessão Plenária`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/tiposSessao",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["resultadodia", {
    name: "resultadodia",
    description: `Retorna o Resultado dos Itens de Pauta das Sessões Plenárias na data informada.`,
    inputSchema: {"type":"object","properties":{"data":{"type":"string","format":"date","description":"Data de referência para consulta no formato AAAAMMDD"},"v":{"type":"number","format":"int32","default":2,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["data"]},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/resultado/{data}",
    executionParameters: [{"name":"data","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["resultadoitemveto", {
    name: "resultadoitemveto",
    description: `Resultado da Votação Nominal de Veto`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int32","description":"Código do Veto"},"v":{"type":"number","format":"int32","default":7,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/resultado/veto/{codigo}",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["resultadoveto", {
    name: "resultadoveto",
    description: `Resultado da Votação Nominal do Veto a um Projeto de Lei`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int32","description":"Código da Matéria"},"v":{"type":"number","format":"int32","default":7,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/resultado/veto/materia/{codigo}",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["resultadovetovotacaodispositivo", {
    name: "resultadovetovotacaodispositivo",
    description: `Resultado da Votação Nominal de um Dispositivo do Veto (em Vetos Parciais)`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int32","description":"Código do Dispositivo do Veto"},"v":{"type":"number","format":"int32","default":7,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/resultado/veto/dispositivo/{codigo}",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["resultadomes", {
    name: "resultadomes",
    description: `Obtém o resultado do mês das Sessões Plenárias a partir da data informada.`,
    inputSchema: {"type":"object","properties":{"data":{"type":"string","format":"date","description":"Data de referência para consulta no formato AAAAMMDD"},"v":{"type":"number","format":"int32","default":2,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["data"]},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/resultado/mes/{data}",
    executionParameters: [{"name":"data","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["resultadosessaocn", {
    name: "resultadosessaocn",
    description: `Resultado da Sessão Plenária do Congresso Nacional`,
    inputSchema: {"type":"object","properties":{"data":{"type":"string","description":"Data da Sessão no formato AAAAMMDD"},"v":{"type":"number","format":"int32","default":3,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["data"]},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/resultado/cn/{data}",
    executionParameters: [{"name":"data","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listavotacoesdatasessao", {
    name: "listavotacoesdatasessao",
    description: `Substitua pelo serviço de listagem de votos disponível em [/dadosabertos/votacao](#/Votação/votacoes)`,
    inputSchema: {"type":"object","properties":{"dataSessao":{"type":"string","description":"Data de referência da Sessão no formato AAAAMMDD"},"v":{"type":"number","format":"int32","default":2,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["dataSessao"]},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/lista/votacao/{dataSessao}",
    executionParameters: [{"name":"dataSessao","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listavotacoesperiodosessao", {
    name: "listavotacoesperiodosessao",
    description: `Substitua pelo serviço de listagem de votos disponível em [/dadosabertos/votacao](#/Votação/votacoes)`,
    inputSchema: {"type":"object","properties":{"dataInicio":{"type":"string","description":"Data de início do período da consulta no formato AAAAMMDD"},"dataFim":{"type":"string","description":"Data de fim do período da consulta no formato AAAAMMDD"},"v":{"type":"number","format":"int32","default":2,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["dataInicio","dataFim"]},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/lista/votacao/{dataInicio}/{dataFim}",
    executionParameters: [{"name":"dataInicio","in":"path"},{"name":"dataFim","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listatiposcomparecimento", {
    name: "listatiposcomparecimento",
    description: `Lista os Tipos de Comparecimento em Votações do Plenário`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/lista/tiposComparecimento",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listalegislatura", {
    name: "listalegislatura",
    description: `Retorna a lista de todas as Legislaturas e suas Sessões Legislativas em ordem decrescente de número da Legislatura.`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/lista/legislaturas",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listadiscursossessao", {
    name: "listadiscursossessao",
    description: `Lista Discursos das Sessões que ocorreram dentro do período informado (máximo de 30 dias).`,
    inputSchema: {"type":"object","properties":{"dataInicio":{"type":"string","description":"Data de início do período da consulta no formato AAAAMMDD"},"dataFim":{"type":"string","description":"Data de fim do período da consulta no formato AAAAMMDD"},"siglaCasa":{"type":"string","description":"Sigla da casa (SF = Senado Federal, CN = Congresso Nacional)"},"tipoSessao":{"type":"string","description":"Sigla do tipo de Sessão"},"numeroSessao":{"type":"string","description":"Número da Sessão"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}},"required":["dataInicio","dataFim"]},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/lista/discursos/{dataInicio}/{dataFim}",
    executionParameters: [{"name":"dataInicio","in":"path"},{"name":"dataFim","in":"path"},{"name":"siglaCasa","in":"query"},{"name":"tipoSessao","in":"query"},{"name":"numeroSessao","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["legislaturadata", {
    name: "legislaturadata",
    description: `Obtém a Legislatura na data informada e suas Sessões Legislativas`,
    inputSchema: {"type":"object","properties":{"data":{"type":"string","description":"Data de referência para pesquisa da Legislatura no formato AAAAMMDD."},"v":{"type":"number","format":"int32","default":3,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["data"]},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/legislatura/{data}",
    executionParameters: [{"name":"data","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["resumoencontro", {
    name: "resumoencontro",
    description: `Retorna o resumo do Encontro Legislativo.`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int32","description":"Código do Encontro Legislativo"},"v":{"type":"number","format":"int32","default":1,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/encontro/{codigo}/resumo",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["resultadoencontro", {
    name: "resultadoencontro",
    description: `Retorna a relação de Itens de Pauta do Encontro Legislativo com os resultados da apreciação.`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int32","description":"Código do Encontro Legislativo"},"v":{"type":"number","format":"int32","default":1,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/encontro/{codigo}/resultado",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["pautaencontro", {
    name: "pautaencontro",
    description: `Itens de Pauta do Encontro Legislativo`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int32","description":"Código do Encontro Legislativo"},"v":{"type":"number","format":"int32","default":1,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/encontro/{codigo}/pauta",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["detalheencontro", {
    name: "detalheencontro",
    description: `Recupera os detalhes do Encontro Legislativo.`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int32","description":"Código do Encontro Legislativo"},"v":{"type":"number","format":"int32","default":1,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/encontro/{codigo}",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["agendamesplenario", {
    name: "agendamesplenario",
    description: `Retorna a Agenda do mês nos Plenários do Senado Federal e Congresso Nacional (a partir da data informada até o fim do mês).`,
    inputSchema: {"type":"object","properties":{"data":{"type":"string","format":"date","description":"Data de referência para pesquisa da Agenda no formato AAAAMMDD"},"v":{"type":"number","format":"int32","default":2,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["data"]},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/agenda/mes/{data}",
    executionParameters: [{"name":"data","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["agendadiaplenario", {
    name: "agendadiaplenario",
    description: `Agenda do dia nos Plenários do Senado Federal e Congresso Nacional`,
    inputSchema: {"type":"object","properties":{"data":{"type":"string","format":"date","description":"Data de referência para pesquisa da Agenda no formato AAAAMMDD."},"v":{"type":"number","format":"int32","default":2,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["data"]},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/agenda/dia/{data}",
    executionParameters: [{"name":"data","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["agendadoperiodocn", {
    name: "agendadoperiodocn",
    description: `Agenda do período do Plenário do Congresso Nacional`,
    inputSchema: {"type":"object","properties":{"inicio":{"type":"string","description":"Data de início da Agenda no formato AAAAMMDD"},"fim":{"type":"string","description":"Data de fim da Agenda no formato AAAAMMDD"},"v":{"type":"number","format":"int32","default":2,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["inicio","fim"]},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/agenda/cn/{inicio}/{fim}",
    executionParameters: [{"name":"inicio","in":"path"},{"name":"fim","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["agendanadatacn", {
    name: "agendanadatacn",
    description: `Agenda do dia do Plenário do Congresso Nacional`,
    inputSchema: {"type":"object","properties":{"data":{"type":"string","description":"Data da Agenda no formato AAAAMMDD"},"v":{"type":"number","format":"int32","default":2,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["data"]},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/agenda/cn/{data}",
    executionParameters: [{"name":"data","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["agendaicalplenario", {
    name: "agendaicalplenario",
    description: `Retorna a Agenda dos Plenários do Senado Federal e Congresso Nacional em formato iCal, 30 dias a partir da data atual.`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/plenario/agenda/atual/iCal",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["detalheoficio", {
    name: "detalheoficio",
    description: `Retorna informações do Ofício e a relação de Emendas apoiadas pelo mesmo.`,
    inputSchema: {"type":"object","properties":{"v":{"type":"number","format":"int32","default":1,"description":"Versão do serviço. Exemplificada a última disponível."},"numeroSedol":{"type":"string","description":"Número do Documento Sedol recuperado na lista de Ofícios (/dadosbabertos/orcamento/oficios). Se não existir um Número do Documento Sedol, utilize o atributo 'id' do Ofício para recuperar seus detalhes."}},"required":["numeroSedol"]},
    method: "get",
    pathTemplate: "/dadosabertos/orcamento/oficios/{numeroSedol}",
    executionParameters: [{"name":"v","in":"query"},{"name":"numeroSedol","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listaoficios", {
    name: "listaoficios",
    description: `Retorna a lista de Ofícios de apoio às Emendas de Orçamento.`,
    inputSchema: {"type":"object","properties":{"v":{"type":"number","format":"int32","default":1,"description":"Versão do serviço. Exemplificada a última disponível."}}},
    method: "get",
    pathTemplate: "/dadosabertos/orcamento/oficios",
    executionParameters: [{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listaemendas", {
    name: "listaemendas",
    description: `Lotes de Emendas ao Orçamento`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/orcamento/lista",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["detalhes", {
    name: "detalhes",
    description: `Substitua pelos serviços de listagem e detalhes de processo - [/dadosabertos/processo](#/Processo/processos) e [/dadosabertos/processo/{idProcesso}](#/Processo/detalhesProcesso)`,
    inputSchema: {"type":"object","properties":{"sigla":{"type":"string","description":"Sigla do Tipo da Proposição"},"numero":{"type":"string","description":"Número da Proposição"},"ano":{"type":"number","format":"int32","description":"Ano da Proposição"},"comissao":{"type":"string","description":"Sigla da Comissão (somente para requerimentos de Comissão - sigla REQ)"},"v":{"type":"number","format":"int32","default":7,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["sigla","numero","ano"]},
    method: "get",
    pathTemplate: "/dadosabertos/materia/{sigla}/{numero}/{ano}",
    executionParameters: [{"name":"sigla","in":"path"},{"name":"numero","in":"path"},{"name":"ano","in":"path"},{"name":"comissao","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["detalhes_1", {
    name: "detalhes_1",
    description: `Substitua pelo serviço de detalhes do processo em [/dadosabertos/processo/{idProcesso}](#/Processo/detalhesProcesso)`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código da Matéria"},"v":{"type":"number","format":"int32","default":7,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/materia/{codigo}",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["votacoes_1", {
    name: "votacoes_1",
    description: `Substitua pelo serviço de listagem de votos disponível em [/dadosabertos/votacao](#/Votação/votacoes)`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código da Matéria"},"v":{"type":"number","format":"int32","default":6,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/materia/votacoes/{codigo}",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["vetosporano", {
    name: "vetosporano",
    description: `Relação de Vetos presidenciais por ano`,
    inputSchema: {"type":"object","properties":{"ano":{"type":"number","format":"int32","description":"Ano do Veto"}},"required":["ano"]},
    method: "get",
    pathTemplate: "/dadosabertos/materia/vetos/{ano}",
    executionParameters: [{"name":"ano","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["vetosencerrados", {
    name: "vetosencerrados",
    description: `Vetos com tramitação encerrada`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/materia/vetos/encerrados",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["vetosaposrcn", {
    name: "vetosaposrcn",
    description: `Vetos posteriores à RCN 1/2013 em tramitação`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/materia/vetos/aposrcn",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["vetosantesrcn", {
    name: "vetosantesrcn",
    description: `Vetos anteriores à RCN 1/2013 em tramitação`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/materia/vetos/antesrcn",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["tramitando", {
    name: "tramitando",
    description: `Substitua pelo serviço de listagem de processos em [/dadosabertos/processo](#/Processo/processos)`,
    inputSchema: {"type":"object","properties":{"data":{"type":"string","description":"Filtra as matérias cuja última atualização é igual ou posterior à data informada - formato AAAAMMDD"},"hora":{"type":"string","description":"Filtra apenas as matérias cuja hora da última atualização é igual ou posterior à hora\ninformada. Deve ser informado apenas se a data também for informada. Formato HHMISS,\nonde HH é no padrão 24 horas, MI representa os minutos, com 2 dígitos, e SS representa\nos segundos, com 2 dígitos\n"},"sigla":{"type":"string","description":"Sigla do subtipo da matéria"},"numero":{"type":"string","description":"Número da matéria"},"ano":{"type":"number","format":"int32","description":"Ano da matéria"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}}},
    method: "get",
    pathTemplate: "/dadosabertos/materia/tramitando",
    executionParameters: [{"name":"data","in":"query"},{"name":"hora","in":"query"},{"name":"sigla","in":"query"},{"name":"numero","in":"query"},{"name":"ano","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["tiposatualizacoes", {
    name: "tiposatualizacoes",
    description: `Substitua pelo serviço disponível em [/dadosabertos/processo/tipos-atualizacao](#/Processo/tiposAtualizacao)`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/materia/tiposatualizacoes",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["tiposturnoapresentacao", {
    name: "tiposturnoapresentacao",
    description: `(DEPRECATED) Tipos de Turno de Apresentação de Matérias no Processo Legislativo`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/materia/tiposTurnoApresentacao",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["tiposprazos", {
    name: "tiposprazos",
    description: `Substitua pelo serviço disponível em [/dadosabertos/processo/prazo/tipos](#/Processo/tiposPrazo)`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/materia/tiposPrazo",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["tiposnatureza", {
    name: "tiposnatureza",
    description: `Substitua pelo serviço disponível em [/dadosabertos/processo/documento/tipos-conteudo](#/Processo/tiposConteudoDocumento)`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/materia/tiposNatureza",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["tiposemenda", {
    name: "tiposemenda",
    description: `(DEPRECATED) Tipos de Emendas`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/materia/tiposEmenda",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["textos", {
    name: "textos",
    description: `Substitua pelo serviço disponível em [/dadosabertos/processo/documento](#/Processo/documentosProcesso)`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código da Matéria"},"v":{"type":"number","format":"int32","default":5,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/materia/textos/{codigo}",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["subtipos", {
    name: "subtipos",
    description: `Substitua pelo serviço disponível em [/dadosabertos/processo/siglas](#/Processo/siglasIdentificacao)`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/materia/subtipos",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["situacoes", {
    name: "situacoes",
    description: `Substitua pelo serviço disponível em [/dadosabertos/processo/tipos-situacao](#/Processo/tiposSituacao)`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/materia/situacoes",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["situacaoatual", {
    name: "situacaoatual",
    description: `Substitua pelo serviço de detalhes do processo em [/dadosabertos/processo/{idProcesso}](#/Processo/detalhesProcesso)`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código da Matéria"},"v":{"type":"number","format":"int32","default":3,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/materia/situacaoatual/{codigo}",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["situacaoatual_1", {
    name: "situacaoatual_1",
    description: `Substitua pelos serviços de listagem e detalhes de processo - [/dadosabertos/processo](#/Processo/processos) e [/dadosabertos/processo/{idProcesso}](#/Processo/detalhesProcesso)`,
    inputSchema: {"type":"object","properties":{"data":{"type":"string","description":"Data da Tramitação - formato AAAAMMDD"},"v":{"type":"number","format":"int32","default":3,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["data"]},
    method: "get",
    pathTemplate: "/dadosabertos/materia/situacaoatual/tramitacao/{data}",
    executionParameters: [{"name":"data","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["relatorias_1", {
    name: "relatorias_1",
    description: `Substitua pelo serviço em [/dadosabertos/processo/relatoria](#/Processo/relatorias)`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código da Matéria"},"v":{"type":"number","format":"int32","default":5,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/materia/relatorias/{codigo}",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["pesquisamateria", {
    name: "pesquisamateria",
    description: `Substitua pelo serviço de lista de processos disponível em [/dadosabertos/processo](#/Processo/processos)

Retorna as matérias que satisfazem aos parâmetros informados.

Atenção:
1. Se não informar o ano (da matéria ou da norma) nem o período de apresentação, será considerado o ano atual.
1. Para a pesquisa por período de apresentação, o limite é de 1 ano.
`,
    inputSchema: {"type":"object","properties":{"tramitando":{"type":"string","description":"Indica se a matéria está tramitando (S) ou não (N)"},"sigla":{"type":"string","description":"Sigla do subtipo da matéria"},"numero":{"type":"string","description":"Número da matéria"},"ano":{"type":"number","format":"int32","description":"Ano da matéria"},"siglaComissaoReq":{"type":"string","description":"Sigla da comissão do requerimento - para requerimentos de comissão após 2019 (REQ)"},"nomeAutor":{"type":"string","description":"Nome do autor da matéria"},"dataInicioApresentacao":{"type":"string","format":"date","description":"Data de início para pesquisa da data de apresentação da matéria, no formato AAAAMMDD"},"dataFimApresentacao":{"type":"string","format":"date","description":"Data de fim para pesquisa da data de apresentação da matéria, no formato AAAAMMDD"},"codigoClasse":{"type":"number","format":"int64","description":"Código de classificação da matéria - veja lista de tipos em /dadosabertos/materia/classes"},"codigoConteudo":{"type":"number","format":"int64","description":"Código do tipo de conteúdo da matéria - veja lista de tipos em /dadosabertos/materia/tiposNatureza"},"tipoNorma":{"type":"string","description":"Sigla do tipo da norma jurídica gerada"},"numeroNorma":{"type":"string","description":"Número da norma jurídica gerada"},"anoNorma":{"type":"number","format":"int32","description":"Ano da norma jurídica gerada"},"palavraChave":{"type":"string","description":"Palavra chave para pesquisa no conteúdo e indexação da matéria"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}}},
    method: "get",
    pathTemplate: "/dadosabertos/materia/pesquisa/lista",
    executionParameters: [{"name":"tramitando","in":"query"},{"name":"sigla","in":"query"},{"name":"numero","in":"query"},{"name":"ano","in":"query"},{"name":"siglaComissaoReq","in":"query"},{"name":"nomeAutor","in":"query"},{"name":"dataInicioApresentacao","in":"query"},{"name":"dataFimApresentacao","in":"query"},{"name":"codigoClasse","in":"query"},{"name":"codigoConteudo","in":"query"},{"name":"tipoNorma","in":"query"},{"name":"numeroNorma","in":"query"},{"name":"anoNorma","in":"query"},{"name":"palavraChave","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["ordia", {
    name: "ordia",
    description: `Substitua pelo serviço de detalhes do processo em [/dadosabertos/processo/{idProcesso}](#/Processo/detalhesProcesso)`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código da Matéria"},"v":{"type":"number","format":"int32","default":4,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/materia/ordia/{codigo}",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["movimentacoes", {
    name: "movimentacoes",
    description: `Substitua pelo serviço de detalhes do processo em [/dadosabertos/processo/{idProcesso}](#/Processo/detalhesProcesso)`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código da Matéria"},"dataref":{"type":"string","description":"Formato AAAAMMDD - Filtra ocorrências a partir da data especificada"},"v":{"type":"number","format":"int32","default":7,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/materia/movimentacoes/{codigo}",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"dataref","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["locais", {
    name: "locais",
    description: `Substitua pelo serviço em [/dadosabertos/processo/entes](#/Processo/entesJuridicos)`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/materia/locais",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listamateriasemtramitacao", {
    name: "listamateriasemtramitacao",
    description: `Total de Processos em tramitação no Senado Federal ou no Congresso Nacional por Tipo ou pelo Colegiado em que se encontra (Plenário ou Comissão)`,
    inputSchema: {"type":"object","properties":{"sigla":{"type":"string","description":"Sigla do Subtipo de Proposição (Matéria)"},"ano":{"type":"string","description":"Ano da Proposição"},"comissao":{"type":"string","description":"Sigla da Comissão"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}}},
    method: "get",
    pathTemplate: "/dadosabertos/materia/lista/tramitacao",
    executionParameters: [{"name":"sigla","in":"query"},{"name":"ano","in":"query"},{"name":"comissao","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listamateriasprazo", {
    name: "listamateriasprazo",
    description: `Substitua pelo serviço de prazos de Processos localizado em [/dadosaberto/processo/prazo](#/Processo/prazos)`,
    inputSchema: {"type":"object","properties":{"codPrazo":{"type":"number","format":"int64","description":"Código do Tipo de Prazo (use 0 para todos tipos) - veja lista de Tipos em /dadosabertos/materia/tiposPrazo"},"comissao":{"type":"string","description":"Sigla da comissão"},"tipo":{"type":"string","description":"Sigla da identificação"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codPrazo"]},
    method: "get",
    pathTemplate: "/dadosabertos/materia/lista/prazo/{codPrazo}",
    executionParameters: [{"name":"codPrazo","in":"path"},{"name":"comissao","in":"query"},{"name":"tipo","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listamateriascomissao", {
    name: "listamateriascomissao",
    description: `Substitua pelo serviço de listagem de processos em [/dadosabertos/processo](#/Processo/processos)`,
    inputSchema: {"type":"object","properties":{"materia":{"type":"number","format":"int32","description":"Código da Matéria"},"comissao":{"type":"string","description":"Sigla da Comissão"},"situacao":{"type":"string","description":"Sigla da Situação da Matéria - veja tipos possíveis em /dadosabertos/materia/situacoes"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}}},
    method: "get",
    pathTemplate: "/dadosabertos/materia/lista/comissao",
    executionParameters: [{"name":"materia","in":"query"},{"name":"comissao","in":"query"},{"name":"situacao","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["legislaturaatual", {
    name: "legislaturaatual",
    description: `Substitua pelo serviço de listagem de processos em [/dadosabertos/processo](#/Processo/processos)`,
    inputSchema: {"type":"object","properties":{"tramitando":{"type":"string","description":"    (S ou N) - Retorna apenas as matérias que estão tramitando (S) ou apenas as que não estão (N).\n    Se o parâmetro não for informado, retorna ambas.\n"},"sigla":{"type":"string","description":"Sigla do subtipo da matéria. Veja lista em /dadosabertos/materia/subtipos"},"numero":{"type":"string","description":"Número da matéria"},"ano":{"type":"number","format":"int32","description":"Ano da matéria"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}}},
    method: "get",
    pathTemplate: "/dadosabertos/materia/legislaturaatual",
    executionParameters: [{"name":"tramitando","in":"query"},{"name":"sigla","in":"query"},{"name":"numero","in":"query"},{"name":"ano","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["emendas", {
    name: "emendas",
    description: `Substitua pelo serviço em [/dadosabertos/processo/emenda](#/Processo/emendasProcesso)`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código da Matéria"},"v":{"type":"number","format":"int32","default":6,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/materia/emendas/{codigo}",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["emenda", {
    name: "emenda",
    description: `Substitua pelo serviço em [/dadosabertos/processo/emenda](#/Processo/emendasProcesso)`,
    inputSchema: {"type":"object","properties":{"idDomaEmenda":{"type":"number","format":"int64","description":"Identificação do Documento Manifestação da Emenda"},"v":{"type":"number","format":"int32","default":5,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["idDomaEmenda"]},
    method: "get",
    pathTemplate: "/dadosabertos/materia/emenda/{idDomaEmenda}",
    executionParameters: [{"name":"idDomaEmenda","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["distribuicaorelatoria", {
    name: "distribuicaorelatoria",
    description: `Distribuição de relatoria de matérias em uma comissão`,
    inputSchema: {"type":"object","properties":{"sigla":{"type":"string","description":"Sigla da comissão"},"v":{"type":"number","format":"int32","default":2,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["sigla"]},
    method: "get",
    pathTemplate: "/dadosabertos/materia/distribuicao/relatoria/{sigla}",
    executionParameters: [{"name":"sigla","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["distribuicaoautoria", {
    name: "distribuicaoautoria",
    description: `Distribuição de autoria de matérias em uma comissão`,
    inputSchema: {"type":"object","properties":{"siglaComissao":{"type":"string","description":"Sigla da comissão"},"codParlamentar":{"type":"number","format":"int64","description":"Código do parlamentar"}},"required":["siglaComissao"]},
    method: "get",
    pathTemplate: "/dadosabertos/materia/distribuicao/autoria/{siglaComissao}",
    executionParameters: [{"name":"siglaComissao","in":"path"},{"name":"codParlamentar","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["distribuicaoautoria_1", {
    name: "distribuicaoautoria_1",
    description: `Distribuição de autoria de matérias (por comissão e/ou parlamentar)`,
    inputSchema: {"type":"object","properties":{"siglaComissao":{"type":"string","description":"Sigla da comissão"},"codParlamentar":{"type":"number","format":"int64","description":"Código do parlamentar"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}}},
    method: "get",
    pathTemplate: "/dadosabertos/materia/distribuicao/autoria",
    executionParameters: [{"name":"siglaComissao","in":"query"},{"name":"codParlamentar","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["destinos", {
    name: "destinos",
    description: `Substitua pelo serviço em [/dadosabertos/processo/destinos](#/Processo/destinosProcesso)`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/materia/destinos",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["decisoes", {
    name: "decisoes",
    description: `Substitua pelo serviço em [/dadosabertos/processo/tipos-decisao](#/Processo/tiposDecisao)`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/materia/decisoes",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["classes", {
    name: "classes",
    description: `Substitua pelo serviço em [/dadosabertos/processo/classes](#/Processo/classesProcesso)`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/materia/classes",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["autoria", {
    name: "autoria",
    description: `Substitua pelo serviço de detalhes do processo em [/dadosabertos/processo/{idProcesso}](#/Processo/detalhesProcesso)`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código da Matéria"},"v":{"type":"number","format":"int32","default":1,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/materia/autoria/{codigo}",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["atualizadas", {
    name: "atualizadas",
    description: `Substitua pelos serviços de listagem e detalhes de processo - [/dadosabertos/processo](#/Processo/processos) e [/dadosabertos/processo/{idProcesso}](#/Processo/detalhesProcesso)`,
    inputSchema: {"type":"object","properties":{"numdias":{"type":"number","format":"int32","maximum":30,"description":"Número de dias a considerar (X): matérias alteradas nos últimos X dias - X por default é 5. Há dados de até 30 dias"},"alteracao":{"type":"string","description":"Tipo de alteração da matéria. Veja lista em /dadosabertos/materia/tiposatualizacoes"},"codigo":{"type":"number","format":"int64","description":"Código da matéria"},"sigla":{"type":"string","description":"Sigla do subtipo da matéria. Veja lista em /dadosabertos/materia/subtipos"},"numero":{"type":"string","description":"Número da matéria"},"ano":{"type":"number","format":"int32","description":"Ano da matéria"},"codAssuntoGeral":{"type":"number","format":"int64","description":"Código do assunto geral da matéria"},"codAssuntoEspecifico":{"type":"number","format":"int64","description":"Código do assunto específico da matéria. Veja lista em /dadosabertos/materia/assuntos"},"termo":{"type":"string","description":"Termo a ser pesquisado na indexação da matéria"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}}},
    method: "get",
    pathTemplate: "/dadosabertos/materia/atualizadas",
    executionParameters: [{"name":"numdias","in":"query"},{"name":"alteracao","in":"query"},{"name":"codigo","in":"query"},{"name":"sigla","in":"query"},{"name":"numero","in":"query"},{"name":"ano","in":"query"},{"name":"codAssuntoGeral","in":"query"},{"name":"codAssuntoEspecifico","in":"query"},{"name":"termo","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["atualizacoes", {
    name: "atualizacoes",
    description: `Substitua pelo serviço de detalhes do processo em [/dadosabertos/processo/{idProcesso}](#/Processo/detalhesProcesso)`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"string","description":"Código da matéria"},"numdias":{"type":"string","description":"Número de dias a considerar (X): atualizações ocorridas nos últimos X dias - X por default é 30.\nEstão disponíbeis as atualizações dos últimos 30 dias.\n"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/materia/atualizacoes/{codigo}",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"numdias","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["assuntos", {
    name: "assuntos",
    description: `Substitua pelo serviço em [/dadosabertos/processo/assuntos](#/Processo/assuntosProcesso)`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/materia/assuntos",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["normaidentificacao", {
    name: "normaidentificacao",
    description: `Obtém detalhes da Norma por meio do tipo/número/ano ou data de assinatura/sequencial`,
    inputSchema: {"type":"object","properties":{"tipo":{"type":"string","description":"Sigla do Tipo da Norma"},"numdata":{"type":"number","format":"int32","description":"Número ou data da Norma no formato AAAAMMDD"},"anoseq":{"type":"number","format":"int32","description":"Ano da data de assinatura da Norma ou sequencial"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}},"required":["tipo","numdata","anoseq"]},
    method: "get",
    pathTemplate: "/dadosabertos/legislacao/{tipo}/{numdata}/{anoseq}",
    executionParameters: [{"name":"tipo","in":"path"},{"name":"numdata","in":"path"},{"name":"anoseq","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["normaid", {
    name: "normaid",
    description: `Obtém detalhes de uma Norma Jurídica por meio do código informado no parâmetro.`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int32","description":"Código do Documento (Norma Jurídica)"},"v":{"type":"number","format":"int32","default":3,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/legislacao/{codigo}",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["normaurn", {
    name: "normaurn",
    description: `Obtém detalhes de uma Norma Jurídica por meio da URN informada no parâmetro.`,
    inputSchema: {"type":"object","properties":{"urn":{"type":"string","description":"Identificador Universal da Norma, presente no normas.leg.br"},"v":{"type":"number","format":"int32","default":3,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["urn"]},
    method: "get",
    pathTemplate: "/dadosabertos/legislacao/urn",
    executionParameters: [{"name":"urn","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listatiposdeclaracaodetalhe", {
    name: "listatiposdeclaracaodetalhe",
    description: `Retorna a lista de Detalhes de Declaração.`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/legislacao/tiposdeclaracao/detalhe",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listatiposvide", {
    name: "listatiposvide",
    description: `Retorna a lista de Tipos de Declaração.`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/legislacao/tiposVide",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listatipospublicacao", {
    name: "listatipospublicacao",
    description: `Lista de Tipos de Publicação`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/legislacao/tiposPublicacao",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listatiposnorma", {
    name: "listatiposnorma",
    description: `Lista Tipos de Norma`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/legislacao/tiposNorma",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["pesquisatermos", {
    name: "pesquisatermos",
    description: `Obtém a lista Termos do Catálogo, com base nos parâmetros informados.`,
    inputSchema: {"type":"object","properties":{"tipo":{"type":"number","format":"int32","description":"Código referente ao Tipo de Termo"},"termo":{"type":"string","description":"Termo a ser pesquisado"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}}},
    method: "get",
    pathTemplate: "/dadosabertos/legislacao/termos",
    executionParameters: [{"name":"tipo","in":"query"},{"name":"termo","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["pesquisalegislacao", {
    name: "pesquisalegislacao",
    description: `Obtém a lista de Legislação Federal com base nos parâmetros informados.`,
    inputSchema: {"type":"object","properties":{"tipo":{"type":"string","description":"Sigla do tipo da Norma"},"numero":{"type":"number","format":"int32","description":"Número da Norma"},"ano":{"type":"number","format":"int32","description":"Ano da Norma"},"data":{"type":"string","description":"Data da assinatura da Norma no formato AAAAMMDD"},"seq":{"type":"number","format":"int32","description":"Número sequencial da assinatura da Norma na data"},"reedicao":{"type":"number","format":"int32","description":"Número sequencial da reedição"},"ident":{"type":"string","description":"Letra de Identificação"},"complemento":{"type":"string","description":"Letra de Complemento"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}}},
    method: "get",
    pathTemplate: "/dadosabertos/legislacao/lista",
    executionParameters: [{"name":"tipo","in":"query"},{"name":"numero","in":"query"},{"name":"ano","in":"query"},{"name":"data","in":"query"},{"name":"seq","in":"query"},{"name":"reedicao","in":"query"},{"name":"ident","in":"query"},{"name":"complemento","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listaclasses", {
    name: "listaclasses",
    description: `Lista tabela do Sistema de Classificação utilizado na categorização de Normas Jurídicas, Projetos e Pronunciamentos.`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/legislacao/classes",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["getdiscursotextointegral", {
    name: "getdiscursotextointegral",
    description: `Texto Integral de um Pronunciamento em formato texto plano (txt)`,
    inputSchema: {"type":"object","properties":{"codigoPronunciamento":{"type":"string","description":"Código do Pronunciamento"}},"required":["codigoPronunciamento"]},
    method: "get",
    pathTemplate: "/dadosabertos/discurso/texto-integral/{codigoPronunciamento}",
    executionParameters: [{"name":"codigoPronunciamento","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["getdiscursotextobinario", {
    name: "getdiscursotextobinario",
    description: `Texto Integral de um Pronunciamento em formato binário`,
    inputSchema: {"type":"object","properties":{"codigoPronunciamento":{"type":"string","description":"Código do Pronunciamento"}},"required":["codigoPronunciamento"]},
    method: "get",
    pathTemplate: "/dadosabertos/discurso/texto-binario/{codigoPronunciamento}",
    executionParameters: [{"name":"codigoPronunciamento","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["mesadiretorasf", {
    name: "mesadiretorasf",
    description: `Obtém a Composição dos integrantes da Mesa Diretora do Senado Federal`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/composicao/mesaSF",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["mesadiretoracn", {
    name: "mesadiretoracn",
    description: `Obtém a Composição dos integrantes da Mesa Diretora do Congresso Nacional`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/composicao/mesaCN",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listacomposicaocolegiadotipo", {
    name: "listacomposicaocolegiadotipo",
    description: `Obtém a Composição das Comissões do Senado Federal por tipo de Colegiado`,
    inputSchema: {"type":"object","properties":{"tipo":{"type":"string","description":"Tipo de colegiado conforme opções: cpi|cpmi|permanente|orgaos|temporaria "}},"required":["tipo"]},
    method: "get",
    pathTemplate: "/dadosabertos/composicao/lista/{tipo}",
    executionParameters: [{"name":"tipo","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listatiposcargo", {
    name: "listatiposcargo",
    description: `Obtém a lista de Tipos de Cargo nas Comissões do Senado Federal e Congresso Nacional`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/composicao/lista/tiposCargo",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listatiposprazos_1", {
    name: "listatiposprazos_1",
    description: `Obtém a lista dos Partidos Políticos em atividade e/ou extintos no Senado Federal`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/composicao/lista/partidos",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listaliderancasf", {
    name: "listaliderancasf",
    description: `Substitua pelo serviço de Lideranças disponível em [/dadosabertos/composicao/lideranca](#/Composição/liderancas)`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/composicao/lista/liderancaSF",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listaliderancacn", {
    name: "listaliderancacn",
    description: `Substitua pelo serviço de Lideranças disponível em [/dadosabertos/composicao/lideranca](#/Composição/liderancas)`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/composicao/lista/liderancaCN",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listacomissoescn", {
    name: "listacomissoescn",
    description: `Composição das Comissões do Congresso Nacional por tipo`,
    inputSchema: {"type":"object","properties":{"tipo":{"type":"string","description":"Tipo de comissão: cpmi, veto, permanente, mpv, mistaEspecial, mesa, trabalhoCCS, representativa"},"v":{"type":"number","format":"int32","default":3,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["tipo"]},
    method: "get",
    pathTemplate: "/dadosabertos/composicao/lista/cn/{tipo}",
    executionParameters: [{"name":"tipo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listablocosparlamentares", {
    name: "listablocosparlamentares",
    description: `Obtém a lista e a Composição dos Blocos Parlamentares no Senado Federal`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/composicao/lista/blocos",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["gettiposunidadelideranca", {
    name: "gettiposunidadelideranca",
    description: `Lista Tipos de Unidades de Lideranças`,
    inputSchema: {"type":"object","properties":{"v":{"type":"number","format":"int32","default":1,"description":"Versão do serviço. Exemplificada a última disponível."}}},
    method: "get",
    pathTemplate: "/dadosabertos/composicao/lideranca/tipos-unidade",
    executionParameters: [{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["gettiposlideranca", {
    name: "gettiposlideranca",
    description: `Lista Tipos de Lideranças`,
    inputSchema: {"type":"object","properties":{"v":{"type":"number","format":"int32","default":1,"description":"Versão do serviço. Exemplificada a última disponível."}}},
    method: "get",
    pathTemplate: "/dadosabertos/composicao/lideranca/tipos",
    executionParameters: [{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listaliderancas", {
    name: "listaliderancas",
    description: `É obrigatório informar pelo menos um dos seguintes parâmetros:
 * codigo
 * codigoParlamentar
 * vigente (com valor S - default se nenhum outro parâmetro obrigatório for informado)
 * dataInicio + dataFim (intervalo deve ser de até 1 ano no máximo se nenhum outro parâmetro
 obrigatório for informado)
 * codigoPartido
 * codigoBloco

Caso nenhum desses parâmetros for informado, retornará somente as lideranças vigentes
(vigente=S).
`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Codigo da liderança"},"casa":{"type":"string","description":"Casa da liderança (CN, CD ou SF)"},"idTipoUnidadeLideranca":{"type":"number","format":"int32","description":"ID do tipo de unidade de liderança - veja a lista de tipos em /lideranca/tipos-unidade"},"codigoParlamentar":{"type":"number","format":"int64","description":"Código do parlamentar"},"vigente":{"type":"string","description":"'S' - Vigentes, 'N' - Encerradas, Em branco - Todas"},"dataInicio":{"type":"string","format":"date","description":"Lideranças designadas a partir desta data, no formato AAAA-MM-DD"},"dataFim":{"type":"string","format":"date","description":"Lideranças designadas até esta data, no formato AAAA-MM-DD"},"siglaTipoLideranca":{"type":"string","description":"Sigla do tipo de liderança - veja a lista de tipos em /lideranca/tipos"},"codigoPartido":{"type":"number","format":"int64","description":"Código do partido"},"codigoBloco":{"type":"number","format":"int64","description":"Código do bloco"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}}},
    method: "get",
    pathTemplate: "/dadosabertos/composicao/lideranca",
    executionParameters: [{"name":"codigo","in":"query"},{"name":"casa","in":"query"},{"name":"idTipoUnidadeLideranca","in":"query"},{"name":"codigoParlamentar","in":"query"},{"name":"vigente","in":"query"},{"name":"dataInicio","in":"query"},{"name":"dataFim","in":"query"},{"name":"siglaTipoLideranca","in":"query"},{"name":"codigoPartido","in":"query"},{"name":"codigoBloco","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["ultimacomposicaocomissao", {
    name: "ultimacomposicaocomissao",
    description: `Última Composição de uma Comissão do Senado Federal`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int32","description":"Código da Comissão"},"ativas":{"type":"string","description":"Para vagas ativas apenas (S). Para todas, não informe este parâmetro"},"v":{"type":"number","format":"int32","default":3,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/composicao/comissao/{codigo}",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"ativas","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["composicaoresumidamista", {
    name: "composicaoresumidamista",
    description: `Composição resumida de uma Comissão Mista em determinado período`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código da Comissão"},"dataInicio":{"type":"string","description":"Data de início do período no formato AAAAMMDD"},"dataFim":{"type":"string","description":"Data de fim do período no formato AAAAMMDD"},"v":{"type":"number","format":"int32","default":3,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo","dataInicio","dataFim"]},
    method: "get",
    pathTemplate: "/dadosabertos/composicao/comissao/resumida/mista/{codigo}/{dataInicio}/{dataFim}",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"dataInicio","in":"path"},{"name":"dataFim","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["composicaoatualmista", {
    name: "composicaoatualmista",
    description: `Composição atual de uma Comissão Mista`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código da Comissão"},"v":{"type":"number","format":"int32","default":3,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/composicao/comissao/atual/mista/{codigo}",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["bloco", {
    name: "bloco",
    description: `Composição de um Bloco Parlamentar`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código do Bloco (vide serviço /composicao/lista/blocos)"},"v":{"type":"number","format":"int32","default":1,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/composicao/bloco/{codigo}",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["documentoscolegiado", {
    name: "documentoscolegiado",
    description: `Substitua pelo serviço disponível em [/dadosabertos/processo/documento](#/Processo/documentosProcesso).

Se não informar o período, serão retornados os documentos apresentados nos últimos 30 dias.
`,
    inputSchema: {"type":"object","properties":{"comissao":{"type":"string","description":"Sigla do Colegiado (Comissão)"},"tipo":{"type":"string","description":"Sigla do tipo de identificação do documento"},"dataInicio":{"type":"string","format":"date","description":"    Data de início do período da pesquisa no formato AAAAMMDD.\n    Se não for informada, dataInicio = data atual - 1 mês\n"},"dataFim":{"type":"string","format":"date","description":"    Data de fim do período da pesquisa no formato AAAAMMDD.\n    Se não for informada, dataFim = data atual\n"},"v":{"type":"number","format":"int32","description":"Versão do serviço. Exemplificada a última disponível."}},"required":["comissao"]},
    method: "get",
    pathTemplate: "/dadosabertos/comissao/{comissao}/documentos",
    executionParameters: [{"name":"comissao","in":"path"},{"name":"tipo","in":"query"},{"name":"dataInicio","in":"query"},{"name":"dataFim","in":"query"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["detalhescolegiado", {
    name: "detalhescolegiado",
    description: `Detalhes de um Colegiado do Congresso Nacional`,
    inputSchema: {"type":"object","properties":{"codigo":{"type":"number","format":"int64","description":"Código do Colegiado (Comissão)"},"v":{"type":"number","format":"int32","default":3,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigo"]},
    method: "get",
    pathTemplate: "/dadosabertos/comissao/{codigo}",
    executionParameters: [{"name":"codigo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["documentoreuniao", {
    name: "documentoreuniao",
    description: `Retorna o link para o documento, através do status HTTP "Temporary Redirect" (307),
se o documento não existir retorna HTTP "Not Found" (404)
`,
    inputSchema: {"type":"object","properties":{"sigla":{"type":"string","description":"Sigla da Comissão"},"tipoDocumento":{"type":"string","description":"Tipo do documento (pauta|pautacheia|resultado)"}},"required":["sigla","tipoDocumento"]},
    method: "get",
    pathTemplate: "/dadosabertos/comissao/reuniao/{sigla}/documento/{tipoDocumento}",
    executionParameters: [{"name":"sigla","in":"path"},{"name":"tipoDocumento","in":"path"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["detalhereuniao", {
    name: "detalhereuniao",
    description: `Obtém as informações da Reunião de Comissão, incluindo detalhes dos itens de pauta (autoria, relatoria, resultado etc.)`,
    inputSchema: {"type":"object","properties":{"codigoReuniao":{"type":"number","format":"int64","description":"Código da Reunião"},"v":{"type":"number","format":"int32","default":2,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigoReuniao"]},
    method: "get",
    pathTemplate: "/dadosabertos/comissao/reuniao/{codigoReuniao}",
    executionParameters: [{"name":"codigoReuniao","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["notasreuniao_1", {
    name: "notasreuniao_1",
    description: `Notas Taquigráficas da Reunião de Comissão`,
    inputSchema: {"type":"object","properties":{"codigoReuniao":{"type":"number","format":"int64","description":"Código da Reunião"},"v":{"type":"number","format":"int32","default":1,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["codigoReuniao"]},
    method: "get",
    pathTemplate: "/dadosabertos/comissao/reuniao/notas/{codigoReuniao}",
    executionParameters: [{"name":"codigoReuniao","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listacolegiadossfportipo", {
    name: "listacolegiadossfportipo",
    description: `Lista de Colegiados do Senado Federal (por tipo)`,
    inputSchema: {"type":"object","properties":{"tipo":{"type":"string","description":"Tipo do Colegiado: permanente|cpi|temporaria|orgaos"},"v":{"type":"number","format":"int32","default":1,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["tipo"]},
    method: "get",
    pathTemplate: "/dadosabertos/comissao/lista/{tipo}",
    executionParameters: [{"name":"tipo","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listatiposcolegiado", {
    name: "listatiposcolegiado",
    description: `Obtém a Lista de Tipos de Colegiado do Senado Federal e Congresso Nacional`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/comissao/lista/tiposColegiado",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listacomissoesmistas", {
    name: "listacomissoesmistas",
    description: `Comissões Mistas atuais do Congresso Nacional`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/comissao/lista/mistas",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["listacolegiados", {
    name: "listacolegiados",
    description: `Obtém a Lista geral de Colegiados EM ATIVIDADE no Congresso Nacional`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/comissao/lista/colegiados",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["requerimentos", {
    name: "requerimentos",
    description: `Retorna a lista de Requerimentos da CPI, com os documentos enviados e/ou recebidos. RETORNO SOMENTE EM JSON.`,
    inputSchema: {"type":"object","properties":{"comissao":{"type":"string","description":"Sigla da comissão"},"pagina":{"type":"number","format":"int32","default":0,"description":"(obrigatório) - Número da página da lista de Requerimentos. Se não informado assume 0."},"tamanho":{"type":"number","format":"int32","default":20,"description":"(opcional) - Tamanho da página. É o número de registros retornados por página. Valor padrão 20. Valor permitido de 5 a 30."}},"required":["comissao"]},
    method: "get",
    pathTemplate: "/dadosabertos/comissao/cpi/{comissao}/requerimentos",
    executionParameters: [{"name":"comissao","in":"path"},{"name":"pagina","in":"query"},{"name":"tamanho","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["agendareuniaodia", {
    name: "agendareuniaodia",
    description: `Obtém a Agenda das Reunião das Comissões na data informada no formato AAAAMMDD.`,
    inputSchema: {"type":"object","properties":{"dataReferencia":{"type":"string","format":"date","description":"Data de referência"},"v":{"type":"number","format":"int32","default":2,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["dataReferencia"]},
    method: "get",
    pathTemplate: "/dadosabertos/comissao/agenda/{dataReferencia}",
    executionParameters: [{"name":"dataReferencia","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["agendareuniaoperiodo", {
    name: "agendareuniaoperiodo",
    description: `Obtém a Agenda das Reuniões das Comissões no período informado no formato AAAAMMDD. Máximo de 30 dias.`,
    inputSchema: {"type":"object","properties":{"dataInicio":{"type":"string","format":"date","description":"Data de início do período"},"dataFim":{"type":"string","format":"date","description":"Data de fim do período"},"v":{"type":"number","format":"int32","default":2,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["dataInicio","dataFim"]},
    method: "get",
    pathTemplate: "/dadosabertos/comissao/agenda/{dataInicio}/{dataFim}",
    executionParameters: [{"name":"dataInicio","in":"path"},{"name":"dataFim","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["agendareuniaomes", {
    name: "agendareuniaomes",
    description: `Obtém a Agenda das Reuniões das Comissões no mês informado no parâmetro. Formato AAAAMM.`,
    inputSchema: {"type":"object","properties":{"mesReferencia":{"type":"string","description":"Mês de referência"},"v":{"type":"number","format":"int32","default":2,"description":"Versão do serviço. Exemplificada a última disponível."}},"required":["mesReferencia"]},
    method: "get",
    pathTemplate: "/dadosabertos/comissao/agenda/mes/{mesReferencia}",
    executionParameters: [{"name":"mesReferencia","in":"path"},{"name":"v","in":"query"}],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["agendaicalcomissoes", {
    name: "agendaicalcomissoes",
    description: `Retorna a Agenda de Reuniões de Comissão para os próximos 30 dias em formato iCal, 30 dias a partir da data atual.`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/comissao/agenda/atual/iCal",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["tiposautormateria", {
    name: "tiposautormateria",
    description: `Substitua pelo serviço em [/dadosabertos/processo/tipos-autor](#Processo/tiposAutor)`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/autor/tiposAutor",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
  ["autoresmateriasemtramitacao", {
    name: "autoresmateriasemtramitacao",
    description: `Lista Parlamentares Autores de Processos em tramitação no Senado Federal ou no
Congresso Nacional, com o quantitativo de processos de sua autoria.
`,
    inputSchema: {"type":"object","properties":{}},
    method: "get",
    pathTemplate: "/dadosabertos/autor/lista/atual",
    executionParameters: [],
    requestBodyContentType: undefined,
    securityRequirements: []
  }],
]);

/**
 * Security schemes from the OpenAPI spec
 */
const securitySchemes =   {};


server.setRequestHandler(ListToolsRequestSchema, async () => {
  const toolsForClient: Tool[] = Array.from(toolDefinitionMap.values()).map(def => ({
    name: def.name,
    description: def.description,
    inputSchema: def.inputSchema
  }));
  return { tools: toolsForClient };
});


server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest): Promise<CallToolResult> => {
  const { name: toolName, arguments: toolArgs } = request.params;
  const toolDefinition = toolDefinitionMap.get(toolName);
  if (!toolDefinition) {
    console.error(`Error: Unknown tool requested: ${toolName}`);
    return { content: [{ type: "text", text: `Error: Unknown tool requested: ${toolName}` }] };
  }
  return await executeApiTool(toolName, toolDefinition, toolArgs ?? {}, securitySchemes);
});



/**
 * Type definition for cached OAuth tokens
 */
interface TokenCacheEntry {
    token: string;
    expiresAt: number;
}

/**
 * Declare global __oauthTokenCache property for TypeScript
 */
declare global {
    var __oauthTokenCache: Record<string, TokenCacheEntry> | undefined;
}

/**
 * Acquires an OAuth2 token using client credentials flow
 * 
 * @param schemeName Name of the security scheme
 * @param scheme OAuth2 security scheme
 * @returns Acquired token or null if unable to acquire
 */
async function acquireOAuth2Token(schemeName: string, scheme: any): Promise<string | null | undefined> {
    try {
        // Check if we have the necessary credentials
        const clientId = process.env[`OAUTH_CLIENT_ID_SCHEMENAME`];
        const clientSecret = process.env[`OAUTH_CLIENT_SECRET_SCHEMENAME`];
        const scopes = process.env[`OAUTH_SCOPES_SCHEMENAME`];
        
        if (!clientId || !clientSecret) {
            console.error(`Missing client credentials for OAuth2 scheme '${schemeName}'`);
            return null;
        }
        
        // Initialize token cache if needed
        if (typeof global.__oauthTokenCache === 'undefined') {
            global.__oauthTokenCache = {};
        }
        
        // Check if we have a cached token
        const cacheKey = `${schemeName}_${clientId}`;
        const cachedToken = global.__oauthTokenCache[cacheKey];
        const now = Date.now();
        
        if (cachedToken && cachedToken.expiresAt > now) {
            console.error(`Using cached OAuth2 token for '${schemeName}' (expires in ${Math.floor((cachedToken.expiresAt - now) / 1000)} seconds)`);
            return cachedToken.token;
        }
        
        // Determine token URL based on flow type
        let tokenUrl = '';
        if (scheme.flows?.clientCredentials?.tokenUrl) {
            tokenUrl = scheme.flows.clientCredentials.tokenUrl;
            console.error(`Using client credentials flow for '${schemeName}'`);
        } else if (scheme.flows?.password?.tokenUrl) {
            tokenUrl = scheme.flows.password.tokenUrl;
            console.error(`Using password flow for '${schemeName}'`);
        } else {
            console.error(`No supported OAuth2 flow found for '${schemeName}'`);
            return null;
        }
        
        // Prepare the token request
        let formData = new URLSearchParams();
        formData.append('grant_type', 'client_credentials');
        
        // Add scopes if specified
        if (scopes) {
            formData.append('scope', scopes);
        }
        
        console.error(`Requesting OAuth2 token from ${tokenUrl}`);
        
        // Make the token request
        const response = await axios({
            method: 'POST',
            url: tokenUrl,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
            },
            data: formData.toString()
        });
        
        // Process the response
        if (response.data?.access_token) {
            const token = response.data.access_token;
            const expiresIn = response.data.expires_in || 3600; // Default to 1 hour
            
            // Cache the token
            global.__oauthTokenCache[cacheKey] = {
                token,
                expiresAt: now + (expiresIn * 1000) - 60000 // Expire 1 minute early
            };
            
            console.error(`Successfully acquired OAuth2 token for '${schemeName}' (expires in ${expiresIn} seconds)`);
            return token;
        } else {
            console.error(`Failed to acquire OAuth2 token for '${schemeName}': No access_token in response`);
            return null;
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error acquiring OAuth2 token for '${schemeName}':`, errorMessage);
        return null;
    }
}


/**
 * Executes an API tool with the provided arguments
 * 
 * @param toolName Name of the tool to execute
 * @param definition Tool definition
 * @param toolArgs Arguments provided by the user
 * @param allSecuritySchemes Security schemes from the OpenAPI spec
 * @returns Call tool result
 */
async function executeApiTool(
    toolName: string,
    definition: McpToolDefinition,
    toolArgs: JsonObject,
    allSecuritySchemes: Record<string, any>
): Promise<CallToolResult> {
  try {
    // Validate arguments against the input schema
    let validatedArgs: JsonObject;
    try {
        const zodSchema = getZodSchemaFromJsonSchema(definition.inputSchema, toolName);
        const argsToParse = (typeof toolArgs === 'object' && toolArgs !== null) ? toolArgs : {};
        validatedArgs = zodSchema.parse(argsToParse);
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            const validationErrorMessage = `Invalid arguments for tool '${toolName}': ${error.errors.map(e => `${e.path.join('.')} (${e.code}): ${e.message}`).join(', ')}`;
            return { content: [{ type: 'text', text: validationErrorMessage }] };
        } else {
             const errorMessage = error instanceof Error ? error.message : String(error);
             return { content: [{ type: 'text', text: `Internal error during validation setup: ${errorMessage}` }] };
        }
    }

    // Prepare URL, query parameters, headers, and request body
    let urlPath = definition.pathTemplate;
    const queryParams: Record<string, any> = {};
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    let requestBodyData: any = undefined;

    // Apply parameters to the URL path, query, or headers
    definition.executionParameters.forEach((param) => {
        const value = validatedArgs[param.name];
        if (typeof value !== 'undefined' && value !== null) {
            if (param.in === 'path') {
                urlPath = urlPath.replace(`{${param.name}}`, encodeURIComponent(String(value)));
            }
            else if (param.in === 'query') {
                queryParams[param.name] = value;
            }
            else if (param.in === 'header') {
                headers[param.name.toLowerCase()] = String(value);
            }
        }
    });

    // Ensure all path parameters are resolved
    if (urlPath.includes('{')) {
        throw new Error(`Failed to resolve path parameters: ${urlPath}`);
    }
    
    // Construct the full URL
    const requestUrl = API_BASE_URL ? `${API_BASE_URL}${urlPath}` : urlPath;

    // Handle request body if needed
    if (definition.requestBodyContentType && typeof validatedArgs['requestBody'] !== 'undefined') {
        requestBodyData = validatedArgs['requestBody'];
        headers['content-type'] = definition.requestBodyContentType;
    }


    // Apply security requirements if available
    // Security requirements use OR between array items and AND within each object
    const appliedSecurity = definition.securityRequirements?.find(req => {
        // Try each security requirement (combined with OR)
        return Object.entries(req).every(([schemeName, scopesArray]) => {
            const scheme = allSecuritySchemes[schemeName];
            if (!scheme) return false;
            
            // API Key security (header, query, cookie)
            if (scheme.type === 'apiKey') {
                return !!process.env[`API_KEY_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
            }
            
            // HTTP security (basic, bearer)
            if (scheme.type === 'http') {
                if (scheme.scheme?.toLowerCase() === 'bearer') {
                    return !!process.env[`BEARER_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                }
                else if (scheme.scheme?.toLowerCase() === 'basic') {
                    return !!process.env[`BASIC_USERNAME_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`] && 
                           !!process.env[`BASIC_PASSWORD_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                }
            }
            
            // OAuth2 security
            if (scheme.type === 'oauth2') {
                // Check for pre-existing token
                if (process.env[`OAUTH_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`]) {
                    return true;
                }
                
                // Check for client credentials for auto-acquisition
                if (process.env[`OAUTH_CLIENT_ID_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`] &&
                    process.env[`OAUTH_CLIENT_SECRET_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`]) {
                    // Verify we have a supported flow
                    if (scheme.flows?.clientCredentials || scheme.flows?.password) {
                        return true;
                    }
                }
                
                return false;
            }
            
            // OpenID Connect
            if (scheme.type === 'openIdConnect') {
                return !!process.env[`OPENID_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
            }
            
            return false;
        });
    });

    // If we found matching security scheme(s), apply them
    if (appliedSecurity) {
        // Apply each security scheme from this requirement (combined with AND)
        for (const [schemeName, scopesArray] of Object.entries(appliedSecurity)) {
            const scheme = allSecuritySchemes[schemeName];
            
            // API Key security
            if (scheme?.type === 'apiKey') {
                const apiKey = process.env[`API_KEY_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                if (apiKey) {
                    if (scheme.in === 'header') {
                        headers[scheme.name.toLowerCase()] = apiKey;
                        console.error(`Applied API key '${schemeName}' in header '${scheme.name}'`);
                    }
                    else if (scheme.in === 'query') {
                        queryParams[scheme.name] = apiKey;
                        console.error(`Applied API key '${schemeName}' in query parameter '${scheme.name}'`);
                    }
                    else if (scheme.in === 'cookie') {
                        // Add the cookie, preserving other cookies if they exist
                        headers['cookie'] = `${scheme.name}=${apiKey}${headers['cookie'] ? `; ${headers['cookie']}` : ''}`;
                        console.error(`Applied API key '${schemeName}' in cookie '${scheme.name}'`);
                    }
                }
            } 
            // HTTP security (Bearer or Basic)
            else if (scheme?.type === 'http') {
                if (scheme.scheme?.toLowerCase() === 'bearer') {
                    const token = process.env[`BEARER_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                    if (token) {
                        headers['authorization'] = `Bearer ${token}`;
                        console.error(`Applied Bearer token for '${schemeName}'`);
                    }
                } 
                else if (scheme.scheme?.toLowerCase() === 'basic') {
                    const username = process.env[`BASIC_USERNAME_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                    const password = process.env[`BASIC_PASSWORD_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                    if (username && password) {
                        headers['authorization'] = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
                        console.error(`Applied Basic authentication for '${schemeName}'`);
                    }
                }
            }
            // OAuth2 security
            else if (scheme?.type === 'oauth2') {
                // First try to use a pre-provided token
                let token = process.env[`OAUTH_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                
                // If no token but we have client credentials, try to acquire a token
                if (!token && (scheme.flows?.clientCredentials || scheme.flows?.password)) {
                    console.error(`Attempting to acquire OAuth token for '${schemeName}'`);
                    token = (await acquireOAuth2Token(schemeName, scheme)) ?? '';
                }
                
                // Apply token if available
                if (token) {
                    headers['authorization'] = `Bearer ${token}`;
                    console.error(`Applied OAuth2 token for '${schemeName}'`);
                    
                    // List the scopes that were requested, if any
                    const scopes = scopesArray as string[];
                    if (scopes && scopes.length > 0) {
                        console.error(`Requested scopes: ${scopes.join(', ')}`);
                    }
                }
            }
            // OpenID Connect
            else if (scheme?.type === 'openIdConnect') {
                const token = process.env[`OPENID_TOKEN_${schemeName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
                if (token) {
                    headers['authorization'] = `Bearer ${token}`;
                    console.error(`Applied OpenID Connect token for '${schemeName}'`);
                    
                    // List the scopes that were requested, if any
                    const scopes = scopesArray as string[];
                    if (scopes && scopes.length > 0) {
                        console.error(`Requested scopes: ${scopes.join(', ')}`);
                    }
                }
            }
        }
    } 
    // Log warning if security is required but not available
    else if (definition.securityRequirements?.length > 0) {
        // First generate a more readable representation of the security requirements
        const securityRequirementsString = definition.securityRequirements
            .map(req => {
                const parts = Object.entries(req)
                    .map(([name, scopesArray]) => {
                        const scopes = scopesArray as string[];
                        if (scopes.length === 0) return name;
                        return `${name} (scopes: ${scopes.join(', ')})`;
                    })
                    .join(' AND ');
                return `[${parts}]`;
            })
            .join(' OR ');
            
        console.warn(`Tool '${toolName}' requires security: ${securityRequirementsString}, but no suitable credentials found.`);
    }
    

    // Prepare the axios request configuration
    const config: AxiosRequestConfig = {
      method: definition.method.toUpperCase(), 
      url: requestUrl, 
      params: queryParams, 
      headers: headers,
      ...(requestBodyData !== undefined && { data: requestBodyData }),
    };

    // Log request info to stderr (doesn't affect MCP output)
    console.error(`Executing tool "${toolName}": ${config.method} ${config.url}`);
    
    // Execute the request
    const response = await axios(config);

    // Process and format the response
    let responseText = '';
    const contentType = response.headers['content-type']?.toLowerCase() || '';
    
    // Handle JSON responses
    if (contentType.includes('application/json') && typeof response.data === 'object' && response.data !== null) {
         try { 
             responseText = JSON.stringify(response.data, null, 2); 
         } catch (e) { 
             responseText = "[Stringify Error]"; 
         }
    } 
    // Handle string responses
    else if (typeof response.data === 'string') { 
         responseText = response.data; 
    }
    // Handle other response types
    else if (response.data !== undefined && response.data !== null) { 
         responseText = String(response.data); 
    }
    // Handle empty responses
    else { 
         responseText = `(Status: ${response.status} - No body content)`; 
    }
    
    // Return formatted response
    return { 
        content: [ 
            { 
                type: "text", 
                text: `API Response (Status: ${response.status}):\n${responseText}` 
            } 
        ], 
    };

  } catch (error: unknown) {
    // Handle errors during execution
    let errorMessage: string;
    
    // Format Axios errors specially
    if (axios.isAxiosError(error)) { 
        errorMessage = formatApiError(error); 
    }
    // Handle standard errors
    else if (error instanceof Error) { 
        errorMessage = error.message; 
    }
    // Handle unexpected error types
    else { 
        errorMessage = 'Unexpected error: ' + String(error); 
    }
    
    // Log error to stderr
    console.error(`Error during execution of tool '${toolName}':`, errorMessage);
    
    // Return error message to client
    return { content: [{ type: "text", text: errorMessage }] };
  }
}


/**
 * Main function to start the server
 */
async function main() {
// Set up Web Server transport
  try {
    await setupWebServer(server, 3000);
  } catch (error) {
    console.error("Error setting up web server:", error);
    process.exit(1);
  }
}

/**
 * Cleanup function for graceful shutdown
 */
async function cleanup() {
    console.error("Shutting down MCP server...");
    process.exit(0);
}

// Register signal handlers
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start the server
main().catch((error) => {
  console.error("Fatal error in main execution:", error);
  process.exit(1);
});

/**
 * Formats API errors for better readability
 * 
 * @param error Axios error
 * @returns Formatted error message
 */
function formatApiError(error: AxiosError): string {
    let message = 'API request failed.';
    if (error.response) {
        message = `API Error: Status ${error.response.status} (${error.response.statusText || 'Status text not available'}). `;
        const responseData = error.response.data;
        const MAX_LEN = 200;
        if (typeof responseData === 'string') { 
            message += `Response: ${responseData.substring(0, MAX_LEN)}${responseData.length > MAX_LEN ? '...' : ''}`; 
        }
        else if (responseData) { 
            try { 
                const jsonString = JSON.stringify(responseData); 
                message += `Response: ${jsonString.substring(0, MAX_LEN)}${jsonString.length > MAX_LEN ? '...' : ''}`; 
            } catch { 
                message += 'Response: [Could not serialize data]'; 
            } 
        }
        else { 
            message += 'No response body received.'; 
        }
    } else if (error.request) {
        message = 'API Network Error: No response received from server.';
        if (error.code) message += ` (Code: ${error.code})`;
    } else { 
        message += `API Request Setup Error: ${error.message}`; 
    }
    return message;
}

/**
 * Converts a JSON Schema to a Zod schema for runtime validation
 * 
 * @param jsonSchema JSON Schema
 * @param toolName Tool name for error reporting
 * @returns Zod schema
 */
function getZodSchemaFromJsonSchema(jsonSchema: any, toolName: string): z.ZodTypeAny {
    if (typeof jsonSchema !== 'object' || jsonSchema === null) { 
        return z.object({}).passthrough(); 
    }
    try {
        const zodSchemaString = jsonSchemaToZod(jsonSchema);
        const zodSchema = eval(zodSchemaString);
        if (typeof zodSchema?.parse !== 'function') { 
            throw new Error('Eval did not produce a valid Zod schema.'); 
        }
        return zodSchema as z.ZodTypeAny;
    } catch (err: any) {
        console.error(`Failed to generate/evaluate Zod schema for '${toolName}':`, err);
        return z.object({}).passthrough();
    }
}
