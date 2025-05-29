"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mesaTransformer = exports.MesaTransformer = void 0;
/**
 * Transformador para dados de Mesas Diretoras
 */
const logging_1 = require("../utils/logging");
/**
 * Classe para transformação de dados de mesas diretoras
 */
class MesaTransformer {
    /**
     * Transforma os dados extraídos das mesas em formato padronizado
     */
    transformMesas(extractionResult) {
        logging_1.logger.info('Transformando dados de mesas diretoras');
        // Compatibilidade para aceitar ambos os tipos
        const mesas = extractionResult.mesas || extractionResult;
        const mesasTransformadas = [];
        // Transformar Mesa do Senado
        try {
            const senado = this.transformMesaSenado(mesas.senado);
            if (senado) {
                mesasTransformadas.push(senado);
            }
        }
        catch (error) {
            logging_1.logger.error(`Erro ao transformar Mesa do Senado: ${error.message}`, error);
        }
        // Transformar Mesa do Congresso
        try {
            const congresso = this.transformMesaCongresso(mesas.congresso);
            if (congresso) {
                mesasTransformadas.push(congresso);
            }
        }
        catch (error) {
            logging_1.logger.error(`Erro ao transformar Mesa do Congresso: ${error.message}`, error);
        }
        logging_1.logger.info(`Transformadas ${mesasTransformadas.length} mesas diretoras`);
        return {
            timestamp: new Date().toISOString(),
            total: mesasTransformadas.length,
            mesas: mesasTransformadas
        };
    }
    /**
     * Transforma especificamente a Mesa do Senado
     */
    transformMesaSenado(mesaSenado) {
        logging_1.logger.info('Transformando dados da Mesa do Senado');
        try {
            // Verificar se os dados existem
            if (!mesaSenado || !mesaSenado.dados) {
                logging_1.logger.warn('Dados da Mesa do Senado inválidos ou ausentes');
                return null;
            }
            // Extrair dados relevantes da estrutura da API
            const dados = mesaSenado.dados;
            // Acessar a estrutura correta da resposta com base no exemplo fornecido
            // Estrutura: MesaSenado -> Colegiados -> Colegiado (array)
            const mesaSF = dados?.MesaSenado?.Colegiados?.Colegiado?.[0] || {};
            if (!mesaSF) {
                logging_1.logger.warn('Dados da Mesa do Senado inválidos ou ausentes');
                return null;
            }
            // Obter informações básicas do colegiado
            const codigoMesa = mesaSF.CodigoColegiado || '1'; // Valor padrão caso não exista
            const nomeMesa = mesaSF.NomeColegiado || 'Mesa do Senado Federal';
            const siglaMesa = mesaSF.SiglaColegiado || 'MSF';
            // Processar cargos e membros
            const cargosData = mesaSF.Cargos?.Cargo || [];
            const cargos = Array.isArray(cargosData) ? cargosData : [cargosData];
            const cargosTransformados = [];
            const membrosTransformados = [];
            for (const cargo of cargos) {
                // Dados do cargo - estrutura diferente da esperada
                // No exemplo, o cargo é um array dentro do objeto Cargo
                const cargoInfo = cargo.Cargo;
                const descricaoCargo = Array.isArray(cargoInfo) ? cargoInfo[0] : cargoInfo;
                const codigoCargo = cargo.NumeroOrdemImpressao || '0';
                // Dados do parlamentar
                const nomeParlamentar = cargo.NomeParlamentar;
                const bancadaInfo = cargo.Bancada || '';
                // Extrair partido e UF da string de bancada (formato: "(PARTIDO-UF)")
                let partido = '';
                let uf = '';
                if (bancadaInfo) {
                    const match = bancadaInfo.match(/\(([^-]+)-([^)]+)\)/);
                    if (match) {
                        partido = match[1];
                        uf = match[2];
                    }
                }
                const codigoParlamentar = cargo.Http || '';
                const origem = 'Senado'; // Todos são senadores na Mesa do Senado
                if (nomeParlamentar) {
                    // Adicionar ao array de cargos
                    cargosTransformados.push({
                        codigo: codigoCargo,
                        descricao: descricaoCargo,
                        parlamentar: {
                            codigo: codigoParlamentar,
                            nome: nomeParlamentar,
                            partido: partido,
                            uf: uf,
                            origem: origem
                        }
                    });
                    // Adicionar ao array de membros
                    membrosTransformados.push({
                        codigo: codigoParlamentar,
                        nome: nomeParlamentar,
                        cargo: {
                            codigo: codigoCargo,
                            descricao: descricaoCargo
                        },
                        partido: partido,
                        uf: uf,
                        origem: origem,
                        tipoVaga: 'Titular', // Por padrão, todos são titulares na Mesa
                        proprietarioVaga: descricaoCargo
                    });
                }
                else {
                    // Adicionar cargo sem ocupante
                    cargosTransformados.push({
                        codigo: codigoCargo,
                        descricao: descricaoCargo
                    });
                }
            }
            return {
                codigo: codigoMesa,
                nome: nomeMesa,
                sigla: siglaMesa,
                tipo: 'senado',
                atualizadoEm: mesaSenado.timestamp,
                cargos: cargosTransformados,
                membros: membrosTransformados
            };
        }
        catch (error) {
            logging_1.logger.error(`Erro ao transformar Mesa do Senado: ${error.message}`, error);
            return null;
        }
    }
    /**
     * Transforma especificamente a Mesa do Congresso
     */
    transformMesaCongresso(mesaCongresso) {
        logging_1.logger.info('Transformando dados da Mesa do Congresso');
        try {
            // Verificar se os dados existem
            if (!mesaCongresso || !mesaCongresso.dados) {
                logging_1.logger.warn('Dados da Mesa do Congresso inválidos ou ausentes');
                return null;
            }
            // Extrair dados relevantes da estrutura da API
            const dados = mesaCongresso.dados;
            // Acessar a estrutura correta da resposta com base no exemplo fornecido
            // Estrutura: MesaCongresso -> Colegiados -> Colegiado (array)
            const mesaCN = dados?.MesaCongresso?.Colegiados?.Colegiado?.[0] || {};
            if (!mesaCN) {
                logging_1.logger.warn('Dados da Mesa do Congresso inválidos ou ausentes');
                return null;
            }
            // Obter informações básicas do colegiado
            const codigoMesa = mesaCN.CodigoColegiado || '2'; // Valor padrão caso não exista
            const nomeMesa = mesaCN.NomeColegiado || 'Mesa do Congresso Nacional';
            const siglaMesa = mesaCN.SiglaColegiado || 'MCN';
            // Processar cargos e membros
            const cargosData = mesaCN.Cargos?.Cargo || [];
            const cargos = Array.isArray(cargosData) ? cargosData : [cargosData];
            const cargosTransformados = [];
            const membrosTransformados = [];
            // Processar cargos básicos
            for (const cargo of cargos) {
                // Dados do cargo
                const descricaoCargo = cargo.TipoCargo || '';
                const codigoCargo = cargo.CodigoCargo || '0';
                // Dados do parlamentar
                const nomeParlamentar = cargo.NomeParlamentar;
                const codigoParlamentar = cargo.CodigoParlamentar || '';
                const bancadaInfo = cargo.Bancada || '';
                // Determinar se é deputado ou senador
                const ehDeputado = nomeParlamentar?.includes('Deputado') || nomeParlamentar?.includes('Deputada');
                const ehSenador = nomeParlamentar?.includes('Senador') || nomeParlamentar?.includes('Senadora');
                const origem = ehDeputado ? 'Câmara' : (ehSenador ? 'Senado' : 'Desconhecido');
                // Extrair partido e UF da string de bancada (formato: "(PARTIDO-UF)")
                let partido = '';
                let uf = '';
                if (bancadaInfo) {
                    const match = bancadaInfo.match(/\(([^-]+)-([^)]+)\)/);
                    if (match) {
                        partido = match[1];
                        uf = match[2];
                    }
                }
                // Informações adicionais para deputados
                const codigoDeputadoNaCamara = cargo.CodigoDeputadoNaCamara || '';
                if (nomeParlamentar) {
                    // Adicionar ao array de cargos
                    cargosTransformados.push({
                        codigo: codigoCargo,
                        descricao: descricaoCargo,
                        parlamentar: {
                            codigo: codigoParlamentar,
                            nome: nomeParlamentar,
                            partido: partido,
                            uf: uf,
                            origem: origem,
                            codigoDeputadoNaCamara: ehDeputado ? codigoDeputadoNaCamara : undefined
                        }
                    });
                    // Adicionar ao array de membros
                    membrosTransformados.push({
                        codigo: codigoParlamentar,
                        nome: nomeParlamentar,
                        cargo: {
                            codigo: codigoCargo,
                            descricao: descricaoCargo
                        },
                        partido: partido,
                        uf: uf,
                        origem: origem,
                        codigoDeputadoNaCamara: ehDeputado ? codigoDeputadoNaCamara : undefined,
                        proprietarioVaga: '',
                        ramais: '',
                        tipoVaga: '',
                        numeroOrdem: ''
                    });
                }
                else {
                    // Adicionar cargo sem ocupante
                    cargosTransformados.push({
                        codigo: codigoCargo,
                        descricao: descricaoCargo
                    });
                }
            }
            // Processar membros do bloco do Senado Federal (informações mais detalhadas)
            const membrosSenadoBloco = mesaCN.Membros_bloco_sf?.PartidoBloco || [];
            const blocosSenadoArray = Array.isArray(membrosSenadoBloco) ? membrosSenadoBloco : [membrosSenadoBloco];
            for (const bloco of blocosSenadoArray) {
                if (!bloco.Membros_sf)
                    continue;
                const membrosBloco = Array.isArray(bloco.Membros_sf.Membro)
                    ? bloco.Membros_sf.Membro
                    : [bloco.Membros_sf.Membro];
                for (const membro of membrosBloco) {
                    // Verificar se já temos este membro no array (pelo código)
                    const codigoParlamentar = membro.CodigoParlamentar || '';
                    const membroExistente = membrosTransformados.find(m => m.codigo === codigoParlamentar);
                    if (membroExistente) {
                        // Atualizar informações adicionais
                        membroExistente.proprietarioVaga = membro.ProprietarioVaga || '';
                        membroExistente.ramais = membro.Ramais || '';
                        membroExistente.tipoVaga = membro.TipoVaga || '';
                        membroExistente.numeroOrdem = membro.NumeroOrdem || '';
                    }
                }
            }
            // Processar membros do bloco da Câmara dos Deputados (informações mais detalhadas)
            const membrosCamaraBloco = mesaCN.Membros_bloco_cd?.Membro || [];
            const blocosCamaraArray = Array.isArray(membrosCamaraBloco) ? membrosCamaraBloco : [membrosCamaraBloco];
            for (const bloco of blocosCamaraArray) {
                if (!bloco.Membros_cd)
                    continue;
                const membrosBloco = Array.isArray(bloco.Membros_cd.Membro)
                    ? bloco.Membros_cd.Membro
                    : [bloco.Membros_cd.Membro];
                for (const membro of membrosBloco) {
                    // Verificar se já temos este membro no array (pelo código)
                    const codigoParlamentar = membro.CodigoParlamentar || '';
                    const membroExistente = membrosTransformados.find(m => m.codigo === codigoParlamentar);
                    if (membroExistente) {
                        // Atualizar informações adicionais
                        membroExistente.proprietarioVaga = membro.ProprietarioVaga || '';
                        membroExistente.ramais = membro.Ramais || '';
                        membroExistente.tipoVaga = membro.TipoVaga || '';
                        membroExistente.numeroOrdem = membro.NumeroOrdem || '';
                    }
                }
            }
            return {
                codigo: codigoMesa,
                nome: nomeMesa,
                sigla: siglaMesa,
                tipo: 'congresso',
                atualizadoEm: mesaCongresso.timestamp,
                cargos: cargosTransformados,
                membros: membrosTransformados
            };
        }
        catch (error) {
            logging_1.logger.error(`Erro ao transformar Mesa do Congresso: ${error.message}`, error);
            return null;
        }
    }
}
exports.MesaTransformer = MesaTransformer;
// Exporta uma instância do transformador
exports.mesaTransformer = new MesaTransformer();
//# sourceMappingURL=mesas.js.map