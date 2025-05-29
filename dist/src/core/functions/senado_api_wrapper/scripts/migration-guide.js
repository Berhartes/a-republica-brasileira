"use strict";
/**
 * Script de migração para converter processadores antigos para a nova estrutura modular
 *
 * Este script ajuda a identificar e sugerir mudanças necessárias
 * para migrar processadores para o novo sistema ETL modular.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrationChecks = void 0;
exports.showMigrationGuide = showMigrationGuide;
/**
 * Lista de verificações para migração
 */
const migrationChecks = [
    {
        name: 'Estrutura de Diretórios',
        description: 'Verificar se os arquivos estão na estrutura correta',
        check: () => true,
        fix: `
    Mova os arquivos para:
    - processors/ → Processadores específicos
    - config/ → Configurações
    - types/ → Tipos e interfaces
    - utils/cli/ → Utilitários de CLI
    `
    },
    {
        name: 'Imports Antigos',
        description: 'Verificar imports que precisam ser atualizados',
        check: () => true,
        fix: `
    Atualize os imports:
    - ../utils/logger → ../utils/logging
    - ../utils/error_handler → ../utils/logging
    - ../utils/legislatura → ../utils/date
    - ../utils/firestore → ../utils/storage
    - ../exportacao/* → Remover (usar utils/common)
    `
    },
    {
        name: 'Classe Processador',
        description: 'Verificar se está estendendo ETLProcessor',
        check: () => true,
        fix: `
    Crie uma classe que estende ETLProcessor:
    
    export class MeuProcessador extends ETLProcessor<ExtractedData, TransformedData> {
      protected getProcessName(): string { }
      async validate(): Promise<ValidationResult> { }
      async extract(): Promise<ExtractedData> { }
      async transform(data: ExtractedData): Promise<TransformedData> { }
      async load(data: TransformedData): Promise<any> { }
    }
    `
    },
    {
        name: 'Parser de Argumentos',
        description: 'Verificar se está usando ETLCommandParser',
        check: () => true,
        fix: `
    Use o ETLCommandParser:
    
    const cli = new ETLCommandParser('nome:comando', 'Descrição');
    const options = cli.parse();
    `
    },
    {
        name: 'Configuração Centralizada',
        description: 'Verificar se está usando etlConfig',
        check: () => true,
        fix: `
    Use a configuração centralizada:
    
    import { etlConfig } from '../config/etl.config';
    
    // Em vez de:
    const CONFIG = { concurrency: 3 };
    
    // Use:
    this.context.config.senado.concurrency
    `
    },
    {
        name: 'Tipos Padronizados',
        description: 'Verificar se está usando tipos do etl.types.ts',
        check: () => true,
        fix: `
    Use os tipos padronizados:
    
    import { ETLOptions, ETLResult, ValidationResult } from '../types/etl.types';
    `
    },
    {
        name: 'Batch Manager',
        description: 'Verificar uso correto do batch manager',
        check: () => true,
        fix: `
    Use o novo padrão:
    
    import { createBatchManager } from '../utils/storage';
    const batchManager = createBatchManager();
    batchManager.set(ref, data);
    await batchManager.commit();
    `
    },
    {
        name: 'Tratamento de Erros',
        description: 'Verificar se erros são tratados adequadamente',
        check: () => true,
        fix: `
    Use o tratamento de erros do processador base:
    
    // O ETLProcessor já trata erros automaticamente
    // Use this.incrementErrors() para contabilizar
    // Use this.context.logger para logs
    `
    }
];
exports.migrationChecks = migrationChecks;
/**
 * Guia de migração passo a passo
 */
function showMigrationGuide() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              GUIA DE MIGRAÇÃO - SISTEMA ETL MODULAR           ║
╚═══════════════════════════════════════════════════════════════╝

📋 PASSO A PASSO PARA MIGRAR UM PROCESSADOR:

1️⃣ CRIAR O PROCESSADOR
   - Copie o template: processors/template.processor.ts
   - Renomeie para: processors/[seu-processador].processor.ts
   - Ajuste as interfaces ExtractedData e TransformedData
   - Implemente os métodos abstratos

2️⃣ MIGRAR A LÓGICA
   - extract(): Mova a lógica de extração
   - transform(): Mova a lógica de transformação
   - load(): Mova a lógica de carregamento
   - validate(): Adicione validações específicas

3️⃣ CRIAR O INITIATOR
   - Copie um initiator existente como base
   - Ajuste para usar seu processador
   - Configure opções específicas se necessário

4️⃣ ATUALIZAR IMPORTS
   ${migrationChecks[1].fix}

5️⃣ ADICIONAR AO PACKAGE.JSON
   "scripts": {
     "senado:[seu-comando]": "npx ts-node -P tsconfig.scripts.json src/.../processar_[seu_processador].ts"
   }

6️⃣ TESTAR
   npm run senado:[seu-comando] -- --help
   npm run senado:[seu-comando] -- --dry-run --limite 1 --verbose

📌 EXEMPLO DE MIGRAÇÃO:

ANTES (processador antigo):
\`\`\`typescript
async function processarDados(opcoes: any) {
  // Parsing manual de argumentos
  const args = process.argv.slice(2);
  
  // Configuração hardcoded
  const config = { concurrency: 3 };
  
  // Extração
  const dados = await extrairDados();
  
  // Transformação
  const transformados = transformarDados(dados);
  
  // Carregamento
  await salvarDados(transformados);
}
\`\`\`

DEPOIS (processador modular):
\`\`\`typescript
export class DadosProcessor extends ETLProcessor<ExtractedData, TransformedData> {
  async extract(): Promise<ExtractedData> {
    return await extrairDados();
  }
  
  async transform(data: ExtractedData): Promise<TransformedData> {
    return transformarDados(data);
  }
  
  async load(data: TransformedData): Promise<any> {
    return await salvarDados(data);
  }
}
\`\`\`

🎯 BENEFÍCIOS DA MIGRAÇÃO:
- ✅ Código mais organizado e manutenível
- ✅ Métricas automáticas
- ✅ Logs padronizados
- ✅ Tratamento de erros consistente
- ✅ CLI profissional
- ✅ Configuração centralizada
- ✅ Progresso em tempo real
- ✅ Validações automáticas

💡 DICAS:
- Use o template.processor.ts como base
- Mantenha a lógica de negócio nos métodos ETL
- Use this.context para acessar configurações e logger
- Use this.emitProgress() para feedback visual
- Use this.increment*() para estatísticas

🔍 VERIFICAÇÕES:
`);
    // Mostrar checklist
    migrationChecks.forEach((check, index) => {
        console.log(`\n${index + 1}. ${check.name}`);
        console.log(`   ${check.description}`);
        if (check.fix) {
            console.log(`   Correção: ${check.fix}`);
        }
    });
    console.log(`
═══════════════════════════════════════════════════════════════

Para mais informações, consulte o README.md do sistema ETL.
`);
}
// Executar
if (require.main === module) {
    showMigrationGuide();
}
//# sourceMappingURL=migration-guide.js.map