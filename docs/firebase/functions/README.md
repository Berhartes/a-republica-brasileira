# Sistema ETL Unificado para o Senado Federal

Este projeto implementa um sistema ETL (Extração, Transformação e Carregamento) unificado para dados da API do Senado Federal, utilizando Firebase Cloud Functions.

## Arquitetura

O sistema segue uma arquitetura baseada em três componentes principais:

1. **Extratores**: Responsáveis por obter dados da API do Senado Federal
2. **Transformadores**: Responsáveis por converter os dados brutos em formato apropriado para o Firestore
3. **Carregadores**: Responsáveis por persistir os dados no Firestore

## Estrutura do Projeto

```
functions2/
├── src/                           # Código fonte
│   ├── config/                    # Configurações
│   │   ├── firebase.ts            # Configuração do Firebase
│   │   └── endpoints.ts           # Endpoints da API do Senado
│   ├── core/                      # Componentes essenciais
│   │   ├── errors/                # Tratamento de erros
│   │   │   └── app-error.ts       # Classe base para erros
│   │   ├── logging/               # Sistema de logs
│   │   │   └── logger.ts          # Logger estruturado
│   │   └── utils/                 # Utilitários diversos
│   ├── domains/                   # Domínios específicos
│   │   └── congresso/             # Domínio do Congresso Nacional
│   │       └── senado/            # Subdomínio do Senado Federal
│   │           └── api/           # API do Senado
│   │               └── senado-api-client.ts  # Cliente da API
│   ├── extractors/                # Extratores de dados
│   │   └── legislatura-extractor.ts  # Extrator de legislaturas
│   ├── transformers/              # Transformadores de dados
│   │   └── legislatura-transformer.ts  # Transformador de legislaturas
│   ├── loaders/                   # Carregadores de dados
│   │   └── legislatura-loader.ts  # Carregador de legislaturas
│   ├── functions/                 # Funções Cloud Functions
│   │   └── legislatura-functions.ts  # Funções para legislaturas
│   └── index.ts                   # Ponto de entrada principal
├── tests/                         # Testes automatizados
├── package.json                   # Dependências e scripts
└── tsconfig.json                  # Configuração do TypeScript
```

## Componentes Implementados

### 1. Extratores

- `LegislaturaExtractor`: Extrai dados de legislaturas da API do Senado Federal.
- `SenadorExtractor`: Extrai dados básicos e perfis completos de senadores.
- `ComissaoExtractor`: Extrai dados de comissões do Senado Federal e Congresso Nacional.

### 2. Transformadores

- `LegislaturaTransformer`: Transforma os dados brutos de legislaturas para um formato estruturado adequado ao Firestore.
- `SenadorTransformer`: Transforma dados brutos de senadores e perfis completos.
- `ComissaoTransformer`: Transforma dados brutos de comissões em formato estruturado.

### 3. Carregadores

- `LegislaturaLoader`: Carrega os dados transformados de legislaturas no Firestore, seguindo a estrutura definida.
- `SenadorLoader`: Carrega dados básicos e perfis completos de senadores no Firestore.
- `ComissaoLoader`: Carrega dados de comissões no Firestore e detecta mudanças em composições.

### 4. Funções Cloud

#### Legislaturas

- `processarLegislatura`: Função agendada para processar a legislatura atual.
- `triggerLegislatura`: Endpoint HTTP para forçar o processamento da legislatura atual.
- `processarListaLegislaturas`: Função agendada para processar a lista completa de legislaturas.
- `triggerListaLegislaturas`: Endpoint HTTP para forçar o processamento da lista de legislaturas.

#### Senadores

- `atualizarSenadoresAtuais`: Função agendada para atualização diária dos senadores em exercício.
- `atualizarSenadoresAtuaisHttp`: Endpoint HTTP para atualização manual dos senadores atuais.
- `atualizarSenadoresLegislaturaHttp`: Endpoint para atualizar senadores de legislatura específica.
- `atualizarPerfilSenadorHttp`: Endpoint para atualizar perfil de senador específico.

#### Comissões

- `processarComissoes`: Função agendada para atualização diária de comissões.
- `triggerComissoes`: Endpoint HTTP para atualização manual de comissões.
- `triggerComissaoEspecifica`: Endpoint HTTP para atualizar uma comissão específica.
- `triggerComissoesPorTipo`: Endpoint HTTP para atualizar comissões de um tipo específico.

