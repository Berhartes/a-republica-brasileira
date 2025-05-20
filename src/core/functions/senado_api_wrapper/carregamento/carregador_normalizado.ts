/**
 * Carregador de dados normalizados para o Firestore
 * 
 * Este módulo contém funções para carregar os dados normalizados no Firestore,
 * seguindo a nova estrutura de coleções e documentos.
 */

import { logger } from '../utils/logger';
import { createBatchManager } from '../utils/firestore';
import { ResultadoNormalizacaoSenador } from '../transformacao/normalizador';
import {
  Senador,
  Mandato,
  Exercicio,
  Comissao,
  Cargo,
  ParticipacaoComissao,
  FiliacaoPartidaria,
  Licenca,
  Lideranca
} from '../models/estrutura_normalizada';

/**
 * Interface para o resultado do carregamento
 */
export interface ResultadoCarregamento {
  timestamp: string;
  sucessos: number;
  falhas: number;
  entidadesCarregadas: {
    senadores: number;
    mandatos: number;
    exercicios: number;
    cargos: number;
    participacoesComissoes: number;
    filiacoes: number;
    licencas: number;
    liderancas: number;
    comissoes: number;
  };
  status: 'success' | 'partial' | 'error';
}

/**
 * Classe para carregar dados normalizados no Firestore
 */
export class CarregadorNormalizado {
  /**
   * Salva um senador normalizado e todas as suas entidades relacionadas no Firestore
   * @param dadosNormalizados - Dados normalizados do senador
   * @returns Resultado da operação
   */
  async saveSenadorNormalizado(
    dadosNormalizados: ResultadoNormalizacaoSenador
  ): Promise<ResultadoCarregamento> {
    try {
      logger.info(`Salvando dados normalizados do senador ${dadosNormalizados.senador.nome} (${dadosNormalizados.senador.codigo})`);
      
      const timestamp = new Date().toISOString();
      const batchManager = createBatchManager();
      
      let sucessos = 0;
      let falhas = 0;
      
      // Contadores para cada tipo de entidade
      const entidadesCarregadas = {
        senadores: 0,
        mandatos: 0,
        exercicios: 0,
        cargos: 0,
        participacoesComissoes: 0,
        filiacoes: 0,
        licencas: 0,
        liderancas: 0,
        comissoes: 0
      };
      
      try {
        // 1. Salvar o senador
        const senadorRef = `senadores/${dadosNormalizados.senador.codigo}`;
        batchManager.set(senadorRef, dadosNormalizados.senador);
        entidadesCarregadas.senadores++;
        
        // 2. Salvar mandatos (subcoleção)
        for (const mandato of dadosNormalizados.mandatos) {
          const mandatoRef = `senadores/${dadosNormalizados.senador.codigo}/mandatos/${mandato.id}`;
          batchManager.set(mandatoRef, mandato);
          entidadesCarregadas.mandatos++;
        }
        
        // 3. Salvar exercícios (subcoleção de mandatos)
        for (const { mandatoId, exercicio } of dadosNormalizados.exercicios) {
          const exercicioRef = `senadores/${dadosNormalizados.senador.codigo}/mandatos/${mandatoId}/exercicios/${exercicio.id}`;
          batchManager.set(exercicioRef, exercicio);
          entidadesCarregadas.exercicios++;
        }
        
        // 4. Salvar cargos (subcoleção)
        for (const cargo of dadosNormalizados.cargos) {
          const cargoRef = `senadores/${dadosNormalizados.senador.codigo}/cargos/${cargo.id}`;
          batchManager.set(cargoRef, cargo);
          entidadesCarregadas.cargos++;
        }
        
        // 5. Salvar participações em comissões (subcoleção)
        for (const participacao of dadosNormalizados.participacoesComissoes) {
          const participacaoRef = `senadores/${dadosNormalizados.senador.codigo}/participacoesComissoes/${participacao.id}`;
          batchManager.set(participacaoRef, participacao);
          entidadesCarregadas.participacoesComissoes++;
        }
        
        // 6. Salvar filiações partidárias (subcoleção)
        for (const filiacao of dadosNormalizados.filiacoes) {
          const filiacaoRef = `senadores/${dadosNormalizados.senador.codigo}/filiacoes/${filiacao.id}`;
          batchManager.set(filiacaoRef, filiacao);
          entidadesCarregadas.filiacoes++;
        }
        
        // 7. Salvar licenças (subcoleção)
        for (const licenca of dadosNormalizados.licencas) {
          const licencaRef = `senadores/${dadosNormalizados.senador.codigo}/licencas/${licenca.id}`;
          batchManager.set(licencaRef, licenca);
          entidadesCarregadas.licencas++;
        }
        
        // 8. Salvar lideranças (subcoleção)
        for (const lideranca of dadosNormalizados.liderancas) {
          const liderancaRef = `senadores/${dadosNormalizados.senador.codigo}/liderancas/${lideranca.id}`;
          batchManager.set(liderancaRef, lideranca);
          entidadesCarregadas.liderancas++;
        }
        
        // 9. Salvar comissões (coleção separada)
        for (const comissao of dadosNormalizados.comissoes) {
          const comissaoRef = `comissoes/${comissao.codigo}`;
          // Usar setMerge para não sobrescrever comissões existentes
          batchManager.setMerge(comissaoRef, comissao);
          entidadesCarregadas.comissoes++;
        }
        
        // Commit das operações
        await batchManager.commit();
        
        sucessos = 1; // Um senador processado com sucesso
      } catch (error: any) {
        logger.error(`Erro ao salvar dados normalizados do senador ${dadosNormalizados.senador.codigo}: ${error.message}`);
        falhas = 1;
      }
      
      logger.info(`Carregamento de dados normalizados concluído para o senador ${dadosNormalizados.senador.codigo}`);
      logger.info(`Entidades carregadas: ${entidadesCarregadas.senadores} senadores, ${entidadesCarregadas.mandatos} mandatos, ${entidadesCarregadas.exercicios} exercícios, ${entidadesCarregadas.cargos} cargos, ${entidadesCarregadas.participacoesComissoes} participações em comissões, ${entidadesCarregadas.filiacoes} filiações, ${entidadesCarregadas.licencas} licenças, ${entidadesCarregadas.liderancas} lideranças, ${entidadesCarregadas.comissoes} comissões`);
      
      return {
        timestamp,
        sucessos,
        falhas,
        entidadesCarregadas,
        status: falhas === 0 ? 'success' : 'error'
      };
    } catch (error: any) {
      logger.error(`Erro geral ao salvar dados normalizados: ${error.message}`);
      return {
        timestamp: new Date().toISOString(),
        sucessos: 0,
        falhas: 1,
        entidadesCarregadas: {
          senadores: 0,
          mandatos: 0,
          exercicios: 0,
          cargos: 0,
          participacoesComissoes: 0,
          filiacoes: 0,
          licencas: 0,
          liderancas: 0,
          comissoes: 0
        },
        status: 'error'
      };
    }
  }
  
