/**
 * Arquivo unificado de componentes auxiliares para os dashboards
 * Contém: DashboardCard, DashboardHeader, TabSelector, CardDetailView, ErrorMessage
 */
import { useState } from 'react';
import { CardData, DashboardConfig, getDashboardTextColors } from './dashboardConfig';
import { useDashboardStyle } from '../../contexts/DashboardStyleContext';

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
  const [isHovered, setIsHovered] = useState(false);
  const { style } = useDashboardStyle();



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

  // Determinar o estilo do card com base no tipo de dashboard, no estilo selecionado e no modo escuro
  const getCardStyle = () => {
    // Estilo 1: Branco/Escuro - muda com base no modo escuro
    if (style === 'colorido') {
      // Verificar se o modo escuro está ativado
      const isDarkModeActive = document.documentElement.classList.contains('dark');

      // Estilo base que muda com base no modo escuro
      let borderColor = isDarkModeActive ? '#334155' : '#e5e7eb'; // Padrão

      // Definir cores específicas para cada tipo de dashboard
      if (dashboardKey.startsWith('cg-')) {
        borderColor = isDarkModeActive ? '#1e40af' : '#93c5fd'; // Azul
      } else if (dashboardKey.startsWith('ale-')) {
        borderColor = isDarkModeActive ? '#065f46' : '#6ee7b7'; // Verde
      } else if (dashboardKey.startsWith('gov-')) {
        borderColor = isDarkModeActive ? '#991b1b' : '#fca5a5'; // Vermelho
      }

      const baseStyle = {
        backgroundColor: isDarkModeActive ? '#1e293b' : 'white', // Azul escuro no modo escuro, branco no modo claro
        borderRadius: '12px',
        boxShadow: isHovered ? '0 12px 24px rgba(0, 0, 0, 0.15)' : '0 8px 16px rgba(0, 0, 0, 0.1)',
        border: `1px solid ${borderColor}`, // Borda colorida de acordo com o tipo de dashboard
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-5px)' : 'translateY(0)'
      };

      // Adicionar estilos específicos com base no tipo de dashboard
      if (dashboardKey.startsWith('cg-')) {
        return {
          ...baseStyle,
          borderLeft: isHovered
            ? `4px solid ${isDarkModeActive ? '#38bdf8' : '#0077cc'}`
            : `4px solid ${isDarkModeActive ? '#0ea5e9' : '#60a5fa'}`
        };
      } else if (dashboardKey.startsWith('ale-')) {
        return {
          ...baseStyle,
          borderLeft: isHovered
            ? `4px solid ${isDarkModeActive ? '#10b981' : '#065f46'}`
            : `4px solid ${isDarkModeActive ? '#34d399' : '#34d399'}`
        };
      } else if (dashboardKey.startsWith('gov-')) {
        return {
          ...baseStyle,
          borderLeft: isHovered
            ? `4px solid ${isDarkModeActive ? '#f43f5e' : '#e63946'}`
            : `4px solid ${isDarkModeActive ? '#fb7185' : '#f87171'}`
        };
      } else {
        return baseStyle;
      }
    }
    // Estilo 2: Colorido (transparente) - não é afetado pelo modo escuro
    else {
      const baseStyle = {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        boxShadow: isHovered ? '0 12px 24px rgba(0, 0, 0, 0.15)' : '0 8px 16px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-5px)' : 'translateY(0)'
      };

      // Adicionar estilos específicos com base no tipo de dashboard
      if (dashboardKey.startsWith('cg-')) {
        return {
          ...baseStyle,
          borderLeft: isHovered ? '4px solid #00a8e8' : '4px solid rgba(255, 255, 255, 0.3)'
        };
      } else if (dashboardKey.startsWith('ale-')) {
        return {
          ...baseStyle,
          borderLeft: isHovered ? '4px solid #10b981' : '4px solid rgba(255, 255, 255, 0.3)'
        };
      } else if (dashboardKey.startsWith('gov-')) {
        return {
          ...baseStyle,
          borderLeft: isHovered ? '4px solid #ff4d6d' : '4px solid rgba(255, 255, 255, 0.3)'
        };
      } else {
        return baseStyle;
      }
    }
  };

  // Determinar as cores do texto com base no estilo e no modo escuro
  const getTextColorClasses = () => {
    // Verificar se o modo escuro está ativado
    const isDarkModeActive = document.documentElement.classList.contains('dark');

    if (style === 'colorido') {
      // Estilo 1: Branco/Escuro - muda com base no modo escuro
      // Obter as cores de texto padrão
      const textColors = getDashboardTextColors();

      // Selecionar as cores com base no modo (claro/escuro)
      const colors = isDarkModeActive ? textColors.dark : textColors.light;

      return {
        title: `text-xl font-bold ${colors.baseColor}`,
        description: `text-sm ${colors.descriptionColor} mb-2`,
        subtitle: `text-xs ${colors.subtitleColor}`,
        value: `text-3xl font-bold ${colors.baseColor} mb-1`,
        badge: `text-xs px-2 py-1 rounded-full ${colors.badgeBg} ${colors.badgeText}`,
        details: `text-xs ${colors.detailsColor} hover:${colors.baseColorHover} cursor-pointer inline-flex items-center`,
        icon: colors.baseColor // Usar a cor base para o ícone
      };
    } else {
      // Estilo 2: Colorido - não é afetado pelo modo escuro
      return {
        title: "text-xl font-bold text-white",
        description: "text-sm text-white text-opacity-80 mb-2",
        subtitle: "text-xs text-white text-opacity-70",
        value: "text-3xl font-bold text-white mb-1",
        badge: "text-xs px-2 py-1 rounded-full bg-white bg-opacity-20 text-white",
        details: "text-xs text-white text-opacity-70 hover:text-opacity-100 cursor-pointer inline-flex items-center",
        icon: "text-white" // Adicionado classe específica para o ícone
      };
    }
  };

  const textColors = getTextColorClasses();

  return (
    <div
      className="p-5 cursor-pointer transition-all duration-300"
      style={getCardStyle()}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <div className={`${textColors.icon} text-2xl mr-3`}>
            <i className={getCardIcon()}></i>
          </div>
          <h3
            id={`card-title-${card.title.replace(/\s+/g, '-')}`}
            className={textColors.title}
          >
            {card.title}
          </h3>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <p
            id={`card-desc-${card.title.replace(/\s+/g, '-')}`}
            className={textColors.description}
          >
            {card.description}
          </p>
          <p className={textColors.subtitle}>
            Próxima eleição: 2026
          </p>
        </div>

        <div className="flex flex-col items-end">
          <span className={textColors.value}>{card.value}</span>
          <span className={textColors.badge}>
            {card.badge}
          </span>
        </div>
      </div>

      <div className="mt-4 text-right">
        <span className={textColors.details}>
          Detalhes <i className="fas fa-arrow-right ml-1"></i>
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
  selectedCard = null
}: DashboardHeaderProps) => {
  // O estilo do header é sempre colorido, independente do estilo do dashboard

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

  // Obter o estilo do cabeçalho - sempre colorido em ambos os estilos
  const getHeaderStyle = () => {
    // Sempre usar o estilo colorido para o header, independente do estilo selecionado
    return {
      backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
      transition: 'all 0.3s ease',
    };
  };

  // Obter as cores do texto - sempre brancas para o header
  const getTextColors = () => {
    // Como o header sempre será colorido, as cores do texto sempre serão brancas
    return {
      title: "text-2xl sm:text-3xl lg:text-4xl text-white font-bold mb-2",
      subtitle: "text-cyan-200 text-sm sm:text-base",
      icon: "text-white text-3xl mr-4",
      chevron: "text-white"
    };
  };

  const textColors = getTextColors();

  return (
    <div
      className={`
        relative rounded-t-xl overflow-hidden cursor-pointer
        transition-all duration-300 shadow-lg
      `}
      style={getHeaderStyle()}
      onClick={onToggleExpand}
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
            <div className={textColors.icon}>
              {dashboardKey.startsWith('cg-') ? (
                <i className="fas fa-university"></i>
              ) : dashboardKey.startsWith('ale-') ? (
                <i className="fas fa-landmark"></i>
              ) : (
                <i className="fas fa-building"></i>
              )}
            </div>
            <div>
              <h2 className={textColors.title}>{headerContent.title}</h2>
              <p className={`${textColors.subtitle} flex items-center gap-1`}>
                <i className="fas fa-anchor text-sm"></i>
                <span>{headerContent.subtitle}</span>
              </p>
            </div>
          </div>
          <div className={textColors.chevron}>
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
  onSelectTab
}: TabSelectorProps) => {
  const { style } = useDashboardStyle();

  // Obter o estilo do fundo do seletor de abas
  const getTabSelectorStyle = () => {
    // Verificar se o modo escuro está ativado
    const isDarkModeActive = document.documentElement.classList.contains('dark');

    if (style === 'colorido') {
      // Estilo 1: Branco/Escuro - muda com base no modo escuro
      return isDarkModeActive
        ? "flex flex-wrap gap-2 p-2 bg-gray-800 rounded-lg" // Fundo escuro no modo escuro
        : "flex flex-wrap gap-2 p-2 bg-gray-100 rounded-lg"; // Fundo claro no modo claro
    } else {
      // Estilo 2: Colorido - não é afetado pelo modo escuro
      return "flex flex-wrap gap-2 p-2 bg-black bg-opacity-50 rounded-lg";
    }
  };

  // Obter o estilo dos botões de aba
  const getTabButtonStyle = (index: number) => {
    // Verificar se o modo escuro está ativado
    const isDarkModeActive = document.documentElement.classList.contains('dark');

    if (style === 'colorido') {
      // Estilo 1: Branco/Escuro - muda com base no modo escuro
      // Obter as cores de texto padrão
      const textColors = getDashboardTextColors();

      // Selecionar as cores com base no modo (claro/escuro)
      const colors = isDarkModeActive ? textColors.dark : textColors.light;

      // Cores padrão para todos os dashboards
      const activeColor = isDarkModeActive ? 'bg-gray-600' : 'bg-gray-600';
      const inactiveColor = isDarkModeActive ? 'bg-gray-800/70' : 'bg-gray-100';
      const activeTextColor = 'text-white';
      const inactiveTextColor = isDarkModeActive ? colors.lightColor : colors.baseColor;

      return `
        px-3 py-1 rounded-full text-sm font-medium
        transition-all duration-300
        ${selectedIndex === index
          ? `${activeColor} ${activeTextColor} shadow-md transform -translate-y-1`
          : `${inactiveColor} ${inactiveTextColor} hover:bg-opacity-80`}
      `;
    } else {
      // Estilo 2: Colorido - não é afetado pelo modo escuro
      return `
        px-3 py-1 rounded-full text-sm font-medium
        transition-all duration-300
        ${selectedIndex === index
          ? 'bg-white text-gray-900 shadow-lg transform -translate-y-1'
          : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'}
      `;
    }
  };

  return (
    <div className={getTabSelectorStyle()}>
      {dashConfig.dadosCartoes.map((card, index) => (
        <button
          key={`tab-${index}`}
          className={getTabButtonStyle(index)}
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
  onClose
}: CardDetailViewProps) => {
  const { style } = useDashboardStyle();

  // Não precisamos mais determinar a chave do dashboard, pois não estamos mais usando cores específicas

  // Verificar se config e dadosCartoes existem antes de acessar
  const cardData = config?.dadosCartoes?.[cardIndex];

  // Usamos dashboardKey diretamente para determinar as cores temáticas

  // Verificar se é o card de Ranking de Atividades (verificação case-insensitive)
  const isRankingAtividades = cardData?.title?.toLowerCase().includes("ranking de atividades");

  // Verificação alternativa para garantir que o card de Ranking seja identificado
  const isRankingCard =
    cardData?.title?.toLowerCase().includes("ranking") &&
    (cardData?.icon === "fas fa-trophy" || cardData?.description?.toLowerCase().includes("deputados mais ativos"));

  const shouldShowRanking = isRankingAtividades || isRankingCard;

  // Se não houver dados, mostrar mensagem de erro
  if (!config || !cardData) {
    return (
      <div className="p-6 mt-2 rounded-lg bg-red-50 text-red-700">
        <h3 className="text-xl font-bold mb-2">Erro ao carregar detalhes</h3>
        <p>Não foi possível carregar os detalhes deste cartão.</p>
        <button
          onClick={onClose}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Fechar
        </button>
      </div>
    );
  }

  // Função para obter o estilo de gradiente para o dashboard
  const getGradientStyle = () => {
    if (style === 'colorido') {
      // Estilo 1: Branco (como no backup)
      // Verificar se o modo escuro está ativado
      const isDarkModeActive = document.documentElement.classList.contains('dark');

      // Obter as cores de texto padrão
      const textColors = getDashboardTextColors();

      // Selecionar as cores com base no modo (claro/escuro)
      const colors = isDarkModeActive ? textColors.dark : textColors.light;

      // Definir cores para o gradiente
      let bgColor = isDarkModeActive ? '#1e293b' : 'white';
      let textColor = isDarkModeActive ? '#9ca3af' : '#4b5563'; // Cinza padrão

      return {
        backgroundColor: bgColor,
        borderTop: `4px solid ${colors.borderColor}`,
        color: textColor,
        borderLeft: `1px solid ${isDarkModeActive ? '#334155' : '#e5e7eb'}`,
        borderRight: `1px solid ${isDarkModeActive ? '#334155' : '#e5e7eb'}`,
        borderBottom: `1px solid ${isDarkModeActive ? '#334155' : '#e5e7eb'}`,
        transition: 'all 0.3s ease',
        boxShadow: isDarkModeActive
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      };
    } else {
      // Estilo 2: Colorido (original)
      const { primaryColor, secondaryColor } = config;
      return {
        backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
        color: 'white',
        transition: 'all 0.3s ease',
      };
    }
  };

  // Função para obter o estilo de fundo para o conteúdo do card
  const getContentStyle = () => {
    // Verificar se o modo escuro está ativado
    const isDarkModeActive = document.documentElement.classList.contains('dark');

    if (style === 'colorido') {
      // Estilo 1: Branco/Escuro - muda com base no modo escuro

      // Obter as cores de texto padrão
      const textColors = getDashboardTextColors();

      // Selecionar as cores com base no modo (claro/escuro)
      const colors = isDarkModeActive ? textColors.dark : textColors.light;

      if (isDarkModeActive) {
        return {
          backgroundColor: '#1e293b', // Azul escuro no modo escuro
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${colors.borderColor}`, // Borda colorida de acordo com o tipo de dashboard
        };
      } else {
        return {
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: `1px solid ${colors.borderColor}`, // Borda colorida de acordo com o tipo de dashboard
        };
      }
    } else {
      // Estilo 2: Colorido - não é afetado pelo modo escuro
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      };
    }
  };

  // Obter as cores do texto com base no estilo
  const getTextColors = () => {
    if (style === 'colorido') {
      // Estilo 1: Branco/Escuro - muda com base no modo escuro
      // Verificar se o modo escuro está ativado
      const isDarkModeActive = document.documentElement.classList.contains('dark');

      // Obter as cores de texto padrão
      const textColors = getDashboardTextColors();

      // Selecionar as cores com base no modo (claro/escuro)
      const colors = isDarkModeActive ? textColors.dark : textColors.light;

      // Ajustar a cor do item com base no modo escuro
      const itemColor = isDarkModeActive ? colors.lightColor : "text-gray-700";

      return {
        title: `text-xl font-bold ${colors.baseColor}`,
        description: `${colors.descriptionColor} mb-3`,
        value: `text-2xl font-bold ${colors.baseColor}`,
        label: `${colors.lightColor} text-sm mb-1`,
        section: `${colors.baseColor} font-medium mb-2`,
        item: itemColor,
        button: `${colors.bgColor} hover:bg-opacity-80 ${colors.baseColor}`,
        icon: colors.baseColor // Usar a cor base para o ícone
      };
    } else {
      // Estilo 2: Colorido - não é afetado pelo modo escuro
      return {
        title: "text-xl font-bold text-white",
        description: "text-white mb-3",
        value: "text-2xl font-bold text-white",
        label: "text-white text-sm mb-1",
        section: "text-white font-medium mb-2",
        item: "text-white",
        button: "bg-white/20 hover:bg-white/30 text-white",
        icon: "text-white" // Adicionado classe específica para o ícone
      };
    }
  };

  const textColors = getTextColors();

  // Se for o card de Ranking de Atividades, renderizar um conteúdo específico
  if (shouldShowRanking) {
    return (
      <div
        className="p-6 mt-2 rounded-lg area-exibicao"
        style={{
          ...getGradientStyle(),
          display: 'block',
          opacity: 1,
          transform: 'translateY(0)',
          marginTop: '-10px',
          paddingTop: '20px',
          zIndex: 5,
          position: 'relative',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
        }}
        role="tabpanel"
        aria-labelledby={`tab-${cardIndex}`}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className={`${textColors.title} flex items-center gap-2 cursor-pointer hover:underline`}>
            <i className={`${cardData.icon} ${textColors.icon}`}></i>
            {cardData.title}
          </h3>

          <button
            onClick={onClose}
            className={style === 'colorido'
              ? "text-white hover:text-white/80 p-1 rounded-full hover:bg-white/10"
              : `hover:opacity-80 p-1 rounded-full`
            }
            aria-label="Fechar detalhes"
          >
            <i className={`fas fa-times text-lg ${textColors.icon}`}></i>
          </button>
        </div>

        <div className={style === 'colorido' ? "bg-gray-100 p-4 rounded-lg" : "bg-white p-4 rounded-lg border border-gray-200"}>
          <p className="text-gray-700 mb-4">
            Este componente exibiria o ranking de atividades dos deputados, incluindo filtros, lista paginada e gráfico de barras.
          </p>
          <div className="flex flex-col gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-medium mb-2">Filtros</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-2 rounded">Estado</div>
                <div className="bg-gray-50 p-2 rounded">Partido</div>
                <div className="bg-gray-50 p-2 rounded">Ordenação</div>
                <div className="bg-gray-50 p-2 rounded">Tipo de Despesa</div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-medium mb-2">Lista de Deputados</h4>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                      <div>
                        <div className="font-medium">Deputado {i}</div>
                        <div className="text-xs text-gray-500">Partido-UF</div>
                      </div>
                    </div>
                    <div className="font-bold text-green-600">R$ {(Math.random() * 100000).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-6 mt-2 rounded-lg area-exibicao"
      style={{
        ...getGradientStyle(),
        display: 'block',
        opacity: 1,
        transform: 'translateY(0)',
        marginTop: '-10px',
        paddingTop: '20px',
        zIndex: 5,
        position: 'relative',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
      }}
      role="tabpanel"
      aria-labelledby={`tab-${cardIndex}`}
    >
      <div className="mt-4 p-5 rounded-lg shadow-md" style={getContentStyle()}>
        <div className="flex justify-between items-start mb-4">
          <h3 className={`${textColors.title} flex items-center gap-2 cursor-pointer hover:underline`}>
            <i className={`${cardData.icon} ${textColors.icon}`}></i>
            {cardData.title}
          </h3>

          <button
            onClick={onClose}
            className={style === 'colorido'
              ? "text-white hover:text-white/80 hover:bg-white/10 p-1 rounded-full"
              : `hover:opacity-80 p-1 rounded-full`
            }
            aria-label="Fechar detalhes"
          >
            <i className={`fas fa-times text-lg ${textColors.icon}`}></i>
          </button>
        </div>

        <div className={style === 'colorido' ? "p-4 bg-white/10 rounded-lg mb-4" : "p-4 bg-gray-50 rounded-lg mb-4"}>
          <p className={textColors.description}>
            {cardData.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className={style === 'colorido' ? "p-3 bg-white/20 border border-white/30 rounded-lg" : "p-3 bg-white border border-gray-200 rounded-lg"}>
              <p className={textColors.label}>
                Total
              </p>
              <p className={textColors.value}>
                {cardData.value}
              </p>
            </div>

            <div className={style === 'colorido' ? "p-3 bg-white/20 border border-white/30 rounded-lg" : "p-3 bg-white border border-gray-200 rounded-lg"}>
              <p className={textColors.label}>
                Última atualização
              </p>
              <p className={`text-lg font-medium ${style === 'colorido' ? 'text-white' : textColors.title.split(' ')[2]}`}>
                Março 2025
              </p>
            </div>
          </div>
        </div>

        <div className={style === 'colorido' ? "border-t border-white/20 pt-4 mt-4" : "border-t border-gray-200 pt-4 mt-4"}>
          <h4 className={textColors.section}>
            Informações adicionais
          </h4>
          <ul className="space-y-2">
            <li className={`flex items-center cursor-pointer hover:underline ${textColors.item}`}>
              <i className={`fas fa-calendar-check mr-2 ${textColors.icon}`}></i>
              <span>Mandato atual: 2023-2027</span>
            </li>
            <li className={`flex items-center cursor-pointer hover:underline ${textColors.item}`}>
              <i className={`fas fa-map-marker-alt mr-2 ${textColors.icon}`}></i>
              <span>Representação: Estado do Rio de Janeiro</span>
            </li>
            <li className={`flex items-center cursor-pointer hover:underline ${textColors.item}`}>
              <i className={`fas fa-users mr-2 ${textColors.icon}`}></i>
              <span>Participação por partido disponível no link abaixo</span>
            </li>
          </ul>

          <div className="mt-6 text-right">
            <a
              href={cardData.link}
              className={`${textColors.button} font-medium py-2 px-4 rounded inline-flex items-center`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Acesse o portal oficial</span>
              <i className={`fas fa-external-link-alt ml-2 ${textColors.icon}`}></i>
            </a>
          </div>
        </div>
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
