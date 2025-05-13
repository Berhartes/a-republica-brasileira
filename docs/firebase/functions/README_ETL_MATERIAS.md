# Sistema ETL para Matérias Legislativas do Senado Federal

Este documento descreve o sistema ETL para matérias legislativas (processos) do Senado Federal, implementado no contexto do sistema de dados abertos legislativos.

## Visão Geral

O componente de matérias legislativas é responsável por extrair, transformar e carregar dados de processos legislativos do Senado Federal. Os dados incluem informações sobre proposições, autores, situação atual, tramitação, ementas, assuntos, e outras informações relevantes.

### Funcionalidades Principais

1. **Extração de Matérias**: Recupera dados de matérias legislativas da API do Senado Federal, com diversas opções de filtragem:
   - Por identificação (sigla, número e ano)
   - Por período de apresentação
   - Por autor (parlamentar)
   - Por situação (em tramitação, arquivada, etc.)
   - Por classificação e assunto

2. **Transformação de Dados**: Converte os dados brutos da API em um formato estruturado e normalizado, adequado para armazenamento e consulta eficiente.

3. **Carga de Dados**: Persiste os dados no Firestore com estrutura otimizada para diferentes padrões de consulta, incluindo:
   - Consulta por identificação
   - Consulta por autor
   - Consulta por situação
   - Consulta por assunto

4. **Atualização de Matérias em Tramitação**: Implementa mecanismos para manter atualizadas as matérias em tramitação no Senado Federal.

5. **Processamento Automático**: Executa atualizações diárias de matérias em tramitação.

## Estrutura de Dados

### Modelos

- **Materia**: Representa uma matéria legislativa, incluindo suas informações básicas.
- **AutorMateria**: Representa um autor de uma matéria legislativa.
- **SituacaoMateria**: Representa a situação atual de uma matéria legislativa.
- **AssuntoMateria**: Representa um assunto relacionado a uma matéria legislativa.

### Entidades

- **MateriaEntity**: Implementa a lógica de negócios para manipulação e análise de dados de matéria legislativa.

## Componentes ETL

### Extratores

- **MateriaExtractor**: Extrai dados de uma matéria específica por ID.
- **ListaMateriasExtractor**: Extrai lista de matérias com base em parâmetros de filtragem.
- **MateriasTramitandoExtractor**: Extrai matérias em tramitação.

### Transformadores

- **MateriaTransformer**: Transforma dados brutos de uma matéria em formato normalizado.
- **ListaMateriasTransformer**: Transforma lista de matérias em formato adequado para persistência.

### Carregadores

- **MateriaLoader**: Persiste dados de uma matéria no Firestore.
- **ListaMateriasLoader**: Persiste dados de múltiplas matérias no Firestore.

### Processadores

- **MateriaProcessor**: Coordena o processo ETL completo para uma matéria específica.
- **ListaMateriasProcessor**: Coordena o ETL para lista de matérias.
- **MateriasTramitandoProcessor**: Coordena o ETL para matérias em tramitação.

## Cloud Functions

### Funções Agendadas

- **atualizarMateriasTramitando**: Executa diariamente para atualizar matérias em tramitação.

### Funções HTTP

- **atualizarMateria**: Endpoint HTTP para atualizar uma matéria específica:
  - `?id=123456`: Atualiza a matéria com o ID especificado

- **atualizarListaMaterias**: Endpoint HTTP para atualizar matérias com base em parâmetros:
  - `?sigla=PL&numero=1234&ano=2023`: Atualiza uma matéria específica
  - `?tramitando=S`: Atualiza matérias em tramitação
  - `?codigoParlamentarAutor=123`: Atualiza matérias de um autor específico

- **atualizarMateriasRecentes**: Endpoint HTTP para atualizar matérias apresentadas nos últimos 30 dias.

### Funções Callable

- **consultarMateriasParlamentar**: Função callable para consulta de matérias de um parlamentar específico.

## Estrutura no Firestore

