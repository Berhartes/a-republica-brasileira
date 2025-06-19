/**
 * Extrator para Senadores por Bloco Parlamentar
 */
import { logger } from '../utils/logging';
import { senadoresExtractor } from './senadores';

// Interfaces para tipagem dos dados
interface SenadorBloco {
  codigoSenador: string | number;
  nomeSenador: string;
  siglaPartido: string;
  uf: string;
  codigoBloco: string | number;
  nomeBloco: string;
  siglaBloco?: string;
}

interface ResultadoExtracao {
  timestamp: string;
  total: number;
  senadoresPorBloco: Record<string, SenadorBloco[]>;
}

/**
 * Classe para extração de dados de senadores por bloco parlamentar
 */
export class SenadoresPorBlocoExtractor {
  /**
   * Extrai a lista de senadores agrupados por bloco parlamentar
   */
  async extractSenadoresPorBloco(): Promise<ResultadoExtracao> {
    logger.info('Extraindo lista de senadores por bloco parlamentar');

    try {
      // Obter a lista de senadores em exercício
      const resultadoSenadores = await senadoresExtractor.extractSenadoresAtuais();

      if (resultadoSenadores.erro) {
        throw new Error(`Erro ao extrair senadores: ${resultadoSenadores.erro}`);
      }

      // Mapa para armazenar senadores por bloco
      const senadoresPorBloco: Record<string, SenadorBloco[]> = {};
      let totalAssociados = 0;

      // Processar cada senador e associá-lo ao seu bloco
      for (const senador of resultadoSenadores.senadores) {
        const identificacao = senador.IdentificacaoParlamentar;

        // Verificar se o senador pertence a algum bloco
        if (identificacao.Bloco && identificacao.Bloco.CodigoBloco) {
          const codigoBloco = String(identificacao.Bloco.CodigoBloco);

          // Inicializar o array do bloco se ainda não existir
          if (!senadoresPorBloco[codigoBloco]) {
            senadoresPorBloco[codigoBloco] = [];
          }

          // Adicionar o senador ao bloco
          senadoresPorBloco[codigoBloco].push({
            codigoSenador: identificacao.CodigoParlamentar,
            nomeSenador: identificacao.NomeParlamentar,
            siglaPartido: identificacao.SiglaPartidoParlamentar,
            uf: identificacao.UfParlamentar,
            codigoBloco: identificacao.Bloco.CodigoBloco,
            nomeBloco: identificacao.Bloco.NomeBloco,
            siglaBloco: identificacao.Bloco.NomeApelido
          });

          totalAssociados++;
        }
      }

      logger.info(`Extração concluída: ${totalAssociados} senadores associados a ${Object.keys(senadoresPorBloco).length} blocos`);

      return {
        timestamp: new Date().toISOString(),
        total: totalAssociados,
        senadoresPorBloco: senadoresPorBloco
      };
    } catch (error) {
      logger.error('Erro ao extrair lista de senadores por bloco', error);
      throw error;
    }
  }
}

// Exporta uma instância do extrator
export const senadoresPorBlocoExtractor = new SenadoresPorBlocoExtractor();

// Exemplo de uso:
if (require.main === module) {
  // Se executado diretamente (não importado como módulo)
  (async () => {
    try {
      logger.info('Iniciando extração de senadores por bloco');
      const resultado = await senadoresPorBlocoExtractor.extractSenadoresPorBloco();
      logger.info(`Extração concluída: ${resultado.total} senadores associados a blocos`);

      // Exibir exemplo de um bloco
      const primeiroCodigoBloco = Object.keys(resultado.senadoresPorBloco)[0];
      if (primeiroCodigoBloco) {
        const senadores = resultado.senadoresPorBloco[primeiroCodigoBloco];
        console.log(`Bloco ${primeiroCodigoBloco} - ${senadores[0].nomeBloco} (${senadores.length} senadores):`);
        senadores.forEach(s => console.log(`  - ${s.nomeSenador} (${s.siglaPartido}/${s.uf})`));
      }
    } catch (error) {
      logger.error('Erro ao executar o script', error);
      process.exit(1);
    }
  })();
}
