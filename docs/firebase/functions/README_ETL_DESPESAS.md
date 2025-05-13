# Sistema ETL para Despesas de Senadores (CEAPS)

Este documento descreve o sistema ETL para despesas de senadores, implementado no contexto do sistema de dados abertos legislativos do Senado Federal.

## Visão Geral

O componente de despesas é responsável por extrair, transformar e carregar dados da Cota para o Exercício da Atividade Parlamentar dos Senadores (CEAPS), que são as verbas utilizadas pelos senadores para custear despesas relacionadas ao exercício de suas atividades parlamentares.

### Funcionalidades Principais

1. **Extração de Despesas**: Recupera dados de despesas do portal de transparência do Senado Federal, com diversas opções de filtragem:
   - Por ano e mês
   - Por senador
   - Por tipo de despesa
   - Por fornecedor

2. **Transformação de Dados**: Converte os dados brutos em formato CSV para um formato estruturado e normalizado, adequado para armazenamento e consulta eficiente.

3. **Carga de Dados**: Persiste os dados no Firestore com estrutura otimizada para diferentes padrões de consulta, incluindo:
   - Consulta por senador
   - Consulta por tipo de despesa
   - Consulta por fornecedor
   - Consulta por período (ano/mês)

4. **Geração de Resumos**: Cria resumos estatísticos das despesas por senador, tipo de despesa e período.

5. **Processamento Automático**: Executa atualizações mensais e anuais de forma agendada.

## Estrutura de Dados

### Modelos

- **Despesa**: Representa uma despesa individual de um senador, incluindo dados como valor, fornecedor, tipo de despesa, data, etc.
- **ResumoDespesasSenador**: Representa um resumo estatístico das despesas de um senador em um determinado período.
- **ResumoDespesasTipo**: Representa um resumo estatístico por tipo de despesa.

### Entidades

- **DespesaEntity**: Implementa a lógica de negócios para manipulação e análise de dados de despesas.

## Componentes ETL

### Extratores

- **DespesasExtractor**: Extrai dados de despesas para um ano/mês específico.
- **DespesasSenadorExtractor**: Extrai dados de despesas de um senador específico.

### Transformadores

- **DespesaTransformer**: Transforma dados brutos de despesas em formato normalizado.
- **DespesasSenadorTransformer**: Especialização para transformação de despesas por senador.

### Carregadores

- **DespesaLoader**: Persiste dados de uma despesa no Firestore.
- **ListaDespesasLoader**: Persiste dados de múltiplas despesas no Firestore.

### Processadores

- **DespesasAnoProcessor**: Coordena o processo ETL completo para despesas de um ano específico.
- **DespesasMesProcessor**: Coordena o ETL para despesas de um mês específico.
- **DespesasSenadorProcessor**: Coordena o ETL para despesas de um senador específico.
- **DespesasAnoAtualProcessor**: Coordena o ETL para despesas do ano atual.
- **DespesasMesAtualProcessor**: Coordena o ETL para despesas do mês atual.

## Cloud Functions

### Funções Agendadas

- **atualizarDespesasMensais**: Executa mensalmente no início de cada mês para processar despesas do mês anterior.
- **atualizarDespesasAnuais**: Executa anualmente em janeiro para processar despesas do ano anterior.

### Funções HTTP

- **atualizarDespesasAno**: Endpoint HTTP para processamento de despesas de um ano específico:
  - `?ano=2023`: Processa despesas do ano 2023

- **atualizarDespesasMes**: Endpoint HTTP para processamento de despesas de um mês específico:
  - `?ano=2023&mes=5`: Processa despesas de maio de 2023

- **atualizarDespesasSenador**: Endpoint HTTP para processamento de despesas de um senador específico:
  - `?senadorId=123&ano=2023&mes=5`: Processa despesas do senador 123 em maio de 2023
  - `?senadorId=123&ano=2023`: Processa todas as despesas do senador 123 em 2023

### Funções Callable

- **consultarDespesas**: Função callable para consulta de despesas com diversos filtros.

## Estrutura no Firestore

