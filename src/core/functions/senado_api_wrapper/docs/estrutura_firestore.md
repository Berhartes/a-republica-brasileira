# Estrutura do Firestore - Dados do Senado Federal

Este documento descreve a nova estrutura normalizada de dados do Senado Federal no Firestore, seguindo boas práticas de modelagem para bancos de dados NoSQL.

## Visão Geral

A nova estrutura segue um modelo normalizado com coleções principais e subcoleções, reduzindo a redundância de dados e facilitando consultas eficientes.

### Principais Mudanças

1. **Normalização de Dados**: Entidades como comissões, cargos e mandatos foram separadas em coleções próprias
2. **Uso de Subcoleções**: Relacionamentos são modelados usando subcoleções do Firestore
3. **Redução de Redundância**: Dados comuns são armazenados uma única vez e referenciados por ID
4. **Metadados Padronizados**: Todos os documentos incluem metadados consistentes
5. **Nomenclatura Padronizada**: Campos com nomes completos e descritivos

## Estrutura de Coleções

### Coleções Principais

- **`senadores`**: Informações básicas de senadores
- **`comissoes`**: Informações sobre comissões parlamentares
- **`legislaturas`**: Informações sobre legislaturas

### Subcoleções

- **`senadores/{senadorId}/mandatos`**: Mandatos do senador
- **`senadores/{senadorId}/mandatos/{mandatoId}/exercicios`**: Períodos de exercício do mandato
- **`senadores/{senadorId}/cargos`**: Cargos ocupados pelo senador
- **`senadores/{senadorId}/participacoesComissoes`**: Participações em comissões
- **`senadores/{senadorId}/filiacoes`**: Histórico de filiações partidárias
- **`senadores/{senadorId}/licencas`**: Licenças do senador
- **`senadores/{senadorId}/liderancas`**: Cargos de liderança

## Detalhamento das Entidades

### Senador

```json
senadores/{senadorId}/
  - codigo: "6358"
  - nome: "Ana Paula Lobato"
  - nomeCompleto: "Ana Paula Dias Lobato Nova Alves"
  - genero: "Feminino"
  - foto: "http://www.senado.leg.br/senadores/img/fotos-oficiais/senador6358.jpg"
  - paginaOficial: "http://www25.senado.leg.br/web/senadores/senador/-/perfil/6358"
  - paginaParticular: ""
  - email: "sen.anapaulalobato@senado.leg.br"
  - partido: { sigla: "PDT", nome: "Partido Democrático Trabalhista" }
  - uf: "MA"
  - telefones: [{ numero: "(61) 3303-2967", tipo: "Telefone" }]
  - situacaoAtual: {
      emExercicio: true,
      afastado: false,
      titular: false,
      suplente: true,
      cargoMesa: false,
      cargoLideranca: false,
      motivoAfastamento: null
    }
  - dadosPessoais: {
      dataNascimento: "1984-05-11",
      naturalidade: "Pinheiro",
      ufNaturalidade: "MA",
      enderecoParlamentar: "Senado Federal Anexo 1  16º Pavimento  "
    }
  - mandatoAtualId: "602"
  - metadados: {
      origem: "API Senado Federal - Perfil Parlamentar",
      versaoEstrutura: "2.0",
      ultimaAtualizacao: "2025-05-18T23:09:59.815Z",
      processadoPor: "processar_perfilsenadores.ts"
    }
```

### Mandato

```json
senadores/{senadorId}/mandatos/{mandatoId}/
  - id: "602"
  - codigo: "602"
  - participacao: "1º Suplente"
  - legislatura: "57"
  - dataInicio: "2023-02-01"
  - dataFim: null
  - uf: "MA"
  - titularId: "4605"
  - suplentesIds: ["6359"]
  - primeiraLegislatura: {
      numero: "57",
      dataInicio: "2023-02-01",
      dataFim: "2027-01-31"
    }
  - segundaLegislatura: {
      numero: "58",
      dataInicio: "2027-02-01",
      dataFim: "2031-01-31"
    }
  - metadados: {
      origem: "API Senado Federal - Mandatos",
      versaoEstrutura: "2.0",
      ultimaAtualizacao: "2025-05-18T23:09:59.815Z",
      processadoPor: "processar_perfilsenadores.ts"
    }
```

### Exercício

```json
senadores/{senadorId}/mandatos/{mandatoId}/exercicios/{exercicioId}/
  - id: "3057"
  - codigo: "3057"
  - dataInicio: "2024-02-21"
  - dataFim: null
  - causaAfastamento: null
  - descricaoCausaAfastamento: null
  - metadados: {
      origem: "API Senado Federal - Exercícios",
      versaoEstrutura: "2.0",
      ultimaAtualizacao: "2025-05-18T23:09:59.815Z",
      processadoPor: "processar_perfilsenadores.ts"
    }
```

### Comissão

```json
comissoes/{comissaoId}/
  - codigo: "2453"
  - sigla: "FPRNE"
  - nome: "Frente Parlamentar de Recursos Naturais e Energia"
  - casa: "CN"
  - metadados: {
      origem: "API Senado Federal - Comissões",
      versaoEstrutura: "2.0",
      ultimaAtualizacao: "2025-05-18T23:09:59.815Z",
      processadoPor: "processar_perfilsenadores.ts"
    }
```

