import React, { useState, useEffect, useMemo } from 'react';
import { DashboardConfig } from './dashboardConfig';
import {
  DashboardHeader,
  TabSelector,
  CardDetailView
} from './DashboardComponents';

export interface RenderCardComponentProps {
  key: string;
  card: DashboardConfig['dadosCartoes'][0];
  index: number;
  dashboardKey: string;
  onClick: () => void;
  isDarkMode?: boolean;
  ufForCount?: string; // Para StaticDashboard que usa contagem dinâmica
}

interface BaseDashboardRendererProps {
  uf: string; // UF validada
  isDarkMode?: boolean;
  dashboardConfigs: Record<string, DashboardConfig> | null;
  renderCardComponent: (props: RenderCardComponentProps) => JSX.Element;
  // Adicionar quaisquer outras props específicas que diferenciam os dashboards, se houver
  // Por exemplo, uma função para renderizar o rodapé específico.
  renderDashboardFooter?: (dashboardKey: string, config: DashboardConfig) => JSX.Element | null;
}

export const BaseDashboardRenderer: React.FC<BaseDashboardRendererProps> = ({
  uf,
  isDarkMode = false,
  dashboardConfigs,
  renderCardComponent,
  renderDashboardFooter,
}) => {
  const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>({});
  const [selectedCard, setSelectedCard] = useState<{ dashboardKey: string; cardIndex: number } | null>(null);
  const [isFullScreenMode, setIsFullScreenMode] = useState<boolean>(false);
  // O erro de carregamento de config deve ser tratado antes de chamar este componente,
  // ou passado como prop se este componente precisar mostrá-lo.
  // const [error, setError] = useState<string | null>(null); // Removido, assumindo que configs são passadas ou erro é tratado acima

  useEffect(() => {
    if (dashboardConfigs) {
      const initialExpandedPanels: Record<string, boolean> = {};
      Object.keys(dashboardConfigs).forEach(key => {
        // Mantém o estado de expansão se já existir para a UF, senão colapsa.
        // Isso pode precisar de ajuste se a UF mudar e quisermos resetar sempre.
        initialExpandedPanels[key] = expandedPanels[key] || false;
      });
      // Se a UF mudou (indicado pela mudança em dashboardConfigs), resetar painéis e seleção
      const currentKeys = Object.keys(dashboardConfigs).sort().join(',');
      const prevKeys = Object.keys(expandedPanels).sort().join(',');

      if (currentKeys !== prevKeys) {
        const resetExpandedPanels: Record<string, boolean> = {};
         Object.keys(dashboardConfigs).forEach(key => {
            resetExpandedPanels[key] = false;
        });
        setExpandedPanels(resetExpandedPanels);
        setSelectedCard(null);
        setIsFullScreenMode(false);
      } else {
        setExpandedPanels(initialExpandedPanels);
      }
    }
  }, [uf, dashboardConfigs]); // Adicionado dashboardConfigs à dependência

  // O listener de 'stateChange' para UF foi movido para useDashboardShell
  // Se BaseDashboardRenderer precisar reagir a mudanças de UF que não vêm de props,
  // essa lógica precisaria ser reconsiderada aqui ou gerenciada pelo componente pai.

  const togglePanelExpansion = (dashboardKey: string) => {
    setExpandedPanels(prev => ({
      ...prev,
      [dashboardKey]: !prev[dashboardKey]
    }));
    if (selectedCard && selectedCard.dashboardKey === dashboardKey && expandedPanels[dashboardKey]) {
      setSelectedCard(null);
      setIsFullScreenMode(false);
    }
  };

  const handleCardSelect = (dashboardKey: string, cardIndex: number) => {
    if (selectedCard && selectedCard.dashboardKey === dashboardKey && selectedCard.cardIndex === cardIndex) {
      setSelectedCard(null);
      setIsFullScreenMode(false);
      return;
    }
    setSelectedCard({ dashboardKey, cardIndex });
    setIsFullScreenMode(true);
    if (!expandedPanels[dashboardKey]) {
      setExpandedPanels(prev => ({ ...prev, [dashboardKey]: true }));
    }
  };

  const handleCloseCardDetail = () => {
    setSelectedCard(null);
    setIsFullScreenMode(false);
  };

  const renderDashboardCardsInternal = (dashboardKey: string, config: DashboardConfig) => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {config.dadosCartoes.map((card, index) =>
          renderCardComponent({
            key: `${dashboardKey}-card-${index}`,
            card,
            index,
            dashboardKey,
            onClick: () => handleCardSelect(dashboardKey, index),
            isDarkMode,
            ufForCount: uf, // Passa a UF atual para o renderCardComponent
          })
        )}
      </div>
    );
  };

  const getGradientStyle = (config: DashboardConfig) => ({
    backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
    transition: 'all 0.3s ease',
  });

  const renderDashboardContentInternal = (dashboardKey: string, config: DashboardConfig) => {
    const isExpanded = !!expandedPanels[dashboardKey];
    const isSelected = selectedCard?.dashboardKey === dashboardKey;
    const selectedIndex = isSelected ? selectedCard.cardIndex : -1;
    const gradientStyle = getGradientStyle(config);

    return (
      <div
        key={dashboardKey}
        className={`dashboard-panel transition-all duration-300 ${isSelected ? 'selected-panel' : ''} ${isExpanded ? 'mb-3' : 'mb-4'}`}
        style={{ opacity: 1, transform: 'translateY(0)', transition: 'all 0.3s ease' }}
      >
        <div className="relative">
          <DashboardHeader
            config={config}
            isExpanded={isExpanded}
            onToggleExpand={() => togglePanelExpansion(dashboardKey)}
            dashboardKey={dashboardKey}
            isDarkMode={isDarkMode}
            selectedCard={isSelected ? { index: selectedIndex } : null}
          />
        </div>
        {isExpanded && (
          <div
            className="dashboard-content relative text-white rounded-b-xl overflow-hidden"
            style={{
              ...gradientStyle,
              maxHeight: isExpanded ? '2000px' : '0',
              opacity: isExpanded ? 1 : 0,
              marginTop: '-20px',
              paddingTop: '20px',
              transition: 'all 0.5s ease',
              borderBottomLeftRadius: '18px',
              borderBottomRightRadius: '18px',
              zIndex: 5,
              position: 'relative',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
            }}
          >
            {isSelected && selectedIndex !== -1 ? (
              <div className="relative">
                <div className="bg-black bg-opacity-80 p-2">
                  <TabSelector
                    dashboardKey={dashboardKey}
                    dashConfig={config}
                    selectedIndex={selectedIndex}
                    onSelectTab={handleCardSelect}
                    isDarkMode={isDarkMode}
                  />
                </div>
                <CardDetailView
                  config={config}
                  cardIndex={selectedIndex}
                  onClose={handleCloseCardDetail}
                  isDarkMode={isDarkMode}
                  dashboardKey={dashboardKey}
                />
              </div>
            ) : (
              <>
                <div className="p-4">{renderDashboardCardsInternal(dashboardKey, config)}</div>
                {renderDashboardFooter && renderDashboardFooter(dashboardKey, config)}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!dashboardConfigs) {
    // Idealmente, o componente pai lidaria com o estado de erro/carregamento das configs.
    // Se este componente precisar lidar, precisaria de uma prop de erro.
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-2">Carregando configurações do dashboard...</p>
      </div>
    );
  }

  const dashboardOrder = useMemo(() => {
    if (!dashboardConfigs) return [];
    // Simplesmente usar a ordem das chaves como vêm das configs,
    // ou aplicar uma lógica de ordenação específica se necessário.
    // A lógica de reordenar com base no selectedCard foi mantida.
    let orderedKeys = [
        Object.keys(dashboardConfigs).find(key => key.startsWith('cg-')),
        Object.keys(dashboardConfigs).find(key => key.startsWith('ale-')),
        Object.keys(dashboardConfigs).find(key => key.startsWith('gov-'))
    ].filter(Boolean) as string[];


    if (selectedCard) {
      const { dashboardKey: selectedKey } = selectedCard;
      if (orderedKeys.includes(selectedKey)) {
        orderedKeys = [selectedKey, ...orderedKeys.filter(key => key !== selectedKey)];
      }
    }
    return orderedKeys;
  }, [dashboardConfigs, selectedCard]);

  return (
    <div
      className={`w-full py-2 transition-all duration-500 ${isDarkMode ? 'text-white' : 'text-gray-900'} ${isFullScreenMode ? 'fixed inset-0 z-50' : ''}`}
      style={{
        transition: 'all 0.5s ease',
        ...(isFullScreenMode && selectedCard && dashboardConfigs && dashboardConfigs[selectedCard.dashboardKey] ? {
          backgroundColor: dashboardConfigs[selectedCard.dashboardKey].primaryColor,
          backgroundImage: `linear-gradient(to right, ${dashboardConfigs[selectedCard.dashboardKey].primaryColor}, ${dashboardConfigs[selectedCard.dashboardKey].secondaryColor})`,
          padding: '0', margin: '0', maxWidth: '100%', height: '100vh', overflow: 'auto'
        } : {})
      }}
    >
      {isFullScreenMode && selectedCard && dashboardConfigs && dashboardConfigs[selectedCard.dashboardKey] ? (
        <div className="w-full">
          {renderDashboardContentInternal(selectedCard.dashboardKey, dashboardConfigs[selectedCard.dashboardKey])}
        </div>
      ) : (
        dashboardConfigs && dashboardOrder.map(key => dashboardConfigs[key] ? renderDashboardContentInternal(key, dashboardConfigs[key]) : null)
      )}
    </div>
  );
};
