/**
 * Utilitário para analisar argumentos da linha de comando
 * Inclui suporte para legislatura como primeiro argumento numérico
 *
 * Este módulo implementa funções para analisar argumentos da linha de comando
 * e extrair opções como legislatura, limite de deputados, etc.
 */
import { logger } from './logger';

/**
 * Interface para opções de linha de comando
 */
export interface CommandOptions {
  legislatura?: string;
  limite?: string;
  deputado?: string;
  senador?: string;
  atualizar?: string;
  concorrencia?: string;
  ajuda?: string;
  h?: string;
  exportar?: string;
  pc?: string;
  emulator?: string;
  mock?: string;
  [key: string]: string | undefined;
}

/**
 * Detecta se um argumento é um identificador de legislatura numérico
 * @param arg - Argumento a ser analisado
 * @returns Número da legislatura ou null se não for válido
 */
function detectarArgumentoLegislatura(arg: string): number | null {
  // Detectar argumentos como --57, --56, --55, -57, etc.
  const match = arg.match(/^--?(\d+)$/);
  if (match) {
    const num = parseInt(match[1], 10);
    // Aceitar range amplo mas razoável para legislaturas
    if (num >= 1 && num <= 100) {
      return num;
    }
  }
  return null;
}

/**
 * Analisa argumentos da linha de comando com suporte avançado para detecção de legislatura
 * @returns Objeto com opções extraídas
 */
export function parseArgs(): CommandOptions {
  const args = process.argv.slice(2);
  const options: CommandOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // Verificar se é um argumento de legislatura numérico (ex: --57, --56, etc.)
    const legislaturaDetectada = detectarArgumentoLegislatura(arg);
    if (legislaturaDetectada !== null) {
      options.legislatura = legislaturaDetectada.toString();
      logger.info(`🏛️ Legislatura detectada via argumento numérico: ${legislaturaDetectada}`);
      continue;
    }

    if (arg.startsWith('--')) {
      // Formato --opcao=valor ou --opcao valor
      const hasEquals = arg.includes('=');

      if (hasEquals) {
        const [key, value] = arg.slice(2).split('=');
        options[key] = value;
      } else {
        const key = arg.slice(2);
        const nextArg = args[i + 1];

        if (nextArg && !nextArg.startsWith('-')) {
          options[key] = nextArg;
          i++; // Pular o próximo argumento, pois já foi processado
        } else {
          options[key] = 'true'; // Flag sem valor
        }
      }
    } else if (arg.startsWith('-')) {
      // Formato -o valor
      const key = arg.slice(1);
      const nextArg = args[i + 1];

      if (nextArg && !nextArg.startsWith('-')) {
        options[key] = nextArg;
        i++; // Pular o próximo argumento, pois já foi processado
      } else {
        options[key] = 'true'; // Flag sem valor
      }
    } else if (i === 0 && !isNaN(parseInt(arg, 10))) {
      // Primeiro argumento numérico é tratado como legislatura (compatibilidade)
      const legislaturaArg = parseInt(arg, 10);
      if (legislaturaArg > 0 && legislaturaArg <= 100) { // Range expandido
        options.legislatura = arg;
        logger.info(`🏛️ Legislatura especificada via primeiro argumento: ${legislaturaArg}`);
      } else {
        logger.error(`Legislatura inválida: ${arg}. Deve ser um número entre 1 e 100.`);
        process.exit(1);
      }
    }
  }

  // Processar opções especiais que afetam variáveis de ambiente
  if (options.emulator === 'true') {
    process.env.USE_FIRESTORE_EMULATOR = 'true';
    logger.info('🔄 Flag --emulator ativa: Usando o emulador do Firestore');
  }

  if (options.mock === 'true') {
    process.env.USE_REAL_FIRESTORE = 'false';
    logger.info('🔄 Flag --mock ativa: Usando a implementação mock do Firestore');
  }

  // Log das opções encontradas (apenas se há opções)
  if (Object.keys(options).length > 0) {
    logger.info('Opções da linha de comando:', options);
    console.log('Opções da linha de comando:', options);
  }

  return options;
}
