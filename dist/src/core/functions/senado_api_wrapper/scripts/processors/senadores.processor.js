"use strict";
/**
 * Processador especializado para senadores em exercício
 *
 * Este processador implementa o fluxo ETL completo para
 * extração, transformação e carregamento de senadores.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SenadoresProcessor = void 0;
const etl_processor_1 = require("../core/etl-processor");
const etl_types_1 = require("../types/etl.types");
const senadores_1 = require("../extracao/senadores");
const senadores_2 = require("../transformacao/senadores");
const senadores_3 = require("../carregamento/senadores");
const date_1 = require("../utils/date");
const common_1 = require("../utils/common");
/**
 * Processador de senadores em exercício
 */
class SenadoresProcessor extends etl_processor_1.ETLProcessor {
    getProcessName() {
        return 'Processador de Senadores em Exercício';
    }
    async validate() {
        const erros = [];
        const avisos = [];
        // Validar legislatura se especificada
        if (this.context.options.legislatura) {
            const leg = this.context.options.legislatura;
            if (leg < this.context.config.senado.legislatura.min ||
                leg > this.context.config.senado.legislatura.max) {
                erros.push(`Legislatura ${leg} fora do intervalo válido`);
            }
        }
        // Validar partido se especificado
        if (this.context.options.partido && !/^[A-Z]{2,10}$/.test(this.context.options.partido)) {
            avisos.push('Formato de partido pode estar incorreto (use siglas como PT, PSDB, etc.)');
        }
        // Validar UF se especificada
        if (this.context.options.uf && !/^[A-Z]{2}$/.test(this.context.options.uf)) {
            erros.push('UF deve ter exatamente 2 letras maiúsculas (ex: SP, RJ, MG)');
        }
        return {
            valido: erros.length === 0,
            erros,
            avisos
        };
    }
    async extract() {
        const legislatura = await this.determinarLegislatura();
        this.context.logger.info(`📅 Extraindo senadores em exercício da legislatura ${legislatura}`);
        this.emitProgress(etl_types_1.ProcessingStatus.EXTRAINDO, 10, 'Extraindo lista de senadores...');
        // Extrair lista de senadores atuais
        const dadosExtraidos = await senadores_1.senadoresExtractor.extractSenadoresAtuais();
        if (!dadosExtraidos.senadores || dadosExtraidos.senadores.length === 0) {
            throw new Error('Nenhum senador em exercício encontrado');
        }
        let senadores = dadosExtraidos.senadores;
        // Aplicar filtros se especificados
        senadores = this.aplicarFiltros(senadores);
        this.context.logger.info(`✓ ${senadores.length} senadores encontrados`);
        // Aplicar limite se especificado
        if (this.context.options.limite && this.context.options.limite > 0) {
            senadores = senadores.slice(0, this.context.options.limite);
            this.context.logger.info(`🔍 Limitado a ${senadores.length} senadores`);
        }
        this.emitProgress(etl_types_1.ProcessingStatus.EXTRAINDO, 50, 'Extraindo detalhes dos senadores...');
        // Extrair detalhes adicionais se necessário
        const detalhes = await this.extrairDetalhes(senadores);
        this.updateExtractionStats(dadosExtraidos.senadores.length, senadores.length, 0);
        return {
            senadores,
            detalhes,
            legislatura
        };
    }
    async transform(data) {
        this.context.logger.info('🔄 Transformando senadores...');
        this.emitProgress(etl_types_1.ProcessingStatus.TRANSFORMANDO, 60, 'Transformando dados dos senadores...');
        // Preparar dados para transformação
        const dadosParaTransformar = {
            timestamp: new Date().toISOString(),
            senadores: data.senadores,
            // A interface ResultadoExtracao em transformacao/senadores.ts espera 'origem' e 'metadados'.
            // 'detalhes' não faz parte dessa interface específica.
            // Os detalhes já devem ser incorporados aos objetos de 'senadores' antes desta etapa,
            // ou o transformador precisa ser ajustado para aceitá-los separadamente.
            // Por ora, vamos assumir que o transformador lida com os dados de 'data.senadores'
            // e que os 'detalhes' do Map foram usados para enriquecer esses objetos antes.
            origem: `SenadoresProcessor - Legislatura ${data.legislatura}`, // Adicionando origem
            metadados: {
                filtrosAplicados: {
                    legislatura: data.legislatura,
                    partido: this.context.options.partido,
                    uf: this.context.options.uf,
                    limite: this.context.options.limite,
                },
                totalOriginalAntesDeFiltros: data.detalhes.get('totalOriginal') || data.senadores.length,
            },
            // Se 'detalhes' (Map) precisar ser passado diretamente, a interface do transformador precisaria mudar.
            // Vamos assumir que o transformador espera os dados já combinados em 'data.senadores'
            // ou que ele não usa os detalhes brutos do Map diretamente.
        };
        // Transformar senadores
        // O transformador espera que cada senador em data.senadores já tenha os detalhes incorporados, se aplicável.
        // A lógica de extrairDetalhes já popula o Map 'data.detalhes'.
        // O ideal seria que, antes de chamar o transformador, os dados de 'data.detalhes'
        // fossem mesclados em cada objeto correspondente em 'data.senadores'.
        // No entanto, a estrutura atual do transformador parece pegar os dados de 'senadores'
        // e não há uma etapa explícita de merge aqui.
        // Vamos passar 'data.senadores' como está, e o transformador fará o seu melhor.
        // Se o transformador precisar dos detalhes do Map, isso é uma refatoração maior.
        const dadosTransformados = senadores_2.senadoresTransformer.transformSenadoresAtuais({
            timestamp: dadosParaTransformar.timestamp,
            origem: dadosParaTransformar.origem,
            senadores: data.senadores.map(s => {
                const codigo = s.IdentificacaoParlamentar?.CodigoParlamentar;
                const detalhesSenador = codigo ? data.detalhes.get(String(codigo)) : undefined;
                return detalhesSenador ? { ...s, ...detalhesSenador.detalhes } : s; // Mescla detalhes se existirem
            }),
            metadados: dadosParaTransformar.metadados,
        });
        // Calcular estatísticas
        const estatisticas = {
            totalSenadores: dadosTransformados.senadores.length,
            senadoresPorPartido: {},
            senadoresPorUF: {},
            senadoresPorSexo: {}
        };
        // Calcular estatísticas detalhadas
        dadosTransformados.senadores.forEach((senador) => {
            // Por partido
            const partido = senador.partido?.sigla || 'Sem partido';
            estatisticas.senadoresPorPartido[partido] = (estatisticas.senadoresPorPartido[partido] || 0) + 1;
            // Por UF
            const uf = senador.uf || 'Sem UF';
            estatisticas.senadoresPorUF[uf] = (estatisticas.senadoresPorUF[uf] || 0) + 1;
            // Por sexo
            const sexo = senador.sexo || 'Não informado';
            estatisticas.senadoresPorSexo[sexo] = (estatisticas.senadoresPorSexo[sexo] || 0) + 1;
        });
        this.updateTransformationStats(data.senadores.length, dadosTransformados.senadores.length, data.senadores.length - dadosTransformados.senadores.length);
        this.context.logger.info(`✓ ${dadosTransformados.senadores.length} senadores transformados`);
        this.context.logger.info(`📊 Estatísticas:`, estatisticas);
        return {
            senadoresTransformados: dadosTransformados.senadores,
            estatisticas,
            legislatura: data.legislatura,
            metadados: dadosTransformados.metadados, // Incluindo metadados no retorno
        };
    }
    async load(data) {
        this.emitProgress(etl_types_1.ProcessingStatus.CARREGANDO, 80, 'Salvando senadores...');
        switch (this.context.options.destino) {
            case 'pc':
                return this.salvarNoPC(data);
            case 'emulator':
                process.env.FIRESTORE_EMULATOR_HOST = this.context.config.firestore.emulatorHost;
                return this.salvarNoFirestore(data);
            case 'firestore':
                return this.salvarNoFirestore(data);
            default:
                throw new Error(`Destino inválido: ${this.context.options.destino}`);
        }
    }
    /**
     * Métodos auxiliares privados
     */
    async determinarLegislatura() {
        if (this.context.options.legislatura) {
            return this.context.options.legislatura;
        }
        const legislaturaAtual = await (0, date_1.obterNumeroLegislaturaAtual)();
        if (!legislaturaAtual) {
            throw new Error('Não foi possível obter a legislatura atual');
        }
        return legislaturaAtual;
    }
    aplicarFiltros(senadores) {
        let filtrados = [...senadores];
        // Filtro por partido
        if (this.context.options.partido) {
            const partido = this.context.options.partido.toUpperCase();
            filtrados = filtrados.filter(s => {
                const partidoSenador = s.IdentificacaoParlamentar?.SiglaPartidoParlamentar?.toUpperCase();
                return partidoSenador === partido;
            });
            this.context.logger.info(`🔍 Filtrado por partido ${partido}: ${filtrados.length} senadores`);
        }
        // Filtro por UF
        if (this.context.options.uf) {
            const uf = this.context.options.uf.toUpperCase();
            filtrados = filtrados.filter(s => {
                const ufSenador = s.IdentificacaoParlamentar?.UfParlamentar?.toUpperCase();
                return ufSenador === uf;
            });
            this.context.logger.info(`🔍 Filtrado por UF ${uf}: ${filtrados.length} senadores`);
        }
        return filtrados;
    }
    async extrairDetalhes(senadores) {
        const detalhes = new Map();
        let processados = 0;
        // Se não há necessidade de detalhes adicionais, retornar mapa vazio
        if (!this.context.options.detalhes) {
            return detalhes;
        }
        for (const senador of senadores) {
            try {
                const codigo = senador.IdentificacaoParlamentar?.CodigoParlamentar;
                if (codigo) {
                    this.context.logger.debug(`Extraindo detalhes do senador ${senador.IdentificacaoParlamentar?.NomeParlamentar}`);
                    // Extrair detalhes específicos se necessário
                    const detalheSenador = await senadores_1.senadoresExtractor.extractDetalhesParlamentar(codigo);
                    detalhes.set(String(codigo), detalheSenador);
                }
                processados++;
                // Emitir progresso
                const progresso = Math.round((processados / senadores.length) * 40);
                this.emitProgress(etl_types_1.ProcessingStatus.EXTRAINDO, 50 + progresso, `Extraídos detalhes de ${processados}/${senadores.length} senadores`);
                // Pausa entre requisições
                if (processados < senadores.length) {
                    await new Promise(resolve => setTimeout(resolve, this.context.config.senado.pauseBetweenRequests));
                }
            }
            catch (error) {
                this.context.logger.warn(`Erro ao extrair detalhes do senador: ${error.message}`);
                this.incrementWarnings();
            }
        }
        return detalhes;
    }
    async salvarNoPC(data) {
        this.context.logger.info('💾 Salvando senadores no PC local...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const baseDir = `senadores/legislatura_${data.legislatura}`;
        const detalhes = [];
        try {
            // Salvar lista de senadores
            const senadoresPath = `${baseDir}/senadores_atuais_${timestamp}.json`;
            (0, common_1.exportToJson)(data.senadoresTransformados, senadoresPath);
            detalhes.push({ id: 'senadores', status: 'sucesso' });
            // Salvar estatísticas
            const statsPath = `${baseDir}/estatisticas_${timestamp}.json`;
            (0, common_1.exportToJson)(data.estatisticas, statsPath);
            detalhes.push({ id: 'estatisticas', status: 'sucesso' });
            // Salvar por partido
            const partidosDir = `${baseDir}/partidos`;
            Object.entries(data.estatisticas.senadoresPorPartido).forEach(([partido, quantidade]) => {
                try {
                    const senadoresPartido = data.senadoresTransformados.filter(s => s.partido?.sigla === partido);
                    const partidoPath = `${partidosDir}/${partido}_${timestamp}.json`;
                    (0, common_1.exportToJson)(senadoresPartido, partidoPath);
                    detalhes.push({ id: `partido_${partido}`, status: 'sucesso' });
                }
                catch (error) {
                    detalhes.push({
                        id: `partido_${partido}`,
                        status: 'falha',
                        erro: error.message
                    });
                }
            });
            // Salvar por UF
            const ufsDir = `${baseDir}/ufs`;
            Object.entries(data.estatisticas.senadoresPorUF).forEach(([uf, quantidade]) => {
                try {
                    const senadoresUF = data.senadoresTransformados.filter(s => s.uf === uf);
                    const ufPath = `${ufsDir}/${uf}_${timestamp}.json`;
                    (0, common_1.exportToJson)(senadoresUF, ufPath);
                    detalhes.push({ id: `uf_${uf}`, status: 'sucesso' });
                }
                catch (error) {
                    detalhes.push({
                        id: `uf_${uf}`,
                        status: 'falha',
                        erro: error.message
                    });
                }
            });
            const sucessos = detalhes.filter(d => d.status === 'sucesso').length;
            const falhas = detalhes.filter(d => d.status === 'falha').length;
            this.updateLoadStats(detalhes.length, sucessos, falhas);
            return {
                total: detalhes.length,
                processados: detalhes.length,
                sucessos,
                falhas,
                detalhes
            };
        }
        catch (error) {
            this.context.logger.error(`Erro ao salvar no PC: ${error.message}`);
            throw error;
        }
    }
    async salvarNoFirestore(data) {
        this.context.logger.info('☁️ Salvando senadores no Firestore...');
        try {
            // Reconstituir dados no formato esperado pelo loader
            // A interface ResultadoTransformacao (retorno de senadoresTransformer) já tem 'metadados'
            const dadosParaCarregamento = {
                senadores: data.senadoresTransformados,
                timestamp: new Date().toISOString(),
                metadados: data.metadados || {}, // Acessando metadados de data
            };
            // Salvar senadores
            const resultadoSenadores = await senadores_3.senadoresLoader.saveSenadoresAtuais(dadosParaCarregamento, // Agora inclui metadados
            data.legislatura);
            // Salvar histórico
            await senadores_3.senadoresLoader.saveSenadoresHistorico(dadosParaCarregamento, // Agora inclui metadados
            data.legislatura);
            this.updateLoadStats(resultadoSenadores.totalSalvos, resultadoSenadores.totalSalvos, 0);
            return {
                total: resultadoSenadores.totalSalvos,
                processados: resultadoSenadores.totalSalvos,
                sucessos: resultadoSenadores.totalSalvos,
                falhas: 0,
                detalhes: [
                    { id: 'senadores', status: 'sucesso' }, // Removida a propriedade 'quantidade'
                    { id: 'historico', status: 'sucesso' }
                ]
            };
        }
        catch (error) {
            this.context.logger.error(`Erro ao salvar no Firestore: ${error.message}`);
            throw error;
        }
    }
}
exports.SenadoresProcessor = SenadoresProcessor;
//# sourceMappingURL=senadores.processor.js.map