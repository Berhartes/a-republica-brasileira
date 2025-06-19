/**
 * Utilitário para analisar argumentos da linha de comando
 *
 * Este módulo implementa funções para analisar argumentos da linha de comando
 * e extrair opções como legislatura, limite de senadores, etc.
 */
import { logger } from '../logging';

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
 * Analisa argumentos da linha de comando
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
      logger.info(`Legislatura detectada via argumento numérico: ${legislaturaDetectada}`);
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
      // Primeiro argumento numérico é tratado como legislatura
      const legislaturaArg = parseInt(arg, 10);
      if (legislaturaArg > 0 && legislaturaArg <= 100) {
        options.legislatura = arg;
        logger.info(`Legislatura especificada via primeiro argumento: ${legislaturaArg}`);
      } else {
        logger.error(`Legislatura inválida: ${arg}. Deve ser um número entre 1 e 100.`);
        process.exit(1);
      }
    }
  }

  // Log das opções encontradas
  logger.info('Opções da linha de comando:', options);

  // Saída direta para o console para depuração
  console.log('Opções da linha de comando:', options);

  return options;
}

/**
 * Obtém um valor booleano de uma opção
 * @param options - Opções de linha de comando
 * @param key - Chave da opção
 * @param defaultValue - Valor padrão se a opção não estiver presente
 * @returns Valor booleano da opção
 */
export function getBooleanOption(options: CommandOptions, key: string, defaultValue: boolean = false): boolean {
  if (options[key] === undefined) {
    return defaultValue;
  }

  return options[key] === 'true';
}

/**
 * Obtém um valor numérico de uma opção
 * @param options - Opções de linha de comando
 * @param key - Chave da opção
 * @param defaultValue - Valor padrão se a opção não estiver presente ou for inválida
 * @returns Valor numérico da opção
 */
export function getNumberOption(options: CommandOptions, key: string, defaultValue: number): number {
  if (options[key] === undefined) {
    return defaultValue;
  }

  const value = parseInt(options[key], 10);
  if (isNaN(value)) {
    logger.warn(`Valor inválido para opção ${key}: ${options[key]}. Usando valor padrão: ${defaultValue}`);
    return defaultValue;
  }

  return value;
}

/**
 * Exibe mensagem de ajuda padronizada para scripts
 * @param scriptName - Nome do script
 * @param opcoesEspecificas - Texto com opções específicas do script
 * @param exemplosEspecificos - Texto com exemplos específicos do script
 */
export function exibirAjuda(scriptName: string, opcoesEspecificas: string = '', exemplosEspecificos: string = ''): void {
  const opcoesComuns = `
  --pc                        Salva a estrutura exata do Firestore no PC local
  --emulator                  Usa o emulador do Firestore em vez do Firestore real
  --mock                      Usa a implementação mock do Firestore (não salva dados realmente)
  --limite, -l <número>       Limita o processamento a um número específico de itens
  --ajuda, -h                 Exibe esta mensagem de ajuda`;

  const exemplosComuns = `
  # Processar usando Firestore real
  npx ts-node -P tsconfig.scripts.json ${scriptName}

  # Processar usando o emulador do Firestore
  npx ts-node -P tsconfig.scripts.json ${scriptName} --emulator

  # Processar usando a implementação mock (para testes)
  npx ts-node -P tsconfig.scripts.json ${scriptName} --mock

  # Processar e salvar estrutura do Firestore no PC
  npx ts-node -P tsconfig.scripts.json ${scriptName} --pc`;

  console.log(`
Uso: npx ts-node -P tsconfig.scripts.json ${scriptName} [opções]

Opções:${opcoesComuns}${opcoesEspecificas}

Exemplos:${exemplosComuns}${exemplosEspecificos}
  `);

  process.exit(0);
}
