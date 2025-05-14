# Plano Detalhado de Correção de Erros TypeScript - Sistema ETL Senado

## Índice
1. [Visão Geral](#visão-geral)
2. [Erros por Categoria](#erros-por-categoria)
3. [Plano de Correção por Arquivo](#plano-de-correção-por-arquivo)
4. [Passos de Implementação](#passos-de-implementação)
5. [Testes e Validação](#testes-e-validação)

## Visão Geral

Total de erros: 66 erros em 25 arquivos
Principais categorias:
- TS6133: Variáveis/parâmetros declarados mas não utilizados
- TS7016: Falta de declarações de tipo
- TS6196: Interfaces declaradas mas nunca utilizadas
- TS2436: Problemas com declarações de módulos relativos

## Erros por Categoria

### 1. Variáveis Não Utilizadas (TS6133)

#### Padrão de Correção:
- Para parâmetros de callback não utilizados: Prefixar com underscore (_event)
- Para variáveis temporariamente não utilizadas: Adicionar // @ts-ignore ou remover
- Para variáveis que podem ser necessárias no futuro: Documentar com TODO

### 2. Declarações de Tipo Ausentes (TS7016)

#### Padrão de Correção:
- Criar arquivo de declaração adequado para '../loaders/index.mjs'
- Converter arquivos .mjs para .ts onde possível
- Adicionar tipos explícitos para módulos externos

### 3. Interfaces Não Utilizadas (TS6196)

#### Padrão de Correção:
- Remover interfaces não utilizadas
- Implementar interfaces onde necessário
- Documentar interfaces mantidas para uso futuro

## Plano de Correção por Arquivo

### 1. src/core/base-pipeline.ts

```typescript
// Antes
import { AppError, ErrorCode, type ErrorCodeType } from '../utils/errors.js';

// Depois
import { AppError, ErrorCode } from '../utils/errors.js';

// Antes
protected async postProcess(data: U[]): Promise<void> {
  // Implementação vazia
}

// Depois
protected async postProcess(_data: U[]): Promise<void> {
  // Método base vazio - será sobrescrito por classes filhas
}
```

### 2. src/extractors/comissoes.ts

```typescript
// Remover métodos não utilizados ou implementar funcionalidade
extrairCodigosComissoes(dadosComissoes: ComissoesData): string[] {
  return this.buscarCodigosRecursivamente(dadosComissoes);
}

// Adicionar tipo correto e implementação
buscarCodigosRecursivamente(obj: ComissoesData, codigos: string[] = []): string[] {
  // Implementação
}
```

### 3. src/functions/blocos.ts

```typescript
// Antes
}, async (event: ScheduledEvent) => {

// Depois
}, async (_event: ScheduledEvent) => {
```

### 4. src/loaders/index.d.ts

```typescript
// Criar arquivo de declaração adequado
declare module '../loaders/index.mjs' {
  export interface FirestoreLoader {
    saveComissoes(data: ComissoesData, legislatura: number): Promise<void>;
    saveLiderancas(data: LiderancasData, legislatura: number): Promise<void>;
    saveMesas(data: MesasData, legislatura: number): Promise<void>;
    // ... outros métodos
  }

  export const firestoreLoader: FirestoreLoader;
}
```

## Passos de Implementação

### Passo 1: Preparação

1. Fazer backup do código atual
2. Criar branch específica para correções
3. Configurar ferramentas de análise estática

### Passo 2: Correções Base

1. Criar/atualizar arquivos de declaração de tipo
2. Converter arquivos .mjs para .ts
3. Implementar interfaces base

### Passo 3: Correções por Arquivo

#### src/core/base-pipeline.ts
1. Remover importação não utilizada de ErrorCodeType
2. Adicionar prefixo _ para parâmetro data não utilizado

#### src/extractors/comissoes.ts
1. Implementar ou remover métodos não utilizados
2. Adicionar tipos corretos para parâmetros
3. Documentar métodos mantidos para uso futuro

#### src/functions/
1. Adicionar prefixo _ para eventos não utilizados
2. Implementar ou remover variáveis loadResult
3. Documentar resultados importantes para logging

#### src/loaders/
1. Criar arquivo index.d.ts adequado
2. Definir tipos para todas as funções exportadas
3. Atualizar importações em todos os arquivos

### Passo 4: Correções de Módulos

1. Atualizar todas as importações relativas
2. Corrigir declarações de módulo
3. Implementar resolução de módulos ESM

### Passo 5: Limpeza e Documentação

1. Remover código morto
2. Atualizar documentação
3. Adicionar comentários explicativos

## Testes e Validação

### 1. Testes Unitários
- Verificar se todas as funções ainda funcionam como esperado
- Adicionar testes para novas implementações
- Verificar cobertura de código

### 2. Testes de Integração
- Testar fluxo completo do ETL
- Verificar integrações com Firebase
- Validar transformações de dados

### 3. Validação Final
- Executar build completo
- Verificar todos os scripts npm
- Testar em ambiente de desenvolvimento

## Comandos de Verificação

```bash
# Verificar tipos
npm run type-check

# Build completo
npm run build

# Executar testes
npm run test

# Verificar cobertura
npm run test:coverage
```

## Notas Importantes

1. Manter compatibilidade com versões anteriores
2. Documentar todas as alterações
3. Criar testes para novas implementações
4. Manter padrões de código existentes

## Próximos Passos

1. Revisar plano com equipe
2. Priorizar correções críticas
3. Implementar correções em fases
4. Validar cada fase antes de prosseguir
5. Atualizar documentação continuamente

## Conclusão

Este plano fornece um guia detalhado para corrigir todos os erros TypeScript no sistema ETL do Senado. A implementação deve ser feita de forma incremental, testando cada alteração para garantir que não há regressões.

Após a implementação de todas as correções, o sistema estará mais robusto, com melhor tipagem e mais fácil de manter.
