# Refatoração Completa para Tailwind CSS - A República Brasileira Atual

## Objetivo
Refatorar completamente o projeto "A República Brasileira Atual" para utilizar exclusivamente Tailwind CSS, eliminando todos os arquivos CSS customizados e implementando um sistema de design consistente e manutenível baseado em utilitários.

## Motivação
- Eliminar a complexidade de múltiplos sistemas de estilização
- Melhorar a performance removendo CSS desnecessário
- Facilitar a manutenção com um único sistema de design
- Garantir consistência visual em todo o projeto
- Simplificar o desenvolvimento com classes utilitárias

## Estado Atual
Arquivos a serem removidos após a refatoração:
```
src/styles/base/colors.css
src/styles/components/dashboard-card.css
src/styles/main.css
public/styles/main.css
src/shared/styles/* (exceto index.css com imports do Tailwind)
```

## Plano de Refatoração Detalhado

### 1. Configuração do Tailwind
Arquivo: `config/tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
  darkMode: ["class"],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        // Cores do Congresso
        congress: {
          primary: '#0077cc',
          secondary: '#60a5fa',
          accent: '#bfdbfe',
          dark: '#3b82f6'
        },
        // Cores da Assembleia
        assembly: {
          primary: '#087f5b',
          secondary: '#34d399',
          accent: '#a7f3d0',
          dark: '#10b981'
        },
        // Cores do Governo
        government: {
          primary: '#e63946',
          secondary: '#f87171',
          accent: '#fecaca',
          dark: '#ef4444'
        }
      },
      // Outras extensões do tema...
    }
  },
  plugins: [
    tailwindcssAnimate,
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography')
  ],
} satisfies Config;
```

### 2. Refatoração dos Componentes

#### 2.1 DashboardCard
Arquivo: `src/domains/congresso/components/Dashboards/DashboardCard.tsx`

```typescript
interface DashboardCardProps {
  card: CardData;
  index: number;
  dashboardKey: string;
  onClick: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  card,
  dashboardKey,
  onClick
}) => {
  const getVariantClasses = () => {
    if (dashboardKey.startsWith('cg-')) {
      return 'bg-congress-primary hover:bg-congress-dark border-l-4 border-congress-secondary';
    }
    if (dashboardKey.startsWith('ale-')) {
      return 'bg-assembly-primary hover:bg-assembly-dark border-l-4 border-assembly-secondary';
    }
    return 'bg-government-primary hover:bg-government-dark border-l-4 border-government-secondary';
  };

  return (
    <div 
      className={`
        p-5 rounded-xl cursor-pointer
        transition-all duration-300 
        hover:-translate-y-1 hover:shadow-xl
        ${getVariantClasses()}
      `}
      onClick={onClick}
    >
      {/* Conteúdo do card */}
    </div>
  );
};
```

#### 2.2 Layout Principal
Arquivo: `src/app/layouts/app/AppLayout.tsx`

```typescript
const AppLayout: React.FC = ({ children }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <header className="bg-congress-primary dark:bg-congress-dark">
        {/* Header content */}
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};
```

### 3. Páginas Principais

#### 3.1 HomePage
Arquivo: `src/domains/congresso/pages/HomePage.tsx`

```typescript
const HomePage: React.FC = () => {
  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dashboard cards */}
      </section>
    </div>
  );
};
```

#### 3.2 SenadoPage
Arquivo: `src/domains/congresso/pages/SenadoPage.tsx`

```typescript
const SenadoPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Senado Federal
      </h1>
      {/* Conteúdo */}
    </div>
  );
};
```

### 4. Componentes de UI Comuns

#### 4.1 Botões
Arquivo: `src/shared/components/Button.tsx`

```typescript
const Button: React.FC<ButtonProps> = ({ variant = 'primary', ...props }) => {
  const variants = {
    primary: 'bg-congress-primary hover:bg-congress-dark text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  };

  return (
    <button
      className={`
        px-4 py-2 rounded-lg
        transition-colors duration-200
        focus:outline-none focus:ring-2
        ${variants[variant]}
      `}
      {...props}
    />
  );
};
```

### 5. Utilitários e Helpers

#### 5.1 Classes Comuns
Arquivo: `src/shared/styles/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .card-base {
    @apply p-5 rounded-xl shadow-lg hover:-translate-y-1 transition-all duration-300;
  }

  .input-base {
    @apply px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-congress-primary focus:border-transparent;
  }
}
```

### 6. Ordem de Execução

1. Backup do projeto atual
2. Atualizar `tailwind.config.ts`
3. Remover arquivos CSS customizados
4. Refatorar componentes na seguinte ordem:
   - DashboardCard
   - AppLayout
   - Componentes de UI comuns
   - Páginas principais
5. Implementar dark mode
6. Testar responsividade
7. Otimizar bundle

### 7. Testes e Verificações

Para cada componente refatorado, verificar:
- Aparência visual em light/dark mode
- Responsividade em todos os breakpoints
- Animações e transições
- Acessibilidade (contraste, foco, etc.)
- Performance (bundle size, tempo de carregamento)

### 8. Comandos Úteis

```bash
# Instalar dependências necessárias
npm install -D @tailwindcss/forms @tailwindcss/typography

# Gerar CSS otimizado
npm run build

# Verificar bundle size
npm run analyze
```

## Notas Importantes

1. Mantenha consistência nas classes:
   - Use prefixos de breakpoint consistentes (sm, md, lg, xl)
   - Mantenha ordem lógica nas classes (layout -> spacing -> colors -> states)

2. Dark Mode:
   - Use sempre classes `dark:` para variantes escuras
   - Teste todas as combinações de cores

3. Performance:
   - Evite classes desnecessárias
   - Use @apply apenas quando necessário
   - Mantenha o bundle size otimizado

4. Acessibilidade:
   - Mantenha contraste adequado
   - Use atributos ARIA quando necessário
   - Teste com leitores de tela

## Conclusão

Esta refatoração visa criar uma base sólida e manutenível usando Tailwind CSS. Siga este guia passo a passo, testando cada componente após a refatoração. Em caso de dúvidas, consulte a [documentação oficial do Tailwind](https://tailwindcss.com/docs).

Para começar a implementação, toggle para Act mode e siga cada passo deste guia metodicamente.
