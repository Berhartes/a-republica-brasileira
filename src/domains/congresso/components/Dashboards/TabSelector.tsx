import React, { useMemo } from 'react';
import { DashboardConfig } from './dashboardConfig';

interface TabSelectorProps {
  dashboardKey: string;
  dashConfig: DashboardConfig;
  selectedIndex: number;
  onSelectTab: (dashboardKey: string, index: number) => void;
  isDarkMode?: boolean;
}

const TabSelector: React.FC<TabSelectorProps> = ({ 
  dashboardKey, 
  dashConfig, 
  selectedIndex, 
  onSelectTab,
  isDarkMode = false
}) => {
  // Usar as cores da configuração para cada dashboard
  const tabStyles = useMemo(() => {
    // Obter cores da configuração do dashboard
    const baseColor = dashConfig.secondaryColor;
    const activeColor = dashConfig.accent;
    
    return {
      base: {
        backgroundColor: baseColor,
        color: 'white',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '20px',
        height: '40px',
        padding: '0 15px',
        margin: '0 5px',
        transition: 'all 0.3s ease'
      },
      active: {
        backgroundColor: activeColor,
        boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15)',
        border: '2px solid white',
        transform: 'translateY(-3px)',
        fontWeight: 'bold'
      },
      dark: {
        base: {
          backgroundColor: isDarkMode ? '#1e5f94' : baseColor,
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
        },
        active: {
          backgroundColor: isDarkMode ? '#2a8cc5' : activeColor,
          boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3)'
        }
      }
    };
  }, [dashboardKey, dashConfig, isDarkMode]);

  return (
    <div 
      className="flex flex-row gap-2 z-20 overflow-x-auto py-2 px-4 justify-start"
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '2px',
        zIndex: 20,
        position: 'relative',
        justifyContent: 'flex-start'
      }}
    >
      {dashConfig.dadosCartoes.map((card, index) => {
        const isActive = index === selectedIndex;
        
        // Aplicar estilos com base no modo (claro/escuro)
        let currentStyle;
        if (isDarkMode) {
          currentStyle = isActive ? 
            {...tabStyles.base, ...tabStyles.active, ...tabStyles.dark.base, ...tabStyles.dark.active} : 
            {...tabStyles.base, ...tabStyles.dark.base};
        } else {
          currentStyle = isActive ? 
            {...tabStyles.base, ...tabStyles.active} : 
            tabStyles.base;
        }
        
        return (
          <div
            key={`tab-${dashboardKey}-${index}`}
            className="text-sm cursor-pointer transition-all duration-300 whitespace-nowrap rounded-full shadow-md tab-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...currentStyle
            }}
            onClick={() => onSelectTab(dashboardKey, index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelectTab(dashboardKey, index);
              } else if (e.key === 'ArrowRight') {
                const nextIndex = (index + 1) % dashConfig.dadosCartoes.length;
                onSelectTab(dashboardKey, nextIndex);
              } else if (e.key === 'ArrowLeft') {
                const prevIndex = (index - 1 + dashConfig.dadosCartoes.length) % 
                  dashConfig.dadosCartoes.length;
                onSelectTab(dashboardKey, prevIndex);
              }
            }}
            role="tab"
            aria-selected={isActive ? 'true' : 'false'}
            aria-controls={`tabpanel-${index}`}
            id={`tab-${index}`}
            tabIndex={isActive ? 0 : -1}
          >
            <div className="flex items-center gap-2">
              <i className={card.icon}></i>
              {card.title}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(TabSelector);
