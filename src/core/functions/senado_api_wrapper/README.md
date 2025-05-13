# Scripts ETL para API do Senado Federal

Este projeto implementa scripts para extração, transformação e carregamento (ETL) de dados da API do Senado Federal.

## Processamento de Senadores em Exercício

Para executar o processamento completo de senadores em exercício:

```bash
npm run process:senadores
```

Este comando executa o fluxo completo:
1. Detecção da legislatura atual
2. Extração de dados da API do Senado
3. Transformação dos dados para um formato otimizado
4. Carregamento no Firestore (mock)
5. Geração de histórico

### Apenas Extração de Senadores

Para executar apenas a extração de senadores em exercício:

```bash
npm run extract:senadores
```

## Processamento de Perfis Completos de Senadores

Para executar o processamento completo de perfis detalhados de senadores:

```bash
npm run process:perfilsenadores
```

Este comando implementa um ETL mais completo:
1. Detecção da legislatura atual ou uso da legislatura especificada
2. Extração da lista de senadores da legislatura
3. Extração de perfis detalhados para cada senador incluindo:
   - Dados pessoais e identificação
   - Mandatos e cargos
   - Comissões e funções
   - Filiações partidárias
   - Formação acadêmica e profissional
   - Licenças e afastamentos
   - Apartes e atividades parlamentares
4. Transformação dos dados em formato otimizado
5. Carregamento no Firestore (mock)
6. Geração de histórico

### Apenas Extração de Perfis

Para executar apenas a extração de perfis de senadores:

```bash
npm run extract:perfilsenadores
```

### Processamento de Uma Legislatura Específica

É possível processar uma legislatura específica passando o número da legislatura como argumento:

```bash
npm run process:perfilsenadores -- 54
```

Este comando processa os perfis completos dos senadores da 54ª legislatura.

### Exemplo de Uso de Perfis

Para executar um exemplo de extração e transformação de perfis:

```bash
npm run example:perfilsenadores
```

## Obter a Legislatura Atual

Para testar a detecção da legislatura atual:

```bash
npm run test:legislatura
```

Este comando obtém a legislatura atual da API do Senado e exibe suas informações.

## Processamento de Blocos Parlamentares

Para executar o processamento completo de blocos parlamentares:

```bash
npm run process:blocos
```

Este comando executa o fluxo completo:
1. Detecção da legislatura atual
2. Extração de dados da API do Senado
3. Transformação dos dados para um formato otimizado
4. Carregamento no Firestore (mock)
5. Geração de histórico

### Apenas Extração de Blocos

Para executar apenas a extração de blocos parlamentares:

```bash
npm run extract:blocos
```

## Estrutura do Projeto

```
senado_api_wrapper/
├── scripts/                       # Scripts locais para desenvolvimento/testes
│   ├── extracao/                  # Scripts para extração de dados por módulo
│   │   ├── blocos.ts              # Extrai dados de blocos parlamentares
│   │   ├── senadores.ts           # Extrai dados de senadores em exercício
│   │   └── perfilsenadores.ts     # Extrai perfis completos de senadores
│   │
│   ├── transformacao/             # Scripts para transformação de dados
│   │   ├── blocos.ts              # Transforma dados de blocos parlamentares
│   │   ├── senadores.ts           # Transforma dados de senadores
│   │   └── perfilsenadores.ts     # Transforma perfis completos
│   │
│   ├── carregamento/              # Scripts para carregar dados no Firestore
│   │   ├── blocos.ts              # Carrega dados de blocos parlamentares
│   │   ├── senadores.ts           # Carrega dados de senadores
│   │   └── perfilsenadores.ts     # Carrega perfis completos
│   │
│   ├── exemplos/                  # Exemplos de uso
│   │   └── perfilsenadores_exemplo.ts  # Exemplo de uso de perfis
│   │
│   ├── utils/                     # Utilitários comuns
│   │   ├── api.ts                 # Utilitário para requisições à API
│   │   ├── error_handler.ts       # Tratamento centralizado de erros
│   │   ├── firestore.ts           # Mock de configuração do Firestore
│   │   ├── logger.ts              # Sistema de logs
│   │   └── legislatura.ts         # Utilitario para obter legislatura atual
│   │
│   ├── config/                    # Configurações
│   │   └── endpoints.ts           # Configuração de endpoints da API
│   │
│   ├── processar_blocos.ts        # Script principal para processar blocos
│   ├── processar_senadores.ts     # Script principal para processar senadores
│   ├── processar_perfilsenadores.ts # Script para processar perfis de senadores
│   └── testar_legislatura.ts      # Script para testar obtenção da legislatura
│
├── src/                           # Código fonte do wrapper da API
│   └── ...                        # Implementação do wrapper
│
├── package.json                   # Configuração do projeto
└── tsconfig.json                  # Configuração do TypeScript
```

## Pré-requisitos

- Node.js 18 ou superior
- npm ou yarn

## Instalação

```bash
npm install
```

## Desenvolvimento

### Compilar o projeto

```bash
npm run build
```

### Estrutura de Dados

#### Senadores em Exercício
Dados básicos dos senadores, incluindo:
- Código e identificação
- Nome e perfil
- Partido e UF
- Bloco parlamentar
- Situação de exercício
- Mandato atual
- Contatos e informações adicionais

#### Perfis Completos de Senadores
Dados completos de senadores, incluindo:
- Todos os dados de identificação básica
- Dados pessoais (data de nascimento, naturalidade, etc.)
- Todos os mandatos (atuais e anteriores)
- Comissões que participa ou participou
- Histórico de filiações partidárias
- Formação acadêmica e profissional
- Licenças e afastamentos
- Apartes e atividades parlamentares recentes
- Situação atual detalhada

#### Blocos Parlamentares
Dados estruturados dos blocos parlamentares:
- Código do bloco
- Nome e apelido
- Data de criação
- Partidos que compõem o bloco
- Informações de liderança

## Próximos Passos

1. Implementar extração de outros tipos de dados:
   - Comissões
   - Mesa diretora
   - Votações

2. Configurar conexão real com Firestore

3. Implementar sistema de detecção de mudanças
