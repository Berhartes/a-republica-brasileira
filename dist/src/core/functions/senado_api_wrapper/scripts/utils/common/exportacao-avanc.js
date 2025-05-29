"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.criarEstruturaDiretorios = criarEstruturaDiretorios;
exports.exportarParaJSON = exportarParaJSON;
exports.exportarParaCSV = exportarParaCSV;
exports.calcularCompletude = calcularCompletude;
exports.verificarConsistencia = verificarConsistencia;
exports.gerarEstatisticasGerais = gerarEstatisticasGerais;
exports.criarDadosResumidos = criarDadosResumidos;
exports.exportarObjeto = exportarObjeto;
exports.exportarDados = exportarDados;
const tslib_1 = require("tslib");
/**
 * Módulo avançado para exportação de dados com suporte a múltiplos formatos
 * e geração de estatísticas de qualidade de dados
 */
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const zlib = tslib_1.__importStar(require("zlib"));
const util_1 = require("util");
const logging_1 = require("../logging");
// Diretório base para armazenar os arquivos exportados (mantém compatibilidade com file_exporter)
const BASE_OUTPUT_DIR = path.join(process.cwd(), 'dados_extraidos');
// Converter callbacks para promises
const mkdir = (0, util_1.promisify)(fs.mkdir);
const writeFile = (0, util_1.promisify)(fs.writeFile);
const gzip = (0, util_1.promisify)(zlib.gzip);
/**
 * Cria a estrutura de diretórios para armazenar os dados exportados
 * @param legislatura - Número da legislatura
 * @param dataExtracao - Data de extração (formato YYYY-MM-DD)
 * @param caminhoBase - Caminho base para criação dos diretórios
 * @returns Caminho principal criado
 */
async function criarEstruturaDiretorios(legislatura, dataExtracao = new Date().toISOString().split('T')[0], caminhoBase = 'dados') {
    const caminhoPrincipal = path.join(BASE_OUTPUT_DIR, caminhoBase, 'senadores', `legislatura_${legislatura}`, dataExtracao);
    const diretorios = [
        path.join(caminhoPrincipal, 'perfis'),
        path.join(caminhoPrincipal, 'estatisticas')
    ];
    for (const diretorio of diretorios) {
        try {
            await mkdir(diretorio, { recursive: true });
            logging_1.logger.info(`Diretório criado: ${diretorio}`);
        }
        catch (erro) {
            logging_1.logger.warn(`Erro ao criar diretório ${diretorio}: ${erro.message}`);
            // Se o diretório já existe, seguimos adiante
            if (erro.code !== 'EEXIST') {
                throw erro;
            }
        }
    }
    return caminhoPrincipal;
}
/**
 * Exporta dados para formato JSON
 * @param dados - Dados a serem exportados
 * @param caminhoArquivo - Caminho do arquivo de destino
 * @param comprimir - Indica se o arquivo deve ser comprimido
 * @returns Caminho do arquivo gerado
 */
async function exportarParaJSON(dados, caminhoArquivo, comprimir = false) {
    const jsonString = JSON.stringify(dados, null, 2);
    const arquivoFinal = comprimir ? `${caminhoArquivo}.gz` : caminhoArquivo;
    try {
        // Garantir que o diretório exista
        const diretorio = path.dirname(arquivoFinal);
        await mkdir(diretorio, { recursive: true });
        if (comprimir) {
            const dadosComprimidos = await gzip(Buffer.from(jsonString));
            await writeFile(arquivoFinal, dadosComprimidos);
        }
        else {
            await writeFile(arquivoFinal, jsonString);
        }
        logging_1.logger.info(`Arquivo JSON exportado: ${arquivoFinal}`);
        return arquivoFinal;
    }
    catch (erro) {
        logging_1.logger.error(`Erro ao exportar para JSON (${arquivoFinal}): ${erro.message}`);
        throw erro;
    }
}
/**
 * Exporta dados para formato CSV
 * @param dados - Dados a serem exportados
 * @param caminhoArquivo - Caminho do arquivo de destino
 * @param comprimir - Indica se o arquivo deve ser comprimido
 * @returns Caminho do arquivo gerado
 */
