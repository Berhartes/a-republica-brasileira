/**
 * Script para processar perfis de deputados
 *
 * Este script utiliza o sistema modular ETL para extrair,
 * transformar e carregar perfis completos de deputados.
 *
 * Uso:
 *   npm run camara:perfil -- [legislatura] [opções]
 *
 * Exemplos:
 *   npm run camara:perfil                       # Processa legislatura atual
 *   npm run camara:perfil -- 56 --limite 10     # Legislatura 56, limitado a 10
 *   npm run camara:perfil -- --pc --verbose     # Salva no PC com logs detalhados
 *   npm run camara:perfil -- --emulator         # Usa Firestore Emulator
 *
 * Para mais opções, use: npm run camara:perfil -- --help
 */
/**
 * Função principal do script
 */
declare function main(): Promise<void>;
export { main as processarPerfilDeputados };
export default main;
