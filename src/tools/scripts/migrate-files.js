import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Mapeamento de arquivos para mover
const filesToMove = [
  // Core
  {
    from: 'src/types',
    to: 'src/core/types'
  },
  {
    from: 'types',
    to: 'src/core/types'
  },
  {
    from: 'schemas',
    to: 'src/core/schemas'
  },
  {
    from: 'functions',
    to: 'src/core/functions'
  },
  
  // Domínio Congresso Nacional
  {
    from: 'src/domains/congresso/components',
    to: 'src/domains/congresso-nacional/senado/components'
  },
  {
    from: 'src/domains/congresso/services',
    to: 'src/domains/congresso-nacional/senado/services'
  },
  {
    from: 'src/domains/congresso/types',
    to: 'src/domains/congresso-nacional/senado/types'
  },
  {
    from: 'src/domains/congresso/schemas',
    to: 'src/core/schemas/congresso'
  },
  
  // Shared
  {
    from: 'src/components',
    to: 'src/shared/components'
  },
  {
    from: 'src/hooks',
    to: 'src/shared/hooks'
  },
  {
    from: 'src/styles',
    to: 'src/shared/styles'
  },
  {
    from: 'src/utils',
    to: 'src/shared/utils'
  },
  
  // Services
  {
    from: 'src/services/senado',
    to: 'src/services/api/senado'
  },
  {
    from: 'services/firebase',
    to: 'src/services/firebase'
  },
  {
    from: 'src/services/firebase',
    to: 'src/services/firebase'
  },
  
  // App
  {
    from: 'src/App.tsx',
    to: 'src/app/App.tsx'
  },
  {
    from: 'src/routes',
    to: 'src/app/routes'
  },
  {
    from: 'src/providers',
    to: 'src/app/providers'
  },
  {
    from: 'src/layouts',
    to: 'src/app/layouts'
  },
  {
    from: 'src/pages',
    to: 'src/app/pages'
  },
  
  // Mock API
  {
    from: 'mock-api',
    to: 'tools/mock-api'
  }
];

// Função para criar diretório recursivamente
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Diretório criado: ${dir}`);
  }
}

// Função para copiar arquivo
function copyFile(from, to) {
  try {
    const sourceFile = path.resolve(rootDir, from);
    const targetFile = path.resolve(rootDir, to);
    
    // Criar diretório de destino se não existir
    const targetDir = path.dirname(targetFile);
    ensureDirectoryExists(targetDir);
    
    // Copiar arquivo
    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, targetFile);
      console.log(`✅ Arquivo copiado: ${from} -> ${to}`);
    } else {
      console.log(`⚠️ Arquivo fonte não encontrado: ${from}`);
    }
  } catch (error) {
    console.error(`❌ Erro ao copiar arquivo ${from}:`, error.message);
  }
}

// Função para copiar diretório
function copyDirectory(from, to) {
  try {
    const sourceDir = path.resolve(rootDir, from);
    const targetDir = path.resolve(rootDir, to);
    
    // Criar diretório de destino
    ensureDirectoryExists(targetDir);
    
    if (fs.existsSync(sourceDir)) {
      // Copiar arquivos recursivamente
      const files = fs.readdirSync(sourceDir);
      files.forEach(file => {
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(targetDir, file);
        
        if (fs.lstatSync(sourcePath).isDirectory()) {
          copyDirectory(
            path.relative(rootDir, sourcePath),
            path.relative(rootDir, targetPath)
          );
        } else {
          copyFile(
            path.relative(rootDir, sourcePath),
            path.relative(rootDir, targetPath)
          );
        }
      });
      console.log(`✅ Diretório copiado: ${from} -> ${to}`);
    } else {
      console.log(`⚠️ Diretório fonte não encontrado: ${from}`);
    }
  } catch (error) {
    console.error(`❌ Erro ao copiar diretório ${from}:`, error.message);
  }
}

// Executar migração
console.log('🚀 Iniciando migração de arquivos...\n');

filesToMove.forEach(({ from, to }) => {
  const sourcePath = path.resolve(rootDir, from);
  
  if (fs.existsSync(sourcePath)) {
    if (fs.lstatSync(sourcePath).isDirectory()) {
      copyDirectory(from, to);
    } else {
      copyFile(from, to);
    }
  } else {
    console.log(`⚠️ Caminho não encontrado: ${from}`);
  }
});

console.log('\n✨ Migração concluída!'); 