```
congressoNacional/
  senadoFederal/
    despesas/
      {id}/
        id: string
        ano: number
        mes: number
        senadorId: number
        nomeSenador: string
        partidoSenador: string
        ufSenador: string
        tipoDespesa: string
        cnpjCpf: string
        fornecedor: string
        documento: string
        data: string
        detalhamento: string
        valorReembolsado: number
        codDocumento: string
        atualizadoEm: string
        dados: object
    indices/
      despesas/
        porSenador/
          {senadorId}/
            anos/
              {ano}/
                meses/
                  {mes}/
                    despesas/
                      {id}/
                        id: string
                        tipoDespesa: string
                        fornecedor: string
                        data: string
                        valorReembolsado: number
                        atualizadoEm: string
        porTipo/
          {tipoNormalizado}/
            anos/
              {ano}/
                meses/
                  {mes}/
                    despesas/
                      {id}/
                        id: string
                        senadorId: number
                        nomeSenador: string
                        fornecedor: string
                        data: string
                        valorReembolsado: number
                        atualizadoEm: string
        porFornecedor/
          {cnpjCpfNormalizado}/
            despesas/
              {id}/
                id: string
                senadorId: number
                nomeSenador: string
                tipoDespesa: string
                data: string
                valorReembolsado: number
                atualizadoEm: string
        porAnoMes/
          {ano-mes}/
            despesas/
              {id}/
                id: string
                senadorId: number
                nomeSenador: string
                tipoDespesa: string
                fornecedor: string
                valorReembolsado: number
                atualizadoEm: string
    resumo/
      despesasPorSenador/
        anos/
          {ano}/
            senadores/
              {senadorId}/
                senadorId: number
                nomeSenador: string
                partidoSenador: string
                ufSenador: string
                valorTotal: number
                quantidadeDespesas: number
                mediaDespesas: number
                maiorDespesa: number
                menorDespesa: number
                ultimaAtualizacao: string
```

## Uso

### Atualização Automática

O sistema atualiza automaticamente as despesas:
- Mensalmente: No 1º dia de cada mês às 01:00, processa as despesas do mês anterior.
- Anualmente: No dia 15 de janeiro às 02:00, processa todas as despesas do ano anterior.

### Atualização Manual

Para atualizar despesas manualmente, envie uma requisição para os endpoints de atualização:

```
POST /atualizarDespesasAno?ano=2023
Authorization: Bearer {token}
```

```
POST /atualizarDespesasMes?ano=2023&mes=5
Authorization: Bearer {token}
```

```
POST /atualizarDespesasSenador?senadorId=123&ano=2023&mes=5
Authorization: Bearer {token}
```

### Consulta de Despesas

Para consultar despesas com diversos filtros:

```javascript
const despesas = firebase.functions().httpsCallable('consultarDespesas');
despesas({ 
  senadorId: 123,
  ano: 2023,
  mes: 5,
  tipoDespesa: 'Passagens aéreas',
  limit: 50,
  orderBy: {
    field: 'valorReembolsado',
    direction: 'desc'
  }
});
```

## Considerações e Limitações

1. **Formato dos Dados Fonte**: Os dados são disponibilizados em formato CSV, o que pode levar a variações na estrutura entre diferentes anos. O sistema implementa lógica flexível para lidar com essas variações.

2. **Volume de Dados**: O volume de despesas pode ser considerável, especialmente ao processar um ano inteiro. O sistema implementa processamento em lotes para lidar com essa carga.

3. **Normalização de Tipos de Despesa**: Os tipos de despesa não são padronizados na fonte, podendo haver variações de nomenclatura. O sistema implementa normalização para facilitar consultas.

4. **Consultas Eficientes**: As consultas mais comuns (por senador, tipo, fornecedor, período) são otimizadas através de índices específicos no Firestore.

## Próximos Passos e Melhorias

1. **Detecção de Anomalias**: Implementar análise estatística para detecção de despesas atípicas.

2. **Enriquecimento de Dados**: Integração com outros dados, como presenças em sessões e votações.

3. **Visualizações Avançadas**: Ferramentas para visualização geográfica e temporal das despesas.

4. **Comparação entre Senadores**: Análise comparativa de padrões de gastos entre senadores.

5. **Análise de Tendências**: Implementar análise de tendências temporais nas despesas.

---

## Histórico de Versões

- **1.0.0** (28/04/2025): Implementação inicial do sistema ETL de despesas.