### Cargo

```json
senadores/{senadorId}/cargos/{cargoId}/
  - id: "uuid-gerado"
  - tipo: {
      codigo: "244",
      descricao: "Vice-Presidente pelo Senado Federal"
    }
  - comissaoId: "2453"
  - dataInicio: "2025-03-18"
  - dataFim: null
  - atual: true
  - metadados: {
      origem: "API Senado Federal - Cargos",
      versaoEstrutura: "2.0",
      ultimaAtualizacao: "2025-05-18T23:09:59.815Z",
      processadoPor: "processar_perfilsenadores.ts"
    }
```

### Participação em Comissão

```json
senadores/{senadorId}/participacoesComissoes/{participacaoId}/
  - id: "uuid-gerado"
  - comissaoId: "2453"
  - participacao: "Titular"
  - dataInicio: "2023-08-30"
  - dataFim: null
  - atual: true
  - metadados: {
      origem: "API Senado Federal - Participações em Comissões",
      versaoEstrutura: "2.0",
      ultimaAtualizacao: "2025-05-18T23:09:59.815Z",
      processadoPor: "processar_perfilsenadores.ts"
    }
```

### Filiação Partidária

```json
senadores/{senadorId}/filiacoes/{filiacaoId}/
  - id: "uuid-gerado"
  - partido: {
      codigo: "20",
      sigla: "PDT",
      nome: "Partido Democrático Trabalhista"
    }
  - dataFiliacao: "2024-04-24"
  - dataDesfiliacao: null
  - atual: true
  - metadados: {
      origem: "API Senado Federal - Filiações Partidárias",
      versaoEstrutura: "2.0",
      ultimaAtualizacao: "2025-05-18T23:09:59.815Z",
      processadoPor: "processar_perfilsenadores.ts"
    }
```

### Licença

```json
senadores/{senadorId}/licencas/{licencaId}/
  - id: "uuid-gerado"
  - codigo: "23437"
  - tipo: {
      sigla: "LICENCA_ATIVIDADE_PARLAMENTAR",
      descricao: "Missão política ou cultural de interesse parlamentar"
    }
  - dataInicio: "2025-04-28"
  - dataFim: "2025-04-30"
  - atual: false
  - metadados: {
      origem: "API Senado Federal - Licenças",
      versaoEstrutura: "2.0",
      ultimaAtualizacao: "2025-05-18T23:09:59.815Z",
      processadoPor: "processar_perfilsenadores.ts"
    }
```

### Liderança

```json
senadores/{senadorId}/liderancas/{liderancaId}/
  - id: "uuid-gerado"
  - codigo: 17704
  - casa: "CN"
  - tipoUnidade: {
      codigo: 19,
      sigla: "P",
      descricao: "Liderança de Partido na CMO"
    }
  - tipoLideranca: {
      codigo: "L",
      sigla: "L",
      descricao: "Líder do Congresso Nacional"
    }
  - dataDesignacao: "2025-04-29"
  - dataTermino: null
  - atual: true
  - partido: {
      codigo: 20,
      sigla: "PDT",
      nome: "Partido Democrático Trabalhista"
    }
  - metadados: {
      origem: "API Senado Federal - Lideranças",
      versaoEstrutura: "2.0",
      ultimaAtualizacao: "2025-05-18T23:09:59.815Z",
      processadoPor: "processar_perfilsenadores.ts"
    }
```

## Índices Recomendados

Para otimizar as consultas mais comuns, recomenda-se criar os seguintes índices compostos:

1. `senadores` - `uf` ASC, `nome` ASC
2. `senadores` - `partido.sigla` ASC, `nome` ASC
3. `senadores/{senadorId}/mandatos` - `atual` DESC, `dataInicio` DESC
4. `senadores/{senadorId}/cargos` - `atual` DESC, `dataInicio` DESC
5. `senadores/{senadorId}/participacoesComissoes` - `atual` DESC, `dataInicio` DESC
6. `comissoes` - `casa` ASC, `sigla` ASC

## Consultas Comuns

### Senadores por UF
```javascript
db.collection('senadores').where('uf', '==', 'MA').orderBy('nome').get();
```

### Senadores por Partido
```javascript
db.collection('senadores').where('partido.sigla', '==', 'PDT').orderBy('nome').get();
```

### Comissões de um Senador
```javascript
db.collection('senadores').doc('6358').collection('participacoesComissoes')
  .where('atual', '==', true).get();
```

### Mandato Atual de um Senador
```javascript
db.collection('senadores').doc('6358').collection('mandatos')
  .where('codigo', '==', db.collection('senadores').doc('6358').get().data().mandatoAtualId)
  .get();
```

## Vantagens da Nova Estrutura

1. **Consultas Eficientes**: Estrutura otimizada para as consultas mais comuns
2. **Redução de Redundância**: Dados normalizados reduzem duplicação
3. **Manutenção Simplificada**: Alterações em uma entidade não afetam outras
4. **Escalabilidade**: Estrutura preparada para crescimento do volume de dados
5. **Documentação Clara**: Metadados padronizados facilitam entendimento
6. **Flexibilidade**: Facilita adição de novos tipos de dados no futuro
