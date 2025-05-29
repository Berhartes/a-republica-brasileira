/**
 * Utilitário genérico para exportação de dados em diferentes formatos
 *
 * Este módulo fornece funções para exportar dados em diferentes formatos (JSON, CSV)
 * e com diferentes níveis de detalhamento (completo, resumido).
 *
 * Características:
 * - Suporte para exportação em JSON e CSV
 * - Opção para compressão de arquivos
 * - Geração de estatísticas sobre os dados
 * - Suporte para diferentes níveis de detalhamento
 */
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { promisify } from 'util';
import { logger } from '../logging';
import {
  OpcoesExportacao,
  exportarParaJSON,
  exportarParaCSV,
  calcularCompletude,
  verificarConsistencia,
  gerarEstatisticasGerais,
  criarDadosResumidos,
  exportarObjeto,
  criarEstruturaDiretorios
} from './exportacao-avanc';

// Converter callbacks para promises
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

// Diretório base para armazenar os arquivos exportados
const BASE_OUTPUT_DIR = path.join(process.cwd(), 'dados_extraidos');

/**
 * Função para exportar dados para JSON (implementação local)
 * @param dados - Dados a serem exportados
 * @param filePath - Caminho do arquivo
 */
export function exportToJson(dados: any, filePath: string): void {
  try {
    // Garantir que o diretório existe
    const diretorio = path.dirname(path.join(BASE_OUTPUT_DIR, filePath));
    if (!fs.existsSync(diretorio)) {
      fs.mkdirSync(diretorio, { recursive: true });
    }

    // Escrever arquivo
    const caminhoCompleto = path.join(BASE_OUTPUT_DIR, filePath);
    fs.writeFileSync(caminhoCompleto, JSON.stringify(dados, null, 2));
    logger.info(`Arquivo JSON exportado: ${caminhoCompleto}`);
  } catch (error: any) {
    logger.error(`Erro ao exportar JSON para ${filePath}: ${error.message}`);
    throw error;
  }
}

/**
 * Exporta itens como arquivos individuais
 * @param dados - Array de dados a serem exportados
 * @param baseDir - Diretório base
 * @param getFileName - Função para obter o nome do arquivo para cada item
 */
export function exportItemsAsIndividualFiles<T>(
  dados: T[],
  baseDir: string,
  getFileName: (item: T) => string
): void {
  try {
    for (const item of dados) {
      const fileName = getFileName(item);
      const filePath = path.join(baseDir, `${fileName}.json`);
      exportToJson(item, filePath);
    }
    logger.info(`${dados.length} arquivos individuais exportados em ${baseDir}`);
  } catch (error: any) {
    logger.error(`Erro ao exportar arquivos individuais: ${error.message}`);
    throw error;
  }
}

/**
 * Interface para opções de exportação de dados para o Firestore
 */
export interface OpcoesExportacaoFirestore {
  salvarNoPC: boolean;
  caminhoBase?: string;
  timestamp?: string;
}

/**
 * Interface para opções de exportação básica
 */
export interface OpcoesExportacaoBasica {
  caminhoBase?: string;
  timestamp?: string;
}

/**
 * Exporta dados para o formato Firestore (simulação da estrutura)
 * @param dados - Dados a serem exportados
 * @param opcoes - Opções de exportação
 * @param prepararDadosFirestore - Função para preparar os dados no formato do Firestore
 */
export async function exportarDadosFirestore<T>(
  dados: T[],
  opcoes: OpcoesExportacaoFirestore,
  prepararDadosFirestore: () => Record<string, any>
): Promise<void> {
  try {
    if (!opcoes.salvarNoPC) {
      logger.info('Exportação para formato Firestore desativada');
      return;
    }

    logger.info('Exportando dados no formato exato do Firestore');

    // Usar timestamp fornecido ou gerar um novo
    const timestamp = opcoes.timestamp || new Date().toISOString().replace(/[:.]/g, '-');
    const caminhoBase = opcoes.caminhoBase || 'dados';

    // Preparar a estrutura completa
    const estruturaFirestore = prepararDadosFirestore();

    // Definir caminho do arquivo
    const filePath = path.join(
      caminhoBase,
      `estrutura_firestore_${timestamp}.json`
    );

    // Exportar a estrutura completa
    exportToJson(estruturaFirestore, filePath);

    logger.info(`Estrutura exata do Firestore salva com sucesso: ${filePath}`);

    // Exportar cada item em um arquivo separado se necessário
    if (dados.length > 0) {
      logger.info('Exportando itens individuais com a estrutura exata do Firestore');

      // Função para obter o nome do arquivo para cada item
      const getFileName = (item: any) => {
        const codigo = item.codigo || item.id || 'desconhecido';
        return `firestore_item_${codigo}_${timestamp}`;
      };

      // Exportar cada item em um arquivo separado
      exportItemsAsIndividualFiles(
        dados,
        path.join(caminhoBase, 'itens'),
        getFileName
      );

      logger.info(`${dados.length} arquivos de itens exportados com sucesso`);
    }
  } catch (error: any) {
    logger.error(`Erro ao exportar dados para formato Firestore: ${error.message}`);
    throw error;
  }
}

