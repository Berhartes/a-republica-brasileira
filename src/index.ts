/**
 * Barrel exports para todos os domínios
 * Facilita a importação de componentes, hooks e serviços de domínios
 */

// Domínio Congresso Nacional e subdomínios
export * as senado from './congresso-nacional/senado';
export * as camara from './congresso-nacional/camara';

// Domínio Usuário
export * from './domains/usuario';

// Verifica se o módulo usuário existe e registra aviso se não encontrar
try {
  await import('./domains/usuario');
} catch (e) {
  console.warn('Módulo usuário não encontrado, continuando sem ele');
}

// Adicione outros domínios conforme necessário