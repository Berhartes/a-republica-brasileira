/**
 * Carregador para dados de Comissões do Senado
 */
import { logger } from '../utils/logging';
import { firestoreBatch } from '../utils/storage';

// Interface para comissão transformada (simplificada)
interface ComissaoTransformada {
  codigo: string | number;
  sigla: string;
  nome: string;
  ativa: boolean;
  tipo: string | { nome: string; sigla?: string; };
  situacao?: { nome: string; data?: string; };
  apelido?: string;
  casa: 'SF' | 'CN';
  dataCriacao?: string | null;
  dataExtincao?: string | null;
  dataInstalacao?: string | null;
  finalidade?: string | null;
  historia?: string | null;
  participacao?: string | null;
  composicao: {
    membros: Array<{
      codigo: string | number;
      nome: string;
      nomeCompleto?: string;
      partido?: string;
      uf?: string;
      participacao: string;
      cargo?: string;
      dataDesignacao?: string | null;
      dataFim?: string | null;
      motivoFim?: string | null;
    }>;
  };
  atualizadoEm: string;
}

// Interface para membro de comissão
interface MembroComissao {
  codigo: string | number;
  nome: string;
  nomeCompleto?: string;
  partido?: string;
  uf?: string;
  participacao: string;
  cargo?: string;
  dataDesignacao?: string | null;
  dataFim?: string | null;
  motivoFim?: string | null;
}

// Interface para dados transformados
interface ResultadoTransformacao {
  timestamp: string;
  total: number;
  comissoes: {
    senado: Record<string, ComissaoTransformada[]>;
    congresso: Record<string, ComissaoTransformada[]>;
  };
  indices: {
    porCodigo: Record<string, any>;
    porParlamentar: Record<string, any>;
  };
  referencias?: {
    tipos?: Record<string, any>;
  };
}

// Interface para resultado do carregamento
interface ResultadoCarregamento {
  timestamp: string;
  totalComissoes: number;
  totalSalvos: number;
  totalAtualizados: number;
  totalErros: number;
  metadados: {
    tipoComissoes: Record<string, number>;
    casas: Record<string, number>;
    comissoesAtivas: number;
    comissoesInativas: number;
  };
}

// Interface para dados históricos consolidados
interface ComissaoConsolidada {
  codigo: string | number;
  sigla: string;
  nome: string;
  casa: 'SF' | 'CN';
  ativa: boolean;
  tipo: string | { nome: string; sigla?: string; };
}

/**
 * Classe para carregamento de dados de comissões do Senado no Firestore
 */
export class ComissaoLoader {
  // Caminhos de coleção no Firestore (estrutura hierárquica)
  private readonly BASE_PATH = 'congressoNacional/senadoFederal';
  private readonly COLECAO_COMISSOES_ATUAL = `congressoNacional/senadoFederal/atual/comissoes/itens`;
  private readonly COLECAO_COMISSOES_LEGISLATURA = (legislatura: number) =>
    `congressoNacional/senadoFederal/legislaturas/${legislatura}/comissoes`;
  private readonly COLECAO_METADATA = `congressoNacional/senadoFederal/metadata/comissoes`;
  private readonly COLECAO_INDICES = `congressoNacional/senadoFederal/indices`;
  private readonly COLECAO_REFERENCIAS = `congressoNacional/senadoFederal/referencias`;
  private readonly COLECAO_HISTORICO = 'comissoes_historico';

