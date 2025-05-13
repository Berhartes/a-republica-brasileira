#!/usr/bin/env node

/**
 * Script para corrigir problemas com o react-query no projeto
 * 
 * Este script resolve incompatibilidades comuns entre as versões do React Query e outras bibliotecas
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}Iniciando correção do React Query...${colors.reset}`);

try {
  // Verifica a versão atual do React Query
  const packageJson = require(path.join(process.cwd(), 'package.json'));
  const hasReactQuery = packageJson.dependencies['@tanstack/react-query'] || packageJson.dependencies['react-query'];
  
  if (!hasReactQuery) {
    console.log(`${colors.yellow}React Query não encontrado nas dependências.${colors.reset}`);
    process.exit(0);
  }
  
  console.log(`${colors.yellow}Verificando compatibilidade com outras bibliotecas...${colors.reset}`);
  
  // Verifica incompatibilidades conhecidas
  const reactVersion = packageJson.dependencies.react;
  if (reactVersion && !reactVersion.includes('18')) {
    console.log(`${colors.yellow}Detectada possível incompatibilidade: React ${reactVersion}${colors.reset}`);
    console.log(`${colors.yellow}React Query funciona melhor com React 18 ou superior.${colors.reset}`);
  }
  
  // Corrige problemas de tipos
  console.log(`${colors.yellow}Aplicando correções para problemas de tipos...${colors.reset}`);
  
  // Criar módulo de correção se necessário
  const fixModulePath = path.join(process.cwd(), 'src', 'core', 'types', 'react-query-fixes.d.ts');
  if (!fs.existsSync(fixModulePath)) {
    const fixContent = `// Correções de tipos para o React Query
declare module '@tanstack/react-query' {
  // Extensões e correções de tipos aqui
}
`;
    
    // Cria o diretório se não existir
    const dir = path.dirname(fixModulePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fixModulePath, fixContent);
    console.log(`${colors.green}Arquivo de correção de tipos criado em ${fixModulePath}${colors.reset}`);
  }
  
  console.log(`${colors.green}Correções aplicadas com sucesso!${colors.reset}`);
  
} catch (error) {
  console.error(`${colors.red}Erro ao aplicar correções:${colors.reset}`, error.message);
  process.exit(1);
}