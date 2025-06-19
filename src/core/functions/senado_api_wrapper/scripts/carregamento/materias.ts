/**
 * Módulo para carregamento de dados de matérias legislativas no Firestore
 *
 * Este módulo implementa funções para salvar dados transformados de matérias legislativas
 * no Firestore, seguindo a estrutura de coleções do projeto.
 */
import { logger } from '../utils/logging';
import { firestoreBatch } from '../utils/storage';
import { MateriaTransformada } from '../transformacao/materias';

/**
 * Classe para carregar dados de matérias legislativas no Firestore
 */
export class MateriasLoader {
  /**
   * Salva matérias de um senador no Firestore
   * @param materiaData - Matérias transformadas do senador
   * @param legislaturaNumero - Número da legislatura (opcional)
   * @returns Resultado da operação
   */
  async saveMateria(
    materiaData: MateriaTransformada,
    legislaturaNumero?: number
  ): Promise<{
    timestamp: string;
    codigo: string;
    status: string;
  }> {
    try {
      // Verificação de segurança
      if (!materiaData || !materiaData.codigo) {
        logger.error('Dados de matéria inválidos para salvamento');
        return {
          timestamp: new Date().toISOString(),
          codigo: 'desconhecido',
          status: 'error'
        };
      }

      logger.info(`Salvando matérias do senador ${materiaData.senador.nome} (${materiaData.codigo}) ${legislaturaNumero ? `da legislatura ${legislaturaNumero}` : ''}`);

      const timestamp = new Date().toISOString();

      // Criar o batch manager para operações em lote
      const batchManager = firestoreBatch.createBatchManager();

      // Preparar o documento de matéria que conterá todas as categorias
      const materiaDoc = {
        codigo: materiaData.codigo,
        senador: materiaData.senador,
        timestamp: timestamp,
        atualizadoEm: timestamp,
        estatisticasAutorias: materiaData.estatisticasAutorias || {},
        // Categorias de autorias (sem redundância)
        autoriasIndividuais: materiaData.autoriasIndividuais || [],
        coautorias: materiaData.coautorias || [],
        autoriasColetivas: materiaData.autoriasColetivas || [],
        // Relatorias
        relatorias: materiaData.relatorias || [],
        // Contadores para facilitar consultas
        totalAutoriasIndividuais: materiaData.autoriasIndividuais?.length || 0,
        totalCoautorias: materiaData.coautorias?.length || 0,
        totalAutoriasColetivas: materiaData.autoriasColetivas?.length || 0,
        totalRelatorias: materiaData.relatorias?.length || 0
      };

      // Agrupar todas as matérias por ano
      const materiasPorAno = this.agruparMateriasPorAno(materiaData);

      // Salvar um documento para cada ano
      for (const ano in materiasPorAno) {
        const materiasDoAno = materiasPorAno[ano];
        const materiaRef = `congressoNacional/senadoFederal/perfilComplementar/${materiaData.codigo}/materias/${ano}`;

        // Log para informar o que está sendo salvo
        logger.info(`Salvando matérias do ano ${ano} para o senador ${materiaData.codigo} em ${materiaRef}`);
        logger.info(`- ${materiasDoAno.autoriasIndividuais.length} autorias individuais`);
        logger.info(`- ${materiasDoAno.coautorias.length} coautorias`);
        logger.info(`- ${materiasDoAno.autoriasColetivas.length} autorias coletivas`);
        logger.info(`- ${materiasDoAno.relatorias.length} relatorias`);

        batchManager.set(materiaRef, {
          ...materiaDoc,
          ...materiasDoAno,
          ano: parseInt(ano),
        });
      }

      // Commit das operações
      await batchManager.commit();

      logger.info(`Matérias do senador ${materiaData.codigo} salvas com sucesso`);

      return {
        timestamp,
        codigo: materiaData.codigo,
        status: 'success'
      };
    } catch (error: any) {
      logger.error(`Erro ao salvar matérias do senador ${materiaData.codigo}: ${error.message}`);
      return {
        timestamp: new Date().toISOString(),
        codigo: materiaData.codigo,
        status: 'error'
      };
    }
  }

