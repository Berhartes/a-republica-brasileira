"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.perfilSenadoresLoader = exports.PerfilSenadoresLoader = void 0;
exports.carregarPerfisSenadores = carregarPerfisSenadores;
/**
 * Módulo de carregamento de perfis de senadores para o Firestore
 * Este módulo é especializado na persistência de perfis completos de senadores,
 * com suporte para legislaturas específicas
 */
const logging_1 = require("../utils/logging");
const storage_1 = require("../utils/storage");
const common_1 = require("../utils/common");
// Função auxiliar para parsear caminhos do Firestore
function parseFirestorePath(fullPath) {
    const parts = fullPath.split('/');
    if (parts.length % 2 !== 0) {
        throw new Error(`Caminho Firestore inválido: ${fullPath}. Deve ter um número par de segmentos (coleção/documento/coleção/documento...).`);
    }
    const documentId = parts[parts.length - 1];
    const collectionPath = parts.slice(0, parts.length - 1).join('/');
    return { collectionPath, documentId };
}
/**
 * Classe para carregar dados de perfis de senadores no Firestore
 */
class PerfilSenadoresLoader {
    /**
     * Salva lista de senadores de uma legislatura específica
     * @param transformedData - Dados transformados dos senadores
     * @param legislaturaNumero - Número da legislatura
     * @returns Resultado da operação
     */
    async saveSenadoresLegislatura(transformedData, legislaturaNumero) {
        try {
            logging_1.logger.info(`Salvando lista de ${transformedData.senadores.length} senadores para a legislatura ${legislaturaNumero}`);
            const batchManager = (0, storage_1.createBatchManager)();
            const timestamp = new Date().toISOString();
            // 1. Atualizar lista na estrutura da legislatura específica
            const legislaturaRef = `congressoNacional/senadoFederal/legislaturas/${legislaturaNumero}/senadores/lista`;
            const { collectionPath: legListCollection, documentId: legListDocId } = parseFirestorePath(legislaturaRef);
            batchManager.set(legListCollection, legListDocId, {
                timestamp,
                legislatura: legislaturaNumero,
                total: transformedData.senadores.length,
                atualizadoEm: timestamp,
                metadados: {}
            });
            // 2. Salvar dados individuais de cada senador na coleção da legislatura
            for (const senador of transformedData.senadores) {
                // Verifica se o senador tem dados básicos
                if (!senador || !senador.codigo) {
                    logging_1.logger.warn('Senador sem dados básicos completos, pulando...');
                    continue;
                }
                const senadorRef = `congressoNacional/senadoFederal/legislaturas/${legislaturaNumero}/senadores/${senador.codigo}`;
                const { collectionPath: senadorLegCollection, documentId: senadorLegDocId } = parseFirestorePath(senadorRef);
                // Verificar se o senador já possui um perfil completo
                const perfilRef = `congressoNacional/senadoFederal/perfis/${senador.codigo}`;
                const perfilExiste = await this.verificaPerfilExiste(perfilRef);
                batchManager.set(senadorLegCollection, senadorLegDocId, {
                    ...senador,
                    perfilDisponivel: perfilExiste,
                    atualizadoEm: timestamp
                });
            }
            // Commit das operações
            await batchManager.commitAndReset();
            logging_1.logger.info(`Lista de senadores da legislatura ${legislaturaNumero} salva com sucesso`);
            return {
                timestamp,
                totalSalvos: transformedData.senadores.length,
                legislatura: legislaturaNumero,
                status: 'success'
            };
        }
        catch (error) {
            logging_1.logger.error(`Erro ao salvar lista de senadores da legislatura ${legislaturaNumero}: ${error.message}`);
            throw error;
        }
    }
    /**
     * Verifica se um perfil existe no Firestore (mock)
     * @param perfilRef - Referência do perfil
     * @returns Verdadeiro se o perfil existe
     */
    async verificaPerfilExiste(perfilRef) {
        // Simulação de verificação no Firestore
        // Na implementação real, usaria get() para verificar
        logging_1.logger.debug(`Verificando existência do perfil ${perfilRef}`);
        return false; // Por padrão, assume que o perfil não existe ainda
    }
    /**
     * Salva perfil completo de um senador no Firestore
     * @param perfilData - Perfil transformado do senador
     * @param legislaturaNumero - Número da legislatura (opcional)
     * @returns Resultado da operação
     */
    async savePerfil(perfilData, legislaturaNumero) {
        try {
            // Verificação de segurança
            if (!perfilData || !perfilData.codigo) {
                logging_1.logger.error('Dados de perfil inválidos para salvamento');
                return {
                    timestamp: new Date().toISOString(),
                    codigo: 'desconhecido',
                    status: 'error'
                };
            }
            logging_1.logger.info(`Salvando perfil completo do senador ${perfilData.nome} (${perfilData.codigo}) ${legislaturaNumero ? `da legislatura ${legislaturaNumero}` : ''}`);
            const timestamp = new Date().toISOString();
            // 1. Salvar no firestore na coleção de perfis
            const perfilRef = `congressoNacional/senadoFederal/perfis/${perfilData.codigo}`;
            const batchManager = (0, storage_1.createBatchManager)();
            const { collectionPath: perfilCollection, documentId: perfilDocId } = parseFirestorePath(perfilRef);
            batchManager.set(perfilCollection, perfilDocId, {
                ...perfilData,
                atualizadoEm: timestamp
            });
            // 2. Atualizar referências básicas para mostrar que o perfil está disponível
            await this.updateReferenciasBasicas(perfilData, legislaturaNumero, batchManager);
            // Commit das operações
            await batchManager.commitAndReset();
            logging_1.logger.info(`Perfil do senador ${perfilData.codigo} salvo com sucesso`);
            return {
                timestamp,
                codigo: perfilData.codigo,
                status: 'success'
            };
        }
        catch (error) {
            logging_1.logger.error(`Erro ao salvar perfil do senador ${perfilData?.codigo || 'desconhecido'}: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                codigo: perfilData?.codigo || 'desconhecido',
                status: 'error'
            };
        }
    }
    /**
     * Salva múltiplos perfis de senadores em uma única operação
     * @param perfis - Lista de perfis transformados
     * @param legislaturaNumero - Número da legislatura (opcional)
     * @returns Resultado da operação
     */
    async saveMultiplosPerfis(perfis, legislaturaNumero) {
        try {
            logging_1.logger.info(`Salvando ${perfis.length} perfis de senadores ${legislaturaNumero ? `da legislatura ${legislaturaNumero}` : ''}`);
            const timestamp = new Date().toISOString();
            let sucessos = 0;
            let falhas = 0;
            // Processar em lotes para melhor performance
            const tamanhoLote = 10;
            const lotes = [];
            for (let i = 0; i < perfis.length; i += tamanhoLote) {
                lotes.push(perfis.slice(i, i + tamanhoLote));
            }
            for (const [indice, lote] of lotes.entries()) {
                logging_1.logger.info(`Processando lote ${indice + 1}/${lotes.length} (${lote.length} perfis)`);
                const batchManager = (0, storage_1.createBatchManager)();
                // Salvar cada perfil no lote
                for (const perfil of lote) {
                    try {
                        // Verificar se o perfil é válido
                        if (!perfil || !perfil.codigo) {
                            logging_1.logger.warn(`Perfil inválido encontrado no lote ${indice + 1}, pulando...`);
                            falhas++;
                            continue;
                        }
                        // 1. Salvar no firestore na coleção de perfis
                        const perfilRef = `congressoNacional/senadoFederal/perfis/${perfil.codigo}`;
                        const { collectionPath: perfilBatchCollection, documentId: perfilBatchDocId } = parseFirestorePath(perfilRef);
                        batchManager.set(perfilBatchCollection, perfilBatchDocId, {
                            ...perfil,
                            atualizadoEm: timestamp
                        });
                        // 2. Atualizar referências básicas
                        await this.updateReferenciasBasicas(perfil, legislaturaNumero, batchManager);
                        sucessos++;
                    }
                    catch (error) {
                        logging_1.logger.warn(`Erro ao processar perfil do senador ${perfil?.codigo || 'desconhecido'} no lote ${indice + 1}: ${error.message}`);
                        falhas++;
                    }
                }
                // Commit das operações do lote
                try {
                    await batchManager.commitAndReset();
                }
                catch (error) {
                    logging_1.logger.error(`Erro ao fazer commit do lote ${indice + 1}: ${error.message}`);
                    // Ajustar contadores de sucesso/falha
                    falhas += lote.length;
                    sucessos -= lote.length;
                }
                // Pequena pausa entre lotes para evitar sobrecarga
                if (indice < lotes.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            logging_1.logger.info(`Salvamento de perfis concluído: ${sucessos} sucessos, ${falhas} falhas`);
            return {
                timestamp,
                total: perfis.length,
                sucessos,
                falhas,
                status: 'success'
            };
        }
        catch (error) {
            logging_1.logger.error(`Erro ao salvar múltiplos perfis: ${error.message}`);
            return {
                timestamp: new Date().toISOString(),
                total: perfis.length,
                sucessos: 0,
                falhas: perfis.length,
                status: 'error'
            };
        }
    }
    /**
     * Atualiza referências básicas para indicar que um perfil está disponível
     * @param perfil - Perfil do senador
     * @param legislaturaNumero - Número da legislatura específica (opcional)
     * @param batchManager - Gerenciador de batch (opcional)
     */
    async updateReferenciasBasicas(perfil, legislaturaNumero, batchManager) {
        try {
            // Verifica se o perfil é válido
            if (!perfil || !perfil.codigo) {
                return;
            }
            const newBatchManager = batchManager || (0, storage_1.createBatchManager)();
            const useExistingBatch = !!batchManager;
            const timestamp = new Date().toISOString();
            // Cria objeto com referência básica
            const referencia = {
                codigo: perfil.codigo,
                nome: perfil.nome || 'Nome não disponível',
                nomeCompleto: perfil.nomeCompleto || perfil.nome || 'Nome não disponível',
                partido: perfil.partido?.sigla || '',
                uf: perfil.uf || '',
                perfilDisponivel: true,
                situacaoAtual: {
                    emExercicio: perfil.situacaoAtual?.emExercicio || false,
                    afastado: perfil.situacaoAtual?.afastado || false,
                    titular: perfil.situacaoAtual?.titular || false,
                    suplente: perfil.situacaoAtual?.suplente || false
                },
                atualizadoEm: timestamp
            };
            // Atualizamos apenas a legislatura específica
            if (legislaturaNumero) {
                const senadorRef = `congressoNacional/senadoFederal/legislaturas/${legislaturaNumero}/senadores/${perfil.codigo}`;
                // Na simulação, simplesmente setamos o documento
                const { collectionPath: senadorRefCollection, documentId: senadorRefDocId } = parseFirestorePath(senadorRef);
                newBatchManager.set(senadorRefCollection, senadorRefDocId, {
                    ...referencia,
                    legislatura: legislaturaNumero
                });
            }
            else {
                // Se não especificamos legislatura, não fazemos nada
                // Não atualizamos mais a estrutura "atual"
                logging_1.logger.info(`Não atualizando estrutura "atual" para o senador ${perfil.codigo}`);
            }
            // Se criamos um novo batch manager, fazemos o commit
            if (!useExistingBatch) {
                await newBatchManager.commitAndReset();
            }
        }
        catch (error) {
            logging_1.logger.warn(`Erro ao atualizar referências básicas do senador ${perfil?.codigo || 'desconhecido'}: ${error.message}`);
            // Não propagamos o erro para não interromper o fluxo principal
        }
    }
    /**
     * Método saveSenadoresAtuais removido - não implementamos mais informações na pasta "atual"
     */
    /**
     * Salva um snapshot histórico dos perfis de senadores
     * @param perfis - Lista de perfis completos transformados
     * @param legislaturaNumero - Número da legislatura
     * @returns Resultado da operação
     */
    async saveHistorico(perfis, legislaturaNumero) {
        logging_1.logger.info(`Salvando histórico de ${perfis.length} perfis de senadores da legislatura ${legislaturaNumero}`);
        const timestamp = new Date().toISOString();
        const historicRef = `congressoNacional/senadoFederal/historico/senadores/snapshots/${legislaturaNumero}_${timestamp}`;
        // Na versão mock, apenas logamos a operação
        logging_1.logger.info(`Simulando salvamento de histórico em ${historicRef}`);
        logging_1.logger.debug('Dados do snapshot:', {
            timestamp,
            legislatura: legislaturaNumero,
            totalPerfis: perfis.length
        });
        // Simula um atraso para parecer mais realista
        await new Promise(resolve => setTimeout(resolve, 500));
        logging_1.logger.info('Histórico de perfis de senadores salvo no Firestore (mock)');
        return {
            timestamp,
            legislatura: legislaturaNumero,
            total: perfis.length,
            status: 'success'
        };
    }
}
exports.PerfilSenadoresLoader = PerfilSenadoresLoader;
// Método para carregar perfis com opção de exportação para arquivos
async function carregarPerfisSenadores(legislatura, opcoesExportacao) {
    logging_1.logger.info(`Iniciando carregamento de perfis para legislatura ${legislatura}`);
    // Registrar tempo de início para cálculo de estatísticas
    const tempoInicio = Date.now();
    try {
        // Simular o carregamento de dados
        // Na implementação real, esta parte seria a chamada para a API
        logging_1.logger.info(`Obtendo dados de senadores da legislatura ${legislatura}`);
        // Simular um atraso para parecer mais realista
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Gerar dados simulados para teste
        const perfisSenadores = Array.from({ length: 20 }, (_, index) => ({
            codigo: `${1000 + index}`,
            nome: `Senador Teste ${index + 1}`,
            nomeCompleto: `Senador Teste Completo ${index + 1}`,
            genero: index % 3 === 0 ? 'F' : 'M',
            partido: { sigla: ['PT', 'MDB', 'PL', 'PP', 'PSDB'][index % 5], nome: 'Partido Teste' },
            uf: ['SP', 'RJ', 'MG', 'RS', 'BA'][index % 5],
            foto: `https://www.senado.leg.br/senadores/img/fotos/teste${index + 1}.jpg`,
            email: `senador.teste${index + 1}@senado.leg.br`,
            telefones: [{
                    numero: `(61) 3303-${1000 + index}`,
                    tipo: 'Telefone'
                }],
            paginaOficial: `https://www.senado.leg.br/senadores/senador${index + 1}`,
            situacao: {
                emExercicio: true,
                afastado: false,
                titular: index % 4 !== 0,
                suplente: index % 4 === 0,
                cargoMesa: index % 7 === 0,
                cargoLideranca: index % 9 === 0
            },
            mandatoAtual: {
                codigo: `${2000 + index}`,
                participacao: index % 4 === 0 ? 'Suplente' : 'Titular',
                legislatura: '57'
            },
            dadosPessoais: {
                dataNascimento: '1960-01-01',
                naturalidade: `Cidade Teste ${index % 5 + 1}`,
                ufNaturalidade: ['SP', 'RJ', 'MG', 'RS', 'BA'][index % 5],
                enderecoParlamentar: `Senado Federal, Anexo II, Gabinete ${10 + index}`
            },
            mandatos: [
                {
                    codigo: `${2000 + index}`,
                    participacao: index % 4 === 0 ? 'Suplente' : 'Titular',
                    legislatura: '57',
                    dataInicio: '2023-02-01',
                    dataFim: '2027-01-31',
                    exercicios: [],
                    suplentes: []
                }
            ],
            comissoes: [
                {
                    codigo: `${3000 + index}`,
                    sigla: `COM${index % 5 + 1}`,
                    nome: `Comissão ${index % 5 + 1}`,
                    casa: 'SF',
                    participacao: 'Titular',
                    dataInicio: '2023-02-15',
                    atual: true
                },
                {
                    codigo: `${3100 + index}`,
                    sigla: `COM${(index + 2) % 5 + 1}`,
                    nome: `Comissão ${(index + 2) % 5 + 1}`,
                    casa: 'SF',
                    participacao: 'Suplente',
                    dataInicio: '2023-03-01',
                    atual: true
                }
            ],
            filiacoes: [
                {
                    partido: {
                        codigo: `${4000 + index % 5}`,
                        sigla: ['PT', 'MDB', 'PL', 'PP', 'PSDB'][index % 5],
                        nome: 'Partido Teste'
                    },
                    dataFiliacao: '2020-01-01',
                    atual: true
                }
            ],
            formacao: {
                historicoAcademico: [
                    {
                        curso: 'Direito',
                        grau: 'Superior',
                        instituicao: `Universidade Teste ${index % 3 + 1}`,
                        local: `Cidade Universitária ${index % 3 + 1}`
                    }
                ],
                profissao: [
                    {
                        nome: ['Advogado', 'Economista', 'Médico', 'Engenheiro', 'Professor'][index % 5],
                        principal: true
                    }
                ]
            },
            licencas: [],
            apartes: [],
            situacaoAtual: {
                emExercicio: true,
                afastado: false,
                titular: index % 4 !== 0,
                suplente: index % 4 === 0,
                mandatoAtual: {
                    codigo: `${2000 + index}`,
                    participacao: index % 4 === 0 ? 'Suplente' : 'Titular',
                    legislatura: '57'
                }
            },
            metadados: {
                atualizadoEm: new Date().toISOString(),
                fontes: {
                    dadosBasicos: 'mock'
                }
            },
            atualizadoEm: new Date().toISOString()
        }));
        // Após carregar os dados, verificar se devemos exportá-los
        if (opcoesExportacao) {
            await (0, common_1.exportarDados)(perfisSenadores, legislatura, opcoesExportacao, tempoInicio);
        }
        return perfisSenadores;
    }
    catch (erro) {
        logging_1.logger.error(`Erro ao carregar perfis de senadores: ${erro.message}`);
        throw erro;
    }
}
// Exporta uma instância do carregador
exports.perfilSenadoresLoader = new PerfilSenadoresLoader();
//# sourceMappingURL=perfilsenadores.js.map