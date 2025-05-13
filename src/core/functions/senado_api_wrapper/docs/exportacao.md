# Funcionalidades de Exportação de Perfis de Senadores

Este documento descreve as funcionalidades de exportação integradas ao módulo de extração de perfis de senadores, permitindo automatizar o processo completo de ETL (Extração, Transformação e Carregamento) com exportação para múltiplos formatos.

## Visão Geral

O processo de exportação foi integrado ao fluxo de ETL existente para criar uma solução completa que:

1. Extrai dados reais da API do Senado Federal
2. Transforma os dados para um formato estruturado
3. Carrega os dados (simulado para o Firestore)
4. Exporta os dados em diferentes formatos (JSON, CSV)
5. Gera estatísticas de qualidade dos dados

## Comandos de Exportação

Os seguintes comandos estão disponíveis:

```bash
# Extração + exportação básica (formatos padrão)
npm run process:perfilsenadores -- 55 --exportar

# Extração + exportação com configurações específicas
npm run process:perfilsenadores:full -- 55 
npm run process:perfilsenadores:csv -- 55
npm run process:perfilsenadores:json -- 55
npm run process:perfilsenadores:compressed -- 55

# Demonstração completa do processo integrado
npm run demo:perfilsenadores:integrado
```

## Opções de Linha de Comando

O script principal suporta as seguintes opções:

| Opção | Abreviação | Descrição |
|-------|------------|-----------|
| `--exportar` | `-e` | Ativa o módulo de exportação avançada |
| `--formato [tipo]` | `-f` | Define o formato de exportação: `json`, `csv` ou `ambos` |
| `--comprimir` | `-c` | Ativa a compressão gzip dos arquivos |
| `--detalhamento [nivel]` | `-d` | Nível de detalhamento: `completo`, `resumido` ou `ambos` |
| `--caminho [pasta]` | `-p` | Pasta base para armazenar os arquivos exportados |
| `--limite [numero]` | `-l` | Limita o número de senadores processados (útil para testes rápidos) |

### Exemplos de Uso:

```bash
# Exportar em todos os formatos sem compressão
npm run process:perfilsenadores -- 55 --exportar

# Exportar apenas em CSV com compressão
npm run process:perfilsenadores -- 55 --exportar --formato csv --comprimir

# Exportar apenas dados resumidos em JSON
npm run process:perfilsenadores -- 55 --exportar --formato json --detalhamento resumido

# Exportar para uma pasta específica
npm run process:perfilsenadores -- 55 --exportar --caminho meus_dados

# Processar apenas 20 senadores para teste rápido
npm run process:perfilsenadores -- 55 --exportar --limite 20
```

## Estrutura de Diretórios

Os arquivos exportados seguem a seguinte estrutura:

```
dados_extraidos/
└── [caminho_base]/
    └── senadores/
        └── legislatura_[numero]/
            └── [data_extracao]/
                ├── perfis/
                │   ├── perfis_completos.json
                │   ├── perfis_completos.csv
                │   ├── perfis_resumidos.json
                │   └── perfis_resumidos.csv
                └── estatisticas/
                    ├── completude.json
                    ├── consistencia.json
                    └── resumo.json
```

## Estatísticas de Qualidade

O módulo gera automaticamente três tipos de estatísticas:

1. **Completude**: Avalia quais campos estão preenchidos e calcula a porcentagem de completude
2. **Consistência**: Verifica se os tipos de dados estão corretos e se as datas são coerentes
3. **Resumo Geral**: Fornece informações sobre a distribuição por estado, partido, gênero, etc.

## Integrando em Aplicações

Para integrar o módulo em suas próprias aplicações, utilize o seguinte código:

```typescript
import { processarPerfilSenadoresComExportacao } from './scripts/processar_perfilsenadores_export';

// Configurar opções
const opcoes = {
  legislatura: 55,
  exportar: true,
  opcoesExportacao: {
    formato: 'ambos',
    comprimir: true,
    nivelDetalhamento: 'ambos',
    caminhoBase: 'minha_pasta'
  }
};

// Executar o processamento
await processarPerfilSenadoresComExportacao(opcoes);
```

## Testes Rápidos

Para executar testes mais rápidos com um subconjunto limitado de senadores, foram adicionados os seguintes comandos:

```bash
# Teste com 20 senadores (formatos JSON e CSV)
npm run test:perfilsenadores:quick

# Teste apenas com formato CSV 
npm run test:perfilsenadores:csv

# Teste apenas com formato JSON
npm run test:perfilsenadores:json

# Executa um script de demonstração completo
npm run test:perfilsenadores:demo
```

Estes comandos processam apenas 20 senadores, mas executam todas as etapas do pipeline completo, incluindo exportação e análise de qualidade dos dados.

## Próximos Passos

Possíveis melhorias para futuras versões:

- Adicionar exportação para outros formatos (XLS, XML)
- Implementar visualizações automáticas dos dados
- Criar filtros para exportar subconjuntos específicos de dados
- Adicionar validação de dados mais avançada
