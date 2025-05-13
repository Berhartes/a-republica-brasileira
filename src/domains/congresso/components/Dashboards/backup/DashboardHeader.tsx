import React, { useState } from 'react';
import { DashboardConfig } from './dashboardConfig';

interface DashboardHeaderProps {
  config: DashboardConfig;
  isExpanded: boolean;
  onToggleExpand: () => void;
  dashboardKey: string;
  isDarkMode?: boolean;
  selectedCard?: { index: number } | null;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  config,
  isExpanded,
  onToggleExpand,
  dashboardKey,
  isDarkMode = false,
  selectedCard = null
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Determinar o gradiente de fundo com base no tipo de dashboard
  const getGradientStyle = () => {
    const { primaryColor, secondaryColor } = config;
    
    // Estilo base para todos os dashboards
    const baseStyle = {
      backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      position: 'relative' as 'relative',
      overflow: 'hidden' as 'hidden',
      zIndex: 10
    };
    
    // Adicionar efeito de hover
    if (isHovered) {
      return {
        ...baseStyle,
        boxShadow: `0 10px 25px rgba(0, 0, 0, 0.2), 0 0 0 1px ${primaryColor}40`
      };
    }
    
    return baseStyle;
  };
  
  // Determinar o ícone com base no tipo de dashboard
  const getIcon = () => {
    if (dashboardKey.startsWith('cg-')) {
      return 'fas fa-university';
    } else if (dashboardKey.startsWith('ale-')) {
      return 'fas fa-landmark';
    } else if (dashboardKey.startsWith('gov-')) {
      return 'fas fa-building';
    } else {
      return config.icon || 'fas fa-university';
    }
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
      className={`rounded-t-xl shadow-lg ${isExpanded ? 'mb-0 rounded-b-none' : 'mb-4 rounded-xl'}`}
      style={getGradientStyle()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
      <div className="p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <i className={`${headerContent.icon} text-white text-2xl mr-3`}></i>
            <div>
              <h2 className="text-2xl text-white font-bold">{headerContent.title}</h2>
              <p className="text-white text-opacity-90">{headerContent.subtitle}</p>
            </div>
          </div>
          
          <button 
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2 transition-transform duration-300"
            style={{ 
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            aria-label={isExpanded ? "Recolher painel" : "Expandir painel"}
          >
            <i className="fas fa-chevron-down"></i>
          </button>
        </div>
      </div>
      
      {/* Barra de navegação para cards quando um card está selecionado */}
      {isExpanded && selectedCard !== null && (
        <div className="bg-black bg-opacity-80 p-2 mt-2">
          {/* Aqui será renderizado o TabSelector pelo componente pai */}
        </div>
      )}
      
      {/* Efeito de brilho no hover */}
      {isHovered && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.1) 50%, transparent 75%)',
            backgroundSize: '200% 200%',
            animation: 'shimmer 2s infinite',
            zIndex: -1
          }}
        />
      )}
      
      {/* Keyframes para o efeito de brilho */}
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -100% -100%; }
            100% { background-position: 100% 100%; }
          }
        `}
      </style>
    </div>
  );
};

export default React.memo(DashboardHeader);
