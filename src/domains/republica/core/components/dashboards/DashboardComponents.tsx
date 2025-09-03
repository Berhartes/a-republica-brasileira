/**
 * Arquivo unificado de componentes auxiliares para os dashboards
 * Contém: DashboardCard, DashboardHeader, TabSelector, CardDetailView, ErrorMessage
 */
import { useState, useMemo } from 'react';
import { CardData, DashboardConfig, getDashboardTextColors } from './dashboardConfig'; // Este parece correto (./dashboardConfig)
// Removido: collection, getDocs, query, orderBy, limit, where, doc, getDoc (serão usados no board-rankingCongresso)
import { useDashboardStyle } from '../../contexts/DashboardStyleContext';
import { BoardRankingCongresso } from './congressoNacional/board-rankingCongresso'; // minúsculo 'congressoNacional'
import { BoardSenadores } from './congressoNacional/board-senadores'; // minúsculo 'congressoNacional'
import { BoardDeputadosFederais } from './congressoNacional/board-deputadosFederais'; // minúsculo 'congressoNacional'
import { BoardEleitorado } from './congressoNacional/board-eleitorado'; // minúsculo 'congressoNacional'
import { BoardEstatisticas } from './congressoNacional/board-estatisticas'; // minúsculo 'congressoNacional'

// Imports para Assembleia
import { BoardDeputadosEstaduais } from './assembleia/board-deputadosEstaduais';
import { BoardComissoes } from './assembleia/board-comissoes';
import { BoardProjetosDeLei } from './assembleia/board-projetosDeLei';
import { BoardAudienciasPublicas } from './assembleia/board-audienciasPublicas';
import { BoardOrcamentoAlerj } from './assembleia/board-orcamentoAlerj';

// Imports para Governo
import { BoardGovernador } from './governo/board-governador';
import { BoardSecretarias } from './governo/board-secretarias';
import { BoardOrcamentoEstadual } from './governo/board-orcamentoEstadual';
import { BoardProgramasSociais } from './governo/board-programasSociais';
import { BoardMunicipios } from './governo/board-municipios';

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
  dashboardKey,
  onClick,
}: DashboardCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { style } = useDashboardStyle();

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
        title: `text-base font-bold ${colors.baseColor}`,
        description: `text-xs ${colors.descriptionColor} mb-1`,
        subtitle: `text-xs ${colors.subtitleColor}`,
        value: `text-xl font-bold ${colors.baseColor}`,
        badge: `text-xs px-2 py-1 rounded-full ${colors.badgeBg} ${colors.badgeText}`,
        details: `text-xs ${colors.detailsColor} hover:${colors.baseColorHover} cursor-pointer inline-flex items-center`,
        icon: colors.baseColor // Usar a cor base para o ícone
      };
    } else {
      // Estilo 2: Colorido - não é afetado pelo modo escuro
      return {
        title: "text-base font-bold text-white",
        description: "text-xs text-white text-opacity-80 mb-1",
        subtitle: "text-xs text-white text-opacity-70",
        value: "text-xl font-bold text-white",
        badge: "text-xs px-2 py-1 rounded-full bg-white bg-opacity-20 text-white",
        details: "text-xs text-white text-opacity-70 hover:text-opacity-100 cursor-pointer inline-flex items-center",
        icon: "text-white" // Adicionado classe específica para o ícone
      };
    }
  };

  const textColors = getTextColorClasses();

  return (
    <div
      className="p-2 sm:p-4 cursor-pointer transition-all duration-300 flex flex-col justify-between h-full"
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
      {/* Seção Superior: Título */}
      <h3
        id={`card-title-${card.title.replace(/\s+/g, '-')}`}
        className={textColors.title}
      >
        {card.title}
      </h3>

      {/* Seção do Meio: Conteúdo Principal */}
      <div className="flex-grow flex items-baseline justify-between my-2">
        {/* Conteúdo da Esquerda */}
        <div className="flex flex-col">
          <p
            id={`card-desc-${card.title.replace(/\s+/g, '-')}`}
            className={textColors.description}
          >
            {card.details.description}
          </p>
          <p className={`${textColors.subtitle} hidden sm:block`}>
            Próxima eleição: 2026
          </p>
        </div>

        {/* Conteúdo da Direita */}
        <div className="flex flex-col items-end text-right">
          <span className={textColors.value}>{card.value}</span>
          <div className="flex items-center gap-1 mt-1">
            <i className={`fas fa-star ${textColors.icon} text-xs`}></i>
            <span className={textColors.badge}>
            </span>
          </div>
        </div>
      </div>

      {/* Seção Inferior: Detalhes */}
      <div className="text-right">
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
        subtitle: card.details.description || '',
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
      title: "text-xl sm:text-2xl lg:text-3xl text-white font-bold mb-1",
      subtitle: "text-cyan-200 text-xs sm:text-sm",
      icon: "text-white text-2xl mr-3",
      chevron: "text-white"
    };
  };

  const textColors = getTextColors();

  return (
    <div
      className={`
        relative ${isExpanded ? 'rounded-t-xl' : 'rounded-xl'} overflow-hidden cursor-pointer
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
      <div className="p-4 sm:p-6">
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
                <i className="fas fa-anchor text-xs"></i>
                <span>{headerContent.subtitle}</span>
              </p>
            </div>
          </div>
          <div className={textColors.chevron}>
            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-xl transition-transform duration-300`}></i>
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
  dashboardKey: string;
}

