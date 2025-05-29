/**
 * Script para processamento de despesas de deputados
 * Este script implementa o fluxo ETL completo para despesas de deputados:
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
// Configurações do Firestore
const FIRESTORE_MAX_SIZE = 1048576; // 1MB em bytes
const FIRESTORE_SAFETY_MARGIN = 0.9; // Margem de segurança (90% do limite)
const MAX_DESPESAS_POR_BATCH = 500; // Limite máximo de despesas por batch
/**
 * Funções auxiliares para gerenciamento de tamanho do Firestore
 */
/**
 * Calcula o tamanho estimado de um objeto em bytes (JSON string)
 * @param obj - Objeto para calcular tamanho
 * @returns Tamanho em bytes
 */
function calcularTamanhoBytes(obj) {
    try {
        return new TextEncoder().encode(JSON.stringify(obj)).length;
    }
    catch (error) {
        // Fallback: estimação baseada em string
        return JSON.stringify(obj).length * 2; // UTF-8 pode usar até 2 bytes por caractere
    }
}
/**
 * Divide array de despesas em batches que respeitam o limite do Firestore
 * @param despesas - Array de despesas
 * @returns Array de batches seguros
 */
function dividirEmBatchesSeguras(despesas) {
    const batches = [];
    let batchAtual = [];
    let tamanhoAtual = 0;
    const limiteSeguro = FIRESTORE_MAX_SIZE * FIRESTORE_SAFETY_MARGIN;
    logger.info(`Dividindo ${despesas.length} despesas em batches seguros (limite: ${Math.round(limiteSeguro)} bytes)`);
    for (const despesa of despesas) {
        const tamanhoDespesa = calcularTamanhoBytes(despesa);
        // Verificar se adicionar esta despesa excederia o limite
        if (tamanhoAtual + tamanhoDespesa > limiteSeguro || batchAtual.length >= MAX_DESPESAS_POR_BATCH) {
            // Finalizar batch atual se tiver pelo menos uma despesa
            if (batchAtual.length > 0) {
                batches.push([...batchAtual]);
                logger.info(`Batch ${batches.length} finalizado: ${batchAtual.length} despesas, ${tamanhoAtual} bytes`);
                batchAtual = [];
                tamanhoAtual = 0;
            }
        }
        // Adicionar despesa ao batch atual
        batchAtual.push(despesa);
        tamanhoAtual += tamanhoDespesa;
    }
    // Adicionar último batch se não estiver vazio
    if (batchAtual.length > 0) {
        batches.push(batchAtual);
        logger.info(`Batch final ${batches.length} criado: ${batchAtual.length} despesas, ${tamanhoAtual} bytes`);
    }
    logger.info(`Total de batches criados: ${batches.length}`);
    return batches;
}
/**
 * Classe especializada para extração de despesas com paginação
 */
