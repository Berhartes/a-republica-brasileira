# Scripts ETL para API do Senado Federal

Este projeto implementa scripts para extração, transformação e carregamento (ETL) de dados da API do Senado Federal.

## Nova Estrutura Normalizada (v2.0)

A partir da versão 2.0, o sistema utiliza uma estrutura normalizada de dados no Firestore, seguindo boas práticas de modelagem para bancos de dados NoSQL. A nova estrutura:

- Reduz a redundância de dados
- Melhora a eficiência das consultas
- Facilita a manutenção e evolução do sistema
- Padroniza a nomenclatura e os metadados

Para detalhes completos sobre a nova estrutura, consulte a [documentação da estrutura do Firestore](./docs/estrutura_firestore.md).

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
├── carregamento/                  # Módulos para carregar dados no Firestore
│   ├── carregador_normalizado.ts  # Carregador para a nova estrutura
│   ├── blocos.ts                  # Carrega dados de blocos parlamentares
│   ├── senadores.ts               # Carrega dados de senadores
│   ├── perfilsenadores.ts         # Carrega perfis completos
│   ├── discursos.ts               # Carrega discursos e apartes
│   ├── votacoes.ts                # Carrega votações
│   └── materias.ts                # Carrega matérias legislativas
│
├── docs/                          # Documentação
│   └── estrutura_firestore.md     # Documentação da estrutura do Firestore
│
├── extracao/                      # Módulos para extrair dados da API
│   ├── blocos.ts                  # Extrai dados de blocos parlamentares
│   ├── senadores.ts               # Extrai dados de senadores em exercício
│   ├── perfilsenadores.ts         # Extrai perfis completos de senadores
│   ├── discursos.ts               # Extrai discursos e apartes
│   ├── votacoes.ts                # Extrai votações
│   └── materias.ts                # Extrai matérias legislativas
│
├── models/                        # Definições de tipos e interfaces
│   └── estrutura_normalizada.ts   # Interfaces para a nova estrutura
│
├── scripts/                       # Scripts executáveis
│   ├── executar_migracao.js       # Interface interativa para migração
│   ├── migrar_estrutura_senadores.ts  # Script de migração
│   ├── processar_blocos.ts        # Script para processar blocos
│   ├── processar_senadores.ts     # Script para processar senadores
│   ├── processar_perfilsenadores.ts   # Script original para perfis
│   ├── processar_perfilsenadores_normalizado.ts  # Script para nova estrutura
│   ├── processar_discursos.ts     # Script para processar discursos
│   ├── processar_votacoes.ts      # Script para processar votações
│   ├── processar_senadomateria.ts # Script para processar matérias
│   └── testar_legislatura.ts      # Script para testar legislatura
│
├── transformacao/                 # Módulos para transformar dados
│   ├── normalizador.ts            # Transformador para a nova estrutura
│   ├── blocos.ts                  # Transforma dados de blocos parlamentares
│   ├── senadores.ts               # Transforma dados de senadores
│   ├── perfilsenadores.ts         # Transforma perfis completos
│   ├── discursos.ts               # Transforma discursos e apartes
│   ├── votacoes.ts                # Transforma votações
│   └── materias.ts                # Transforma matérias legislativas
│
├── utils/                         # Utilitários diversos
│   ├── api.ts                     # Utilitário para requisições à API
│   ├── error_handler.ts           # Tratamento centralizado de erros
│   ├── firestore.ts               # Utilitários para o Firestore
│   ├── logger.ts                  # Sistema de logs
│   ├── legislatura.ts             # Utilitário para obter legislatura atual
│   └── file_exporter.ts           # Utilitário para exportar arquivos
│
├── config/                        # Configurações
│   └── endpoints.ts               # Configuração de endpoints da API
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

## Processamento com Estrutura Normalizada

### Processamento de Perfis de Senadores (Nova Estrutura)

Para executar o processamento de perfis de senadores com a nova estrutura normalizada:

```bash
# Processar legislatura atual
npx ts-node -P tsconfig.scripts.json scripts/processar_perfilsenadores_normalizado.ts

# Processar legislatura específica
npx ts-node -P tsconfig.scripts.json scripts/processar_perfilsenadores_normalizado.ts --legislatura=57

# Limitar o número de senadores processados
npx ts-node -P tsconfig.scripts.json scripts/processar_perfilsenadores_normalizado.ts --limite=10

# Exportar para o PC em vez de salvar no Firestore
npx ts-node -P tsconfig.scripts.json scripts/processar_perfilsenadores_normalizado.ts --pc=true

# Processar múltiplas legislaturas
npx ts-node -P tsconfig.scripts.json scripts/processar_perfilsenadores_normalizado.ts --multiplas --legislaturas=55,56,57
```

### Migração da Estrutura Antiga para a Nova

```bash
# Executar migração interativa (recomendado)
node scripts/executar_migracao.js

# Executar migração diretamente
npx ts-node -P tsconfig.scripts.json scripts/migrar_estrutura_senadores.ts

# Executar em modo de simulação (sem alterar o Firestore)
npx ts-node -P tsconfig.scripts.json scripts/migrar_estrutura_senadores.ts --simulacao=true

# Exportar dados normalizados para o PC
npx ts-node -P tsconfig.scripts.json scripts/migrar_estrutura_senadores.ts --exportar=true

# Limitar o número de senadores migrados
npx ts-node -P tsconfig.scripts.json scripts/migrar_estrutura_senadores.ts --limite=10

# Remover dados da estrutura antiga após a migração
npx ts-node -P tsconfig.scripts.json scripts/migrar_estrutura_senadores.ts --remover=true
```

## Plano de Migração

A migração para a nova estrutura normalizada deve seguir estas etapas:

1. **Backup**: Fazer backup completo dos dados existentes
2. **Simulação**: Executar a migração em modo de simulação para validar o processo
3. **Exportação**: Exportar os dados normalizados para o PC para inspeção
4. **Migração Parcial**: Migrar um subconjunto de senadores e validar os resultados
5. **Migração Completa**: Migrar todos os senadores para a nova estrutura
6. **Validação**: Verificar a integridade e consistência dos dados migrados
7. **Atualização da Aplicação**: Atualizar a aplicação para usar a nova estrutura
8. **Período de Transição**: Manter ambas as estruturas por 30 dias
9. **Remoção da Estrutura Antiga**: Após o período de transição, remover a estrutura antiga

## Consultas Comuns na Nova Estrutura

### Obter Dados Básicos de um Senador

```javascript
const senadorRef = db.collection('senadores').doc('6358');
const senador = await senadorRef.get();
console.log(senador.data());
```

### Obter Mandatos de um Senador

```javascript
const mandatosRef = db.collection('senadores').doc('6358').collection('mandatos');
const mandatos = await mandatosRef.get();
mandatos.forEach(doc => console.log(doc.data()));
```

### Obter Comissões Atuais de um Senador

```javascript
const participacoesRef = db.collection('senadores').doc('6358').collection('participacoesComissoes');
const participacoesAtuais = await participacoesRef.where('atual', '==', true).get();

// Para cada participação, buscar os dados da comissão
for (const doc of participacoesAtuais.docs) {
  const participacao = doc.data();
  const comissaoRef = db.collection('comissoes').doc(participacao.comissaoId);
  const comissao = await comissaoRef.get();
  console.log({
    participacao: participacao.participacao,
    comissao: comissao.data()
  });
}
```

## Próximos Passos

1. Implementar extração de outros tipos de dados:
   - Comissões
   - Mesa diretora
   - Votações

2. Configurar conexão real com Firestore

3. Implementar sistema de detecção de mudanças

4. Atualizar os outros scripts (discursos, votações, matérias) para usar a nova estrutura normalizada