/**
 * Exporta dados brutos para arquivos JSON
 * @param dados - Dados a serem exportados
 * @param opcoes - Opções de exportação
 */
export async function exportarDadosBrutos<T>(
  dados: T,
  opcoes: OpcoesExportacaoBasica
): Promise<void> {
  try {
    const timestamp = opcoes.timestamp || new Date().toISOString().replace(/[:.]/g, '-');
    const caminhoBase = opcoes.caminhoBase || 'dados';

    const filePath = path.join(
      caminhoBase,
      `dados_brutos_${timestamp}.json`
    );

    exportToJson(dados, filePath);
    logger.info(`Dados brutos exportados com sucesso: ${filePath}`);
  } catch (error: any) {
    logger.error(`Erro ao exportar dados brutos: ${error.message}`);
    throw error;
  }
}

/**
 * Exporta dados com opções avançadas (JSON, CSV, estatísticas)
 * @param dados - Dados a serem exportados
 * @param opcoes - Opções de exportação avançada
 * @param tempoInicio - Timestamp de início do processamento (para cálculo do tempo total)
 */
export async function exportarDadosAvancados<T>(
  dados: T[],
  opcoes: OpcoesExportacao,
  tempoInicio: number = Date.now()
): Promise<void> {
  try {
    const dataExtracao = new Date().toISOString().split('T')[0];
    const diretorioBase = await criarEstruturaDiretorios(
      0, // Não usamos legislatura aqui, é um valor genérico
      dataExtracao,
      opcoes.caminhoBase || 'dados'
    );

    // Verificar se há dados para exportar
    if (dados.length === 0) {
      logger.warn('Array de dados vazio para exportação avançada. Criando apenas resumo e metadados.');

      // Criar um resumo básico para casos de dados vazios
      const resumoVazio = {
        timestamp: new Date().toISOString(),
        status: 'success',
        mensagem: 'Nenhum dado disponível para exportação',
        tempoProcessamento: (Date.now() - tempoInicio) / 1000
      };

      // Exportar resumo
      await exportarObjeto(resumoVazio, path.join(diretorioBase, 'estatisticas', 'resumo.json'));
      logger.info('Resumo básico criado para dataset vazio');
      return;
    }

    // Criar dados resumidos
    const dadosResumidos = criarDadosResumidos(dados);

    // Exportar dados conforme as opções
    if (opcoes.formato === 'json' || opcoes.formato === 'ambos') {
      if (opcoes.nivelDetalhamento === 'completo' || opcoes.nivelDetalhamento === 'ambos') {
        await exportarParaJSON(
          dados,
          path.join(diretorioBase, 'dados', 'dados_completos.json'),
          opcoes.comprimir
        );
      }

      if (opcoes.nivelDetalhamento === 'resumido' || opcoes.nivelDetalhamento === 'ambos') {
        await exportarParaJSON(
          dadosResumidos,
          path.join(diretorioBase, 'dados', 'dados_resumidos.json'),
          opcoes.comprimir
        );
      }
    }

    if (opcoes.formato === 'csv' || opcoes.formato === 'ambos') {
      if (opcoes.nivelDetalhamento === 'completo' || opcoes.nivelDetalhamento === 'ambos') {
        await exportarParaCSV(
          dados,
          path.join(diretorioBase, 'dados', 'dados_completos.csv'),
          opcoes.comprimir
        );
      }

      if (opcoes.nivelDetalhamento === 'resumido' || opcoes.nivelDetalhamento === 'ambos') {
        await exportarParaCSV(
          dadosResumidos,
          path.join(diretorioBase, 'dados', 'dados_resumidos.csv'),
          opcoes.comprimir
        );
      }
    }

    // Calcular e exportar estatísticas
    const tempoFim = Date.now();
    const tempoProcessamento = (tempoFim - tempoInicio) / 1000; // em segundos

    const completude = calcularCompletude(dados);
    const consistencia = verificarConsistencia(dados);
    const estatisticasGerais = gerarEstatisticasGerais(dados);
    estatisticasGerais.tempoProcessamento = tempoProcessamento;

    // Criar um novo arquivo para exportar objetos de estatísticas
    await exportarObjeto(completude, path.join(diretorioBase, 'estatisticas', 'completude.json'));
    await exportarObjeto(consistencia, path.join(diretorioBase, 'estatisticas', 'consistencia.json'));
    await exportarObjeto(estatisticasGerais, path.join(diretorioBase, 'estatisticas', 'resumo.json'));

    logger.info('=================================================');
    logger.info(`✅ Exportação concluída com sucesso!`);
    logger.info(`📂 Diretório: ${diretorioBase}`);
    logger.info(`📊 Total de itens: ${dados.length}`);
    logger.info(`🔍 Completude média: ${completude.media.toFixed(2)}%`);
    logger.info(`⏱️ Tempo de processamento: ${tempoProcessamento.toFixed(2)}s`);
    logger.info('=================================================');
  } catch (error: any) {
    logger.error(`❌ Erro ao exportar dados: ${error.message}`);
    throw error;
  }
}
