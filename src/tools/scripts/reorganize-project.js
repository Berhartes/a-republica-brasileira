// Este script ajuda na reorganização da estrutura do projeto
// Execute com: node scripts/reorganize-project.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

console.log(`${colors.yellow}Iniciando reorganização do projeto...${colors.reset}`);

// Função para criar diretório se não existir
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`${colors.green}Diretório criado:${colors.reset} ${dirPath}`);
  }
}

// Função para mover arquivo ou diretório
function moveIfExists(source, dest) {
  if (fs.existsSync(source)) {
    // Verifica se o destino já existe
    if (fs.existsSync(dest)) {
      console.log(`${colors.yellow}Destino já existe, pulando:${colors.reset} ${dest}`);
      return;
    }
    
    // Cria os diretórios pai do destino se necessário
    ensureDir(path.dirname(dest));
    
    // Move o arquivo ou diretório
    fs.renameSync(source, dest);
    console.log(`${colors.green}Movido:${colors.reset} ${source} -> ${dest}`);
  } else {
    console.log(`${colors.yellow}Origem não encontrada, pulando:${colors.reset} ${source}`);
  }
}

// Raiz do projeto
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');

// 1. Criar estrutura de diretórios conforme recomendado
const dirs = [
  'dist',
  'src/app/components',
  'src/app/hooks',
  'src/app/pages',
  'src/shared/components',
  'src/shared/hooks',
  'src/shared/styles',
  'src/shared/utils',
  'src/shared/types',
];

dirs.forEach(dir => {
  ensureDir(path.join(projectRoot, dir));
});

// 2. Mover arquivos para suas novas localizações
const moves = [
  // Mover estilos
  { from: path.join(srcDir, 'shared/styles'), to: path.join(srcDir, 'shared/styles') },
  
  // Mover utils
  { from: path.join(srcDir, 'utils.ts'), to: path.join(srcDir, 'shared/utils/general.ts') },
  { from: path.join(srcDir, 'utils'), to: path.join(srcDir, 'shared/utils') },
  
  // Mover tipos
  { from: path.join(srcDir, 'types.ts'), to: path.join(srcDir, 'shared/types/general.ts') },
  { from: path.join(srcDir, 'types'), to: path.join(srcDir, 'shared/types') },
];

moves.forEach(move => {
  moveIfExists(move.from, move.to);
});

// 3. Atualizar imports nos arquivos
console.log(`${colors.blue}Reorganização básica concluída!${colors.reset}`);
console.log(`${colors.yellow}Nota:${colors.reset} Você precisará atualizar manualmente os imports nos arquivos.`);
console.log(`${colors.yellow}Sugestão:${colors.reset} Use uma extensão como "Find and Replace" no VSCode para fazer isso mais facilmente.`);

// 4. Instruções adicionais
console.log(`\n${colors.blue}Próximos passos:${colors.reset}`);
console.log(`1. Execute o build com: ${colors.green}pnpm run build${colors.reset}`);
console.log(`2. Verifique se os arquivos foram gerados corretamente na pasta ${colors.green}dist${colors.reset}`);
console.log(`3. Continue a refatoração seguindo as diretrizes em ${colors.green}PROJETO-REESTRUTURADO.md${colors.reset}`);
