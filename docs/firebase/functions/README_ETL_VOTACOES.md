# Sistema ETL para Votações do Senado Federal

Este documento descreve o sistema ETL para votações do Senado Federal, implementado no contexto do sistema de dados abertos legislativos.

## Visão Geral

O componente de votações é responsável por extrair, transformar e carregar dados de votações nominais do Senado Federal. Os dados incluem informações sobre sessões, matérias votadas, votos de parlamentares e orientações de bancada.

### Funcionalidades Principais

1. **Extração de Votações**: Recupera dados de votações da API do Senado Federal, com diversas opções de filtragem:
   - Por período (datas de início e fim)
   - Por sessão específica
   - Por matéria legislativa (sigla, número e ano)
   - Por parlamentar

2. **Transformação de Dados**: Converte os dados brutos da API em um formato estruturado e normalizado, adequado para armazenamento e consulta eficiente.

3. **Carga de Dados**: Persiste os dados no Firestore com estrutura otimizada para diferentes padrões de consulta, incluindo:
   - Consulta por sessão
   - Consulta por matéria
   - Consulta por parlamentar

4. **Detecção de Mudanças**: Implementa mecanismos para identificar alterações em votações existentes.

5. **Processamento Automático**: Executa atualizações diárias e sob demanda.

## Estrutura de Dados

### Modelos

- **Votacao**: Representa uma votação nominal, incluindo metadados da sessão, matéria votada, resultado e votos individuais.
- **VotoParlamentar**: Representa o voto individual de um parlamentar em uma votação específica.
- **OrientacaoBancada**: Representa a orientação dada por uma bancada partidária para uma votação.

### Entidades

- **VotacaoEntity**: Implementa a lógica de negócios para manipulação e análise de dados de votação.

## Componentes ETL

### Extratores

- **VotacaoExtractor**: Extrai dados gerais de votações com base em parâmetros de filtragem.
- **VotacaoPorSessaoExtractor**: Extrai votações de uma sessão específica.
- **VotacaoPorMateriaExtractor**: Extrai votações de uma matéria específica.

### Transformadores

- **VotacaoTransformer**: Transforma dados brutos de votações em formato normalizado.
- **VotacaoPorSessaoTransformer**: Especialização para transformação de votações por sessão.

### Carregadores

- **VotacaoLoader**: Persiste dados de votações no Firestore, com estruturas otimizadas para consulta.

### Processadores

- **VotacaoProcessor**: Coordena o processo ETL completo para votações.
- **VotacaoPorSessaoProcessor**: Coordena o ETL para votações de uma sessão específica.
- **VotacaoPorMateriaProcessor**: Coordena o ETL para votações de uma matéria específica.

## Cloud Functions

### Funções Agendadas

- **atualizarVotacoesDiarias**: Executa diariamente para obter novas votações e atualizações.

### Funções HTTP

- **atualizarVotacoes**: Endpoint HTTP para processamento sob demanda:
  - `?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD`: Processa votações em um período
  - `?codigoSessao=123`: Processa votações de uma sessão específica
  - `?sigla=PL&numero=1234&ano=2023`: Processa votações de uma matéria específica

### Funções Callable

- **consultarVotacoesParlamentar**: Função callable para consulta de votações de um parlamentar específico.

## Estrutura no Firestore

```
congressoNacional/
  senadoFederal/
    votacoes/
      {votacaoId}/
        codigoSessao: number
        dataSessao: string
        horaSessao: string
        siglaMateria: string
        numeroMateria: string
        anoMateria: number
        descricaoVotacao: string
        resultado: string
        votos: VotoParlamentar[]
        orientacaoBancada: OrientacaoBancada[]
        atualizadoEm: string
        dados: object
    indices/
      votacoes/
        porSessao/
          {codigoSessao}/
            votacoes/
              {votacaoId}/
                votacaoId: string
                descricaoVotacao: string
                resultado: string
                atualizadoEm: string
        porMateria/
          {siglaNumeroAno}/
            votacoes/
              {votacaoId}/
                votacaoId: string
                descricaoVotacao: string
                resultado: string
                atualizadoEm: string
        porParlamentar/
          {codigoParlamentar}/
            votacoes/
              {votacaoId}/
                votacaoId: string
                voto: string
                dataSessao: string
                siglaMateria: string
                numeroMateria: string
                anoMateria: number
                descricaoVotacao: string
                resultado: string
                atualizadoEm: string
```

## Uso

### Atualização Automática

O sistema atualiza automaticamente as votações diariamente às 3:30 da manhã (horário de Brasília), buscando as votações dos últimos 7 dias.

### Atualização Manual

Para atualizar votações manualmente, envie uma requisição para o endpoint de atualização:

```
POST /atualizarVotacoes
Authorization: Bearer {token}
```

Parâmetros:
- `dataInicio`: Data inicial (YYYY-MM-DD)
- `dataFim`: Data final (YYYY-MM-DD)
- `codigoSessao`: Código da sessão
- `sigla`, `numero`, `ano`: Identificação da matéria

### Consulta de Votações

Para consultar votações de um parlamentar específico:

```javascript
const votacoes = firebase.functions().httpsCallable('consultarVotacoesParlamentar');
votacoes({ 
  codigoParlamentar: 123,
  periodo: {
    dataInicio: '2023-01-01',
    dataFim: '2023-12-31'
  }
});
```

## Considerações e Limitações

1. **Votações Secretas**: Para votações secretas, o sistema armazena metadados da votação, mas não contém informações sobre votos individuais.

2. **Desempenho**: A API do Senado pode ser lenta para períodos muito extensos. Recomenda-se limitar consultas a períodos de até um ano.

3. **Consistência de Dados**: A API do Senado pode retornar dados inconsistentes ou incompletos em alguns casos. O sistema tenta mitigar isso com validações e tratamento de erros robustos.

4. **Orientação de Bancada**: As orientações de bancada nem sempre estão disponíveis para todas as votações.

## Próximos Passos e Melhorias

1. **Análise de Coerência Partidária**: Implementar análises avançadas de coerência entre voto e orientação partidária.

2. **Integração com Notificações**: Adicionar notificações para votações importantes.

3. **Visualizações Personalizadas**: Gerar visualizações e relatórios personalizados de votações por tema, partido ou parlamentar.

4. **Análise Temporal**: Implementar análises históricas e comparativas de votações em diferentes legislaturas.

---

## Histórico de Versões

- **1.0.0** (28/04/2025): Implementação inicial do sistema ETL de votações.
