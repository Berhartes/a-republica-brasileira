/**
 * Utilitário para analisar argumentos da linha de comando
 *
 * Este módulo implementa funções para analisar argumentos da linha de comando
 * e extrair opções como legislatura, limite de senadores, etc.
 */
import { logger } from './logger';

/**
 * Interface para opções de linha de comando
 */
export interface CommandOptions {
  legislatura?: string;
  limite?: string;
  senador?: string;
  [key: string]: string | undefined;
}

/**
 * Analisa argumentos da linha de comando
 * @returns Objeto com opções extraídas
 */
export function parseArgs(): CommandOptions {
  const args = process.argv.slice(2);
  const options: CommandOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

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
      // Primeiro argumento numérico é tratado como legislatura
      options.legislatura = arg;
    }
  }

  // Log das opções encontradas
  logger.info('Opções da linha de comando:', options);

  // Saída direta para o console para depuração
  console.log('Opções da linha de comando:', options);

  return options;
}
