/**
 * Arquivo unificado de componentes auxiliares para os dashboards
 * Contém: DashboardCard, DashboardHeader, TabSelector, CardDetailView, ErrorMessage
 */
import { useState } from 'react';
import { CardData, DashboardConfig } from './dashboardConfig';

// ============= DashboardCard =============
interface DashboardCardProps {
  card: CardData;
  index: number;
  dashboardKey: string;
  onClick: () => void;
  isDarkMode?: boolean;
}

export const DashboardCard = ({
  card,
  index,
  dashboardKey,
  onClick,
  isDarkMode = false
}: DashboardCardProps) => {
  // Determinar o ícone específico para cada tipo de card
  const getCardIcon = () => {
    const title = card.title.toLowerCase();

    if (title.includes('deputado')) return 'fas fa-user-tie';
    if (title.includes('senador')) return 'fas fa-user-tie';
    if (title.includes('governador')) return 'fas fa-user-tie';
    if (title.includes('presidente')) return 'fas fa-user-tie';
    if (title.includes('população')) return 'fas fa-users';
    if (title.includes('municípios')) return 'fas fa-map-marked-alt';
    if (title.includes('área')) return 'fas fa-map';
    if (title.includes('pib')) return 'fas fa-chart-line';
    if (title.includes('orçamento')) return 'fas fa-money-bill-wave';
    if (title.includes('projetos')) return 'fas fa-file-alt';
    if (title.includes('comissões')) return 'fas fa-briefcase';

    return card.icon || 'fas fa-info-circle';
  };

  // Determinar as classes de estilo com base no tipo de dashboard
  const getVariantClasses = () => {
    if (dashboardKey.startsWith('cg-')) {
      return isDarkMode
        ? 'border-blue-800 shadow-blue-900/20'
        : 'border-blue-200 shadow-blue-500/10';
    }

    if (dashboardKey.startsWith('ale-')) {
      return isDarkMode
        ? 'border-green-800 shadow-green-900/20'
        : 'border-green-200 shadow-green-500/10';
    }

    if (dashboardKey.startsWith('gov-')) {
      return isDarkMode
        ? 'border-amber-800 shadow-amber-900/20'
        : 'border-amber-200 shadow-amber-500/10';
    }

    return '';
  };

  return (
    <div
      className={`
        p-3 rounded-lg cursor-pointer
        transition-all duration-300
        hover:-translate-y-1 hover:shadow-lg
        flex flex-row items-center justify-between
        bg-white bg-opacity-10 backdrop-blur-sm
        ${getVariantClasses()}
      `}
      onClick={onClick}
      role="button"
      aria-labelledby={`card-title-${card.title.replace(/\s+/g, '-')}`}
      tabIndex={0}
      aria-describedby={`card-desc-${card.title.replace(/\s+/g, '-')}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      <div className="flex items-center space-x-4">
        <i className={`${getCardIcon()} text-xl text-white`}></i>
        <div>
          <h3
            id={`card-title-${card.title.replace(/\s+/g, '-')}`}
            className="text-lg font-bold text-white"
          >
            {card.title}
          </h3>
          <p
            id={`card-desc-${card.title.replace(/\s+/g, '-')}`}
            className="text-sm text-white text-opacity-80"
          >
            {card.description}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-2xl font-bold text-white">{card.value}</span>
        <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-20 text-white">
          {card.badge}
        </span>
      </div>
    </div>
  );
};

// ============= DashboardHeader =============
interface DashboardHeaderProps {
  config: DashboardConfig;
  isExpanded: boolean;
  onToggleExpand: () => void;
  dashboardKey: string;
  isDarkMode?: boolean;
  selectedCard?: { index: number } | null;
}

export const DashboardHeader = ({
  config,
  isExpanded,
  onToggleExpand,
  dashboardKey,
  isDarkMode = false,
  selectedCard = null
}: DashboardHeaderProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // Função para obter o ícone com base no tipo de dashboard
  const getIcon = () => {
    if (dashboardKey.startsWith('cg-')) {
      return 'fas fa-university';
    } else if (dashboardKey.startsWith('ale-')) {
      return 'fas fa-landmark';
    } else if (dashboardKey.startsWith('gov-')) {
      return 'fas fa-building';
    }
    return 'fas fa-chart-bar';
  };

  // Determinar o título e subtítulo a serem exibidos
  const getHeaderContent = () => {
    // Se houver um card selecionado, exibir o título e descrição do card
    if (selectedCard !== null && config.dadosCartoes[selectedCard.index]) {
      const card = config.dadosCartoes[selectedCard.index];
      return {
        title: card.title,
        subtitle: card.description || '',
        icon: card.icon
      };
    }

    // Caso contrário, exibir o título e subtítulo padrão do dashboard
    return {
      title: config.title,
      subtitle: config.subtitle,
      icon: getIcon()
    };
  };

  const headerContent = getHeaderContent();

  return (
    <div
      className={`
        relative rounded-t-xl overflow-hidden cursor-pointer
        transition-all duration-300 shadow-lg
      `}
      style={{
        backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
        transition: 'all 0.3s ease',
      }}
      onClick={onToggleExpand}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      aria-expanded={isExpanded}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onToggleExpand();
        }
      }}
    >
      <div className="p-6 sm:p-8">
        <div className="flex justify-between items-center">
          <div className="flex items-start">
            <div className="text-white text-3xl mr-4">
              {dashboardKey.startsWith('cg-') ? (
                <i className="fas fa-university"></i>
              ) : dashboardKey.startsWith('ale-') ? (
                <i className="fas fa-landmark"></i>
              ) : (
                <i className="fas fa-building"></i>
              )}
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl text-white font-bold mb-2">{headerContent.title}</h2>
              <p className="text-cyan-200 text-sm sm:text-base flex items-center gap-1">
                <i className="fas fa-anchor text-sm"></i>
                <span>{headerContent.subtitle}</span>
              </p>
            </div>
          </div>
          <div className="text-white">
            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-2xl transition-transform duration-300`}></i>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============= TabSelector =============
interface TabSelectorProps {
  dashboardKey: string;
  dashConfig: DashboardConfig;
  selectedIndex: number;
  onSelectTab: (dashboardKey: string, index: number) => void;
  isDarkMode?: boolean;
}

export const TabSelector = ({
  dashboardKey,
  dashConfig,
  selectedIndex,
  onSelectTab,
  isDarkMode = false
}: TabSelectorProps) => {
  return (
    <div className="flex flex-wrap gap-2 p-2 bg-black bg-opacity-50 rounded-lg">
      {dashConfig.dadosCartoes.map((card, index) => (
        <button
          key={`tab-${index}`}
          className={`
            px-3 py-1 rounded-full text-sm font-medium
            transition-all duration-300
            ${selectedIndex === index
              ? 'bg-white text-gray-900 shadow-lg transform -translate-y-1'
              : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'}
          `}
          onClick={(e) => {
            e.stopPropagation();
            onSelectTab(dashboardKey, index);
          }}
        >
          {card.title}
        </button>
      ))}
    </div>
  );
};

// ============= CardDetailView =============
interface CardDetailViewProps {
  config: DashboardConfig;
  cardIndex: number;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const CardDetailView = ({
  config,
  cardIndex,
  onClose,
  isDarkMode = false
}: CardDetailViewProps) => {
  // Obter o card selecionado
  const card = config.dadosCartoes[cardIndex];

  if (!card) {
    return (
      <div className="p-4 text-white">
        <p>Card não encontrado.</p>
        <button
          className="mt-4 px-4 py-2 bg-white bg-opacity-20 rounded-lg"
          onClick={onClose}
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 text-white">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center">
          <i className={`${card.icon} text-3xl mr-4`}></i>
          <div>
            <h2 className="text-3xl font-bold">{card.title}</h2>
            <p className="text-lg text-white text-opacity-80">{card.description}</p>
          </div>
        </div>
        <button
          className="text-white text-opacity-80 hover:text-opacity-100 text-2xl"
          onClick={onClose}
          aria-label="Fechar"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="mb-6">
        <div className="text-6xl font-bold mb-2">{card.value}</div>
        <div className="inline-block px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
          {card.badge}
        </div>
      </div>

      <div
        className="mb-8 prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: card.content || '' }}
      />

      <div className="flex justify-end">
        <a
          href={card.link}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-medium py-2 px-4 rounded-lg inline-flex items-center"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Saiba mais</span>
          <i className="fas fa-external-link-alt ml-2"></i>
        </a>
      </div>
    </div>
  );
};

// ============= ErrorMessage =============
interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">Erro! </strong>
      <span className="block sm:inline">{message}</span>
    </div>
  );
};
