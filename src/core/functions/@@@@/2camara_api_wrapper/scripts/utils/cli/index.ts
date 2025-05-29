/**
 * Utilitários de Linha de Comando
 * 
 * Este módulo oferece funcionalidades para parsing e tratamento de argumentos
 * da linha de comando.
 * 
 * @example
 * ```typescript
 * import { parseArgs, CommandOptions } from '../utils/cli';
 * 
 * const options = parseArgs();
 * console.log('Legislatura:', options.legislatura);
 * console.log('Limite:', options.limite);
 * ```
 */

export { parseArgs, CommandOptions } from './args-parser';