  /**
   * Agrupa matérias por ano
   * @param materiaData - Matérias transformadas do senador
   * @returns Objeto com matérias agrupadas por ano
   */
  private agruparMateriasPorAno(materiaData: MateriaTransformada): Record<string, any> {
    const materiasPorAno: Record<string, any> = {};

    const agrupar = (materias: any[] | undefined, tipo: string) => {
      if (!materias) return;
      for (const materia of materias) {
        const ano = materia.ano;
        if (!ano) continue;
        if (!materiasPorAno[ano]) {
          materiasPorAno[ano] = {
            autoriasIndividuais: [],
            coautorias: [],
            autoriasColetivas: [],
            relatorias: [],
          };
        }
        materiasPorAno[ano][tipo].push(materia);
      }
    };

    agrupar(materiaData.autoriasIndividuais || [], 'autoriasIndividuais');
    agrupar(materiaData.coautorias || [], 'coautorias');
    agrupar(materiaData.autoriasColetivas || [], 'autoriasColetivas');
    agrupar(materiaData.relatorias || [], 'relatorias');

    return materiasPorAno;
  }
  
  /**
   * Salva múltiplas matérias no Firestore
   * @param materias - Array de matérias transformadas
   * @param legislaturaNumero - Número da legislatura (opcional)
   * @returns Resultado da operação
   */
  async saveMultiplasMaterias(
    materias: MateriaTransformada[],
    legislaturaNumero?: number
  ): Promise<{
    timestamp: string;
    total: number;
    sucessos: number;
    falhas: number;
    status: string;
  }> {
    try {
      logger.info(`Salvando ${materias.length} matérias de senadores ${legislaturaNumero ? `da legislatura ${legislaturaNumero}` : ''}`);

      const timestamp = new Date().toISOString();
      let sucessos = 0;
      let falhas = 0;

      // Processar em lotes para evitar limites do Firestore
      const tamanhoBatch = 100;
      const totalLotes = Math.ceil(materias.length / tamanhoBatch);

      for (let indice = 0; indice < totalLotes; indice++) {
        logger.info(`Processando lote ${indice + 1}/${totalLotes}`);

        // Obter lote atual
        const inicio = indice * tamanhoBatch;
        const fim = Math.min(inicio + tamanhoBatch, materias.length);
        const lote = materias.slice(inicio, fim);

        // Criar batch manager para o lote
        const batchManager = firestoreBatch.createBatchManager();

        // Salvar cada matéria no lote
        for (const materia of lote) {
          try {
            // Verificar se a matéria é válida
            if (!materia || !materia.codigo) {
              logger.warn(`Matéria inválida encontrada no lote ${indice + 1}, pulando...`);
              falhas++;
              continue;
            }

            // Agrupar matérias por ano
            const materiasPorAno = this.agruparMateriasPorAno(materia);

            // Salvar um documento para cada ano
            for (const ano in materiasPorAno) {
              const materiasDoAno = materiasPorAno[ano];
              const materiaRef = `congressoNacional/senadoFederal/perfilComplementar/${materia.codigo}/materias/${ano}`;

              // Log para informar o que está sendo salvo
              logger.info(`Salvando matérias do ano ${ano} para o senador ${materia.codigo} em ${materiaRef}`);

              const materiaDoc = {
                codigo: materia.codigo,
                senador: materia.senador,
                timestamp: timestamp,
                atualizadoEm: timestamp,
                ano: parseInt(ano),
                ...materiasDoAno,
              };

              batchManager.set(materiaRef, materiaDoc);
            }

            sucessos++;
          } catch (error: any) {
            logger.warn(`Erro ao processar matérias do senador ${materia?.codigo || 'desconhecido'} no lote ${indice + 1}: ${error.message}`);
            falhas++;
          }
        }

        // Commit do lote
        await batchManager.commit();

        // Mostrar progresso
        logger.info(`Progresso: ${Math.min((indice + 1) * tamanhoBatch, materias.length)}/${materias.length} matérias`);

        // Pausa entre lotes para não sobrecarregar o Firestore
        if (indice < totalLotes - 1) {
          logger.info(`Aguardando 1 segundo antes de processar o próximo lote...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      logger.info(`Carregamento de matérias concluído: ${sucessos} salvos com sucesso, ${falhas} falhas`);

      return {
        timestamp,
        total: materias.length,
        sucessos,
        falhas,
        status: falhas === 0 ? 'success' : falhas < materias.length ? 'partial' : 'error'
      };
    } catch (error: any) {
      logger.error(`Erro ao salvar múltiplas matérias: ${error.message}`);
      return {
        timestamp: new Date().toISOString(),
        total: materias.length,
        sucessos: 0,
        falhas: materias.length,
        status: 'error'
      };
    }
  }
}

// Instância singleton para uso em toda a aplicação
export const materiasLoader = new MateriasLoader();