  /**
   * Salva múltiplos senadores normalizados no Firestore
   * @param dadosNormalizados - Array de dados normalizados de senadores
   * @returns Resultado da operação
   */
  async saveMultiplosSenadores(
    dadosNormalizados: ResultadoNormalizacaoSenador[]
  ): Promise<ResultadoCarregamento> {
    try {
      logger.info(`Salvando dados normalizados de ${dadosNormalizados.length} senadores`);
      
      const timestamp = new Date().toISOString();
      let sucessos = 0;
      let falhas = 0;
      
      // Contadores para cada tipo de entidade
      const entidadesCarregadas = {
        senadores: 0,
        mandatos: 0,
        exercicios: 0,
        cargos: 0,
        participacoesComissoes: 0,
        filiacoes: 0,
        licencas: 0,
        liderancas: 0,
        comissoes: 0
      };
      
      // Processar cada senador individualmente
      for (const [index, dadosSenador] of dadosNormalizados.entries()) {
        try {
          logger.info(`Processando senador ${index + 1}/${dadosNormalizados.length}: ${dadosSenador.senador.nome} (${dadosSenador.senador.codigo})`);
          
          const resultado = await this.saveSenadorNormalizado(dadosSenador);
          
          if (resultado.status === 'success') {
            sucessos++;
            
            // Somar entidades carregadas
            entidadesCarregadas.senadores += resultado.entidadesCarregadas.senadores;
            entidadesCarregadas.mandatos += resultado.entidadesCarregadas.mandatos;
            entidadesCarregadas.exercicios += resultado.entidadesCarregadas.exercicios;
            entidadesCarregadas.cargos += resultado.entidadesCarregadas.cargos;
            entidadesCarregadas.participacoesComissoes += resultado.entidadesCarregadas.participacoesComissoes;
            entidadesCarregadas.filiacoes += resultado.entidadesCarregadas.filiacoes;
            entidadesCarregadas.licencas += resultado.entidadesCarregadas.licencas;
            entidadesCarregadas.liderancas += resultado.entidadesCarregadas.liderancas;
            entidadesCarregadas.comissoes += resultado.entidadesCarregadas.comissoes;
          } else {
            falhas++;
          }
        } catch (error: any) {
          logger.error(`Erro ao processar senador ${dadosSenador.senador.codigo}: ${error.message}`);
          falhas++;
        }
        
        // Pausa entre senadores para não sobrecarregar o Firestore
        if (index < dadosNormalizados.length - 1) {
          logger.info('Aguardando 500ms antes de processar o próximo senador...');
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      logger.info(`Carregamento de múltiplos senadores concluído: ${sucessos} salvos com sucesso, ${falhas} falhas`);
      logger.info(`Total de entidades carregadas: ${entidadesCarregadas.senadores} senadores, ${entidadesCarregadas.mandatos} mandatos, ${entidadesCarregadas.exercicios} exercícios, ${entidadesCarregadas.cargos} cargos, ${entidadesCarregadas.participacoesComissoes} participações em comissões, ${entidadesCarregadas.filiacoes} filiações, ${entidadesCarregadas.licencas} licenças, ${entidadesCarregadas.liderancas} lideranças, ${entidadesCarregadas.comissoes} comissões`);
      
      return {
        timestamp,
        sucessos,
        falhas,
        entidadesCarregadas,
        status: falhas === 0 ? 'success' : falhas < dadosNormalizados.length ? 'partial' : 'error'
      };
    } catch (error: any) {
      logger.error(`Erro geral ao salvar múltiplos senadores normalizados: ${error.message}`);
      return {
        timestamp: new Date().toISOString(),
        sucessos: 0,
        falhas: dadosNormalizados.length,
        entidadesCarregadas: {
          senadores: 0,
          mandatos: 0,
          exercicios: 0,
          cargos: 0,
          participacoesComissoes: 0,
          filiacoes: 0,
          licencas: 0,
          liderancas: 0,
          comissoes: 0
        },
        status: 'error'
      };
    }
  }
}

// Instância exportada para uso em outros módulos
export const carregadorNormalizado = new CarregadorNormalizado();
