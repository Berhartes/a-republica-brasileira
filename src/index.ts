/**
 * Barrel exports para todos os domínios
 * Facilita a importação de componentes, hooks e serviços de domínios
 */

// Domínio Congresso Nacional e subdomínios
export * as senado from './domains/republica/congresso/senado';
export * as camara from './domains/republica/congresso/camara';

// Domínio Usuário
export * from './domains/usuario';

// Adicione outros domínios conforme necessário