## Estrutura de Dados no Firestore

O sistema armazena os dados em uma estrutura hierárquica no Firestore:

```
congressoNacional/
└── senadoFederal/
    ├── atual/                 # Acesso rápido aos dados atuais
    │   ├── legislatura        # Documento com dados da legislatura atual
    │   ├── senadores/         # Senadores em exercício
    │   │   ├── lista          # Metadata e lista básica 
    │   │   └── itens/         # Detalhes individuais
    │   │       └── {codigo}/  # Documento por senador
    │   └── comissoes/         # Comissões ativas
    │       └── dados/         # Detalhes de comissões
    │           └── {id}/      # Documento por comissão
    ├── legislaturas/          # Dados organizados por legislatura
    │   ├── 57/                # Documento para legislatura 57
    │   │   ├── senadores/     # Senadores da legislatura
    │   │   │   ├── lista      # Metadata e lista básica
    │   │   │   └── {codigo}/  # Documento por senador
    │   │   └── comissoes/     # Comissões da legislatura
    │   │       ├── senado/    # Comissões do Senado
    │   │       │   ├── permanente/  # Comissões permanentes
    │   │       │   ├── cpi/         # CPIs
    │   │       │   └── temporaria/  # Comissões temporárias
    │   │       └── congresso/  # Comissões do Congresso
    │   │           ├── cpmi/        # CPMIs
    │   │           └── mista/       # Comissões mistas
    │   ├── 56/                # Documento para legislatura 56
    │   └── ...
    ├── perfis/                # Perfis completos dos parlamentares
    │   └── {codigo}/          # Perfil completo por senador
    ├── metadata/              # Metadados
    │   ├── legislatura        # Metadados da legislatura atual
    │   ├── listaLegislaturas  # Metadados da lista de legislaturas
    │   ├── senadores          # Metadados da última atualização de senadores
    │   ├── comissoes          # Metadados da última atualização de comissões
    │   └── tiposComissoes     # Tipos de comissões disponíveis
    ├── indices/               # Índices para consultas rápidas
    │   ├── comissoes          # Índice de comissões por código
    │   └── parlamentaresComissoes  # Índice de comissões por parlamentar
    └── mudancas/              # Registro de mudanças detectadas
        ├── legislatura-57-[timestamp]  # Mudanças na legislatura 57
        └── comissoes_[timestamp]       # Mudanças em comissões
```

## Próximos Passos

Os seguintes componentes ainda precisam ser implementados:

1. **Votações**: Extração, transformação e carregamento de dados de votações.
2. **Matérias**: Extração, transformação e carregamento de dados de matérias legislativas.
3. **Despesas**: Extração, transformação e carregamento de dados de despesas.
4. **Presenças**: Extração, transformação e carregamento de dados de presenças.
5. **Partidos**: Extração, transformação e carregamento de dados de partidos.
6. **Blocos Partidários**: Extração, transformação e carregamento de dados de blocos partidários.

## Desenvolvimento

### Pré-requisitos

- Node.js 22
- Firebase CLI
- Conta no Firebase

### Instalação

```bash
# Instalar dependências
npm install

# Compilar TypeScript
npm run build

# Executar localmente
npm run serve
```

### Deployment

```bash
# Fazer deploy das funções
npm run deploy
```

## Funcionalidades Avançadas

- **Detecção de Mudanças**: O sistema detecta e registra mudanças nos dados entre atualizações.
- **Estrutura Dual**: Os dados são armazenados tanto em uma estrutura por legislatura quanto em uma estrutura "atual" para acesso rápido.
- **Tratamento de Erros**: Sistema robusto de tratamento e registro de erros.
- **Logs Estruturados**: Logs detalhados para facilitar o debugging e monitoramento.

## Manutenção e Extensão

Para adicionar novos tipos de dados ao ETL, siga este processo:

1. Crie um novo extrator em `src/extractors/`
2. Crie um novo transformador em `src/transformers/`
3. Crie um novo carregador em `src/loaders/`
4. Crie novas funções Cloud em `src/functions/`
5. Exporte as novas funções em `src/index.ts`
