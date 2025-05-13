# ETL de Senadores - Documentação

Este módulo implementa o processo de ETL (Extração, Transformação, Carregamento) para dados de Senadores do Senado Federal brasileiro. O sistema busca dados da API do Senado Federal, processa-os e salva no Firestore, mantendo uma estrutura de dados otimizada para consultas.

## Componentes

O sistema ETL de Senadores é composto pelos seguintes componentes:

### 1. Modelos

- `senador.ts`: Define as interfaces para representar os dados de senadores, incluindo:
  - `SenadorBasico`: Dados básicos de um senador
  - `PerfilSenador`: Perfil completo de um senador
  - Outras interfaces de suporte (mandatos, exercícios, telefones, etc.)

### 2. Entidades

- `senador.ts`: Implementa classes para representar senadores no sistema:
  - `Senador`: Representa um senador com dados básicos
  - `PerfilSenadorEntity`: Representa um perfil completo de senador

### 3. Extrator

- `senador-extractor.ts`: Responsável por extrair dados da API do Senado Federal:
  - `extract()`: Extrai lista de senadores (atuais ou de legislatura específica)
  - `extractPerfilCompleto()`: Extrai perfil completo de um senador
  - `extractMultiplosPerfis()`: Extrai perfis completos de múltiplos senadores

### 4. Transformador

- `senador-transformer.ts`: Responsável por transformar os dados extraídos:
  - `transform()`: Transforma lista de senadores
  - `transformPerfilCompleto()`: Transforma perfil completo de um senador
  - Métodos auxiliares para transformação de componentes específicos

### 5. Carregador

- `senador-loader.ts`: Responsável por salvar os dados no Firestore:
  - `load()`: Carrega dados transformados no Firestore
  - `savePerfil()`: Salva perfil completo de um senador
  - `savePerfisMultiplos()`: Salva múltiplos perfis de senadores

### 6. Processador

- `senador-processor.ts`: Coordena o fluxo completo de ETL:
  - `process()`: Executa o processo ETL completo
  - `processarPerfilSenador()`: Processa perfil de um senador específico
  - `processarPerfisCompletos()`: Processa perfis completos de múltiplos senadores

### 7. Funções Cloud

- `senador-functions.ts`: Implementa Cloud Functions para execução do ETL:
  - `atualizarSenadoresAtuais`: Função agendada para atualização diária
  - `atualizarSenadoresAtuaisHttp`: Endpoint HTTP para atualização manual
  - `atualizarSenadoresLegislaturaHttp`: Endpoint para atualizar senadores de legislatura específica
  - `atualizarPerfilSenadorHttp`: Endpoint para atualizar perfil de senador específico

## Estrutura de Dados no Firestore

Os dados são organizados no Firestore da seguinte forma:

```
congressoNacional/
└── senadoFederal/
    ├── legislaturas/
    │   └── {numero}/
    │       └── senadores/
    │           ├── lista
    │           └── {codigo}/
    ├── atual/
    │   └── senadores/
    │       ├── lista
    │       └── itens/
    │           └── {codigo}/
    ├── perfis/
    │   └── {codigo}/
    └── metadata/
        └── senadores
```

- `legislaturas/{numero}/senadores`: Lista e dados básicos dos senadores de cada legislatura
- `atual/senadores`: Lista e dados básicos dos senadores em exercício
- `perfis/{codigo}`: Perfis completos dos senadores
- `metadata/senadores`: Metadados da última atualização

## Execução do ETL

### Via Cloud Functions Agendadas

O sistema executa automaticamente a atualização diária dos senadores em exercício através da função agendada `atualizarSenadoresAtuais`, que é executada todos os dias às 3h da manhã (UTC-3).

### Via Endpoints HTTP

Para execuções manuais, os seguintes endpoints estão disponíveis:

1. **Atualizar senadores atuais**:
   ```
   POST /atualizarSenadoresAtuaisHttp
   {
     "incluidaPerfisCompletos": true|false
   }
   ```

2. **Atualizar senadores de legislatura específica**:
   ```
   POST /atualizarSenadoresLegislaturaHttp
   {
     "legislatura": 57,
     "incluidaPerfisCompletos": true|false
   }
   ```

3. **Atualizar perfil de senador específico**:
   ```
   POST /atualizarPerfilSenadorHttp
   {
     "codigo": "12345",
     "legislatura": 57  // opcional
   }
   ```

## Considerações Técnicas

- **Tratamento de Erros**: O sistema implementa tratamento de erros robusto para lidar com falhas na API do Senado Federal.
- **Batch Operations**: Utiliza batch operations para operações eficientes no Firestore.
- **Logging**: Implementa logging detalhado para facilitar o diagnóstico de problemas.
- **Concorrência Controlada**: Implementa controle de concorrência para evitar sobrecarga da API.
- **Detecção de Mudanças**: Detecta automaticamente mudanças nos dados para atualizações eficientes.
