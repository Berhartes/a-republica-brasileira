/**
 * Script para processamento de discursos de deputados
 * Este script implementa o fluxo ETL completo para discursos de deputados:
 * 1. Extração de dados da API da Câmara dos Deputados (COM PAGINAÇÃO)
 * 2. Transformação dos dados para o formato padronizado
 * 3. Carregamento dos dados no Firestore
 */
import { logger } from '../utils/logging/logger';
import { PerfilDeputadosExtractor } from '../extracao/perfildeputados';
import { firestoreDb as db } from '../utils/storage/firestore';
import { parseArgs } from '../utils/cli/args-parser';
import * as api from '../utils/api';
import { endpoints } from '../config/endpoints';
import { withRetry } from '../utils/logging/error-handler';
// Configurações padrão
const LEGISLATURA_ATUAL = 57; // 57ª Legislatura (2023-2027)
const LIMITE_PADRAO = 0; // 0 = sem limite
const ITENS_POR_PAGINA = 75; // Máximo de itens por página na API
/**
 * Classe especializada para extração de discursos com paginação
 */
class DiscursosExtractor {
    /**
     * Extrai discursos em modo atualização incremental
     * Processa apenas discursos dos últimos 60 dias
     * @param deputadoId - ID do deputado
     * @param legislatura - Número da legislatura
     * @returns Apenas discursos dos últimos 60 dias
     */
    async extractDiscursosAtualizacao(deputadoId, legislatura) {
        try {
            logger.info(`Iniciando atualização incremental de discursos do deputado ${deputadoId}`);
            // 1. Verificar dados existentes no Firestore
            const dadosExistentes = await this.verificarDadosExistentes(deputadoId.toString());
            // 2. Calcular data limite (60 dias atrás)
            const dataLimite = this.calcularDataLimite60Dias();
            // 3. Extrair todos os discursos e filtrar por data
            const todosDiscursos = await this.extractDiscursosCompletos(deputadoId, legislatura);
            if (todosDiscursos.erro) {
                return todosDiscursos;
            }
            // 4. Filtrar apenas discursos dos últimos 60 dias
            const discursosRecentes = todosDiscursos.discursos.filter(discurso => {
                const dataDiscurso = new Date(discurso.dataHoraInicio);
                return dataDiscurso >= dataLimite;
            });
            // 5. Verificar quais são realmente novos (não existem no Firestore)
            const discursosNovos = await this.filtrarDiscursosNovos(discursosRecentes, dadosExistentes.discursosExistentes);
            if (discursosNovos.length === 0) {
                logger.info(`✅ Deputado ${deputadoId} já está atualizado - nenhum novo discurso nos últimos 60 dias`);
                return {
                    deputadoId: deputadoId.toString(),
                    totalDiscursos: 0,
                    totalPaginas: 0,
                    discursos: [],
                    anosComDiscursos: [],
                    periodosProcessados: []
                };
            }
            logger.info(`🔄 Deputado ${deputadoId}: encontrados ${discursosNovos.length} novos discursos dos últimos 60 dias`);
            // 6. Calcular estatísticas dos novos discursos
            const anosComDiscursos = [...new Set(discursosNovos.map(d => d.anoDiscurso))].sort();
            const periodosProcessados = this.extrairPeriodosDiscursos(discursosNovos);
            return {
                deputadoId: deputadoId.toString(),
                totalDiscursos: discursosNovos.length,
                totalPaginas: todosDiscursos.totalPaginas,
                discursos: discursosNovos,
                anosComDiscursos,
                periodosProcessados
            };
        }
        catch (error) {
            logger.error(`Erro na atualização incremental de discursos do deputado ${deputadoId}: ${error.message}`);
            return {
                deputadoId: deputadoId.toString(),
                totalDiscursos: 0,
                totalPaginas: 0,
                discursos: [],
                anosComDiscursos: [],
                erro: error.message
            };
        }
    }
    /**
     * Verifica dados existentes do deputado no Firestore
     * @param deputadoId - ID do deputado
     * @returns Dados existentes
     */
    async verificarDadosExistentes(deputadoId) {
        try {
            const discursosArrayRef = db.doc(`congressoNacional/camaraDeputados/discursos/${deputadoId}/dados/items`);
            const doc = await discursosArrayRef.get();
            if (!doc.exists) {
                logger.info(`Deputado ${deputadoId} não tem discursos no Firestore - processará todos os discursos recentes`);
                return { discursosExistentes: [] };
            }
            const dados = doc.data();
            const discursosExistentes = (dados?.items || []).map((item) => item.id);
            logger.info(`Deputado ${deputadoId} tem ${discursosExistentes.length} discursos já processados`);
            return { discursosExistentes };
        }
        catch (error) {
            logger.warn(`Erro ao verificar dados existentes do deputado ${deputadoId}: ${error.message}`);
            return { discursosExistentes: [] };
        }
    }
    /**
     * Calcula a data limite para filtrar discursos (60 dias atrás)
     * @returns Data limite
     */
    calcularDataLimite60Dias() {
        const agora = new Date();
        const dataLimite = new Date(agora);
        dataLimite.setDate(dataLimite.getDate() - 60); // 60 dias atrás
        logger.info(`Data limite para discursos: ${dataLimite.toISOString().split('T')[0]}`);
        return dataLimite;
    }
    /**
     * Filtra discursos que são realmente novos (não existem no Firestore)
     * @param discursosRecentes - Discursos dos últimos 60 dias
     * @param idsExistentes - IDs de discursos já salvos
     * @returns Apenas discursos novos
     */
    async filtrarDiscursosNovos(discursosRecentes, idsExistentes) {
        const discursosNovos = discursosRecentes.filter(discurso => {
            return !idsExistentes.includes(discurso.id);
        });
        logger.info(`Filtrados ${discursosNovos.length} discursos novos de ${discursosRecentes.length} discursos recentes`);
        return discursosNovos;
    }
    /**
     * Extrai períodos (ano/mês) dos discursos
     * @param discursos - Lista de discursos
     * @returns Períodos únicos
     */
    extrairPeriodosDiscursos(discursos) {
        const periodos = new Set();
        discursos.forEach(discurso => {
            const chave = `${discurso.anoDiscurso}-${discurso.mesDiscurso.toString().padStart(2, '0')}`;
            periodos.add(chave);
        });
        return Array.from(periodos).map(periodo => {
            const [ano, mes] = periodo.split('-');
            return { ano: parseInt(ano), mes: parseInt(mes) };
        }).sort((a, b) => {
            if (a.ano !== b.ano)
                return a.ano - b.ano;
            return a.mes - b.mes;
        });
    }
    /**
     * Extrai todos os discursos de um deputado usando paginação
     * @param deputadoId - ID do deputado
     * @param legislatura - Número da legislatura
     * @returns Todos os discursos do deputado
     */
    async extractDiscursosCompletos(deputadoId, legislatura) {
        try {
            logger.info(`Iniciando extração completa de discursos do deputado ${deputadoId}`);
            const todosDiscursos = [];
            let paginaAtual = 1;
            let totalPaginas = 1;
            let temMaisPaginas = true;
            while (temMaisPaginas) {
                try {
                    logger.info(`Extraindo página ${paginaAtual} de discursos do deputado ${deputadoId}`);
                    // Configurar endpoint com paginação
                    const endpointConfig = endpoints.DEPUTADOS.DISCURSOS;
                    const endpoint = api.replacePath(endpointConfig.PATH, { codigo: deputadoId.toString() });
                    // Parâmetros com paginação
                    const params = {
                        ...endpointConfig.PARAMS,
                        idLegislatura: legislatura.toString(),
                        pagina: paginaAtual.toString(),
                        itens: ITENS_POR_PAGINA.toString(),
                        ordenarPor: 'dataHoraInicio',
                        ordem: 'DESC'
                    };
                    // Log de debug dos parâmetros
                    logger.info(`🔍 Parâmetros da requisição: ${JSON.stringify(params, null, 2)}`);
                    // Fazer requisição com retry
                    logger.info(`🔍 DEBUG: URL completa: ${endpoints.BASE_URL}${endpoint}?${new URLSearchParams(params).toString()}`);
                    const response = await withRetry(async () => api.get(endpoint, params), endpoints.REQUEST.RETRY_ATTEMPTS, endpoints.REQUEST.RETRY_DELAY, `Extração discursos do deputado ${deputadoId} - página ${paginaAtual}`);
                    // Log de debug da resposta
                    logger.info(`🔍 Resposta recebida: ${response ? 'SIM' : 'NÃO'}, dados: ${response?.dados ? response.dados.length : 'NENHUM'} itens`);
                    if (response?.links) {
                        logger.info(`🔍 Links de paginação: ${JSON.stringify(response.links, null, 2)}`);
                    }
                    if (!response || !response.dados) {
                        logger.warn(`Sem dados na página ${paginaAtual} para deputado ${deputadoId}`);
                        break;
                    }
                    const discursosPagina = response.dados;
                    logger.info(`Encontrados ${discursosPagina.length} discursos na página ${paginaAtual}`);
                    // Se não há discursos nesta página, parar
                    if (!Array.isArray(discursosPagina) || discursosPagina.length === 0) {
                        logger.info(`Página ${paginaAtual} vazia - finalizando extração`);
                        break;
                    }
                    // Transformar e adicionar discursos desta página
                    const discursosTransformados = discursosPagina.map((discurso) => this.transformDiscurso(discurso, deputadoId.toString()));
                    todosDiscursos.push(...discursosTransformados);
                    // Verificar se há mais páginas
                    // Se retornou menos que o máximo de itens, é a última página
                    if (discursosPagina.length < ITENS_POR_PAGINA) {
                        logger.info(`Página ${paginaAtual} retornou ${discursosPagina.length} itens (< ${ITENS_POR_PAGINA}) - última página`);
                        temMaisPaginas = false;
                    }
                    else {
                        paginaAtual++;
                        // Delay entre páginas para não sobrecarregar a API
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
                catch (error) {
                    logger.error(`Erro ao extrair página ${paginaAtual} do deputado ${deputadoId}: ${error.message}`);
                    // Se é erro de página não encontrada ou similar, parar
                    if (error.message?.includes('404') || error.message?.includes('Página não encontrada')) {
                        logger.info(`Página ${paginaAtual} não encontrada - finalizando extração`);
                        break;
                    }
                    // Para outros erros, tentar próxima página (pode ser erro temporário)
                    logger.warn(`Erro na página ${paginaAtual}, tentando próxima...`);
                    paginaAtual++;
                    // Mas não continuar indefinidamente
                    if (paginaAtual > 50) { // Limite de segurança
                        logger.warn(`Muitas páginas processadas (${paginaAtual}), parando por segurança`);
                        break;
                    }
                }
            }
            totalPaginas = paginaAtual - 1;
            // Calcular estatísticas
            const anosComDiscursos = [...new Set(todosDiscursos.map(d => d.anoDiscurso))].sort();
            logger.info(`Extração completa finalizada para deputado ${deputadoId}: ${todosDiscursos.length} discursos em ${totalPaginas} páginas`);
            return {
                deputadoId: deputadoId.toString(),
                totalDiscursos: todosDiscursos.length,
                totalPaginas,
                discursos: todosDiscursos,
                anosComDiscursos,
            };
        }
        catch (error) {
            logger.error(`Erro na extração completa de discursos do deputado ${deputadoId}: ${error.message}`);
            return {
                deputadoId: deputadoId.toString(),
                totalDiscursos: 0,
                totalPaginas: 0,
                discursos: [],
                anosComDiscursos: [],
                erro: error.message
            };
        }
    }
    /**
     * Transforma um discurso bruto em formato padronizado
     * @param discurso - Discurso bruto da API
     * @param deputadoId - ID do deputado
     * @returns Discurso transformado
     */
    transformDiscurso(discurso, deputadoId) {
        // Extrair ano e mês da data do discurso
        const dataDiscurso = new Date(discurso.dataHoraInicio || discurso.dataHora || '');
        const anoDiscurso = dataDiscurso.getFullYear() || 0;
        const mesDiscurso = dataDiscurso.getMonth() + 1 || 0;
        return {
            // Dados básicos
            id: discurso.id?.toString() || '',
            dataHoraInicio: discurso.dataHoraInicio || discurso.dataHora || '',
            dataHoraFim: discurso.dataHoraFim || '',
            tipoDiscurso: discurso.tipoDiscurso || discurso.tipo || '',
            // Conteúdo
            sumario: discurso.sumario || discurso.descricao || '',
            transcricao: discurso.transcricao || discurso.textoDiscurso || '',
            palavrasChave: Array.isArray(discurso.palavrasChave) ? discurso.palavrasChave :
                (discurso.palavrasChave ? discurso.palavrasChave.split(',').map((p) => p.trim()) : []),
            // Evento/Contexto
            faseEvento: discurso.faseEvento?.nome || discurso.faseEvento || '',
            tipoEvento: discurso.tipoEvento || '',
            codEvento: discurso.codEvento?.toString() || discurso.evento?.id?.toString() || '',
            // URLs e recursos
            urlAudio: discurso.urlAudio || '',
            urlTexto: discurso.urlTexto || discurso.uriTexto || '',
            // Metadados
            idDeputado: deputadoId,
            dataExtracao: new Date().toISOString(),
            anoDiscurso,
            mesDiscurso
        };
    }
}
/**
 * Detecta e valida a legislatura a partir dos argumentos da linha de comando
 * Suporta múltiplos formatos: --57, --56, --55, 57, --legislatura 57
 * @param args - Argumentos parseados
 * @returns Número da legislatura validado
 */
function detectarLegislatura(args) {
    let legislatura = LEGISLATURA_ATUAL; // Padrão: 57
    // Método 1: Detectar argumentos numéricos com hífen (ex: --57, --56, --55)
    // Este é o método principal usado no script do senado
    for (const arg of process.argv) {
        const match = arg.match(/^--?(\d+)$/);
        if (match) {
            const numLegislatura = parseInt(match[1], 10);
            // Validar range específico para Câmara dos Deputados
            if (numLegislatura >= 50 && numLegislatura <= 60) {
                legislatura = numLegislatura;
                logger.info(`🏛️ Legislatura detectada via argumento numérico (--${legislatura}): ${legislatura}ª Legislatura`);
                return legislatura;
            }
            else if (numLegislatura >= 1 && numLegislatura <= 100) {
                // Range mais amplo mas com aviso (para compatibilidade histórica)
                logger.warn(`⚠️ Legislatura ${numLegislatura} fora do range comum (50-60), mas será aceita`);
                legislatura = numLegislatura;
                logger.info(`🏛️ Legislatura detectada via argumento numérico (--${legislatura}): ${legislatura}ª Legislatura`);
                return legislatura;
            }
            else {
                logger.error(`❌ Legislatura inválida: ${numLegislatura}. Para a Câmara dos Deputados, use valores entre 50 e 60.`);
                process.exit(1);
            }
        }
    }
    // Método 2: Usar parâmetro --legislatura tradicional
    if (args.legislatura !== undefined) {
        const legislaturaArg = parseInt(args.legislatura, 10);
        if (legislaturaArg >= 1 && legislaturaArg <= 100) {
            legislatura = legislaturaArg;
            logger.info(`🏛️ Legislatura detectada via parâmetro --legislatura: ${legislatura}ª Legislatura`);
            return legislatura;
        }
        else {
            logger.error(`❌ Legislatura inválida: ${args.legislatura}. Deve ser um número entre 1 e 100.`);
            process.exit(1);
        }
    }
    // Método 3: Primeiro argumento numérico (compatibilidade)
    const primeiroArg = process.argv[2];
    if (primeiroArg && !primeiroArg.startsWith('-') && !isNaN(parseInt(primeiroArg, 10))) {
        const legislaturaArg = parseInt(primeiroArg, 10);
        if (legislaturaArg >= 1 && legislaturaArg <= 100) {
            legislatura = legislaturaArg;
            logger.info(`🏛️ Legislatura detectada via primeiro argumento: ${legislatura}ª Legislatura`);
            return legislatura;
        }
        else {
            logger.error(`❌ Legislatura inválida: ${legislaturaArg}. Deve ser um número entre 1 e 100.`);
            process.exit(1);
        }
    }
    // Se chegou aqui, usar legislatura padrão
    logger.info(`🏛️ Usando legislatura padrão: ${legislatura}ª Legislatura (${LEGISLATURA_ATUAL})`);
    return legislatura;
}
/**
 * Função principal para processamento de discursos de deputados
 */
async function processarDiscursosDeputados() {
    try {
        // Obter argumentos da linha de comando
        const args = parseArgs();
        const limite = args.limite !== undefined ? parseInt(args.limite, 10) : LIMITE_PADRAO;
        const concorrencia = args.concorrencia !== undefined ? parseInt(args.concorrencia, 10) : 2;
        const modoAtualizacao = args.atualizar !== undefined;
        // Detectar e validar legislatura usando a função padronizada
        const legislatura = detectarLegislatura(args);
        logger.info(`Iniciando processamento de discursos de deputados da legislatura ${legislatura}`);
        logger.info(`Configurações: limite=${limite}, concorrência=${concorrencia}, modo=${modoAtualizacao ? 'ATUALIZAÇÃO INCREMENTAL (60 dias)' : 'COMPLETO'}`);
        logger.info(`${modoAtualizacao ? '📋 Modo Atualização: Processará apenas discursos novos dos últimos 60 dias' : '📋 Modo Completo: Processará todos os discursos disponíveis'}`);
        logger.info(`🏛️ Processando discursos da ${legislatura}ª Legislatura`);
        // Inicializar extratores
        const perfilExtractor = new PerfilDeputadosExtractor();
        const discursosExtractor = new DiscursosExtractor();
        // 1. Extrair lista de deputados da legislatura
        logger.info('Etapa 1: Extraindo lista de deputados');
        const listaDeputados = await perfilExtractor.extractDeputadosLegislatura(legislatura);
        if (!listaDeputados.deputados || listaDeputados.deputados.length === 0) {
            logger.error(`Nenhum deputado encontrado para a legislatura ${legislatura}`);
            return;
        }
        logger.info(`Encontrados ${listaDeputados.deputados.length} deputados na legislatura ${legislatura}`);
        // Aplicar limite se especificado
        let deputadosParaProcessar = listaDeputados.deputados;
        if (limite > 0 && limite < deputadosParaProcessar.length) {
            logger.info(`Aplicando limite de ${limite} deputados`);
            deputadosParaProcessar = deputadosParaProcessar.slice(0, limite);
        }
        // 2. Extrair discursos de cada deputado (modo completo ou atualização)
        const tipoProcessamento = modoAtualizacao ? 'atualização incremental' : 'discursos completos';
        logger.info(`Etapa 2: Extraindo ${tipoProcessamento} de ${deputadosParaProcessar.length} deputados`);
        // Extrair apenas os IDs dos deputados
        const idsDeputados = deputadosParaProcessar.map((deputado) => deputado.id);
        // Estatísticas
        let totalDiscursosExtraidos = 0;
        let deputadosProcessados = 0;
        let deputadosComErro = 0;
        let deputadosJaAtualizados = 0; // Para modo atualização
        // Processar deputados com concorrência controlada
        for (let i = 0; i < idsDeputados.length; i += concorrencia) {
            const lote = idsDeputados.slice(i, i + concorrencia);
            logger.info(`Processando lote ${Math.floor(i / concorrencia) + 1} com ${lote.length} deputados`);
            // Processar lote em paralelo
            const promessas = lote.map(async (idDeputado) => {
                try {
                    let resultadoDiscursos;
                    // Escolher método baseado no modo
                    if (modoAtualizacao) {
                        // Modo atualização incremental
                        resultadoDiscursos = await discursosExtractor.extractDiscursosAtualizacao(idDeputado, legislatura);
                    }
                    else {
                        // Modo completo (todos os discursos)
                        resultadoDiscursos = await discursosExtractor.extractDiscursosCompletos(idDeputado, legislatura);
                    }
                    if (resultadoDiscursos.erro) {
                        logger.error(`Erro na extração de discursos do deputado ${idDeputado}: ${resultadoDiscursos.erro}`);
                        deputadosComErro++;
                        return null;
                    }
                    // Verificar se há dados para salvar
                    if (resultadoDiscursos.totalDiscursos === 0) {
                        if (modoAtualizacao) {
                            logger.info(`✅ Deputado ${idDeputado}: atualizado - nenhum novo discurso nos últimos 60 dias`);
                            deputadosJaAtualizados++;
                        }
                        else {
                            logger.info(`ℹ️ Deputado ${idDeputado}: nenhum discurso encontrado`);
                        }
                        deputadosProcessados++;
                        return resultadoDiscursos;
                    }
                    // Salvar discursos no Firestore (modo incremental ou completo)
                    await salvarDiscursosFirestore(resultadoDiscursos, modoAtualizacao);
                    // Atualizar estatísticas
                    totalDiscursosExtraidos += resultadoDiscursos.totalDiscursos;
                    deputadosProcessados++;
                    const modoTexto = modoAtualizacao ? 'novos discursos' : 'discursos';
                    logger.info(`✅ Deputado ${idDeputado}: ${resultadoDiscursos.totalDiscursos} ${modoTexto} em ${resultadoDiscursos.totalPaginas} páginas`);
                    return resultadoDiscursos;
                }
                catch (error) {
                    logger.error(`Erro ao processar deputado ${idDeputado}: ${error.message}`);
                    deputadosComErro++;
                    return null;
                }
            });
            // Aguardar conclusão do lote
            await Promise.allSettled(promessas);
            // Log de progresso
            logger.info(`Progresso: ${Math.min(i + concorrencia, idsDeputados.length)}/${idsDeputados.length} deputados processados`);
            // Delay entre lotes para não sobrecarregar a API
            if (i + concorrencia < idsDeputados.length) {
                logger.info('Aguardando 5 segundos antes do próximo lote...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        // 3. Resumo final
        logger.info('====================================================');
        logger.info(`📊 RESUMO DO PROCESSAMENTO DE DISCURSOS`);
        logger.info('====================================================');
        logger.info(`🔧 Modo: ${modoAtualizacao ? 'ATUALIZAÇÃO INCREMENTAL (últimos 60 dias)' : 'PROCESSAMENTO COMPLETO'}`);
        logger.info(`✅ Deputados processados com sucesso: ${deputadosProcessados}`);
        if (modoAtualizacao && deputadosJaAtualizados > 0) {
            logger.info(`🔄 Deputados já atualizados (sem novos dados): ${deputadosJaAtualizados}`);
        }
        logger.info(`❌ Deputados com erro: ${deputadosComErro}`);
        logger.info(`🎤 Total de ${modoAtualizacao ? 'novos ' : ''}discursos extraídos: ${totalDiscursosExtraidos.toLocaleString()}`);
        if (modoAtualizacao) {
            logger.info(`📅 Período verificado: últimos 60 dias`);
        }
        logger.info('====================================================');
        logger.info('Processamento de discursos de deputados concluído com sucesso');
    }
    catch (error) {
        logger.error(`Erro no processamento de discursos de deputados: ${error.message}`);
        logger.error(error.stack);
        process.exit(1);
    }
}
/**
 * Salva os discursos de um deputado no Firestore
 * Estrutura: /discursos/{codigo} (similar aos perfis e despesas)
 * @param resultadoDiscursos - Resultado da extração de discursos
 * @param modoAtualizacao - Se true, adiciona aos dados existentes; se false, substitui tudo
 */
async function salvarDiscursosFirestore(resultadoDiscursos, modoAtualizacao = false) {
    try {
        const { deputadoId, discursos, totalDiscursos, totalPaginas, anosComDiscursos, periodosProcessados } = resultadoDiscursos;
        logger.info(`Salvando ${totalDiscursos} ${modoAtualizacao ? 'novos ' : ''}discursos do deputado ${deputadoId} no Firestore`);
        // Referência do documento principal
        const deputadoDiscursosRef = db.doc(`congressoNacional/camaraDeputados/discursos/${deputadoId}`);
        const discursosArrayRef = db.doc(`congressoNacional/camaraDeputados/discursos/${deputadoId}/dados/items`);
        let dadosFinais;
        let discursosFinais;
        if (modoAtualizacao && totalDiscursos > 0) {
            // MODO ATUALIZAÇÃO: Mesclar com dados existentes
            logger.info(`Modo atualização: mesclando ${totalDiscursos} novos discursos com dados existentes`);
            // 1. Ler dados existentes
            const [docPrincipal, docDiscursos] = await Promise.all([
                deputadoDiscursosRef.get(),
                discursosArrayRef.get()
            ]);
            const dadosExistentes = docPrincipal.exists ? (docPrincipal.data() || {}) : {};
            const discursosExistentes = docDiscursos.exists ? (docDiscursos.data()?.items || []) : [];
            logger.info(`Dados existentes: ${discursosExistentes.length} discursos`);
            // 2. Combinar discursos (adicionar novos aos existentes)
            discursosFinais = [...discursosExistentes, ...discursos];
            // 3. Recalcular estatísticas totais
            const anosFinais = [...new Set(discursosFinais.map((d) => d.anoDiscurso))].sort();
            // 4. Atualizar controle de períodos processados
            const periodosProcessadosExistentes = dadosExistentes?.periodosProcessados || [];
            const periodosProcessadosNovos = [...periodosProcessadosExistentes];
            // Marcar novos períodos como processados
            if (periodosProcessados && periodosProcessados.length > 0) {
                const agora = new Date().toISOString();
                periodosProcessados.forEach(({ ano, mes }) => {
                    const chave = `${ano}-${mes.toString().padStart(2, '0')}`;
                    const jaExiste = periodosProcessadosNovos.some((p) => p.periodo === chave);
                    if (!jaExiste) {
                        periodosProcessadosNovos.push({ periodo: chave, dataProcessamento: agora });
                    }
                });
            }
            // 5. Preparar dados finais mesclados
            dadosFinais = {
                idDeputado: deputadoId,
                totalDiscursos: discursosFinais.length,
                totalPaginas: (dadosExistentes?.totalPaginas || 0) + totalPaginas,
                anosComDiscursos: anosFinais,
                ultimaAtualizacao: new Date().toISOString(),
                periodosProcessados: periodosProcessadosNovos,
                // Recalcular estatísticas por ano
                estatisticasPorAno: anosFinais.map((ano) => {
                    const discursosAno = discursosFinais.filter((d) => d.anoDiscurso === ano);
                    return {
                        ano,
                        totalDiscursos: discursosAno.length
                    };
                }),
                // Recalcular estatísticas por tipo de discurso
                estatisticasPorTipo: Object.entries(discursosFinais.reduce((acc, discurso) => {
                    const tipo = discurso.tipoDiscurso || 'Não informado';
                    acc[tipo] = (acc[tipo] || 0) + 1;
                    return acc;
                }, {})).map(([tipo, quantidade]) => ({ tipo, quantidade }))
            };
            logger.info(`Dados finais: ${discursosFinais.length} discursos totais`);
        }
        else {
            // MODO COMPLETO: Substituir todos os dados
            logger.info(`Modo completo: substituindo todos os dados`);
            discursosFinais = discursos;
            // Marcar todos os períodos dos discursos como processados
            const periodosProcessadosCompleto = [];
            const agora = new Date().toISOString();
            // Extrair todos os períodos dos discursos
            const periodosUnicos = [...new Set(discursos.map(d => `${d.anoDiscurso}-${d.mesDiscurso.toString().padStart(2, '0')}`))].sort();
            periodosUnicos.forEach(periodo => {
                periodosProcessadosCompleto.push({ periodo, dataProcessamento: agora });
            });
            dadosFinais = {
                idDeputado: deputadoId,
                totalDiscursos,
                totalPaginas,
                anosComDiscursos,
                ultimaAtualizacao: new Date().toISOString(),
                periodosProcessados: periodosProcessadosCompleto,
                // Estatísticas por ano
                estatisticasPorAno: anosComDiscursos.map((ano) => {
                    const discursosAno = discursos.filter((d) => d.anoDiscurso === ano);
                    return {
                        ano,
                        totalDiscursos: discursosAno.length
                    };
                }),
                // Estatísticas por tipo de discurso
                estatisticasPorTipo: Object.entries(discursos.reduce((acc, discurso) => {
                    const tipo = discurso.tipoDiscurso || 'Não informado';
                    acc[tipo] = (acc[tipo] || 0) + 1;
                    return acc;
                }, {})).map(([tipo, quantidade]) => ({ tipo, quantidade }))
            };
        }
        // Salvar dados finais
        await Promise.all([
            deputadoDiscursosRef.set(dadosFinais, { merge: true }),
            discursosArrayRef.set({
                items: discursosFinais,
                totalItems: discursosFinais.length,
                ultimaAtualizacao: new Date().toISOString()
            }, { merge: true })
        ]);
        logger.info(`✅ Discursos do deputado ${deputadoId} salvos com sucesso (${modoAtualizacao ? 'modo incremental' : 'modo completo'})`);
    }
    catch (error) {
        logger.error(`Erro ao salvar discursos do deputado ${resultadoDiscursos.deputadoId}: ${error.message}`);
        throw error;
    }
}
// Executar função principal
processarDiscursosDeputados().catch(error => {
    logger.error(`Erro fatal no processamento: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
});
//# sourceMappingURL=processar_discursosdeputados.js.map