async function exportarParaCSV(dados, caminhoArquivo, comprimir = false) {
    if (!dados || !Array.isArray(dados)) {
        throw new Error('Os dados não são um array válido');
    }
    if (!dados.length) {
        logging_1.logger.warn('Array de dados vazio para exportação CSV. Criando arquivo com apenas cabeçalhos.');
        // Continuar com a exportação mesmo se o array estiver vazio, para criar pelo menos o arquivo com cabeçalhos
    }
    try {
        // Obter cabeçalhos - se o array estiver vazio, usar um conjunto padrão de cabeçalhos
        let cabecalhos = [];
        if (dados.length > 0) {
            cabecalhos = Object.keys(dados[0]);
        }
        else {
            // Definir cabeçalhos padrão para quando o array estiver vazio
            // Isso depende do contexto, podendo ser ajustado conforme a necessidade
            cabecalhos = ['id', 'nome', 'descricao', 'data', 'observacoes'];
            logging_1.logger.info(`Usando cabeçalhos padrão para CSV: ${cabecalhos.join(', ')}`);
        }
        // Converter cada item em uma linha CSV
        const linhas = dados.map(item => cabecalhos.map(cabecalho => {
            const valor = item[cabecalho];
            // Adicionar aspas e escape para valores que contenham vírgulas
            if (typeof valor === 'string' && (valor.includes(',') || valor.includes('"') || valor.includes('\n'))) {
                return `"${valor.replace(/"/g, '""')}"`;
            }
            return valor === null || valor === undefined ? '' : String(valor);
        }).join(','));
        // Montar o conteúdo CSV completo
        const csvString = [cabecalhos.join(','), ...linhas].join('\n');
        const arquivoFinal = comprimir ? `${caminhoArquivo}.gz` : caminhoArquivo;
        // Garantir que o diretório exista
        const diretorio = path.dirname(arquivoFinal);
        await mkdir(diretorio, { recursive: true });
        if (comprimir) {
            const dadosComprimidos = await gzip(Buffer.from(csvString));
            await writeFile(arquivoFinal, dadosComprimidos);
        }
        else {
            await writeFile(arquivoFinal, csvString);
        }
        logging_1.logger.info(`Arquivo CSV exportado: ${arquivoFinal}`);
        return arquivoFinal;
    }
    catch (erro) {
        logging_1.logger.error(`Erro ao exportar para CSV (${caminhoArquivo}): ${erro.message}`);
        throw erro;
    }
}
/**
 * Calcula a completude dos dados (campos preenchidos)
 * @param dados - Dados a serem analisados
 * @returns Estatísticas de completude
 */
function calcularCompletude(dados) {
    if (!dados.length) {
        return { camposPorItem: {}, media: 0 };
    }
    const campos = Object.keys(dados[0]);
    const estatisticas = {};
    for (const campo of campos) {
        const preenchidos = dados.filter(item => item[campo] !== null &&
            item[campo] !== undefined &&
            item[campo] !== '').length;
        const total = dados.length;
        const percentual = (preenchidos / total) * 100;
        estatisticas[campo] = { preenchidos, total, percentual };
    }
    // Calcular média de completude
    const mediaCompletude = Object.values(estatisticas)
        .reduce((acc, val) => acc + val.percentual, 0) / campos.length;
    return {
        camposPorItem: estatisticas,
        media: mediaCompletude
    };
}
/**
 * Verifica a consistência dos dados (tipos e valores esperados)
 * @param dados - Dados a serem analisados
 * @returns Estatísticas de consistência
 */
