"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.comissoesTransformer = exports.ComissoesTransformer = void 0;
/**
 * Transformador para dados de Comissões do Senado
 */
const logger_1 = require("../utils/logging/logger");
/**
 * Classe para transformação de dados de comissões
 */
class ComissoesTransformer {
    /**
     * Transforma os dados de comissões para formato otimizado
     */
    transformComissoes(extractionResult) {
        logger_1.logger.info('Transformando dados de comissões');
        const { lista, detalhes, composicoes } = extractionResult;
        // Verificar se temos dados para transformar
        if (!lista || !lista.comissoes) {
            logger_1.logger.warn('Nenhuma comissão para transformar');
            return {
                timestamp: new Date().toISOString(),
                total: 0,
                comissoes: {
                    senado: {},
                    congresso: {}
                },
                indices: {
                    porCodigo: {},
                    porParlamentar: {}
                },
                referencias: {
                    tipos: {}
                }
            };
        }
        // Garantir que comissoes.senado e comissoes.mistas existam
        if (!lista.comissoes.senado)
            lista.comissoes.senado = [];
        if (!lista.comissoes.mistas)
            lista.comissoes.mistas = [];
        // Criar mapa de detalhes e composições para fácil acesso
        const detalhesMap = this.criarMapaDetalhes(detalhes);
        const composicoesMap = this.criarMapaComposicoes(composicoes);
        logger_1.logger.info(`Mapa de detalhes criado com ${Object.keys(detalhesMap).length} entradas`);
        logger_1.logger.info(`Mapa de composições criado com ${Object.keys(composicoesMap).length} entradas`);
        // Transformar comissões do Senado
        const comissoesSenado = this.transformComissoesSenado(lista.comissoes.senado, detalhesMap, composicoesMap);
        // Transformar comissões do Congresso
        const comissoesCongresso = this.transformComissoesCongresso(lista.comissoes.mistas, detalhesMap, composicoesMap);
        // Calcular total de comissões processadas
        let totalComissoesSenado = 0;
        Object.values(comissoesSenado).forEach(comissoes => {
            totalComissoesSenado += comissoes.length;
        });
        let totalComissoesCongresso = 0;
        Object.values(comissoesCongresso).forEach(comissoes => {
            totalComissoesCongresso += comissoes.length;
        });
        const totalComissoes = totalComissoesSenado + totalComissoesCongresso;
        logger_1.logger.info(`Transformadas ${totalComissoesSenado} comissões do Senado e ${totalComissoesCongresso} do Congresso`);
        // Criar índices para consultas rápidas
        const indices = this.criarIndices(comissoesSenado, comissoesCongresso);
        logger_1.logger.info(`Índices criados: ${Object.keys(indices.porCodigo).length} por código e ${Object.keys(indices.porParlamentar).length} por parlamentar`);
        logger_1.logger.info('Transformação de comissões concluída');
        return {
            timestamp: new Date().toISOString(),
            total: totalComissoes,
            comissoes: {
                senado: comissoesSenado,
                congresso: comissoesCongresso
            },
            indices: indices,
            referencias: {
                tipos: this.transformTiposComissoes(extractionResult.tipos || {})
            }
        };
    }
    /**
     * Transforma tipos de comissões em formato simplificado
     */
    transformTiposComissoes(tiposData) {
        const tiposMap = {};
        // Se tiposData for indefinido ou nulo, retorna objeto vazio
        if (!tiposData)
            return tiposMap;
        try {
            // Tenta processar a estrutura da Lista de Colegiados
            if (tiposData.ListaColegiados && tiposData.ListaColegiados.Colegiados && tiposData.ListaColegiados.Colegiados.Colegiado) {
                const colegiados = tiposData.ListaColegiados.Colegiados.Colegiado;
                const colegiadosArray = Array.isArray(colegiados) ? colegiados : [colegiados];
                colegiadosArray.forEach(colegiado => {
                    if (colegiado.CodigoTipoColegiado && colegiado.SiglaTipoColegiado) {
                        const codigo = colegiado.CodigoTipoColegiado;
                        if (!tiposMap[codigo]) {
                            tiposMap[codigo] = {
                                codigo: codigo,
                                sigla: colegiado.SiglaTipoColegiado,
                                nome: colegiado.DescricaoTipoColegiado || colegiado.SiglaTipoColegiado,
                                descricao: colegiado.DescricaoTipoColegiado || null
                            };
                        }
                    }
                });
            }
            // Tenta processar a estrutura da Lista de Tipos de Colegiado (endpoint TIPOS)
            else if (tiposData.ListaTipoColegiado && tiposData.ListaTipoColegiado.TiposColegiado) {
                const tipos = tiposData.ListaTipoColegiado.TiposColegiado.TipoColegiado;
                if (Array.isArray(tipos)) {
                    tipos.forEach(tipo => {
                        if (tipo.Codigo && tipo.Sigla) {
                            tiposMap[tipo.Codigo] = {
                                codigo: tipo.Codigo,
                                sigla: tipo.Sigla,
                                nome: tipo.Nome || tipo.Sigla,
                                descricao: tipo.Descricao || null
                            };
                        }
                    });
                }
                else if (tipos && tipos.Codigo && tipos.Sigla) {
                    // Caso seja apenas um item e não um array
                    tiposMap[tipos.Codigo] = {
                        codigo: tipos.Codigo,
                        sigla: tipos.Sigla,
                        nome: tipos.Nome || tipos.Sigla,
                        descricao: tipos.Descricao || null
                    };
                }
            }
        }
        catch (error) {
            logger_1.logger.error(`Erro ao processar tipos de comissões: ${error}`);
        }
        return tiposMap;
    }
    /**
     * Cria mapa de detalhes de comissões para consulta rápida
     */
    criarMapaDetalhes(detalhes) {
        const detalhesMap = {};
        if (!detalhes)
            return detalhesMap;
        detalhes.forEach(detalhe => {
            if (detalhe && detalhe.codigo && detalhe.detalhes) {
                detalhesMap[detalhe.codigo] = detalhe.detalhes;
            }
        });
        return detalhesMap;
    }
    /**
     * Cria mapa de composições de comissões para consulta rápida
     */
    criarMapaComposicoes(composicoes) {
        const composicoesMap = {};
        if (!composicoes)
            return composicoesMap;
        composicoes.forEach(composicao => {
            if (composicao && composicao.codigo && composicao.composicao) {
                composicoesMap[composicao.codigo] = {
                    dados: composicao.composicao,
                    origem: composicao.origem
                };
            }
        });
        return composicoesMap;
    }
    /**
     * Transforma comissões do Senado
     */
    transformComissoesSenado(comissoes, detalhesMap, composicoesMap) {
        const comissoesPorTipo = {
            'permanente': [],
            'cpi': [],
            'temporaria': [],
            'orgaos': [],
            'subcomissao': []
        };
        if (!comissoes || !Array.isArray(comissoes) || comissoes.length === 0) {
            return comissoesPorTipo;
        }
        comissoes.forEach(comissao => {
            if (!comissao || (!comissao.Codigo && !comissao.CodigoColegiado)) {
                return;
            }
            const codigo = comissao.Codigo || comissao.CodigoColegiado;
            // Determinar o tipo com base nas propriedades disponíveis
            let tipo = 'permanente'; // Tipo padrão
            if (comissao.SiglaTipoColegiado) {
                // Usar SiglaTipoColegiado para determinar o tipo
                const sigla = comissao.SiglaTipoColegiado.toLowerCase();
                if (sigla.includes('cpi') || sigla.includes('inquerito')) {
                    tipo = 'cpi';
                }
                else if (sigla.includes('temporaria') || sigla.includes('temp')) {
                    tipo = 'temporaria';
                }
                else if (sigla.includes('subcomissao') || sigla.includes('sub')) {
                    tipo = 'subcomissao';
                }
                else if (sigla.includes('orgao') || sigla.includes('conselho') || sigla.includes('mesa') || sigla.includes('cons')) {
                    tipo = 'orgaos';
                }
            }
            else if (comissao.TipoComissao) {
                // Usar TipoComissao para determinar o tipo
                const tipoComissao = comissao.TipoComissao.toLowerCase();
                if (tipoComissao.includes('cpi') || tipoComissao.includes('inquerito')) {
                    tipo = 'cpi';
                }
                else if (tipoComissao.includes('temporaria') || tipoComissao.includes('temp')) {
                    tipo = 'temporaria';
                }
                else if (tipoComissao.includes('subcomissao') || tipoComissao.includes('sub')) {
                    tipo = 'subcomissao';
                }
                else if (tipoComissao.includes('orgao') || tipoComissao.includes('conselho') || tipoComissao.includes('mesa')) {
                    tipo = 'orgaos';
                }
            }
            else if (comissao.DescricaoTipoColegiado) {
                // Usar DescricaoTipoColegiado para determinar o tipo
                const descTipo = comissao.DescricaoTipoColegiado.toLowerCase();
                if (descTipo.includes('cpi') || descTipo.includes('inquerito')) {
                    tipo = 'cpi';
                }
                else if (descTipo.includes('temporaria') || descTipo.includes('temp')) {
                    tipo = 'temporaria';
                }
                else if (descTipo.includes('subcomissao') || descTipo.includes('sub')) {
                    tipo = 'subcomissao';
                }
                else if (descTipo.includes('orgao') || descTipo.includes('conselho') || descTipo.includes('mesa') || descTipo.includes('cons')) {
                    tipo = 'orgaos';
                }
            }
            else if (comissao.Sigla) {
                // Tentar inferir o tipo pela sigla da comissão
                const sigla = comissao.Sigla.toLowerCase();
                if (sigla.startsWith('cpi') || sigla.startsWith('cpmi')) {
                    tipo = 'cpi';
                }
                else if (sigla.startsWith('ce') || sigla.startsWith('ct')) {
                    tipo = 'temporaria';
                }
                else if (sigla.includes('sub')) {
                    tipo = 'subcomissao';
                }
                else if (sigla === 'cdir' || sigla === 'mesa' || sigla.startsWith('cd') || sigla.startsWith('co')) {
                    tipo = 'orgaos';
                }
            }
            // Encontrar detalhes e composição
            const detalheComissao = detalhesMap[codigo] || {};
            const composicaoComissao = composicoesMap[codigo]?.dados || {};
            // Determinar se está ativa com base nas propriedades disponíveis
            let ativa = true;
            if (comissao.Publica === 'N') {
                ativa = false;
            }
            else if (comissao.DataExtincao) {
                ativa = false;
            }
            else if (detalheComissao.DataExtincao) {
                ativa = false;
            }
            // Criar objeto transformado
            const comissaoTransformada = {
                codigo: codigo,
                sigla: comissao.Sigla || detalheComissao.Sigla || '',
                nome: comissao.Nome || detalheComissao.Nome || '',
                ativa: ativa,
                tipo: tipo,
                apelido: comissao.Apelido || detalheComissao.Apelido || undefined,
                casa: comissao.SiglaCasa === 'CN' ? 'CN' : 'SF',
                dataCriacao: comissao.DataInicio || comissao.DataCriacao || detalheComissao.DataCriacao || null,
                dataExtincao: comissao.DataExtincao || detalheComissao.DataExtincao || null,
                dataInstalacao: comissao.DataInstalacao || detalheComissao.DataInstalacao || null,
                finalidade: comissao.Finalidade || detalheComissao.Finalidade || null,
                historia: comissao.Historia || detalheComissao.Historia || null,
                participacao: comissao.Participacao || detalheComissao.Participacao || null,
                composicao: {
                    membros: this.transformarMembros(composicaoComissao)
                },
                atualizadoEm: new Date().toISOString()
            };
            // Adicionar à lista do tipo apropriado
            if (!comissoesPorTipo[tipo]) {
                comissoesPorTipo[tipo] = [];
            }
            comissoesPorTipo[tipo].push(comissaoTransformada);
        });
        return comissoesPorTipo;
    }
    /**
     * Transforma comissões do Congresso Nacional
     */
    transformComissoesCongresso(comissoes, detalhesMap, composicoesMap) {
        const comissoesPorTipo = {
            'mista': [],
            'cpmi': [],
            'veto': [],
            'permanente': [],
            'mpv': [],
            'especial': []
        };
        if (!comissoes || !Array.isArray(comissoes) || comissoes.length === 0) {
            return comissoesPorTipo;
        }
        comissoes.forEach(comissao => {
            if (!comissao || (!comissao.Codigo && !comissao.CodigoColegiado)) {
                return;
            }
            const codigo = comissao.Codigo || comissao.CodigoColegiado;
            // Identificar tipo baseado em propriedades ou usar 'mista' como padrão
            let tipo = 'mista';
            // Tentar determinar tipo a partir de várias propriedades
            if (comissao.TipoComissao || comissao.SiglaTipoColegiado || comissao.DescricaoTipoColegiado) {
                // Usar TipoComissao, SiglaTipoColegiado ou DescricaoTipoColegiado
                const tipoText = (comissao.TipoComissao || comissao.SiglaTipoColegiado || comissao.DescricaoTipoColegiado || '').toLowerCase();
                if (tipoText.includes('cpmi') || tipoText.includes('cpi') || tipoText.includes('inquérito')) {
                    tipo = 'cpmi';
                }
                else if (tipoText.includes('veto')) {
                    tipo = 'veto';
                }
                else if (tipoText.includes('mpv') || tipoText.includes('medida provisória')) {
                    tipo = 'mpv';
                }
                else if (tipoText.includes('especial')) {
                    tipo = 'especial';
                }
                else if (tipoText.includes('perm')) {
                    tipo = 'permanente';
                }
            }
            else if (comissao.Sigla) {
                // Tentar inferir o tipo pela sigla da comissão
                const sigla = comissao.Sigla.toLowerCase();
                if (sigla.includes('cpmi') || sigla.startsWith('cpi')) {
                    tipo = 'cpmi';
                }
                else if (sigla.includes('veto')) {
                    tipo = 'veto';
                }
                else if (sigla.includes('mpv')) {
                    tipo = 'mpv';
                }
                else if (sigla.startsWith('ce')) {
                    tipo = 'especial';
                }
            }
            // Encontrar detalhes e composição
            const detalheComissao = detalhesMap[codigo] || {};
            const composicaoComissao = composicoesMap[codigo]?.dados || {};
            // Determinar se está ativa com base nas propriedades disponíveis
            let ativa = true;
            if (comissao.Publica === 'N') {
                ativa = false;
            }
            else if (comissao.DataExtincao) {
                ativa = false;
            }
            else if (detalheComissao.DataExtincao) {
                ativa = false;
            }
            // Criar objeto transformado
            const comissaoTransformada = {
                codigo: codigo,
                sigla: comissao.Sigla || detalheComissao.Sigla || '',
                nome: comissao.Nome || detalheComissao.Nome || '',
                ativa: ativa,
                tipo: tipo,
                apelido: comissao.Apelido || detalheComissao.Apelido || undefined,
                casa: 'CN',
                dataCriacao: comissao.DataInicio || comissao.DataCriacao || detalheComissao.DataCriacao || null,
                dataExtincao: comissao.DataExtincao || detalheComissao.DataExtincao || null,
                dataInstalacao: comissao.DataInstalacao || detalheComissao.DataInstalacao || null,
                finalidade: comissao.Finalidade || detalheComissao.Finalidade || null,
                historia: comissao.Historia || detalheComissao.Historia || null,
                participacao: comissao.Participacao || detalheComissao.Participacao || null,
                composicao: {
                    membros: this.transformarMembros(composicaoComissao)
                },
                atualizadoEm: new Date().toISOString()
            };
            // Adicionar à lista do tipo apropriado
            if (!comissoesPorTipo[tipo]) {
                comissoesPorTipo[tipo] = [];
            }
            comissoesPorTipo[tipo].push(comissaoTransformada);
        });
        return comissoesPorTipo;
    }
    /**
     * Transforma os membros da comissão
     */
    transformarMembros(composicao) {
        // Verificar diferentes estruturas de membros na API
        if (!composicao)
            return [];
        let membros = [];
        try {
            // Estrutura 1: Membros diretos
            if (composicao.Membros && composicao.Membros.Membro) {
                const membrosData = composicao.Membros.Membro;
                membros = Array.isArray(membrosData) ? membrosData : [membrosData];
            }
            // Estrutura 2: Membros por bloco no Senado
            else if (composicao.MembrosBlocoSF) {
                // Extrair membros de cada partido/bloco
                const blocos = Array.isArray(composicao.MembrosBlocoSF.PartidoBloco)
                    ? composicao.MembrosBlocoSF.PartidoBloco
                    : [composicao.MembrosBlocoSF.PartidoBloco];
                blocos.forEach((bloco) => {
                    if (bloco && bloco.MembrosSF && bloco.MembrosSF.Membro) {
                        const blocoMembros = Array.isArray(bloco.MembrosSF.Membro)
                            ? bloco.MembrosSF.Membro
                            : [bloco.MembrosSF.Membro];
                        membros = membros.concat(blocoMembros);
                    }
                });
            }
            // Estrutura 3: Membros por bloco na Câmara
            else if (composicao.MembrosBlocoCD) {
                // Extrair membros da lista de blocos
                const blocos = Array.isArray(composicao.MembrosBlocoCD.Membro)
                    ? composicao.MembrosBlocoCD.Membro
                    : [composicao.MembrosBlocoCD.Membro];
                blocos.forEach((bloco) => {
                    if (bloco && bloco.MembrosCD && bloco.MembrosCD.Membro) {
                        const blocoMembros = Array.isArray(bloco.MembrosCD.Membro)
                            ? bloco.MembrosCD.Membro
                            : [bloco.MembrosCD.Membro];
                        membros = membros.concat(blocoMembros);
                    }
                });
            }
        }
        catch (error) {
            logger_1.logger.error(`Erro ao extrair membros: ${error}`);
            return [];
        }
        return membros.map((membro) => {
            const identificacao = membro.IdentificacaoParlamentar || {};
            return {
                codigo: identificacao.CodigoParlamentar || membro.CodigoParlamentar || '',
                nome: identificacao.NomeParlamentar || membro.NomeParlamentar || '',
                nomeCompleto: identificacao.NomeCompletoParlamentar || undefined,
                partido: identificacao.SiglaPartidoParlamentar || membro.SiglaPartido || membro.Partido || undefined,
                uf: identificacao.UfParlamentar || membro.SiglaUf || membro.UfParlamentar || undefined,
                participacao: membro.DescricaoParticipacao || membro.TipoVaga || membro.ProprietarioVaga || '',
                cargo: membro.DescricaoCargo || membro.TipoCargo || undefined,
                dataDesignacao: membro.DataDesignacao || membro.DataInicioMembroVaga || null,
                dataFim: membro.DataFim || null,
                motivoFim: membro.DescricaoMotivo || null
            };
        });
    }
    /**
     * Cria índices para consultas rápidas
     */
    criarIndices(comissoesSenado, comissoesCongresso) {
        // Índice por código
        const porCodigo = {};
        // Índice por parlamentar
        const porParlamentar = {};
        try {
            // Processar comissões do Senado
            Object.entries(comissoesSenado).forEach(([tipo, comissoes]) => {
                if (!Array.isArray(comissoes)) {
                    logger_1.logger.warn(`Comissões do Senado tipo ${tipo} não é um array`);
                    return;
                }
                comissoes.forEach(comissao => {
                    if (!comissao || !comissao.codigo)
                        return;
                    // Índice por código
                    porCodigo[comissao.codigo] = {
                        tipo: tipo,
                        casa: 'SF',
                        sigla: comissao.sigla,
                        nome: comissao.nome
                    };
                    // Índice por parlamentar
                    if (comissao.composicao && comissao.composicao.membros) {
                        comissao.composicao.membros.forEach(membro => {
                            if (!membro || !membro.codigo)
                                return;
                            const codigoParlamentar = membro.codigo;
                            if (!porParlamentar[codigoParlamentar]) {
                                porParlamentar[codigoParlamentar] = {
                                    nome: membro.nome || '',
                                    partido: membro.partido || '',
                                    uf: membro.uf || '',
                                    comissoes: []
                                };
                            }
                            porParlamentar[codigoParlamentar].comissoes.push({
                                codigo: comissao.codigo,
                                sigla: comissao.sigla,
                                nome: comissao.nome,
                                casa: 'SF',
                                tipo: tipo,
                                cargo: membro.cargo || '',
                                titular: typeof membro.participacao === 'string' &&
                                    membro.participacao.toLowerCase().includes('titular')
                            });
                        });
                    }
                });
            });
            // Processar comissões do Congresso
            Object.entries(comissoesCongresso).forEach(([tipo, comissoes]) => {
                if (!Array.isArray(comissoes)) {
                    logger_1.logger.warn(`Comissões do Congresso tipo ${tipo} não é um array`);
                    return;
                }
                comissoes.forEach(comissao => {
                    if (!comissao || !comissao.codigo)
                        return;
                    // Índice por código
                    porCodigo[comissao.codigo] = {
                        tipo: tipo,
                        casa: 'CN',
                        sigla: comissao.sigla,
                        nome: comissao.nome
                    };
                    // Índice por parlamentar
                    if (comissao.composicao && comissao.composicao.membros) {
                        comissao.composicao.membros.forEach(membro => {
                            if (!membro || !membro.codigo)
                                return;
                            const codigoParlamentar = membro.codigo;
                            if (!porParlamentar[codigoParlamentar]) {
                                porParlamentar[codigoParlamentar] = {
                                    nome: membro.nome || '',
                                    partido: membro.partido || '',
                                    uf: membro.uf || '',
                                    comissoes: []
                                };
                            }
                            porParlamentar[codigoParlamentar].comissoes.push({
                                codigo: comissao.codigo,
                                sigla: comissao.sigla,
                                nome: comissao.nome,
                                casa: 'CN',
                                tipo: tipo,
                                cargo: membro.cargo || '',
                                titular: typeof membro.participacao === 'string' &&
                                    membro.participacao.toLowerCase().includes('titular')
                            });
                        });
                    }
                });
            });
        }
        catch (error) {
            logger_1.logger.error(`Erro ao criar índices: ${error}`);
        }
        return {
            porCodigo: porCodigo,
            porParlamentar: porParlamentar
        };
    }
}
exports.ComissoesTransformer = ComissoesTransformer;
// Exporta uma instância do transformador
exports.comissoesTransformer = new ComissoesTransformer();
//# sourceMappingURL=comissoes.js.map