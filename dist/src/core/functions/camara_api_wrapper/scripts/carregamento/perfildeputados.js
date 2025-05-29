"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerfilDeputadosLoader = void 0;
/**
 * Carregador especializado para perfis de deputados
 * Este módulo trata especificamente do carregamento de perfis completos de deputados
 * para o Firestore, seguindo a mesma estrutura usada para senadores.
 */
const logging_1 = require("../utils/logging");
const config_1 = require("../utils/storage/firestore/config"); // Admin SDK e BatchManager
// Constantes para coleções no Firestore
// Usando a mesma estrutura de caminhos que é usada para senadores
const CAMINHO_BASE = 'congressoNacional/camaraDeputados';
const CAMINHO_PERFIS = `${CAMINHO_BASE}/perfis`;
const CAMINHO_ORGAOS = `${CAMINHO_BASE}/orgaos`;
const CAMINHO_FRENTES = `${CAMINHO_BASE}/frentes`;
const CAMINHO_LEGISLATURAS = `${CAMINHO_BASE}/legislaturas`;
const CAMINHO_OCUPACOES = `${CAMINHO_BASE}/ocupacoes`;
const CAMINHO_MANDATOS_EXTERNOS = `${CAMINHO_BASE}/mandatosExternos`;
const CAMINHO_HISTORICO = `${CAMINHO_BASE}/historico`;
const CAMINHO_PROFISSOES = `${CAMINHO_BASE}/profissoes`;
const CAMINHO_GABINETES = `${CAMINHO_BASE}/gabinetes`;
const CAMINHO_DADOS_PESSOAIS = `${CAMINHO_BASE}/dadosPessoais`;
const CAMINHO_STATUS = `${CAMINHO_BASE}/ultimoStatus`;
/**
 * Classe para carregamento de perfis de deputados no Firestore
 */