function verificarConsistencia(dados) {
    if (!dados.length) {
        return {
            tiposValidos: {},
            dataCoerente: false,
            totais: { validos: 0, total: 0, percentual: 0 }
        };
    }
    const campos = Object.keys(dados[0]);
    const tiposValidos = {};
    // Verificar tipos de dados para cada campo
    for (const campo of campos) {
        let validos = 0;
        for (const item of dados) {
            const valor = item[campo];
            // Verificações específicas por tipo de campo
            if (campo.includes('data') && valor) {
                // Verificar se é uma data válida
                const dataValida = !isNaN(Date.parse(valor));
                if (dataValida)
                    validos++;
            }
            else if (campo.includes('id') || campo.includes('codigo')) {
                // Verificar se é um número ou string não vazia
                const idValido = typeof valor === 'number' ||
                    (typeof valor === 'string' && valor.trim() !== '');
                if (idValido)
                    validos++;
            }
            else if (valor !== null && valor !== undefined && valor !== '') {
                // Considerar preenchido como válido para outros campos
                validos++;
            }
        }
        const total = dados.length;
        const percentual = (validos / total) * 100;
        tiposValidos[campo] = { validos, total, percentual };
    }
    // Verificar coerência de datas 
    const datasCoerentes = dados.every(item => {
        // Verifica se existem campos de data de início e fim
        const campoDataInicio = Object.keys(item).find(k => k.toLowerCase().includes('inicio') || k.toLowerCase().includes('início'));
        const campoDataFim = Object.keys(item).find(k => k.toLowerCase().includes('fim') || k.toLowerCase().includes('término'));
        if (campoDataInicio && campoDataFim && item[campoDataInicio] && item[campoDataFim]) {
            return new Date(item[campoDataInicio]) < new Date(item[campoDataFim]);
        }
        return true;
    });
    // Calcular totais
    const totalCampos = Object.keys(tiposValidos).length * dados.length;
    const totalValidos = Object.values(tiposValidos)
        .reduce((acc, val) => acc + val.validos, 0);
    const percentualTotal = (totalValidos / totalCampos) * 100;
    return {
        tiposValidos,
        dataCoerente: datasCoerentes,
        totais: {
            validos: totalValidos,
            total: totalCampos,
            percentual: percentualTotal
        }
    };
}
/**
 * Gera estatísticas gerais sobre os dados
 * @param dados - Dados a serem analisados
 * @returns Estatísticas gerais
 */
function gerarEstatisticasGerais(dados) {
    const distribuicaoPorEstado = {};
    const distribuicaoPorPartido = {};
    const distribuicaoPorGenero = {};
    for (const item of dados) {
        // Contagem por estado - procurar campos comuns que representam estado
        const uf = item.ufRepresentacao || item.uf || item.estado || '';
        if (uf) {
            distribuicaoPorEstado[uf] = (distribuicaoPorEstado[uf] || 0) + 1;
        }
        // Contagem por partido - procurar campos comuns que representam partido
        const partido = item.siglaPartido || (item.partido && item.partido.sigla) || '';
        if (partido) {
            distribuicaoPorPartido[partido] = (distribuicaoPorPartido[partido] || 0) + 1;
        }
        // Contagem por gênero - procurar campos comuns que representam gênero
        let genero = item.sexo || item.genero || '';
        if (typeof genero === 'string') {
            genero = genero.toUpperCase();
            if (genero === 'M' || genero === 'MASCULINO') {
                distribuicaoPorGenero['Masculino'] = (distribuicaoPorGenero['Masculino'] || 0) + 1;
            }
            else if (genero === 'F' || genero === 'FEMININO') {
                distribuicaoPorGenero['Feminino'] = (distribuicaoPorGenero['Feminino'] || 0) + 1;
            }
            else if (genero) {
                distribuicaoPorGenero[genero] = (distribuicaoPorGenero[genero] || 0) + 1;
            }
        }
    }
    return {
        totalPerfis: dados.length,
        distribuicaoPorEstado,
        distribuicaoPorPartido,
        distribuicaoPorGenero,
        dataExtracao: new Date().toISOString(),
        tempoProcessamento: 0 // Será calculado no código principal
    };
}
/**
 * Processa dados para criar versões resumidas
 * @param dados - Dados completos a serem resumidos
 * @returns Versão resumida dos dados
 */
