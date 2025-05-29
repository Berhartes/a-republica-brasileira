/**
 * Módulo de carregamento de votações de senadores para o Firestore
 * Este módulo é especializado na persistência de votações de senadores
 */
import { logger } from '../utils/logger';
import { createBatchManager } from '../utils/firestore';
import { VotacaoTransformada } from '../transformacao/votacoes';

/**
 * Classe para carregar dados de votações de senadores no Firestore
 */
export class VotacoesLoader {
  /**
   * Salva votações de um senador no Firestore
   * @param votacaoData - Votações transformadas do senador
   * @param legislaturaNumero - Número da legislatura (opcional)
   * @returns Resultado da operação
   */
  async saveVotacao(
    votacaoData: VotacaoTransformada,
    legislaturaNumero?: number
  ): Promise<{
    timestamp: string;
    codigo: string;
    status: string;
  }> {
    try {
      // Verificação de segurança
      if (!votacaoData || !votacaoData.codigo) {
        logger.error('Dados de votação inválidos para salvamento');
        return {
          timestamp: new Date().toISOString(),
          codigo: 'desconhecido',
          status: 'error'
        };
      }

      logger.info(`Salvando votações do senador ${votacaoData.senador.nome} (${votacaoData.codigo}) ${legislaturaNumero ? `da legislatura ${legislaturaNumero}` : ''}`);

      const timestamp = new Date().toISOString();

      // 1. Salvar no firestore na coleção de votações
      const votacaoRef = `congressoNacional/senadoFederal/votacoes/${votacaoData.codigo}`;

      const batchManager = createBatchManager();

      batchManager.set(votacaoRef, {
        ...votacaoData,
        atualizadoEm: timestamp
      });

      // Commit das operações
      await batchManager.commit();

      logger.info(`Votações do senador ${votacaoData.codigo} salvas com sucesso`);

      return {
        timestamp,
        codigo: votacaoData.codigo,
        status: 'success'
      };
    } catch (error: any) {
      logger.error(`Erro ao salvar votações do senador ${votacaoData?.codigo || 'desconhecido'}: ${error.message}`);
      return {
        timestamp: new Date().toISOString(),
        codigo: votacaoData?.codigo || 'desconhecido',
        status: 'error'
      };
    }
  }

  /**
   * Salva múltiplas votações de senadores em uma única operação
   * @param votacoes - Lista de votações transformadas
   * @param legislaturaNumero - Número da legislatura (opcional)
   * @returns Resultado da operação
   */
  async saveMultiplasVotacoes(
    votacoes: VotacaoTransformada[],
    legislaturaNumero?: number
  ): Promise<{
    timestamp: string;
    total: number;
    sucessos: number;
    falhas: number;
    status: string;
  }> {
    try {
      logger.info(`Salvando votações de ${votacoes.length} senadores ${legislaturaNumero ? `da legislatura ${legislaturaNumero}` : ''}`);

      const timestamp = new Date().toISOString();
      let sucessos = 0;
      let falhas = 0;

      // Processar em lotes para melhor performance
      const tamanhoLote = 10;
      const lotes = [];

      for (let i = 0; i < votacoes.length; i += tamanhoLote) {
        lotes.push(votacoes.slice(i, i + tamanhoLote));
      }

      for (const [indice, lote] of lotes.entries()) {
        logger.info(`Processando lote ${indice + 1}/${lotes.length} (${lote.length} votações)`);

        const batchManager = createBatchManager();

        // Salvar cada votação no lote
        for (const votacao of lote) {
          try {
            // Verificar se a votação é válida
            if (!votacao || !votacao.codigo) {
              logger.warn(`Votação inválida encontrada no lote ${indice + 1}, pulando...`);
              falhas++;
              continue;
            }

            // 1. Salvar no firestore na coleção de votações
            const votacaoRef = `congressoNacional/senadoFederal/votacoes/${votacao.codigo}`;

            batchManager.set(votacaoRef, {
              ...votacao,
              atualizadoEm: timestamp
            });

            sucessos++;
          } catch (error: any) {
            logger.warn(`Erro ao processar votações do senador ${votacao?.codigo || 'desconhecido'} no lote ${indice + 1}: ${error.message}`);
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

      logger.info(`Salvamento de votações concluído: ${sucessos} sucessos, ${falhas} falhas`);

      return {
        timestamp,
        total: votacoes.length,
        sucessos,
        falhas,
        status: 'success'
      };
    } catch (error: any) {
      logger.error(`Erro ao salvar múltiplas votações: ${error.message}`);
      return {
        timestamp: new Date().toISOString(),
        total: votacoes.length,
        sucessos: 0,
        falhas: votacoes.length,
        status: 'error'
      };
    }
  }
}

// Instância singleton para uso em toda a aplicação
export const votacoesLoader = new VotacoesLoader();