  /**
   * Salva as comissões transformadas no Firestore
   */
  async saveComissoes(dados: ResultadoTransformacao, legislaturaAtual: number): Promise<ResultadoCarregamento> {
    // Calcular metadados para o resultado
    const metadados = {
      tipoComissoes: {} as Record<string, number>,
      casas: { 'SF': 0, 'CN': 0 } as Record<string, number>,
      comissoesAtivas: 0,
      comissoesInativas: 0
    };

    // Contar comissões por tipo e calcular totais
    let totalComissoes = 0;

    // Contar comissões do Senado
    Object.entries(dados.comissoes.senado).forEach(([tipo, comissoes]) => {
      if (!metadados.tipoComissoes[tipo]) {
        metadados.tipoComissoes[tipo] = 0;
      }
      metadados.tipoComissoes[tipo] += comissoes.length;
      metadados.casas['SF'] += comissoes.length;
      totalComissoes += comissoes.length;

      // Contar ativas/inativas
      comissoes.forEach(comissao => {
        if (comissao.ativa) {
          metadados.comissoesAtivas++;
        } else {
          metadados.comissoesInativas++;
        }
      });
    });

    // Contar comissões do Congresso
    Object.entries(dados.comissoes.congresso).forEach(([tipo, comissoes]) => {
      if (!metadados.tipoComissoes[tipo]) {
        metadados.tipoComissoes[tipo] = 0;
      }
      metadados.tipoComissoes[tipo] += comissoes.length;
      metadados.casas['CN'] += comissoes.length;
      totalComissoes += comissoes.length;

      // Contar ativas/inativas
      comissoes.forEach(comissao => {
        if (comissao.ativa) {
          metadados.comissoesAtivas++;
        } else {
          metadados.comissoesInativas++;
        }
      });
    });

    logger.info(`Iniciando carregamento de ${totalComissoes} comissões no Firestore`);

    const resultado: ResultadoCarregamento = {
      timestamp: new Date().toISOString(),
      totalComissoes: totalComissoes,
      totalSalvos: 0,
      totalAtualizados: 0,
      totalErros: 0,
      metadados: metadados
    };

    try {
      if (totalComissoes === 0) {
        logger.warn('Nenhuma comissão para carregar');
        return resultado;
      }

      // Processar comissões do Senado
      for (const [tipo, comissoes] of Object.entries(dados.comissoes.senado)) {
        for (const comissao of comissoes) {
          try {
            const comissaoId = String(comissao.codigo);

            // Adicionar informação da legislatura
            const comissaoComLegislatura = {
              ...comissao,
              legislaturaReferencia: legislaturaAtual
            };

            // Usar batch manager para salvar
            const batchManager = firestoreBatch.createBatchManager();
            
            // Salvar na estrutura atual
            batchManager.set(`${this.COLECAO_COMISSOES_ATUAL}/${comissaoId}`, comissaoComLegislatura);

            // Salvar na estrutura de legislatura
            batchManager.set(`${this.COLECAO_COMISSOES_LEGISLATURA(legislaturaAtual)}/${comissaoId}`, comissaoComLegislatura);
            
            // Commit das operações
            await batchManager.commit();

            resultado.totalSalvos++;
            logger.info(`Nova comissão salva: ${comissao.sigla} (${comissaoId})`);
          } catch (error) {
            resultado.totalErros++;
            logger.error(`Erro ao salvar comissão ${comissao.sigla || comissao.codigo}:`, error);
          }
        }
      }

      // Processar comissões do Congresso
      for (const [tipo, comissoes] of Object.entries(dados.comissoes.congresso)) {
        for (const comissao of comissoes) {
          try {
            const comissaoId = String(comissao.codigo);

            // Adicionar informação da legislatura
            const comissaoComLegislatura = {
              ...comissao,
              legislaturaReferencia: legislaturaAtual
            };

            // Usar batch manager para salvar
            const batchManager = firestoreBatch.createBatchManager();
            
            // Salvar na estrutura atual
            batchManager.set(`${this.COLECAO_COMISSOES_ATUAL}/${comissaoId}`, comissaoComLegislatura);

            // Salvar na estrutura de legislatura
            batchManager.set(`${this.COLECAO_COMISSOES_LEGISLATURA(legislaturaAtual)}/${comissaoId}`, comissaoComLegislatura);
            
            // Commit das operações
            await batchManager.commit();

            resultado.totalSalvos++;
            logger.info(`Nova comissão salva: ${comissao.sigla} (${comissaoId})`);
          } catch (error) {
            resultado.totalErros++;
            logger.error(`Erro ao salvar comissão ${comissao.sigla || comissao.codigo}:`, error);
          }
        }
      }

      // Salvar os índices na nova estrutura
      try {
        const batchManager = firestoreBatch.createBatchManager();
        
        // Salvar índice por código
        batchManager.set(`${this.COLECAO_INDICES}/comissoes_porCodigo`, {
          dados: dados.indices.porCodigo,
          atualizadoEm: new Date().toISOString(),
          legislatura: legislaturaAtual
        });

        // Salvar índice por parlamentar (pode ser grande, então separar se necessário)
        batchManager.set(`${this.COLECAO_INDICES}/comissoes_porParlamentar`, {
          dados: dados.indices.porParlamentar,
          atualizadoEm: new Date().toISOString(),
          legislatura: legislaturaAtual
        });

        // Salvar metadados
        batchManager.set(`${this.COLECAO_METADATA}/info`, {
          ultimaAtualizacao: new Date().toISOString(),
          totalComissoes: totalComissoes,
          legislatura: legislaturaAtual,
          metadados: metadados
        });
        
        // Commit das operações
        await batchManager.commit();

        logger.info(`Índices e metadados salvos com sucesso`);
      } catch (indexError: unknown) {
        const errorMessage = indexError instanceof Error ? indexError.message : 'Erro desconhecido';
        logger.error(`Erro ao salvar índices: ${errorMessage}`, indexError);
      }

      // Salvar referências (tipos de comissões)
      if (dados.referencias && dados.referencias.tipos) {
        try {
          const batchManager = firestoreBatch.createBatchManager();
          
          batchManager.set(`${this.COLECAO_REFERENCIAS}/comissoes_tipos`, {
            dados: dados.referencias.tipos,
            atualizadoEm: new Date().toISOString(),
            legislatura: legislaturaAtual
          });
          
          await batchManager.commit();

          logger.info(`Referências de tipos salvas com sucesso`);
        } catch (refError: unknown) {
          const errorMessage = refError instanceof Error ? refError.message : 'Erro desconhecido';
          logger.error(`Erro ao salvar referências: ${errorMessage}`, refError);
        }
      }

      logger.info(`Carregamento concluído: ${resultado.totalSalvos} novas, ${resultado.totalAtualizados} atualizadas, ${resultado.totalErros} erros`);
      return resultado;
    } catch (error) {
      logger.error('Erro durante o carregamento de comissões:', error);
      throw error;
    }
  }

