# Configuration Directory Structure

Este diretório contém todas as configurações do projeto A República Brasileira.

## Estrutura

```
config/
├── app/              # Configurações da aplicação
│   ├── components.json   # Configuração de componentes
│   └── dependencies.json # Dependências e versões
├── build/            # Contém configurações específicas de build/teste
│   └── vitest.workspace.ts # Configuração de workspace para Vitest (mantido para possível uso futuro)
├── dev/             # Configurações de desenvolvimento
│   ├── .eslintrc.json
│   ├── .prettierrc
│   ├── .prettierignore
│   └── tsconfig.json
├── firebase/        # Configurações do Firebase
│   ├── .firebaserc
│   ├── firebase.json
│   ├── firestore.indexes.json
│   └── firestore.rules
└── test/            # Configurações de teste
    └── vitest.shims.d.ts
```

## Categorias

### App Config
Configurações gerais da aplicação, incluindo:
- Definições de componentes
- Gerenciamento de dependências
- Configurações de ambiente

### Build Config
Configurações relacionadas ao processo de build e teste:
- **Vite e plugins:** A configuração principal do Vite está em `config/vite/vite.config.ts`.
- **PostCSS e Tailwind:** São configurados dentro do `config/vite/vite.config.ts` e `config/tailwind.config.js` respectivamente.
- **Vitest para testes:** A configuração principal do Vitest (`vitest.config.ts`) foi movida para a raiz do projeto. O arquivo `config/build/vitest.workspace.ts` é mantido para configurações de workspace específicas (ex: testes do Storybook, se utilizados).

### Dev Config
Configurações para ambiente de desenvolvimento:
- ESLint para linting
- Prettier para formatação
- TypeScript

### Firebase Config
Configurações do Firebase:
- Configuração do projeto
- Regras do Firestore
- Índices e segurança

### Test Config
Configurações específicas para testes:
- Shims e mocks
- Configurações do Vitest

## Uso

### Variáveis de Ambiente
```env
# Exemplo de .env
VITE_API_URL=https://api.exemplo.com
VITE_FIREBASE_CONFIG={...}
```

### Configuração do Build
```typescript
// vite.config.ts
export default defineConfig({
  // Configurações personalizadas aqui
});
```

### Configuração do ESLint
```json
// .eslintrc.json
{
  "extends": [
    // Extensões aqui
  ]
}
```

## Manutenção

1. Mantenha as configurações organizadas por categoria
2. Documente todas as alterações
3. Evite duplicação de configurações
4. Use variáveis de ambiente para valores sensíveis

## Boas Práticas

1. Não armazene segredos nos arquivos de configuração
2. Mantenha backups das configurações críticas
3. Documente todas as opções personalizadas
4. Revise as configurações periodicamente
