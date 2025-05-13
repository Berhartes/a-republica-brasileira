import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapeamento de diretórios antigos para novos
const migrationMap = {
  // Configurações
  'config/firebase': 'config/firebase',
  'config/vite.config.ts': 'config/vite/vite.config.ts',
  'config/vite.config.alternativo.ts': 'config/vite/vite.config.alternativo.ts',
  'config/tsconfig.json': 'config/typescript/tsconfig.json',
  
  // Domínio Congresso
  'src/domains/congresso/components': 'src/domains/congresso/components',
  'src/domains/congresso/services': 'src/domains/congresso/services',
  'src/domains/congresso/types': 'src/domains/congresso/types',
  'src/domains/congresso/schemas': 'src/core/schemas/congresso',
  
  // Compartilhados
  'src/shared/components': 'src/shared/components',
  'src/shared/hooks': 'src/shared/hooks',
  'src/shared/utils': 'src/shared/utils',
  'src/shared/styles': 'src/shared/styles',
  
  // Core
  'src/types': 'src/core/types',
  'src/core/monitoring': 'src/core/monitoring',
  
  // Serviços
  'src/services/senado': 'src/services/senado',
  'src/services/firebase': 'src/services/firebase',
};

// Função para criar diretório se não existir
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Função para mover arquivos
function moveFiles(source, destination) {
  if (!fs.existsSync(source)) {
    console.log(`Source directory ${source} does not exist`);
    return;
  }

  ensureDirectoryExists(destination);

  const files = fs.readdirSync(source);
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);

    if (fs.lstatSync(sourcePath).isDirectory()) {
      moveFiles(sourcePath, destPath);
    } else {
      fs.renameSync(sourcePath, destPath);
      console.log(`Moved ${sourcePath} to ${destPath}`);
    }
  });
}

// Executar migração
console.log('Iniciando migração...');
Object.entries(migrationMap).forEach(([source, destination]) => {
  console.log(`Migrando ${source} para ${destination}`);
  moveFiles(source, destination);
});
console.log('Migração concluída!'); 