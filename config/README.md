# Configuration Directory Structure

Este diretório contém todas as configurações do projeto A República Brasileira.

## Estrutura

```
config/
├── app/              # Configurações da aplicação
│   ├── components.json   # Configuração de componentes
│   └── dependencies.json # Dependências e versões
├── build/            # Configurações de build
│   ├── postcss.config.ts
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   └── vitest.workspace.ts
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
Configurações relacionadas ao processo de build:
- Vite e plugins
- PostCSS e Tailwind
- Vitest para testes

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