  /**
   * Salva o histórico de comissões no Firestore
   */
  async saveComissoesHistorico(dados: ResultadoTransformacao, legislaturaAtual: number): Promise<void> {
    logger.info('Salvando histórico de comissões');

    try {
      // Criar registro histórico com timestamp para identificação
      const timestamp = new Date().toISOString();
      const historicoId = `comissoes_${timestamp.replace(/[:.]/g, '-')}`;

      // Consolidar comissões para o histórico
      const comissoesConsolidadas: ComissaoConsolidada[] = [];

      // Consolidar comissões do Senado
      Object.entries(dados.comissoes.senado).forEach(([tipo, comissoes]) => {
        comissoes.forEach(comissao => {
          // Extrair o valor do tipo adequado para consolidação
          let tipoConsolidado: string | { nome: string; sigla?: string; } = tipo;

          // Se a comissão já tiver um tipo como objeto, usar esse valor
          if (typeof comissao.tipo === 'object' && comissao.tipo?.nome) {
            tipoConsolidado = comissao.tipo;
          }

          comissoesConsolidadas.push({
            codigo: comissao.codigo,
            sigla: comissao.sigla,
            nome: comissao.nome,
            casa: comissao.casa,
            ativa: comissao.ativa,
            tipo: tipoConsolidado
          });
        });
      });

      // Consolidar comissões do Congresso
      Object.entries(dados.comissoes.congresso).forEach(([tipo, comissoes]) => {
        comissoes.forEach(comissao => {
          // Extrair o valor do tipo adequado para consolidação
          let tipoConsolidado: string | { nome: string; sigla?: string; } = tipo;

          // Se a comissão já tiver um tipo como objeto, usar esse valor
          if (typeof comissao.tipo === 'object' && comissao.tipo?.nome) {
            tipoConsolidado = comissao.tipo;
          }

          comissoesConsolidadas.push({
            codigo: comissao.codigo,
            sigla: comissao.sigla,
            nome: comissao.nome,
            casa: comissao.casa,
            ativa: comissao.ativa,
            tipo: tipoConsolidado
          });
        });
      });

      // Calcular metadados para o histórico
      const metadados = {
        tipoComissoes: {} as Record<string, number>,
        casas: { 'SF': 0, 'CN': 0 } as Record<string, number>,
        comissoesAtivas: 0,
        comissoesInativas: 0
      };

      // Calcular estatísticas
      comissoesConsolidadas.forEach(comissao => {
        // Contagem por tipo
        let tipoChave: string;
        if (typeof comissao.tipo === 'string') {
          tipoChave = comissao.tipo;
        } else if (comissao.tipo && typeof comissao.tipo === 'object') {
          tipoChave = comissao.tipo.nome || 'Desconhecido';
        } else {
          tipoChave = 'Desconhecido';
        }

        if (!metadados.tipoComissoes[tipoChave]) {
          metadados.tipoComissoes[tipoChave] = 0;
        }
        metadados.tipoComissoes[tipoChave]++;

        // Contagem por casa
        metadados.casas[comissao.casa]++;

        // Contagem de ativas/inativas
        if (comissao.ativa) {
          metadados.comissoesAtivas++;
        } else {
          metadados.comissoesInativas++;
        }
      });

      const dadosHistorico = {
        timestamp,
        legislatura: legislaturaAtual,
        total: comissoesConsolidadas.length,
        comissoes: comissoesConsolidadas,
        metadados: metadados,
        indices: {
          totalPorCodigo: Object.keys(dados.indices.porCodigo).length,
          totalPorParlamentar: Object.keys(dados.indices.porParlamentar).length
        }
      };

      const batchManager = firestoreBatch.createBatchManager();
      batchManager.set(`${this.COLECAO_HISTORICO}/${historicoId}`, dadosHistorico);
      await batchManager.commit();
      logger.info(`Histórico de comissões salvo com ID: ${historicoId}`);
    } catch (error) {
      logger.error('Erro ao salvar histórico de comissões:', error);
      throw error;
    }
  }

