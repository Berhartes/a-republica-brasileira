# Domínio: Congresso Nacional

Este domínio contém toda a lógica relacionada ao Congresso Nacional, incluindo Senado Federal e Câmara dos Deputados.

## Estrutura

```
congresso-nacional/
├── senado/                # Subdomínio do Senado Federal
│   ├── components/       # Componentes específicos do Senado
│   ├── hooks/           # Hooks customizados
│   ├── services/        # Serviços e APIs
│   └── types/           # Tipos e interfaces
├── camara/               # Subdomínio da Câmara dos Deputados
│   ├── components/       # Componentes específicos da Câmara
│   ├── hooks/           # Hooks customizados
│   ├── services/        # Serviços e APIs
│   └── types/           # Tipos e interfaces
└── shared/              # Código compartilhado entre os domínios
```

## Uso

### Importação de Componentes

```typescript
// Importar componentes específicos
import { SenadorCard } from '@/domains/congresso-nacional/senado';
import { DeputadoCard } from '@/domains/congresso-nacional/camara';

// Importar hooks
import { useSenadores, useVotacoes } from '@/domains/congresso-nacional/senado';
import { useDeputados, useProposicoes } from '@/domains/congresso-nacional/camara';
```

### Utilitários Compartilhados

```typescript
import { 
  formatarNomeParlamentar,
  formatarSiglaPartido,
  formatarEstado,
  CASAS
} from '@/domains/congresso-nacional';

// Exemplo de uso
const nome = formatarNomeParlamentar('JOÃO SILVA');  // "João Silva"
const partido = formatarSiglaPartido('pt');          // "PT"
const estado = formatarEstado('sp');                 // "SP"
```

## APIs

### Senado Federal
- Base URL: `https://legis.senado.leg.br/dadosabertos/`
- Documentação: [Link para documentação]
- Autenticação: Não requerida

### Câmara dos Deputados
- Base URL: `https://dadosabertos.camara.leg.br/api/v2/`
- Documentação: [Link para documentação]
- Autenticação: Não requerida

## Tipos Compartilhados

```typescript
interface Parlamentar {
  id: string;
  nome: string;
  partido: string;
  estado: string;
}

interface Votacao {
  id: string;
  data: string;
  resultado: string;
}

interface Casa {
  SENADO: 'senado';
  CAMARA: 'camara';
}
```

## Boas Práticas

1. **Organização**
   - Manter código específico em seu respectivo subdomínio
   - Usar tipos compartilhados quando possível
   - Seguir padrões de nomenclatura

2. **Performance**
   - Implementar cache de dados
   - Usar paginação quando necessário
   - Otimizar chamadas à API

3. **Manutenção**
   - Documentar alterações nas APIs
   - Manter testes atualizados
   - Seguir padrões de código

4. **Segurança**
   - Validar dados de entrada
   - Tratar erros adequadamente
   - Seguir boas práticas de LGPD

## Contribuição

1. Criar branch específica para alterações
2. Seguir padrões de código estabelecidos
3. Incluir testes para novas funcionalidades
4. Atualizar documentação quando necessário