function criarDadosResumidos(dados) {
    return dados.map(item => {
        // Identificar os campos relevantes para o resumo
        const campoId = Object.keys(item).find(k => k.toLowerCase() === 'id' || k.toLowerCase() === 'codigo' || k.toLowerCase().includes('codigo'));
        const campoNome = Object.keys(item).find(k => k.toLowerCase() === 'nome' || k.toLowerCase().includes('nome'));
        const campoPartido = Object.keys(item).find(k => k.toLowerCase().includes('partido') || k.toLowerCase().includes('sigla'));
        const campoUF = Object.keys(item).find(k => k.toLowerCase() === 'uf' || k.toLowerCase().includes('estado') || k.toLowerCase().includes('representacao'));
        const campoGenero = Object.keys(item).find(k => k.toLowerCase() === 'sexo' || k.toLowerCase() === 'genero');
        // Construir resumo
        const resumo = {};
        if (campoId)
            resumo.id = item[campoId];
        if (campoNome)
            resumo.nome = item[campoNome];
        if (campoPartido) {
            if (typeof item[campoPartido] === 'string') {
                resumo.partido = item[campoPartido];
            }
            else if (typeof item[campoPartido] === 'object' && item[campoPartido]?.sigla) {
                resumo.partido = item[campoPartido].sigla;
            }
        }
        if (campoUF)
            resumo.uf = item[campoUF];
        if (campoGenero)
            resumo.genero = item[campoGenero];
        // Adicionar outros campos básicos se existirem
        if (item.email)
            resumo.email = item.email;
        if (item.mandatoInicio)
            resumo.mandatoInicio = item.mandatoInicio;
        if (item.mandatoFim)
            resumo.mandatoFim = item.mandatoFim;
        if (item.situacao)
            resumo.situacao = item.situacao;
        if (item.urlFoto)
            resumo.urlFoto = item.urlFoto;
        return resumo;
    });
}
/**
 * Exporta um objeto para formato JSON
 * @param objeto - Objeto a ser exportado
 * @param caminhoArquivo - Caminho do arquivo de destino
 * @param comprimir - Indica se o arquivo deve ser comprimido
 * @returns Caminho do arquivo gerado
 */
async function exportarObjeto(objeto, caminhoArquivo, comprimir = false) {
    const jsonString = JSON.stringify(objeto, null, 2);
    const arquivoFinal = comprimir ? `${caminhoArquivo}.gz` : caminhoArquivo;
    try {
        // Garantir que o diretório exista
        const diretorio = path.dirname(arquivoFinal);
        await mkdir(diretorio, { recursive: true });
        if (comprimir) {
            const dadosComprimidos = await gzip(Buffer.from(jsonString));
            await writeFile(arquivoFinal, dadosComprimidos);
        }
        else {
            await writeFile(arquivoFinal, jsonString);
        }
        logging_1.logger.info(`Arquivo JSON exportado: ${arquivoFinal}`);
        return arquivoFinal;
    }
    catch (erro) {
        logging_1.logger.error(`Erro ao exportar objeto para JSON (${arquivoFinal}): ${erro.message}`);
        throw erro;
    }
}
/**
 * Função principal para exportar dados e gerar estatísticas
 * @param dados - Dados a serem exportados
 * @param legislatura - Número da legislatura
 * @param opcoes - Opções de exportação
 * @param tempoInicio - Timestamp de início do processamento (para cálculo do tempo total)
 */