  /**
   * Verifica se houve mudanças relevantes nos dados da comissão
   */
  private verificarMudancas(existente: any, novo: ComissaoTransformada): boolean {
    // Campos a ignorar na comparação (atualizadoEm sempre muda)
    const camposParaIgnorar = ['atualizadoEm'];

    // Lista de campos para verificar mudanças estruturais
    const camposEstruturais = [
      'sigla', 'nome', 'ativa', 'tipo', 'casa',
      'dataCriacao', 'dataExtincao', 'dataInstalacao'
    ];

    // Verificar mudanças nos campos estruturais
    for (const campo of camposEstruturais) {
      if (campo === 'tipo') {
        // Tratar o campo tipo de forma especial, pois pode ser string ou objeto
        const tipoExistente = existente.tipo;
        const tipoNovo = novo.tipo;

        if (typeof tipoExistente !== typeof tipoNovo) {
          return true; // Tipos diferentes (string vs objeto)
        }

        if (typeof tipoExistente === 'string' && typeof tipoNovo === 'string') {
          if (tipoExistente !== tipoNovo) return true;
        } else if (typeof tipoExistente === 'object' && typeof tipoNovo === 'object') {
          // Comparar objetos
          if (tipoExistente?.nome !== tipoNovo?.nome || tipoExistente?.sigla !== tipoNovo?.sigla) {
            return true;
          }
        }
      } else if (existente[campo] !== novo[campo as keyof ComissaoTransformada]) {
        return true;
      }
    }

    // Verificar mudanças na composição
    const membroExistentes = existente.composicao?.membros || [];
    const membrosNovos = novo.composicao?.membros || [];

    // Se o número de membros mudou, houve mudança
    if (membroExistentes.length !== membrosNovos.length) {
      return true;
    }

    // Funções para comparar membros por código
    const membrosPorCodigo = (membros: any[]) => {
      const mapa: Record<string, any> = {};
      membros.forEach(m => {
        mapa[String(m.codigo)] = m;
      });
      return mapa;
    };

    // Mapas de membros para comparação eficiente
    const mapaExistentes = membrosPorCodigo(membroExistentes);
    const mapaNovos = membrosPorCodigo(membrosNovos);

    // Verificar mudanças em membros
    const todosCodigos = new Set([
      ...Object.keys(mapaExistentes),
      ...Object.keys(mapaNovos)
    ]);

    for (const codigo of todosCodigos) {
      const membroExistente = mapaExistentes[codigo];
      const membroNovo = mapaNovos[codigo];

      // Se um membro existe em um e não no outro, houve mudança
      if (!membroExistente || !membroNovo) {
        return true;
      }

      // Verificar campos relevantes
      if (
        membroExistente.participacao !== membroNovo.participacao ||
        membroExistente.cargo !== membroNovo.cargo ||
        membroExistente.dataFim !== membroNovo.dataFim
      ) {
        return true;
      }
    }

    // Se chegou até aqui, não houve mudanças relevantes
    return false;
  }
}

// Exporta uma instância do carregador
export const comissaoLoader = new ComissaoLoader();