```
congressoNacional/
  senadoFederal/
    materias/
      {id}/
        id: number
        sigla: string
        numero: string
        ano: number
        ementa: string
        explicacaoEmenta: string
        dataApresentacao: string
        autores: AutorMateria[]
        situacaoAtual: SituacaoMateria
        assuntos: AssuntoMateria[]
        origem: string
        natureza: string
        palavrasChave: string[]
        apelido: string
        normaGerada: object
        materiasRelacionadas: object[]
        ultimaAtualizacao: string
        atualizadoEm: string
        dados: object
    indices/
      materias/
        porIdentificacao/
          {siglaNumeroAno}/
            id: number
            sigla: string
            numero: string
            ano: number
            ementa: string
            dataApresentacao: string
            atualizadoEm: string
        porAutor/
          {codigoParlamentar}/
            materias/
              {id}/
                id: number
                sigla: string
                numero: string
                ano: number
                ementa: string
                dataApresentacao: string
                atualizadoEm: string
        porSituacao/
          {siglaSituacao}/
            materias/
              {id}/
                id: number
                sigla: string
                numero: string
                ano: number
                ementa: string
                dataApresentacao: string
                local: string
                atualizadoEm: string
        porLocal/
          {siglaLocal}/
            materias/
              {id}/
                id: number
                sigla: string
                numero: string
                ano: number
                ementa: string
                dataApresentacao: string
                situacao: string
                atualizadoEm: string
        porAssunto/
          {codigoAssunto}/
            materias/
              {id}/
                id: number
                sigla: string
                numero: string
                ano: number
                ementa: string
                dataApresentacao: string
                atualizadoEm: string
        tramitando/
          {id}/
            id: number
            sigla: string
            numero: string
            ano: number
            ementa: string
            dataApresentacao: string
            situacao: string
            local: string
            atualizadoEm: string
```

## Uso

### Atualização Automática

O sistema atualiza automaticamente as matérias em tramitação diariamente às 4:30 da manhã (horário de Brasília).

### Atualização Manual

Para atualizar matérias manualmente, envie uma requisição para os endpoints de atualização:

```
POST /atualizarMateria?id=123456
Authorization: Bearer {token}
```

```
POST /atualizarListaMaterias?sigla=PL&numero=1234&ano=2023
Authorization: Bearer {token}
```

```
POST /atualizarMateriasRecentes
Authorization: Bearer {token}
```

### Consulta de Matérias

Para consultar matérias de um parlamentar específico:

```javascript
const materias = firebase.functions().httpsCallable('consultarMateriasParlamentar');
materias({ 
  codigoParlamentar: 123,
  situacao: 'TRAMITANDO',
  periodo: {
    dataInicio: '2023-01-01',
    dataFim: '2023-12-31'
  }
});
```

## Considerações e Limitações

1. **Volume de Dados**: A API do Senado limita a quantidade de resultados por consulta. Para matérias com muitos resultados, pode ser necessário realizar consultas em lotes.

2. **Atualização de Tramitação**: A situação das matérias pode mudar com frequência. Recomenda-se atualizar regularmente as matérias em tramitação.

3. **Detalhamento de Dados**: A API fornece diferentes níveis de detalhamento. A consulta de lista fornece dados resumidos, enquanto a consulta por ID fornece dados completos.

4. **Relações entre Matérias**: Algumas matérias possuem relações com outras (apensadas, substituídas, etc.). Estas relações são armazenadas, mas podem exigir consultas adicionais para obter detalhes completos.

## Próximos Passos e Melhorias

1. **Integração com Votações**: Implementar relações diretas entre matérias e votações.

2. **Análise Temática**: Adicionar análise semântica para classificação temática mais precisa.

3. **Alertas de Atualização**: Implementar sistema de notificação para alterações em matérias específicas.

4. **Visualizações Personalizadas**: Gerar visualizações e relatórios personalizados por área temática, autor ou período.

5. **Análise Temporal**: Implementar análises históricas e comparativas de matérias em diferentes legislaturas.

---

## Histórico de Versões

- **1.0.0** (28/04/2025): Implementação inicial do sistema ETL de matérias.