async function exportarDados(dados, legislatura, opcoes, tempoInicio) {
    try {
        const dataExtracao = new Date().toISOString().split('T')[0];
        const diretorioBase = await criarEstruturaDiretorios(legislatura, dataExtracao, opcoes.caminhoBase || 'dados');
        // Verificar se há dados para exportar
        if (dados.length === 0) {
            logging_1.logger.warn('Array de dados vazio para exportação avançada. Criando apenas resumo e metadados.');
            // Criar um resumo básico para casos de dados vazios
            const resumoVazio = {
                timestamp: new Date().toISOString(),
                legislatura: legislatura,
                status: 'success',
                mensagem: 'Nenhum dado disponível para exportação',
                tempoProcessamento: (Date.now() - tempoInicio) / 1000
            };
            // Exportar resumo
            await exportarObjeto(resumoVazio, path.join(diretorioBase, 'estatisticas', 'resumo.json'));
            logging_1.logger.info('Resumo básico criado para dataset vazio');
            return;
        }
        // Criar dados resumidos
        const dadosResumidos = criarDadosResumidos(dados);
        // Exportar dados conforme as opções
        if (opcoes.formato === 'json' || opcoes.formato === 'ambos') {
            if (opcoes.nivelDetalhamento === 'completo' || opcoes.nivelDetalhamento === 'ambos') {
                await exportarParaJSON(dados, path.join(diretorioBase, 'perfis', 'perfis_completos.json'), opcoes.comprimir);
            }
            if (opcoes.nivelDetalhamento === 'resumido' || opcoes.nivelDetalhamento === 'ambos') {
                await exportarParaJSON(dadosResumidos, path.join(diretorioBase, 'perfis', 'perfis_resumidos.json'), opcoes.comprimir);
            }
        }
        if (opcoes.formato === 'csv' || opcoes.formato === 'ambos') {
            if (opcoes.nivelDetalhamento === 'completo' || opcoes.nivelDetalhamento === 'ambos') {
                await exportarParaCSV(dados, path.join(diretorioBase, 'perfis', 'perfis_completos.csv'), opcoes.comprimir);
            }
            if (opcoes.nivelDetalhamento === 'resumido' || opcoes.nivelDetalhamento === 'ambos') {
                await exportarParaCSV(dadosResumidos, path.join(diretorioBase, 'perfis', 'perfis_resumidos.csv'), opcoes.comprimir);
            }
        }
        // Calcular e exportar estatísticas
        const tempoFim = Date.now();
        const tempoProcessamento = (tempoFim - tempoInicio) / 1000; // em segundos
        const completude = calcularCompletude(dados);
        const consistencia = verificarConsistencia(dados);
        const estatisticasGerais = gerarEstatisticasGerais(dados);
        estatisticasGerais.tempoProcessamento = tempoProcessamento;
        // Criar um novo arquivo para exportar objetos de estatísticas
        await exportarObjeto(completude, path.join(diretorioBase, 'estatisticas', 'completude.json'));
        await exportarObjeto(consistencia, path.join(diretorioBase, 'estatisticas', 'consistencia.json'));
        await exportarObjeto(estatisticasGerais, path.join(diretorioBase, 'estatisticas', 'resumo.json'));
        logging_1.logger.info('=================================================');
        logging_1.logger.info(`✅ Exportação concluída com sucesso!`);
        logging_1.logger.info(`📂 Diretório: ${diretorioBase}`);
        logging_1.logger.info(`📊 Total de perfis: ${dados.length}`);
        logging_1.logger.info(`🔍 Completude média: ${completude.media.toFixed(2)}%`);
        logging_1.logger.info(`⏱️ Tempo de processamento: ${tempoProcessamento.toFixed(2)}s`);
        logging_1.logger.info('=================================================');
    }
    catch (erro) {
        logging_1.logger.error(`❌ Erro ao exportar dados: ${erro.message}`);
        throw erro;
    }
}
//# sourceMappingURL=exportacao-avanc.js.map