class DespesasExtractor {
    /**
     * Extrai despesas em modo atualização incremental
     * Processa apenas meses que não estão no Firestore ou estão desatualizados
     * @param deputadoId - ID do deputado
     * @param legislatura - ID da legislatura
     * @returns Apenas despesas dos meses faltantes
     */
    async extractDespesasAtualizacao(deputadoId, legislatura) {
        try {
            logger.info(`Iniciando atualização incremental de despesas do deputado ${deputadoId}`);
            // 1. Verificar dados existentes no Firestore
            const dadosExistentes = await this.verificarDadosExistentes(deputadoId.toString());
            // 2. Calcular meses a serem processados (faltantes nos últimos 60 dias)
            const mesesParaProcessar = this.calcularMesesFaltantes(dadosExistentes.mesesProcessados);
            if (mesesParaProcessar.length === 0) {
                logger.info(`✅ Deputado ${deputadoId} já está atualizado - todos os meses dos últimos 60 dias foram processados recentemente`);
                return {
                    deputadoId: deputadoId.toString(),
                    totalDespesas: 0,
                    totalPaginas: 0,
                    despesas: [],
                    anosComDespesas: [],
                    valorTotal: 0,
                    mesesProcessados: mesesParaProcessar
                };
            }
            logger.info(`🔄 Deputado ${deputadoId}: processando ${mesesParaProcessar.length} mês(es) faltante(s): ${mesesParaProcessar.map(m => `${m.ano}-${m.mes.toString().padStart(2, '0')}`).join(', ')}`);
            // 3. Extrair despesas apenas dos meses faltantes
            const todasDespesasNovas = [];
            let totalPaginas = 0;
            for (const { ano, mes } of mesesParaProcessar) {
                try {
                    logger.info(`Extraindo despesas de ${ano}-${mes.toString().padStart(2, '0')} do deputado ${deputadoId}`);
                    const despesasMes = await this.extractDespesasPorMes(deputadoId, ano, mes, legislatura);
                    todasDespesasNovas.push(...despesasMes.despesas);
                    totalPaginas += despesasMes.totalPaginas;
                    // Delay entre meses para não sobrecarregar API
                    if (mesesParaProcessar.length > 1) {
                        await new Promise(resolve => setTimeout(resolve, 1500));
                    }
                }
                catch (error) {
                    logger.error(`Erro ao extrair mês ${ano}-${mes} do deputado ${deputadoId}: ${error.message}`);
                    // Continua processando outros meses
                }
            }
            // 4. Calcular estatísticas das novas despesas
            const anosComDespesas = [...new Set(todasDespesasNovas.map(d => d.ano))].sort();
            const valorTotal = todasDespesasNovas.reduce((total, despesa) => total + despesa.valorLiquido, 0);
            logger.info(`Atualização incremental finalizada para deputado ${deputadoId}: ${todasDespesasNovas.length} novas despesas em ${totalPaginas} páginas`);
            return {
                deputadoId: deputadoId.toString(),
                totalDespesas: todasDespesasNovas.length,
                totalPaginas,
                despesas: todasDespesasNovas,
                anosComDespesas,
                valorTotal,
                mesesProcessados: mesesParaProcessar
            };
        }
        catch (error) {
            logger.error(`Erro na atualização incremental de despesas do deputado ${deputadoId}: ${error.message}`);
            return {
                deputadoId: deputadoId.toString(),
                totalDespesas: 0,
                totalPaginas: 0,
                despesas: [],
                anosComDespesas: [],
                valorTotal: 0,
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
            const deputadoRef = db.doc(`congressoNacional/camaraDeputados/despesas/${deputadoId}`);
            const doc = await deputadoRef.get();
            if (!doc.exists) {
                logger.info(`Deputado ${deputadoId} não tem dados no Firestore - processará todos os meses recentes`);
                return { mesesProcessados: {} };
            }
            const dados = doc.data();
            const mesesProcessados = dados?.mesesProcessados || {};
            logger.info(`Deputado ${deputadoId} tem ${Object.keys(mesesProcessados).length} meses já processados`);
            return { mesesProcessados };
        }
        catch (error) {
            logger.warn(`Erro ao verificar dados existentes do deputado ${deputadoId}: ${error.message}`);
            return { mesesProcessados: {} };
        }
    }
    /**
     * Calcula quais meses dos últimos 60 dias (mês atual e anterior) estão faltantes ou desatualizados
     * @param mesesProcessados - Meses já processados
     * @returns Lista de meses para processar
     */
    calcularMesesFaltantes(mesesProcessados) {
        const agora = new Date();
        const mesesParaVerificar = [];
        // Calcular últimos 2 meses (60 dias: mês atual e anterior)
        for (let i = 0; i < 2; i++) {
            const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
            mesesParaVerificar.push({
                ano: data.getFullYear(),
                mes: data.getMonth() + 1 // getMonth() retorna 0-11, precisamos 1-12
            });
        }
        // Filtrar apenas meses que não foram processados ou estão desatualizados
        const mesesFaltantes = mesesParaVerificar.filter(({ ano, mes }) => {
            const chave = `${ano}-${mes.toString().padStart(2, '0')}`;
            const ultimaAtualizacao = mesesProcessados[chave];
            if (!ultimaAtualizacao) {
                logger.info(`Mês ${chave} nunca foi processado`);
                return true; // Nunca foi processado
            }
            // Verificar se foi atualizado há mais de 5 dias (para manter dados atualizados)
            const dataUltimaAtualizacao = new Date(ultimaAtualizacao);
            const diasDesdeAtualizacao = (agora.getTime() - dataUltimaAtualizacao.getTime()) / (1000 * 60 * 60 * 24);
            if (diasDesdeAtualizacao > 5) {
                logger.info(`Mês ${chave} desatualizado (${Math.floor(diasDesdeAtualizacao)} dias) - será reprocessado`);
                return true; // Desatualizado
            }
            logger.info(`Mês ${chave} atualizado recentemente`);
            return false; // Atualizado recentemente
        });
        return mesesFaltantes.sort((a, b) => {
            if (a.ano !== b.ano)
                return a.ano - b.ano;
            return a.mes - b.mes;
        });
    }
    /**
     * Extrai despesas de um mês específico com paginação
     * @param deputadoId - ID do deputado
     * @param ano - Ano
     * @param mes - Mês
     * @param legislatura - ID da legislatura
     * @returns Despesas do mês
     */
    async extractDespesasPorMes(deputadoId, ano, mes, legislatura) {
        const despesasMes = [];
        let paginaAtual = 1;
        let temMaisPaginas = true;
        while (temMaisPaginas) {
            try {
                // Configurar endpoint com filtros de ano/mês
                const endpointConfig = endpoints.DEPUTADOS.DESPESAS;
                const endpoint = api.replacePath(endpointConfig.PATH, { codigo: deputadoId.toString() });
                // Parâmetros com filtros de período
                const params = {
                    ...endpointConfig.PARAMS,
                    idLegislatura: legislatura.toString(),
                    ano: ano.toString(),
                    mes: mes.toString(),
                    pagina: paginaAtual.toString(),
                    itens: ITENS_POR_PAGINA.toString()
                };
                // Fazer requisição com retry
                const response = await withRetry(async () => api.get(endpoint, params), endpoints.REQUEST.RETRY_ATTEMPTS, endpoints.REQUEST.RETRY_DELAY, `Extração ${ano}-${mes} do deputado ${deputadoId} - página ${paginaAtual}`);
                if (!response || !response.dados || !Array.isArray(response.dados)) {
                    break;
                }
                const despesasPagina = response.dados;
                if (despesasPagina.length === 0) {
                    break;
                }
                // Transformar e adicionar despesas desta página
                const despesasTransformadas = despesasPagina.map((despesa) => this.transformDespesa(despesa, deputadoId.toString()));
                despesasMes.push(...despesasTransformadas);
                // Verificar se há mais páginas
                if (despesasPagina.length < ITENS_POR_PAGINA) {
                    temMaisPaginas = false;
                }
                else {
                    paginaAtual++;
                    // Delay entre páginas
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            catch (error) {
                logger.error(`Erro na página ${paginaAtual} do mês ${ano}-${mes}: ${error.message}`);
                break;
            }
        }
        logger.info(`Mês ${ano}-${mes.toString().padStart(2, '0')}: ${despesasMes.length} despesas em ${paginaAtual - 1} páginas`);
        return {
            despesas: despesasMes,
            totalPaginas: paginaAtual - 1
        };
    }
    /**
     * Extrai todas as despesas de um deputado usando paginação
     * @param deputadoId - ID do deputado
     * @param legislatura - ID da legislatura
     * @returns Todas as despesas do deputado
     */
    async extractDespesasCompletas(deputadoId, legislatura) {
        try {
            logger.info(`Iniciando extração completa de despesas do deputado ${deputadoId}`);
            const todasDespesas = [];
            let paginaAtual = 1;
            let totalPaginas = 1;
            let temMaisPaginas = true;
            while (temMaisPaginas) {
                try {
                    logger.info(`Extraindo página ${paginaAtual} de despesas do deputado ${deputadoId}`);
                    // Configurar endpoint com paginação
                    const endpointConfig = endpoints.DEPUTADOS.DESPESAS;
                    const endpoint = api.replacePath(endpointConfig.PATH, { codigo: deputadoId.toString() });
                    // Parâmetros com paginação
                    const params = {
                        ...endpointConfig.PARAMS,
                        idLegislatura: legislatura.toString(),
                        pagina: paginaAtual.toString(),
                        itens: ITENS_POR_PAGINA.toString()
                    };
                    // Fazer requisição com retry
                    const response = await withRetry(async () => api.get(endpoint, params), endpoints.REQUEST.RETRY_ATTEMPTS, endpoints.REQUEST.RETRY_DELAY, `Extração despesas do deputado ${deputadoId} - página ${paginaAtual}`);
                    if (!response || !response.dados) {
                        logger.warn(`Sem dados na página ${paginaAtual} para deputado ${deputadoId}`);
                        break;
                    }
                    const despesasPagina = response.dados;
                    logger.info(`Encontradas ${despesasPagina.length} despesas na página ${paginaAtual}`);
                    // Se não há despesas nesta página, parar
                    if (!Array.isArray(despesasPagina) || despesasPagina.length === 0) {
                        logger.info(`Página ${paginaAtual} vazia - finalizando extração`);
                        break;
                    }
                    // Transformar e adicionar despesas desta página
                    const despesasTransformadas = despesasPagina.map((despesa) => this.transformDespesa(despesa, deputadoId.toString()));
                    todasDespesas.push(...despesasTransformadas);
                    // Verificar se há mais páginas
                    // Se retornou menos que o máximo de itens, é a última página
                    if (despesasPagina.length < ITENS_POR_PAGINA) {
                        logger.info(`Página ${paginaAtual} retornou ${despesasPagina.length} itens (< ${ITENS_POR_PAGINA}) - última página`);
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
            const anosComDespesas = [...new Set(todasDespesas.map(d => d.ano))].sort();
            const valorTotal = todasDespesas.reduce((total, despesa) => total + despesa.valorLiquido, 0);
            logger.info(`Extração completa finalizada para deputado ${deputadoId}: ${todasDespesas.length} despesas em ${totalPaginas} páginas`);
            return {
                deputadoId: deputadoId.toString(),
                totalDespesas: todasDespesas.length,
                totalPaginas,
                despesas: todasDespesas,
                anosComDespesas,
                valorTotal,
            };
        }
        catch (error) {
            logger.error(`Erro na extração completa de despesas do deputado ${deputadoId}: ${error.message}`);
            return {
                deputadoId: deputadoId.toString(),
                totalDespesas: 0,
                totalPaginas: 0,
                despesas: [],
                anosComDespesas: [],
                valorTotal: 0,
                erro: error.message
            };
        }
    }
    /**
     * Transforma uma despesa bruta em formato padronizado
     * @param despesa - Despesa bruta da API
     * @param deputadoId - ID do deputado
     * @returns Despesa transformada
     */
    transformDespesa(despesa, deputadoId) {
        return {
            // Dados básicos
            ano: parseInt(despesa.ano) || 0,
            mes: parseInt(despesa.mes) || 0,
            tipoDespesa: despesa.tipoDespesa || '',
            // Documento
            codDocumento: despesa.codDocumento?.toString() || '',
            tipoDocumento: despesa.tipoDocumento || '',
            codTipoDocumento: despesa.codTipoDocumento?.toString() || '',
            dataDocumento: despesa.dataDocumento || '',
            numDocumento: despesa.numDocumento || '',
            urlDocumento: despesa.urlDocumento || '',
            // Valores
            valorDocumento: parseFloat(despesa.valorDocumento) || 0,
            valorLiquido: parseFloat(despesa.valorLiquido) || 0,
            valorGlosa: parseFloat(despesa.valorGlosa) || 0,
            // Fornecedor
            nomeFornecedor: despesa.nomeFornecedor || '',
            cnpjCpfFornecedor: despesa.cnpjCpfFornecedor || '',
            // Controle
            numRessarcimento: despesa.numRessarcimento || '',
            codLote: despesa.codLote?.toString() || '',
            parcela: parseInt(despesa.parcela) || 0,
            // Metadados
            idDeputado: deputadoId,
            dataExtracao: new Date().toISOString()
        };
    }
}
/**
 * Funções auxiliares para salvamento no Firestore
 */
/**
 * Carrega todas as despesas existentes de um deputado (incluindo múltiplos batches)
 * @param deputadoId - ID do deputado
 * @returns Array com todas as despesas existentes
 */
async function carregarTodasDespesasExistentes(deputadoId) {
    try {
        const despesasExistentes = [];
        // Buscar documento único primeiro (compatibilidade com versão anterior)
        const docUnicoRef = db.doc(`congressoNacional/camaraDeputados/despesas/${deputadoId}/dados/items`);
        const docUnico = await docUnicoRef.get();
        if (docUnico.exists) {
            const dados = docUnico.data();
            if (dados?.items && Array.isArray(dados.items)) {
                despesasExistentes.push(...dados.items);
                logger.info(`Carregadas ${dados.items.length} despesas do documento único`);
                return despesasExistentes;
            }
        }
        // Se não encontrou documento único, buscar por batches
        logger.info(`Buscando batches de despesas para deputado ${deputadoId}...`);
        // Buscar até 20 batches (limite razoável)
        for (let i = 0; i < 20; i++) {
            const batchRef = db.doc(`congressoNacional/camaraDeputados/despesas/${deputadoId}/dados/batch_${i}`);
            const batchDoc = await batchRef.get();
            if (batchDoc.exists) {
                const dados = batchDoc.data();
                if (dados?.items && Array.isArray(dados.items)) {
                    despesasExistentes.push(...dados.items);
                    logger.info(`Carregadas ${dados.items.length} despesas do batch ${i}`);
                }
            }
            else {
                // Se não encontrar batch sequencial, parar
                break;
            }
        }
        logger.info(`Total de despesas existentes carregadas: ${despesasExistentes.length}`);
        return despesasExistentes;
    }
    catch (error) {
        logger.warn(`Erro ao carregar despesas existentes do deputado ${deputadoId}: ${error.message}`);
        return [];
    }
}
/**
 * Calcula estatísticas por ano
 */
function calcularEstatisticasPorAno(despesas) {
    const anosUnicos = [...new Set(despesas.map(d => d.ano))].sort();
    return anosUnicos.map(ano => {
        const despesasAno = despesas.filter(d => d.ano === ano);
        const valorAno = despesasAno.reduce((total, d) => total + d.valorLiquido, 0);
        return {
            ano,
            totalDespesas: despesasAno.length,
            valorTotal: valorAno
        };
    });
}
/**
 * Calcula estatísticas por tipo de despesa
 */
function calcularEstatisticasPorTipo(despesas) {
    const contadorTipos = despesas.reduce((acc, despesa) => {
        acc[despesa.tipoDespesa] = (acc[despesa.tipoDespesa] || 0) + 1;
        return acc;
    }, {});
    return Object.entries(contadorTipos).map(([tipo, quantidade]) => ({ tipo, quantidade }));
}
/**
 * Salva despesas em múltiplos documentos (batches)
 */
async function salvarComBatches(deputadoId, despesas, dadosFinais) {
    try {
        // 1. Dividir despesas em batches seguros
        const batches = dividirEmBatchesSeguras(despesas);
        // 2. Limpar documentos existentes (tanto único quanto batches antigos)
        await limparDocumentosExistentes(deputadoId);
        // 3. Salvar cada batch
        const promessasBatches = batches.map(async (batch, indice) => {
            const batchRef = db.doc(`congressoNacional/camaraDeputados/despesas/${deputadoId}/dados/batch_${indice}`);
            return batchRef.set({
                items: batch,
                totalItems: batch.length,
                batchIndex: indice,
                ultimaAtualizacao: new Date().toISOString()
            });
        });
        // 4. Salvar documento principal com referências aos batches
        const deputadoRef = db.doc(`congressoNacional/camaraDeputados/despesas/${deputadoId}`);
        const dadosComBatches = {
            ...dadosFinais,
            estruturaArmazenamento: 'batches',
            totalBatches: batches.length,
            batchesInfo: batches.map((batch, indice) => ({
                batchIndex: indice,
                totalItems: batch.length,
                path: `dados/batch_${indice}`
            }))
        };
        // 5. Executar todas as operações
        await Promise.all([
            ...promessasBatches,
            deputadoRef.set(dadosComBatches, { merge: true })
        ]);
        logger.info(`✅ ${batches.length} batches salvos com sucesso para deputado ${deputadoId}`);
    }
    catch (error) {
        logger.error(`Erro ao salvar com batches: ${error.message}`);
        throw error;
    }
}
/**
 * Salva despesas em documento único (compatibilidade com versão anterior)
 */
async function salvarDocumentoUnico(deputadoId, despesas, dadosFinais) {
    try {
        const deputadoRef = db.doc(`congressoNacional/camaraDeputados/despesas/${deputadoId}`);
        const despesasRef = db.doc(`congressoNacional/camaraDeputados/despesas/${deputadoId}/dados/items`);
        const dadosComEstrutura = {
            ...dadosFinais,
            estruturaArmazenamento: 'documento_unico'
        };
        await Promise.all([
            deputadoRef.set(dadosComEstrutura, { merge: true }),
            despesasRef.set({
                items: despesas,
                totalItems: despesas.length,
                ultimaAtualizacao: new Date().toISOString()
            })
        ]);
        logger.info(`✅ Documento único salvo com sucesso para deputado ${deputadoId}`);
    }
    catch (error) {
        logger.error(`Erro ao salvar documento único: ${error.message}`);
        throw error;
    }
}
/**
 * Limpa documentos existentes (tanto batches quanto documento único)
 */
async function limparDocumentosExistentes(deputadoId) {
    try {
        const promessasLimpeza = [];
        // Limpar documento único se existir
        const docUnicoRef = db.doc(`congressoNacional/camaraDeputados/despesas/${deputadoId}/dados/items`);
        promessasLimpeza.push(docUnicoRef.delete().catch(() => { })); // Ignore erros se não existir
        // Limpar batches existentes (buscar até 20)
        for (let i = 0; i < 20; i++) {
            const batchRef = db.doc(`congressoNacional/camaraDeputados/despesas/${deputadoId}/dados/batch_${i}`);
            promessasLimpeza.push(batchRef.delete().catch(() => { })); // Ignore erros se não existir
        }
        await Promise.all(promessasLimpeza);
        logger.info(`Documentos existentes limpos para deputado ${deputadoId}`);
    }
    catch (error) {
        logger.warn(`Aviso na limpeza de documentos: ${error.message}`);
        // Não lançar erro, apenas avisar
    }
}
/**
 * Função para exibir ajuda do script
 */
function exibirAjuda() {
    console.log(`
Uso: npx ts-node -P tsconfig.scripts.json scripts/initiators/processar_despesasdeputados.ts [legislatura] [opções]

Argumentos:
  [legislatura]                Número da legislatura para processamento (ex: 57, 56, 55)
                              Se não fornecido, usa a legislatura padrão (${LEGISLATURA_ATUAL})

Formas de especificar legislatura:
  57                          Primeiro argumento numérico (ex: npx comando 57)
  --57                        Argumento com hífen (ex: npx comando --57) ✨ RECOMENDADO
  --56                        Para legislatura 56 (ex: npx comando --56)
  --55                        Para legislatura 55 (ex: npx comando --55)
  --legislatura 57            Parâmetro tradicional (ex: npx comando --legislatura 57)

Opções:
  --limite, -l <número>       Limita o processamento a um número específico de deputados
  --concorrencia <número>     Número de deputados processados em paralelo (padrão: 2)
  --atualizar                 Modo atualização incremental (últimos 60 dias apenas)
  --ajuda, -h                 Exibe esta mensagem de ajuda

Exemplos:
  # Processar legislatura atual (57)
  npx ts-node -P tsconfig.scripts.json scripts/initiators/processar_despesasdeputados.ts

  # Processar legislatura 56 com limite de 10 deputados
  npx ts-node -P tsconfig.scripts.json scripts/initiators/processar_despesasdeputados.ts 56 --limite 10

  # Processar legislatura 55 usando argumento com hífen (MÉTODO RECOMENDADO)
  npx ts-node -P tsconfig.scripts.json scripts/initiators/processar_despesasdeputados.ts --55

  # Processar legislatura 56
  npx ts-node -P tsconfig.scripts.json scripts/initiators/processar_despesasdeputados.ts --56

  # Processar legislatura 54
  npx ts-node -P tsconfig.scripts.json scripts/initiators/processar_despesasdeputados.ts --54

  # Processar legislatura 57 em modo atualização incremental
  npx ts-node -P tsconfig.scripts.json scripts/initiators/processar_despesasdeputados.ts 57 --atualizar

  # Processar com maior concorrência (cuidado com rate limiting)
  npx ts-node -P tsconfig.scripts.json scripts/initiators/processar_despesasdeputados.ts --concorrencia 3
`);
    process.exit(0);
}
/**
 * Detecta e valida a legislatura a partir dos argumentos da linha de comando
 * Suporta múltiplos formatos: --57, --56, --55, 57, --legislatura 57
 * @param args - Argumentos parseados
 * @returns Número da legislatura validado
 */
function detectarLegislatura(args) {
    let legislatura = LEGISLATURA_ATUAL; // Padrão: 57
    // Verificar se foi solicitada ajuda
    if (args.ajuda !== undefined || args.h !== undefined) {
        exibirAjuda();
    }
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
 * Função principal para processamento de despesas de deputados
 */
async function processarDespesasDeputados() {
    try {
        // Obter argumentos da linha de comando
        const args = parseArgs();
        // Detectar e validar legislatura
        const legislatura = detectarLegislatura(args);
        // Outros parâmetros
        const limite = args.limite !== undefined ? parseInt(args.limite, 10) : LIMITE_PADRAO;
        const concorrencia = args.concorrencia !== undefined ? parseInt(args.concorrencia, 10) : 2;
        const modoAtualizacao = args.atualizar !== undefined;
        // Validações adicionais
        if (limite < 0) {
            logger.error(`Limite inválido: ${limite}. Deve ser um número positivo ou 0 (sem limite).`);
            process.exit(1);
        }
        if (concorrencia < 1 || concorrencia > 10) {
            logger.error(`Concorrência inválida: ${concorrencia}. Deve estar entre 1 e 10.`);
            process.exit(1);
        }
        logger.info(`Iniciando processamento de despesas de deputados da legislatura ${legislatura}`);
        logger.info(`Configurações: limite=${limite}, concorrência=${concorrencia}, modo=${modoAtualizacao ? 'ATUALIZAÇÃO INCREMENTAL (60 dias)' : 'COMPLETO'}`);
        logger.info(`${modoAtualizacao ? '📋 Modo Atualização: Processará apenas meses faltantes dos últimos 60 dias' : '📋 Modo Completo: Processará todas as despesas disponíveis'}`);
        // Inicializar extratores
        const perfilExtractor = new PerfilDeputadosExtractor();
        const despesasExtractor = new DespesasExtractor();
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
        // 2. Extrair despesas de cada deputado (modo completo ou atualização)
        const tipoProcessamento = modoAtualizacao ? 'atualização incremental' : 'despesas completas';
        logger.info(`Etapa 2: Extraindo ${tipoProcessamento} de ${deputadosParaProcessar.length} deputados`);
        // Extrair apenas os IDs dos deputados
        const idsDeputados = deputadosParaProcessar.map(deputado => deputado.id);
        // Estatísticas
        let totalDespesasExtraidas = 0;
        let deputadosProcessados = 0;
        let deputadosComErro = 0;
        let valorTotalGeral = 0;
        let deputadosJaAtualizados = 0; // Para modo atualização
        // Processar deputados com concorrência controlada
        for (let i = 0; i < idsDeputados.length; i += concorrencia) {
            const lote = idsDeputados.slice(i, i + concorrencia);
            logger.info(`Processando lote ${Math.floor(i / concorrencia) + 1} com ${lote.length} deputados`);
            // Processar lote em paralelo
            const promessas = lote.map(async (idDeputado) => {
                try {
                    let resultadoDespesas;
                    // Escolher método baseado no modo
                    if (modoAtualizacao) {
                        // Modo atualização incremental
                        resultadoDespesas = await despesasExtractor.extractDespesasAtualizacao(idDeputado, legislatura);
                    }
                    else {
                        // Modo completo (todas as despesas)
                        resultadoDespesas = await despesasExtractor.extractDespesasCompletas(idDeputado, legislatura);
                    }
                    if (resultadoDespesas.erro) {
                        logger.error(`Erro na extração de despesas do deputado ${idDeputado}: ${resultadoDespesas.erro}`);
                        deputadosComErro++;
                        return null;
                    }
                    // Verificar se há dados para salvar
                    if (resultadoDespesas.totalDespesas === 0) {
                        if (modoAtualizacao) {
                            logger.info(`✅ Deputado ${idDeputado}: atualizado - nenhuma nova despesa nos últimos 60 dias`);
                            deputadosJaAtualizados++;
                        }
                        else {
                            logger.info(`ℹ️ Deputado ${idDeputado}: nenhuma despesa encontrada`);
                        }
                        deputadosProcessados++;
                        return resultadoDespesas;
                    }
                    // Salvar despesas no Firestore (modo incremental ou completo)
                    await salvarDespesasFirestore(resultadoDespesas, modoAtualizacao);
                    // Atualizar estatísticas
                    totalDespesasExtraidas += resultadoDespesas.totalDespesas;
                    valorTotalGeral += resultadoDespesas.valorTotal;
                    deputadosProcessados++;
                    const modoTexto = modoAtualizacao ? 'novas despesas' : 'despesas';
                    logger.info(`✅ Deputado ${idDeputado}: ${resultadoDespesas.totalDespesas} ${modoTexto} em ${resultadoDespesas.totalPaginas} páginas - R$ ${resultadoDespesas.valorTotal.toFixed(2)}`);
                    return resultadoDespesas;
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
        logger.info(`📊 RESUMO DO PROCESSAMENTO DE DESPESAS`);
        logger.info('====================================================');
        logger.info(`🔧 Modo: ${modoAtualizacao ? 'ATUALIZAÇÃO INCREMENTAL (últimos 60 dias)' : 'PROCESSAMENTO COMPLETO'}`);
        logger.info(`✅ Deputados processados com sucesso: ${deputadosProcessados}`);
        if (modoAtualizacao && deputadosJaAtualizados > 0) {
            logger.info(`🔄 Deputados já atualizados (sem novos dados): ${deputadosJaAtualizados}`);
        }
        logger.info(`❌ Deputados com erro: ${deputadosComErro}`);
        logger.info(`💰 Total de ${modoAtualizacao ? 'novas ' : ''}despesas extraídas: ${totalDespesasExtraidas.toLocaleString()}`);
        logger.info(`💵 Valor total das ${modoAtualizacao ? 'novas ' : ''}despesas: R$ ${valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        if (modoAtualizacao) {
            logger.info(`📅 Período verificado: últimos 60 dias (mês atual e anterior)`);
        }
        logger.info('====================================================');
        logger.info('Processamento de despesas de deputados concluído com sucesso');
    }
    catch (error) {
        logger.error(`Erro no processamento de despesas de deputados: ${error.message}`);
        logger.error(error.stack);
        process.exit(1);
    }
}
/**
 * Salva as despesas de um deputado no Firestore
 * Estrutura: /despesas/{codigo} (similar aos perfis)
 * NOVO: Divide em batches quando excede limite de 1MB do Firestore
 * @param resultadoDespesas - Resultado da extração de despesas
 * @param modoAtualizacao - Se true, adiciona aos dados existentes; se false, substitui tudo
 */
async function salvarDespesasFirestore(resultadoDespesas, modoAtualizacao = false) {
    try {
        const { deputadoId, despesas, totalDespesas, totalPaginas, anosComDespesas, valorTotal, mesesProcessados } = resultadoDespesas;
        logger.info(`Salvando ${totalDespesas} ${modoAtualizacao ? 'novas ' : ''}despesas do deputado ${deputadoId} no Firestore`);
        // Referência do documento principal
        const deputadoDespesasRef = db.doc(`congressoNacional/camaraDeputados/despesas/${deputadoId}`);
        let dadosFinais;
        let despesasFinais;
        if (modoAtualizacao && totalDespesas > 0) {
            // MODO ATUALIZAÇÃO: Mesclar com dados existentes
            logger.info(`Modo atualização: mesclando ${totalDespesas} novas despesas com dados existentes`);
            // 1. Ler dados existentes
            const docPrincipal = await deputadoDespesasRef.get();
            const dadosExistentes = docPrincipal.exists ? (docPrincipal.data() || {}) : {};
            // 2. Carregar despesas existentes de todos os batches
            const despesasExistentes = await carregarTodasDespesasExistentes(deputadoId);
            logger.info(`Dados existentes: ${despesasExistentes.length} despesas, valor total: R$ ${dadosExistentes?.valorTotal || 0}`);
            // 3. Combinar despesas (adicionar novas às existentes)
            despesasFinais = [...despesasExistentes, ...despesas];
            // 4. Recalcular estatísticas totais
            const anosFinais = [...new Set(despesasFinais.map((d) => d.ano))].sort();
            const valorTotalFinal = despesasFinais.reduce((total, despesa) => total + despesa.valorLiquido, 0);
            // 5. Atualizar controle de meses processados
            const mesesProcessadosExistentes = dadosExistentes?.mesesProcessados || {};
            const mesesProcessadosNovos = { ...mesesProcessadosExistentes };
            // Marcar novos meses como processados
            if (mesesProcessados && mesesProcessados.length > 0) {
                const agora = new Date().toISOString();
                mesesProcessados.forEach(({ ano, mes }) => {
                    const chave = `${ano}-${mes.toString().padStart(2, '0')}`;
                    mesesProcessadosNovos[chave] = agora;
                });
            }
            // 6. Preparar dados finais mesclados
            dadosFinais = {
                idDeputado: deputadoId,
                totalDespesas: despesasFinais.length,
                totalPaginas: (dadosExistentes?.totalPaginas || 0) + totalPaginas,
                anosComDespesas: anosFinais,
                valorTotal: valorTotalFinal,
                ultimaAtualizacao: new Date().toISOString(),
                mesesProcessados: mesesProcessadosNovos,
                // Recalcular estatísticas por ano
                estatisticasPorAno: calcularEstatisticasPorAno(despesasFinais),
                // Recalcular estatísticas por tipo de despesa
                estatisticasPorTipo: calcularEstatisticasPorTipo(despesasFinais)
            };
            logger.info(`Dados finais: ${despesasFinais.length} despesas totais, valor total: R$ ${valorTotalFinal.toFixed(2)}`);
        }
        else {
            // MODO COMPLETO: Substituir todos os dados
            logger.info(`Modo completo: substituindo todos os dados`);
            despesasFinais = despesas;
            // Marcar todos os meses das despesas como processados
            const mesesProcessadosCompleto = {};
            const agora = new Date().toISOString();
            // Extrair todos os meses das despesas
            const mesesUnicos = [...new Set(despesas.map(d => `${d.ano}-${d.mes.toString().padStart(2, '0')}`))].sort();
            mesesUnicos.forEach(mes => {
                mesesProcessadosCompleto[mes] = agora;
            });
            dadosFinais = {
                idDeputado: deputadoId,
                totalDespesas,
                totalPaginas,
                anosComDespesas,
                valorTotal,
                ultimaAtualizacao: new Date().toISOString(),
                mesesProcessados: mesesProcessadosCompleto,
                // Estatísticas por ano
                estatisticasPorAno: calcularEstatisticasPorAno(despesas),
                // Estatísticas por tipo de despesa
                estatisticasPorTipo: calcularEstatisticasPorTipo(despesas)
            };
        }
        // NOVO: Verificar se precisa dividir em batches
        const tamanhoTotal = calcularTamanhoBytes({ items: despesasFinais });
        logger.info(`Tamanho total das despesas: ${tamanhoTotal} bytes (limite: ${FIRESTORE_MAX_SIZE})`);
        if (tamanhoTotal > FIRESTORE_MAX_SIZE * FIRESTORE_SAFETY_MARGIN) {
            // Dividir em múltiplos documentos
            logger.info(`Tamanho excede limite, dividindo em batches...`);
            await salvarComBatches(deputadoId, despesasFinais, dadosFinais);
        }
        else {
            // Salvar normalmente em um único documento
            logger.info(`Tamanho dentro do limite, salvando em documento único`);
            await salvarDocumentoUnico(deputadoId, despesasFinais, dadosFinais);
        }
        logger.info(`✅ Despesas do deputado ${deputadoId} salvas com sucesso (${modoAtualizacao ? 'modo incremental' : 'modo completo'})`);
    }
    catch (error) {
        logger.error(`Erro ao salvar despesas do deputado ${resultadoDespesas.deputadoId}: ${error.message}`);
        throw error;
    }
}
// Executar função principal
processarDespesasDeputados().catch(error => {
    logger.error(`Erro fatal no processamento: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
});
//# sourceMappingURL=processar_despesasdeputados.js.map