class PerfilDeputadosLoader {
    /**
     * Salva a lista de deputados de uma legislatura específica no Firestore
     * Na pasta de legislaturas salvamos apenas dados básicos do endpoint de detalhes
     * @param transformedData - Dados transformados dos deputados
     * @param legislaturaNumero - Número da legislatura
     * @returns Resultado do carregamento
     */
    async salvarDeputadosLegislatura(transformedData, legislaturaNumero) {
        logging_1.logger.info(`Salvando ${transformedData.deputados.length} deputados para a legislatura ${legislaturaNumero}`);
        const batchManager = new config_1.FirestoreBatchManager();
        const timestamp = new Date().toISOString();
        // 1. Documento com metadados da extração
        const metadataRef = config_1.db.doc(`${CAMINHO_BASE}/metadata/deputados`);
        await batchManager.set(metadataRef.path, '', {
            ultimaAtualizacao: timestamp,
            legislaturaAtual: legislaturaNumero,
            totalDeputados: transformedData.deputados.length
        }, { merge: true });
        // 2. Documento com metadados da legislatura
        const legislaturaRef = config_1.db.doc(`${CAMINHO_LEGISLATURAS}/${legislaturaNumero}`);
        await batchManager.set(legislaturaRef.path, '', {
            numero: legislaturaNumero,
            totalDeputados: transformedData.deputados.length,
            atualizadoEm: timestamp
        }, { merge: true });
        // 3. Salvar cada deputado na legislatura com dados básicos
        let sucessos = 0;
        let falhas = 0;
        for (const deputado of transformedData.deputados) {
            try {
                // Verifica se o deputado tem dados básicos
                if (!deputado || !deputado.codigo) {
                    logging_1.logger.warn('Deputado sem dados básicos completos, pulando...');
                    falhas++;
                    continue;
                }
                // Referência para o deputado na legislatura
                const deputadoRef = this.getDeputadoLegislaturaRef(deputado.codigo, legislaturaNumero);
                // Verificar se o deputado já possui um perfil completo
                const perfilRef = this.getPerfilRef(deputado.codigo);
                // Verificar se o perfil existe
                const perfilDoc = await perfilRef.get();
                const perfilExiste = perfilDoc.exists;
                // **APENAS DADOS BÁSICOS** na pasta de legislaturas
                // Extrair apenas dados essenciais do endpoint de detalhes
                const dadosBasicosLegislatura = {
                    // Dados de identificação
                    codigo: deputado.codigo,
                    nome: deputado.nome,
                    nomeCompleto: deputado.nomeCompleto,
                    email: deputado.email,
                    foto: deputado.foto,
                    genero: deputado.genero,
                    // Dados do partido e UF
                    partido: deputado.partido,
                    uf: deputado.uf,
                    // Situação atual
                    situacao: deputado.situacao,
                    legislaturaAtual: deputado.legislaturaAtual,
                    // Dados pessoais básicos (do endpoint de detalhes)
                    dadosPessoais: {
                        nomeCivil: deputado.dadosPessoais?.nomeCivil || '',
                        cpf: deputado.dadosPessoais?.cpf || '',
                        sexo: deputado.dadosPessoais?.sexo || '',
                        dataNascimento: deputado.dadosPessoais?.dataNascimento || null,
                        dataFalecimento: deputado.dadosPessoais?.dataFalecimento || null,
                        naturalidade: deputado.dadosPessoais?.naturalidade || '',
                        ufNaturalidade: deputado.dadosPessoais?.ufNaturalidade || '',
                        escolaridade: deputado.dadosPessoais?.escolaridade || '',
                        urlWebsite: deputado.dadosPessoais?.urlWebsite || '',
                        redeSocial: deputado.dadosPessoais?.redeSocial || ''
                    },
                    // Último status (do endpoint de detalhes)
                    ultimoStatus: deputado.ultimoStatus,
                    // Gabinete (do endpoint de detalhes)
                    gabinete: deputado.gabinete,
                    // Metadados
                    perfilDisponivel: perfilExiste,
                    atualizadoEm: timestamp
                };
                // Adicionar dados ao batch
                await batchManager.set(deputadoRef.parent.path, deputadoRef.id, dadosBasicosLegislatura, { merge: true });
                sucessos++;
            }
            catch (error) {
                logging_1.logger.error(`Erro ao salvar deputado ${deputado?.codigo || 'desconhecido'}: ${error.message}`);
                falhas++;
            }
        }
        // Executar batch
        try {
            await batchManager.commit();
            logging_1.logger.info(`Batch de deputados da legislatura ${legislaturaNumero} salvo com sucesso`);
        }
        catch (error) {
            logging_1.logger.error(`Erro ao salvar batch de deputados da legislatura ${legislaturaNumero}: ${error.message}`);
            // Considerar todos como falha em caso de erro no batch
            return { sucessos: 0, falhas: transformedData.deputados.length };
        }
        return { sucessos, falhas };
    }
    /**
     * Carrega um perfil completo de deputado no Firestore
     * @param deputado - Perfil completo transformado
     * @returns Resultado do carregamento
     */
    async carregarPerfilCompleto(deputado) {
        try {
            logging_1.logger.info(`Carregando perfil completo do deputado ${deputado.codigo}`);
            // Verificar se o deputado tem código válido
            if (!deputado.codigo) {
                logging_1.logger.error('Deputado sem código válido, impossível salvar');
                return {
                    timestamp: new Date().toISOString(),
                    codigo: 'desconhecido',
                    sucesso: false,
                    mensagem: 'Deputado sem código válido'
                };
            }
            // Iniciar batch para operações atômicas
            const batchManager = new config_1.FirestoreBatchManager();
            // Referências para documentos
            const refPerfil = this.getPerfilRef(deputado.codigo);
            const refDadosPessoais = this.getDadosPessoaisRef(deputado.codigo);
            const refUltimoStatus = this.getUltimoStatusRef(deputado.codigo);
            const refGabinete = this.getGabineteRef(deputado.codigo);
            const refOrgaos = this.getOrgaosRef(deputado.codigo);
            const refFrentes = this.getFrentesRef(deputado.codigo);
            const refOcupacoes = this.getOcupacoesRef(deputado.codigo);
            const refMandatosExternos = this.getMandatosExternosRef(deputado.codigo);
            const refHistorico = this.getHistoricoRef(deputado.codigo);
            const refProfissoes = this.getProfissoesRef(deputado.codigo);
            // Preparar dados para salvar (remover objetos complexos do perfil principal)
            const perfilSemObjetos = { ...deputado };
            // Usar operador de espalhamento para criar um novo objeto sem as propriedades indesejadas
            const { dadosPessoais, ultimoStatus, gabinete, orgaos, frentes, ocupacoes, mandatosExternos, historico, profissoes, ...dadosPrincipais } = perfilSemObjetos;
            // Adicionar dados ao batch
            await batchManager.set(refPerfil.parent.path, refPerfil.id, dadosPrincipais, { merge: true });
            await batchManager.set(refDadosPessoais.parent.path, refDadosPessoais.id, { dados: deputado.dadosPessoais || {} }, { merge: true });
            await batchManager.set(refUltimoStatus.parent.path, refUltimoStatus.id, { dados: deputado.ultimoStatus || {} }, { merge: true });
            await batchManager.set(refGabinete.parent.path, refGabinete.id, { dados: deputado.gabinete || {} }, { merge: true });
            await batchManager.set(refOrgaos.parent.path, refOrgaos.id, { items: deputado.orgaos || [] }, { merge: true });
            await batchManager.set(refFrentes.parent.path, refFrentes.id, { items: deputado.frentes || [] }, { merge: true });
            await batchManager.set(refOcupacoes.parent.path, refOcupacoes.id, { items: deputado.ocupacoes || [] }, { merge: true });
            await batchManager.set(refMandatosExternos.parent.path, refMandatosExternos.id, { items: deputado.mandatosExternos || [] }, { merge: true });
            await batchManager.set(refHistorico.parent.path, refHistorico.id, { items: deputado.historico || [] }, { merge: true });
            await batchManager.set(refProfissoes.parent.path, refProfissoes.id, { items: deputado.profissoes || [] }, { merge: true });
            // Executar batch
            await batchManager.commit();
            logging_1.logger.info(`Perfil completo do deputado ${deputado.codigo} carregado com sucesso`);
            return {
                timestamp: new Date().toISOString(),
                codigo: deputado.codigo,
                sucesso: true,
                mensagem: 'Perfil completo carregado com sucesso',
                detalhes: {
                    perfilSalvo: true,
                    dadosPessoaisSalvos: true,
                    ultimoStatusSalvo: true,
                    gabineteSalvo: true,
                    orgaosSalvos: true,
                    frentesSalvas: true,
                    ocupacoesSalvas: true,
                    mandatosExternosSalvos: true,
                    historicoSalvo: true,
                    profissoesSalvas: true
                }
            };
        }
        catch (error) {
            logging_1.logger.error(`Erro ao carregar perfil completo do deputado ${deputado.codigo}: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                codigo: deputado.codigo || 'desconhecido',
                sucesso: false,
                mensagem: `Erro ao carregar perfil: ${error.message}`
            };
        }
    }
    /**
     * Carrega múltiplos perfis de deputados no Firestore
     * @param deputados - Lista de perfis completos transformados
     * @returns Lista de resultados de carregamento
     */
    async carregarMultiplosPerfis(deputados) {
        logging_1.logger.info(`Carregando ${deputados.length} perfis de deputados`);
        const resultados = [];
        const totalDeputados = deputados.length;
        // Processar cada deputado individualmente
        for (let i = 0; i < totalDeputados; i++) {
            const deputado = deputados[i];
            try {
                // Carregar perfil
                const resultado = await this.carregarPerfilCompleto(deputado);
                resultados.push(resultado);
                // Log de progresso
                logging_1.logger.info(`Progresso: ${i + 1}/${totalDeputados} deputados carregados`);
            }
            catch (error) {
                logging_1.logger.error(`Erro ao carregar deputado ${deputado.codigo}: ${error.message}`);
                // Adicionar resultado de erro
                resultados.push({
                    timestamp: new Date().toISOString(),
                    codigo: deputado.codigo || 'desconhecido',
                    sucesso: false,
                    mensagem: `Erro não tratado: ${error.message}`
                });
            }
        }
        // Contabilizar sucessos e falhas
        const sucessos = resultados.filter(r => r.sucesso).length;
        const falhas = resultados.filter(r => !r.sucesso).length;
        logging_1.logger.info(`Carregamento concluído: ${sucessos} sucessos, ${falhas} falhas`);
        return resultados;
    }
    /**
     * Salva múltiplos perfis de deputados no Firestore
     * @param perfis - Lista de perfis completos transformados
     * @param legislaturaNumero - Número da legislatura (opcional)
     * @returns Resultado do carregamento
     */
    async saveMultiplosPerfis(perfis, legislaturaNumero) {
        logging_1.logger.info(`Salvando ${perfis.length} perfis completos de deputados ${legislaturaNumero ? `da legislatura ${legislaturaNumero}` : ''}`);
        let sucessos = 0;
        let falhas = 0;
        const timestamp = new Date().toISOString();
        // Processar em lotes para evitar exceder limites do Firestore
        const tamanhoBatch = 20; // Número seguro para evitar exceder limites
        const totalLotes = Math.ceil(perfis.length / tamanhoBatch);
        for (let i = 0; i < totalLotes; i++) {
            const lote = perfis.slice(i * tamanhoBatch, (i + 1) * tamanhoBatch);
            logging_1.logger.info(`Processando lote ${i + 1}/${totalLotes} com ${lote.length} perfis`);
            const batchManager = new config_1.FirestoreBatchManager();
            // Salvar cada perfil no lote
            for (const perfil of lote) {
                try {
                    // Verificar se o perfil é válido
                    if (!perfil || !perfil.codigo) {
                        logging_1.logger.warn(`Perfil inválido encontrado no lote ${i + 1}, pulando...`);
                        falhas++;
                        continue;
                    }
                    // 1. Salvar no firestore na coleção de perfis
                    const perfilRef = this.getPerfilRef(perfil.codigo);
                    await batchManager.set(perfilRef.parent.path, perfilRef.id, {
                        ...perfil,
                        atualizadoEm: timestamp
                    }, { merge: true });
                    // 2. Atualizar referências na legislatura se fornecida
                    if (legislaturaNumero) {
                        const deputadoLegRef = this.getDeputadoLegislaturaRef(perfil.codigo, legislaturaNumero);
                        await batchManager.update(deputadoLegRef.parent.path, deputadoLegRef.id, {
                            perfilDisponivel: true,
                            atualizadoEm: timestamp
                        });
                    }
                    sucessos++;
                }
                catch (error) {
                    logging_1.logger.warn(`Erro ao processar perfil do deputado ${perfil?.codigo || 'desconhecido'} no lote ${i + 1}: ${error.message}`);
                    falhas++;
                }
            }
            // Executar batch
            try {
                await batchManager.commit();
                logging_1.logger.info(`Lote ${i + 1}/${totalLotes} processado com sucesso`);
            }
            catch (error) {
                logging_1.logger.error(`Erro ao processar lote ${i + 1}/${totalLotes}: ${error.message}`);
                // Considerar todos do lote como falha
                const falhasNoLote = lote.length - (sucessos - (i * tamanhoBatch)); // Calcula quantos falharam neste lote específico
                sucessos -= falhasNoLote; // Remove os sucessos que não ocorreram
                falhas += falhasNoLote; // Adiciona as falhas
            }
        }
        logging_1.logger.info(`Salvamento de perfis concluído: ${sucessos} sucessos, ${falhas} falhas`);
        return { sucessos, falhas };
    }
    /**
     * Carrega múltiplos perfis de deputados em lotes usando batches
     * @param deputados - Lista de perfis completos transformados
     * @param batchSize - Tamanho do lote para cada batch (máximo 500)
     * @returns Lista de resultados de carregamento
     */
    async carregarMultiplosPerfisEmLotes(deputados, batchSize = 100) {
        logging_1.logger.info(`Carregando ${deputados.length} perfis de deputados em lotes de ${batchSize}`);
        // Limitar tamanho do lote para respeitar limite do Firestore (500 operações por batch)
        const tamanhoBatch = Math.min(batchSize, 50); // 50 * 10 operações = 500 (limite exato do Firestore)
        const resultados = [];
        const totalDeputados = deputados.length;
        // Processar em lotes
        for (let i = 0; i < totalDeputados; i += tamanhoBatch) {
            const lote = deputados.slice(i, i + tamanhoBatch);
            logging_1.logger.info(`Processando lote ${Math.floor(i / tamanhoBatch) + 1} com ${lote.length} deputados`);
            try {
                // Criar batch
                const batchManager = new config_1.FirestoreBatchManager();
                // Mapear operações para cada deputado
                const operacoesLote = await Promise.all(lote.map(async (deputado) => {
                    try {
                        // Verificar se o deputado tem código válido
                        if (!deputado.codigo) {
                            logging_1.logger.warn('Deputado sem código válido, ignorando');
                            return {
                                timestamp: new Date().toISOString(),
                                codigo: 'desconhecido',
                                sucesso: false,
                                mensagem: 'Deputado sem código válido'
                            };
                        }
                        // Adicionar operações ao batch
                        await this.adicionarOperacoesAoBatchManager(batchManager, deputado);
                        // Retornar resultado de sucesso
                        return {
                            timestamp: new Date().toISOString(),
                            codigo: deputado.codigo,
                            sucesso: true,
                            mensagem: 'Perfil adicionado ao batch com sucesso'
                        };
                    }
                    catch (error) {
                        logging_1.logger.error(`Erro ao adicionar deputado ${deputado.codigo} ao batch: ${error.message}`);
                        return {
                            timestamp: new Date().toISOString(),
                            codigo: deputado.codigo || 'desconhecido',
                            sucesso: false,
                            mensagem: `Erro ao adicionar ao batch: ${error.message}`
                        };
                    }
                }));
                // Executar batch
                await batchManager.commit();
                // Atualizar resultados com sucesso para todos os que foram adicionados ao batch
                operacoesLote.forEach(op => {
                    if (op.sucesso) {
                        op.mensagem = 'Perfil carregado com sucesso';
                    }
                    resultados.push(op);
                });
                logging_1.logger.info(`Lote ${Math.floor(i / tamanhoBatch) + 1} processado com sucesso`);
            }
            catch (error) {
                logging_1.logger.error(`Erro ao processar lote ${Math.floor(i / tamanhoBatch) + 1}: ${error.message}`);
                // Adicionar falha para todos os deputados do lote
                lote.forEach(deputado => {
                    resultados.push({
                        timestamp: new Date().toISOString(),
                        codigo: deputado.codigo || 'desconhecido',
                        sucesso: false,
                        mensagem: `Erro no processamento do lote: ${error.message}`
                    });
                });
            }
            // Log de progresso
            logging_1.logger.info(`Progresso: ${Math.min(i + tamanhoBatch, totalDeputados)}/${totalDeputados} deputados`);
        }
        // Contabilizar sucessos e falhas
        const sucessos = resultados.filter(r => r.sucesso).length;
        const falhas = resultados.filter(r => !r.sucesso).length;
        logging_1.logger.info(`Carregamento em lotes concluído: ${sucessos} sucessos, ${falhas} falhas`);
        return resultados;
    }
    /**
     * Adiciona operações de um deputado ao batchManager
     * @param batchManager - Instância de FirestoreBatchManager
     * @param deputado - Perfil completo do deputado
     */
    async adicionarOperacoesAoBatchManager(batchManager, deputado) {
        // Referências para documentos
        const refPerfil = this.getPerfilRef(deputado.codigo);
        const refDadosPessoais = this.getDadosPessoaisRef(deputado.codigo);
        const refUltimoStatus = this.getUltimoStatusRef(deputado.codigo);
        const refGabinete = this.getGabineteRef(deputado.codigo);
        const refOrgaos = this.getOrgaosRef(deputado.codigo);
        const refFrentes = this.getFrentesRef(deputado.codigo);
        const refOcupacoes = this.getOcupacoesRef(deputado.codigo);
        const refMandatosExternos = this.getMandatosExternosRef(deputado.codigo);
        const refHistorico = this.getHistoricoRef(deputado.codigo);
        const refProfissoes = this.getProfissoesRef(deputado.codigo);
        // Preparar dados para salvar (remover objetos complexos do perfil principal)
        const perfilSemObjetos = { ...deputado };
        // Usar operador de espalhamento para criar um novo objeto sem as propriedades indesejadas
        const { dadosPessoais, ultimoStatus, gabinete, orgaos, frentes, ocupacoes, mandatosExternos, historico, profissoes, ...dadosPrincipais } = perfilSemObjetos;
        // Adicionar dados ao batch
        await batchManager.set(refPerfil.parent.path, refPerfil.id, dadosPrincipais, { merge: true });
        await batchManager.set(refDadosPessoais.parent.path, refDadosPessoais.id, { dados: deputado.dadosPessoais || {} }, { merge: true });
        await batchManager.set(refUltimoStatus.parent.path, refUltimoStatus.id, { dados: deputado.ultimoStatus || {} }, { merge: true });
        await batchManager.set(refGabinete.parent.path, refGabinete.id, { dados: deputado.gabinete || {} }, { merge: true });
        await batchManager.set(refOrgaos.parent.path, refOrgaos.id, { items: deputado.orgaos || [] }, { merge: true });
        await batchManager.set(refFrentes.parent.path, refFrentes.id, { items: deputado.frentes || [] }, { merge: true });
        await batchManager.set(refOcupacoes.parent.path, refOcupacoes.id, { items: deputado.ocupacoes || [] }, { merge: true });
        await batchManager.set(refMandatosExternos.parent.path, refMandatosExternos.id, { items: deputado.mandatosExternos || [] }, { merge: true });
        await batchManager.set(refHistorico.parent.path, refHistorico.id, { items: deputado.historico || [] }, { merge: true });
        await batchManager.set(refProfissoes.parent.path, refProfissoes.id, { items: deputado.profissoes || [] }, { merge: true });
    }
    // Métodos auxiliares para obter referências de documentos
    getPerfilRef(codigo) {
        // Usando o mesmo padrão de caminho que é usado para senadores
        return config_1.db.doc(`${CAMINHO_PERFIS}/${codigo}`);
    }
    getDadosPessoaisRef(codigo) {
        return config_1.db.doc(`${CAMINHO_DADOS_PESSOAIS}/deputados/${codigo}`);
    }
    getUltimoStatusRef(codigo) {
        return config_1.db.doc(`${CAMINHO_STATUS}/deputados/${codigo}`);
    }
    getGabineteRef(codigo) {
        return config_1.db.doc(`${CAMINHO_GABINETES}/deputados/${codigo}`);
    }
    getOrgaosRef(codigo) {
        return config_1.db.doc(`${CAMINHO_ORGAOS}/deputados/${codigo}`);
    }
    getFrentesRef(codigo) {
        return config_1.db.doc(`${CAMINHO_FRENTES}/deputados/${codigo}`);
    }
    getOcupacoesRef(codigo) {
        return config_1.db.doc(`${CAMINHO_OCUPACOES}/deputados/${codigo}`);
    }
    getMandatosExternosRef(codigo) {
        return config_1.db.doc(`${CAMINHO_MANDATOS_EXTERNOS}/deputados/${codigo}`);
    }
    getHistoricoRef(codigo) {
        return config_1.db.doc(`${CAMINHO_HISTORICO}/deputados/${codigo}`);
    }
    getProfissoesRef(codigo) {
        return config_1.db.doc(`${CAMINHO_PROFISSOES}/deputados/${codigo}`);
    }
    /**
     * Obtém referência para um deputado em uma legislatura específica
     * @param codigo - Código do deputado
     * @param legislatura - Número da legislatura
     * @returns Referência do documento no Firestore
     */
    getDeputadoLegislaturaRef(codigo, legislatura) {
        return config_1.db.doc(`${CAMINHO_LEGISLATURAS}/${legislatura}/deputados/${codigo}`);
    }
}
exports.PerfilDeputadosLoader = PerfilDeputadosLoader;
//# sourceMappingURL=perfildeputados.js.map