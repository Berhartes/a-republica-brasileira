/**
 * Módulo de carregamento de perfis de senadores para o Firestore
 * Este módulo é especializado na persistência de perfis completos de senadores,
 * com suporte para legislaturas específicas
 */
import { logger } from '../utils/logger';
import { createBatchManager } from '../utils/firestore';
import { SenadorBasicoTransformado, SenadorCompletoTransformado, ResultadoTransformacaoLista } from '../transformacao/perfilsenadores';
import { OpcoesExportacao, exportarDados } from '../utils/exportacao_avanc';

/**
 * Classe para carregar dados de perfis de senadores no Firestore
 */
export class PerfilSenadoresLoader {
  /**
   * Salva lista de senadores de uma legislatura específica
   * @param transformedData - Dados transformados dos senadores
   * @param legislaturaNumero - Número da legislatura
   * @returns Resultado da operação
   */
  async saveSenadoresLegislatura(
    transformedData: ResultadoTransformacaoLista, 
    legislaturaNumero: number
  ): Promise<{
    timestamp: string;
    totalSalvos: number;
    legislatura: number;
    status: string;
  }> {
    try {
      logger.info(`Salvando lista de ${transformedData.senadores.length} senadores para a legislatura ${legislaturaNumero}`);
      
      const batchManager = createBatchManager();
      const timestamp = new Date().toISOString();
      
      // 1. Atualizar lista na estrutura da legislatura específica
      const legislaturaRef = `congressoNacional/senadoFederal/legislaturas/${legislaturaNumero}/senadores/lista`;
      
      batchManager.set(legislaturaRef, {
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
          logger.warn('Senador sem dados básicos completos, pulando...');
          continue;
        }
        
        const senadorRef = `congressoNacional/senadoFederal/legislaturas/${legislaturaNumero}/senadores/${senador.codigo}`;
        
        // Verificar se o senador já possui um perfil completo
        const perfilRef = `congressoNacional/senadoFederal/perfis/${senador.codigo}`;
        
        const perfilExiste = await this.verificaPerfilExiste(perfilRef);
        
        batchManager.set(senadorRef, {
          ...senador,
          perfilDisponivel: perfilExiste,
          atualizadoEm: timestamp
        });
      }
      
      // Commit das operações
      await batchManager.commit();
      
      logger.info(`Lista de senadores da legislatura ${legislaturaNumero} salva com sucesso`);
      
      return {
        timestamp,
        totalSalvos: transformedData.senadores.length,
        legislatura: legislaturaNumero,
        status: 'success'
      };
    } catch (error: any) {
      logger.error(`Erro ao salvar lista de senadores da legislatura ${legislaturaNumero}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Verifica se um perfil existe no Firestore (mock)
   * @param perfilRef - Referência do perfil
   * @returns Verdadeiro se o perfil existe
   */
  private async verificaPerfilExiste(perfilRef: string): Promise<boolean> {
    // Simulação de verificação no Firestore
    // Na implementação real, usaria get() para verificar
    logger.debug(`Verificando existência do perfil ${perfilRef}`);
    return false; // Por padrão, assume que o perfil não existe ainda
  }
  
  /**
   * Salva perfil completo de um senador no Firestore
   * @param perfilData - Perfil transformado do senador
   * @param legislaturaNumero - Número da legislatura (opcional)
   * @returns Resultado da operação
   */
  async savePerfil(
    perfilData: SenadorCompletoTransformado, 
    legislaturaNumero?: number
  ): Promise<{
    timestamp: string;
    codigo: string;
    status: string;
  }> {
    try {
      // Verificação de segurança
      if (!perfilData || !perfilData.codigo) {
        logger.error('Dados de perfil inválidos para salvamento');
        return {
          timestamp: new Date().toISOString(),
          codigo: 'desconhecido',
          status: 'error'
        };
      }
      
      logger.info(`Salvando perfil completo do senador ${perfilData.nome} (${perfilData.codigo}) ${legislaturaNumero ? `da legislatura ${legislaturaNumero}` : ''}`);
      
      const timestamp = new Date().toISOString();
      
      // 1. Salvar no firestore na coleção de perfis
      const perfilRef = `congressoNacional/senadoFederal/perfis/${perfilData.codigo}`;
      
      const batchManager = createBatchManager();
      
      batchManager.set(perfilRef, {
        ...perfilData,
        atualizadoEm: timestamp
      });
      
      // 2. Atualizar referências básicas para mostrar que o perfil está disponível
      await this.updateReferenciasBasicas(perfilData, legislaturaNumero, batchManager);
      
      // Commit das operações
      await batchManager.commit();
      
      logger.info(`Perfil do senador ${perfilData.codigo} salvo com sucesso`);
      
      return {
        timestamp,
        codigo: perfilData.codigo,
        status: 'success'
      };
    } catch (error: any) {
      logger.error(`Erro ao salvar perfil do senador ${perfilData?.codigo || 'desconhecido'}: ${error.message}`);
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
  async saveMultiplosPerfis(
    perfis: SenadorCompletoTransformado[], 
    legislaturaNumero?: number
  ): Promise<{
    timestamp: string;
    total: number;
    sucessos: number;
    falhas: number;
    status: string;
  }> {
    try {
      logger.info(`Salvando ${perfis.length} perfis de senadores ${legislaturaNumero ? `da legislatura ${legislaturaNumero}` : ''}`);
      
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
        logger.info(`Processando lote ${indice + 1}/${lotes.length} (${lote.length} perfis)`);
        
        const batchManager = createBatchManager();
        
        // Salvar cada perfil no lote
        for (const perfil of lote) {
          try {
            // Verificar se o perfil é válido
            if (!perfil || !perfil.codigo) {
              logger.warn(`Perfil inválido encontrado no lote ${indice + 1}, pulando...`);
              falhas++;
              continue;
            }
            
            // 1. Salvar no firestore na coleção de perfis
            const perfilRef = `congressoNacional/senadoFederal/perfis/${perfil.codigo}`;
            
            batchManager.set(perfilRef, {
              ...perfil,
              atualizadoEm: timestamp
            });
            
            // 2. Atualizar referências básicas
            await this.updateReferenciasBasicas(perfil, legislaturaNumero, batchManager);
            
            sucessos++;
          } catch (error: any) {
            logger.warn(`Erro ao processar perfil do senador ${perfil?.codigo || 'desconhecido'} no lote ${indice + 1}: ${error.message}`);
            falhas++;
          }
        }
        
        // Commit das operações do lote
        try {
          await batchManager.commit();
        } catch (error: any) {
          logger.error(`Erro ao fazer commit do lote ${indice + 1}: ${error.message}`);
          // Ajustar contadores de sucesso/falha
          falhas += lote.length;
          sucessos -= lote.length;
        }
        
        // Pequena pausa entre lotes para evitar sobrecarga
        if (indice < lotes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      logger.info(`Salvamento de perfis concluído: ${sucessos} sucessos, ${falhas} falhas`);
      
      return {
        timestamp,
        total: perfis.length,
        sucessos,
        falhas,
        status: 'success'
      };
    } catch (error: any) {
      logger.error(`Erro ao salvar múltiplos perfis: ${error.message}`);
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
  private async updateReferenciasBasicas(
    perfil: SenadorCompletoTransformado, 
    legislaturaNumero?: number,
    batchManager?: any
  ): Promise<void> {
    try {
      // Verifica se o perfil é válido
      if (!perfil || !perfil.codigo) {
        return;
      }
      
      const newBatchManager = batchManager || createBatchManager();
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
      
      // Se temos uma legislatura específica, atualizamos apenas essa
      if (legislaturaNumero) {
        const senadorRef = `congressoNacional/senadoFederal/legislaturas/${legislaturaNumero}/senadores/${perfil.codigo}`;
        
        // Na simulação, simplesmente setamos o documento
        newBatchManager.set(senadorRef, {
          ...referencia,
          legislatura: legislaturaNumero
        });
      } else {
        // Se não especificamos legislatura, atualizamos a estrutura "atual"
        const senadorAtualRef = `congressoNacional/senadoFederal/atual/senadores/itens/${perfil.codigo}`;
        
        newBatchManager.set(senadorAtualRef, {
          ...referencia,
          tipo: 'senador'
        });
        
        // Na implementação real, buscaríamos todas as legislaturas onde o senador aparece e atualizaríamos
        // Aqui, apenas simulamos para a estrutura atual
      }
      
      // Se criamos um novo batch manager, fazemos o commit
      if (!useExistingBatch) {
        await newBatchManager.commit();
      }
    } catch (error: any) {
      logger.warn(`Erro ao atualizar referências básicas do senador ${perfil?.codigo || 'desconhecido'}: ${error.message}`);
      // Não propagamos o erro para não interromper o fluxo principal
    }
  }
  
  /**
   * Salva dados de senadores atuais no Firestore
   * @param transformedData - Dados transformados dos senadores atuais
   * @param perfis - Lista de perfis completos transformados (opcional)
   * @param legislaturaNumero - Número da legislatura atual
   * @returns Resultado da operação
   */
  async saveSenadoresAtuais(
    transformedData: ResultadoTransformacaoLista,
    perfis: SenadorCompletoTransformado[] | null,
    legislaturaNumero: number
  ): Promise<{
    timestamp: string;
    totalSenadores: number;
    totalPerfis: number;
    legislatura: number;
    status: string;
  }> {
    try {
      logger.info(`Salvando dados de ${transformedData.senadores.length} senadores atuais na legislatura ${legislaturaNumero}`);
      
      const batchManager = createBatchManager();
      const timestamp = new Date().toISOString();
      
      // 1. Atualizar lista na estrutura 'atual'
      const senadoresAtualRef = `congressoNacional/senadoFederal/atual/senadores`;
      
      batchManager.set(senadoresAtualRef, {
        timestamp,
        legislatura: legislaturaNumero,
        total: transformedData.senadores.length,
        atualizadoEm: timestamp,
        tipo: 'senadores',
        descricao: 'Lista de senadores em exercício'
      });
      
      // 2. Salvar dados individuais de cada senador na coleção 'atual'
      for (const senador of transformedData.senadores) {
        // Verifica se o senador tem dados básicos
        if (!senador || !senador.codigo) {
          continue;
        }
        
        const senadorAtualRef = `congressoNacional/senadoFederal/atual/senadores/itens/${senador.codigo}`;
        
        // Verificar se o senador já possui um perfil completo
        const temPerfil = perfis ? perfis.some(p => p.codigo === senador.codigo) : false;
        
        batchManager.set(senadorAtualRef, {
          ...senador,
          perfilCompleto: temPerfil,
          atualizadoEm: timestamp
        });
      }
      
      // 3. Também salvar na estrutura de legislatura
      await this.saveSenadoresLegislatura(transformedData, legislaturaNumero);
      
      // 4. Se temos perfis completos, salvá-los
      if (perfis && perfis.length > 0) {
        await this.saveMultiplosPerfis(perfis, legislaturaNumero);
      }
      
      // Commit das operações pendentes
      await batchManager.commit();
      
      // 5. Atualizar documento com metadados da operação
      const metadataRef = `congressoNacional/senadoFederal/metadata/senadores`;
      
      const metadataBatch = createBatchManager();
      
      metadataBatch.set(metadataRef, {
        legislaturaAtual: legislaturaNumero,
        totalSenadores: transformedData.senadores.length,
        totalPerfis: perfis ? perfis.length : 0,
        atualizadoEm: timestamp,
        status: 'success'
      });
      
      await metadataBatch.commit();
      
      logger.info(`Dados de senadores atuais salvos com sucesso`);
      
      return {
        timestamp,
        totalSenadores: transformedData.senadores.length,
        totalPerfis: perfis ? perfis.length : 0,
        legislatura: legislaturaNumero,
        status: 'success'
      };
    } catch (error: any) {
      logger.error(`Erro ao salvar dados de senadores atuais: ${error.message}`);
      return {
        timestamp: new Date().toISOString(),
        totalSenadores: 0,
        totalPerfis: 0,
        legislatura: legislaturaNumero,
        status: 'error'
      };
    }
  }
  
  /**
   * Salva um snapshot histórico dos perfis de senadores
   * @param perfis - Lista de perfis completos transformados
   * @param legislaturaNumero - Número da legislatura
   * @returns Resultado da operação
   */
  async saveHistorico(
    perfis: SenadorCompletoTransformado[], 
    legislaturaNumero: number
  ): Promise<{
    timestamp: string;
    legislatura: number;
    total: number;
    status: string;
  }> {
    logger.info(`Salvando histórico de ${perfis.length} perfis de senadores da legislatura ${legislaturaNumero}`);
    
    const timestamp = new Date().toISOString();
    const historicRef = `congressoNacional/senadoFederal/historico/senadores/snapshots/${legislaturaNumero}_${timestamp}`;
    
    // Na versão mock, apenas logamos a operação
    logger.info(`Simulando salvamento de histórico em ${historicRef}`);
    logger.debug('Dados do snapshot:', { 
      timestamp, 
      legislatura: legislaturaNumero,
      totalPerfis: perfis.length
    });
    
    // Simula um atraso para parecer mais realista
    await new Promise(resolve => setTimeout(resolve, 500));
    
    logger.info('Histórico de perfis de senadores salvo no Firestore (mock)');
    
    return {
      timestamp,
      legislatura: legislaturaNumero,
      total: perfis.length,
      status: 'success'
    };
  }
}

// Método para carregar perfis com opção de exportação para arquivos
export async function carregarPerfisSenadores(
  legislatura: number,
  opcoesExportacao?: OpcoesExportacao
): Promise<SenadorCompletoTransformado[]> {
  logger.info(`Iniciando carregamento de perfis para legislatura ${legislatura}`);
  
  // Registrar tempo de início para cálculo de estatísticas
  const tempoInicio = Date.now();
  
  try {
    // Simular o carregamento de dados
    // Na implementação real, esta parte seria a chamada para a API
    logger.info(`Obtendo dados de senadores da legislatura ${legislatura}`);
    
    // Simular um atraso para parecer mais realista
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Gerar dados simulados para teste
    const perfisSenadores: SenadorCompletoTransformado[] = Array.from({ length: 20 }, (_, index) => ({
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
      await exportarDados(perfisSenadores, legislatura, opcoesExportacao, tempoInicio);
    }
    
    return perfisSenadores;
  } catch (erro: any) {
    logger.error(`Erro ao carregar perfis de senadores: ${erro.message}`);
    throw erro;
  }
}

// Exporta uma instância do carregador
export const perfilSenadoresLoader = new PerfilSenadoresLoader();