export const CardDetailView = ({
  config,
  cardIndex,
  onClose,
  dashboardKey,
  isDarkMode
}: CardDetailViewProps) => {
  const { style } = useDashboardStyle();
  const [parlamentarCount, setParlamentarCount] = useState<number | null>(null);
  
  // Função para obter as cores do texto com base no estilo e modo escuro
  // Movida para ser acessível por todo o CardDetailView
  const getTextColors = () => {
    const isDarkModeActive = document.documentElement.classList.contains('dark');
    if (style === 'colorido') {
      const textColorsConfig = getDashboardTextColors();
      const colors = isDarkModeActive ? textColorsConfig.dark : textColorsConfig.light;
      const itemColor = isDarkModeActive ? colors.lightColor : "text-gray-700";
      return {
        title: `text-xl font-bold ${colors.baseColor}`,
        description: `${colors.descriptionColor} mb-3`,
        value: `text-2xl font-bold ${colors.baseColor}`,
        label: `${colors.lightColor} text-sm mb-1`,
        section: `${colors.baseColor} font-medium mb-2`,
        item: itemColor,
        button: `${colors.bgColor} hover:bg-opacity-80 ${colors.baseColor}`,
        icon: colors.baseColor,
        subtitle: `${colors.subtitleColor}`,
        badge: `text-xs px-2 py-1 rounded-full ${colors.badgeBg} ${colors.badgeText}`,
        detailsColor: `${colors.detailsColor}`,
        baseColor: colors.baseColor,
        baseColorHover: colors.baseColorHover,
        descriptionColor: colors.descriptionColor,
        lightColor: colors.lightColor,
        bgColor: colors.bgColor,
        borderColor: colors.borderColor,
      };
    } else {
      return {
        title: "text-xl font-bold text-white",
        description: "text-white mb-3",
        value: "text-2xl font-bold text-white",
        label: "text-white text-sm mb-1",
        section: "text-white font-medium mb-2",
        item: "text-white",
        button: "bg-white/20 hover:bg-white/30 text-white",
        icon: "text-white",
        subtitle: "text-xs text-white text-opacity-70",
        badge: "text-xs px-2 py-1 rounded-full bg-white bg-opacity-20 text-white",
        detailsColor: "text-xs text-white text-opacity-70",
        baseColor: "text-white",
        baseColorHover: "text-white",
        descriptionColor: "text-white text-opacity-80",
        lightColor: "text-white text-opacity-90",
        bgColor: "bg-white/10",
        borderColor: "border-white/20",
      };
    }
  };
  const calculatedTextColors = getTextColors(); // Definir aqui para estar disponível em todo o componente

  const handleParlamentarCountChange = (count: number) => {
    setParlamentarCount(count);
  };

  const cardData = config?.dadosCartoes?.[cardIndex];

  const ufEstado = useMemo(() => {
    // Priorizar extração da dashboardKey
    const parts = dashboardKey.split('-');
    if (parts.length > 1) {
      const potentialUf = parts[parts.length - 1].toUpperCase();
      if (potentialUf.length === 2 && /^[A-Z]{2}$/.test(potentialUf)) {
        return potentialUf;
      }
    }
    // Fallback para config.uf se existir e for válido
    if (config && typeof (config as any).uf === 'string' && (config as any).uf.length === 2) {
        return (config as any).uf.toUpperCase();
    }
    return '';
  }, [dashboardKey, config]);

  const showDeputadosListFromCardData = cardData?.title?.toLowerCase().includes('deputados federais');
  const showSenadoresListFromCardData = cardData?.title?.toLowerCase().includes('senadores');
  const showEleitoradoCard = cardData?.title?.toLowerCase().includes('eleitorado');
  const showEstatisticasCard = cardData?.title?.toLowerCase().includes('estatísticas'); // Nova verificação

  const isRankingAtividades = cardData?.title?.toLowerCase().includes("ranking de atividades");
  const isRankingCard =
    cardData?.title?.toLowerCase().includes("ranking") &&
    (cardData?.icon === "fas fa-trophy" || cardData?.details.description?.toLowerCase().includes("deputados mais ativos"));
  const shouldShowRanking = isRankingAtividades || isRankingCard;

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
      const isDarkModeActive = document.documentElement.classList.contains('dark');
      const textColorsConfig = getDashboardTextColors();
      const colors = isDarkModeActive ? textColorsConfig.dark : textColorsConfig.light;
      let bgColor = isDarkModeActive ? '#1e293b' : 'white';
      let textColor = isDarkModeActive ? '#9ca3af' : '#4b5563';

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
      const { primaryColor, secondaryColor } = config;
      return {
        backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
        color: 'white',
        transition: 'all 0.3s ease',
      };
    }
  };

  const getContentStyle = () => {
    const isDarkModeActive = document.documentElement.classList.contains('dark');
    if (style === 'colorido') {
      const textColorsConfig = getDashboardTextColors();
      const colors = isDarkModeActive ? textColorsConfig.dark : textColorsConfig.light;
      if (isDarkModeActive) {
        return {
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${colors.borderColor}`,
        };
      } else {
        return {
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: `1px solid ${colors.borderColor}`,
        };
      }
    } else {
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      };
    }
  };

  // A constante calculatedTextColors já foi definida acima, após a função getTextColors.

  if (shouldShowRanking && cardData) {
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
        <BoardRankingCongresso
          config={config}
          cardData={cardData}
          onClose={onClose}
          dashboardKey={dashboardKey}
          isDarkMode={isDarkMode}
          ufEstado={ufEstado}
          style={style}
          textColors={calculatedTextColors}
        />
      </div>
    );
  }

  // Adicionar condição para renderizar BoardSenadores
  if (showSenadoresListFromCardData && cardData) {
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
        <BoardSenadores
          cardData={cardData}
          config={config}
          onClose={onClose}
          isDarkMode={isDarkMode}
          ufEstado={ufEstado}
          style={style}
          textColors={calculatedTextColors}
          parlamentarCount={parlamentarCount}
          onParlamentarCountChange={handleParlamentarCountChange}
          contentStyle={getContentStyle()} // Passar o estilo do conteúdo
        />
      </div>
    );
  }

  // Adicionar condição para renderizar BoardDeputadosFederais
  if (showDeputadosListFromCardData && cardData) {
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
        <BoardDeputadosFederais
          cardData={cardData}
          config={config}
          onClose={onClose}
          isDarkMode={isDarkMode}
          ufEstado={ufEstado}
          style={style}
          textColors={calculatedTextColors}
          contentStyle={getContentStyle()}
        />
      </div>
    );
  }

  // Adicionar condição para renderizar BoardEleitorado
  if (showEleitoradoCard && cardData) {
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
        <BoardEleitorado
          cardData={cardData}
          config={config}
          onClose={onClose}
          isDarkMode={isDarkMode}
          ufEstado={ufEstado}
          style={style}
          textColors={calculatedTextColors}
          contentStyle={getContentStyle()}
        />
      </div>
    );
  }

  // Adicionar condição para renderizar BoardEstatisticas
  if (showEstatisticasCard && cardData) {
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
        <BoardEstatisticas
          cardData={cardData}
          config={config}
          onClose={onClose}
          isDarkMode={isDarkMode}
          ufEstado={ufEstado}
          style={style}
          textColors={calculatedTextColors}
          contentStyle={getContentStyle()}
        />
      </div>
    );
  }

  // --- ASSEMBLEIA ---
  if (dashboardKey.startsWith('ale-')) {
    const propsComunsBoard = {
      cardData,
      config,
      onClose,
      isDarkMode,
      ufEstado,
      style,
      textColors: calculatedTextColors,
      contentStyle: getContentStyle(),
    };
    if (cardData?.title?.toLowerCase().includes("deputados estaduais")) {
      return <BoardDeputadosEstaduais {...propsComunsBoard} />;
    }
    if (cardData?.title?.toLowerCase().includes("comissões")) {
      return <BoardComissoes {...propsComunsBoard} />;
    }
    if (cardData?.title?.toLowerCase().includes("projetos de lei")) {
      return <BoardProjetosDeLei {...propsComunsBoard} />;
    }
    if (cardData?.title?.toLowerCase().includes("audiências públicas")) {
      return <BoardAudienciasPublicas {...propsComunsBoard} />;
    }
    // Atenção ao nome do card "Orçamento" da ALERJ para não confundir com "Orçamento Estadual"
    if (cardData?.title?.toLowerCase() === "orçamento" && dashboardKey.startsWith('ale-')) {
      return <BoardOrcamentoAlerj {...propsComunsBoard} />;
    }
  }

  // --- GOVERNO ---
  if (dashboardKey.startsWith('gov-')) {
    const propsComunsBoard = {
      cardData,
      config,
      onClose,
      isDarkMode,
      ufEstado,
      style,
      textColors: calculatedTextColors,
      contentStyle: getContentStyle(),
    };
    if (cardData?.title?.toLowerCase().includes("governador")) {
      return <BoardGovernador {...propsComunsBoard} />;
    }
    if (cardData?.title?.toLowerCase().includes("secretarias")) {
      return <BoardSecretarias {...propsComunsBoard} />;
    }
    if (cardData?.title?.toLowerCase().includes("orçamento estadual")) {
      return <BoardOrcamentoEstadual {...propsComunsBoard} />;
    }
    if (cardData?.title?.toLowerCase().includes("programas sociais")) {
      return <BoardProgramasSociais {...propsComunsBoard} />;
    }
    if (cardData?.title?.toLowerCase().includes("municípios")) {
      return <BoardMunicipios {...propsComunsBoard} />;
    }
  }

  // Fallback para outros cards que não têm componentes dedicados ainda
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
          <h3 className={`${calculatedTextColors.title} flex items-center gap-2 cursor-pointer hover:underline`}>
            <i className={`${cardData.icon} ${calculatedTextColors.icon}`}></i>
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
            <i className={`fas fa-times text-lg ${calculatedTextColors.icon}`}></i>
          </button>
        </div>

        <div className={style === 'colorido' ? "p-4 bg-white/10 rounded-lg mb-4" : "p-4 bg-gray-50 rounded-lg mb-4"}>
          <p className={calculatedTextColors.description}>
            {cardData.details.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className={style === 'colorido' ? "p-3 bg-white/20 border border-white/30 rounded-lg" : "p-3 bg-white border border-gray-200 rounded-lg"}>
              <p className={calculatedTextColors.label}>
                Total
              </p>
              <p className={calculatedTextColors.value}>
                {/* Exibir a contagem dinâmica se disponível, senão o valor do cardData */}
                {parlamentarCount !== null ? parlamentarCount : cardData.value}
              </p>
            </div>

            <div className={style === 'colorido' ? "p-3 bg-white/20 border border-white/30 rounded-lg" : "p-3 bg-white border border-gray-200 rounded-lg"}>
              <p className={calculatedTextColors.label}>
                Última atualização
              </p>
              <p className={`text-lg font-medium ${style === 'colorido' ? 'text-white' : calculatedTextColors.title.split(' ')[2]}`}>
                Março 2025
              </p>
            </div>
          </div>
        </div>

        {/* 
          O bloco ParlamentaresPorEstadoList foi movido para os componentes de board específicos 
          (BoardDeputadosFederais e BoardSenadores).
          Se houver outros cards que precisem de uma lista de parlamentares genérica, 
          esta lógica pode ser reintroduzida ou adaptada.
          Por agora, este espaço fica para informações adicionais genéricas.
        */}

        <div className={style === 'colorido' ? "border-t border-white/20 pt-4 mt-4" : "border-t border-gray-200 pt-4 mt-4"}>
          <h4 className={calculatedTextColors.section}>
            Informações adicionais
          </h4>
          <ul className="space-y-2">
            <li className={`flex items-center cursor-pointer hover:underline ${calculatedTextColors.item}`}>
              <i className={`fas fa-calendar-check mr-2 ${calculatedTextColors.icon}`}></i>
              <span>Mandato atual: 2023-2027</span>
            </li>
            <li className={`flex items-center cursor-pointer hover:underline ${calculatedTextColors.item}`}>
              <i className={`fas fa-map-marker-alt mr-2 ${calculatedTextColors.icon}`}></i>
              <span>Representação: Estado do Rio de Janeiro</span>
            </li>
            <li className={`flex items-center cursor-pointer hover:underline ${calculatedTextColors.item}`}>
              <i className={`fas fa-users mr-2 ${calculatedTextColors.icon}`}></i>
              <span>Participação por partido disponível no link abaixo</span>
            </li>
          </ul>

          <div className="mt-6 text-right">
            <a
              href={cardData.link}
              className={`${calculatedTextColors.button} font-medium py-2 px-4 rounded inline-flex items-center`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Acesse o portal oficial</span>
              <i className={`fas fa-external-link-alt ml-2 ${calculatedTextColors.icon}`}></i>
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
