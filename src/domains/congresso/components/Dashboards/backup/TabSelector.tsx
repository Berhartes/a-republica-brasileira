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
  const tabStyles = useMemo(() => {
    if (dashboardKey.startsWith('cg-')) {
      return {
        base: {
          backgroundColor: dashConfig.secondaryColor || '#0077cc',
          color: 'white',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        },
        active: {
          backgroundColor: dashConfig.accent || '#00a8e8',
          boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15)',
          border: '2px solid white',
          transform: 'translateY(-3px)',
          fontWeight: 'bold'
        },
        dark: {
          base: {
            backgroundColor: '#1e5f94',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
          },
          active: {
            backgroundColor: '#2a8cc5',
            boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3)'
          }
        }
      };
    } else if (dashboardKey.startsWith('ale-')) {
      return {
        base: {
          backgroundColor: dashConfig.secondaryColor || '#087f5b',
          color: 'white',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        },
        active: {
          backgroundColor: dashConfig.accent || '#10b981',
          boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15)',
          border: '2px solid white',
          transform: 'translateY(-3px)',
          fontWeight: 'bold'
        },
        dark: {
          base: {
            backgroundColor: '#0e6c4f',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
          },
          active: {
            backgroundColor: '#0d9668',
            boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3)'
          }
        }
      };
    } else {
      return {
        base: {
          backgroundColor: dashConfig.secondaryColor || '#e63946',
          color: 'white',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        },
        active: {
          backgroundColor: dashConfig.accent || '#ff4d6d',
          boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.15)',
          border: '2px solid white',
          transform: 'translateY(-3px)',
          fontWeight: 'bold'
        },
        dark: {
          base: {
            backgroundColor: '#c1121f',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
          },
          active: {
            backgroundColor: '#e5383b',
            boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3)'
          }
        }
      };
    }
  }, [dashboardKey, dashConfig]);

  return (
    <div 
      className="flex flex-row gap-2 z-20 overflow-x-auto py-2 px-4 justify-center"
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '10px',
        zIndex: 20,
        position: 'relative'
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
            className="text-sm cursor-pointer transition-all duration-300 whitespace-nowrap rounded-full shadow-md"
            style={{
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 15px',
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
