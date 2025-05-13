#!/usr/bin/env node

/**
 * Script para atualizar as dependências do projeto
 * 
 * Este script verifica e atualiza as dependências do projeto,
 * garantindo a compatibilidade e estabilidade.
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

console.log(`${colors.cyan}Iniciando atualização de dependências...${colors.reset}`);

try {
  // Verifica dependências desatualizadas
  console.log(`${colors.yellow}Verificando dependências desatualizadas...${colors.reset}`);
  const outdated = execSync('pnpm outdated --format=json').toString();
  const outdatedDeps = JSON.parse(outdated);
  
  if (Object.keys(outdatedDeps).length === 0) {
    console.log(`${colors.green}Todas as dependências estão atualizadas!${colors.reset}`);
    process.exit(0);
  }
  
  // Backup do package.json atual
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const backupPath = path.join(process.cwd(), 'package.json.backup');
  fs.copyFileSync(packageJsonPath, backupPath);
  
  console.log(`${colors.yellow}Backup do package.json criado em ${backupPath}${colors.reset}`);
  
  // Atualiza as dependências
  console.log(`${colors.yellow}Atualizando dependências...${colors.reset}`);
  execSync('pnpm update', { stdio: 'inherit' });
  
  console.log(`${colors.green}Dependências atualizadas com sucesso!${colors.reset}`);
  
} catch (error) {
  console.error(`${colors.red}Erro ao atualizar dependências:${colors.reset}`, error.message);
  process.exit(1);
}