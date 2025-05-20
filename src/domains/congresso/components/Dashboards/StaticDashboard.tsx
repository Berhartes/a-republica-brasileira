/**
 * Componente de dashboard estático que carrega apenas uma vez
 * e não reage a mudanças de visibilidade ou foco da janela
 */
import { useState, useMemo, useRef } from 'react';
import { getConfigPorUF, DashboardConfig, todosEstados } from './dashboardConfig';
import {
  DashboardHeader,
  DashboardCard,
  TabSelector,
  CardDetailView,
  ErrorMessage
} from './DashboardComponents';

interface StaticDashboardProps {
  uf: string;
  isDarkMode?: boolean;
}

export const StaticDashboard = ({
  uf = 'br',
  isDarkMode = false
}: StaticDashboardProps) => {
  // Referência para garantir que o dashboard seja carregado apenas uma vez
  const isInitialized = useRef(false);

  // Estado para controlar quais painéis estão expandidos (inicialmente todos retraídos)
  const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>({});

  // Estado para controlar qual card está selecionado
  const [selectedCard, setSelectedCard] = useState<{ dashboardKey: string; cardIndex: number } | null>(null);

  // Estado para controlar o modo de tela cheia quando um card está selecionado
  const [isFullScreenMode, setIsFullScreenMode] = useState<boolean>(false);

  // Estado para mensagens de erro
  const [error, setError] = useState<string | null>(null);

  // Obter configurações dos dashboards para a UF atual
  const dashboardConfigs = useMemo(() => {
    try {
      console.log(`StaticDashboard: Carregando configurações para UF: ${uf}`);

      // Usar o método original para obter as configurações
      const configs = getConfigPorUF(uf.toLowerCase());

      // Inicializar os painéis expandidos apenas uma vez ou quando a UF mudar
      const initialExpandedPanels: Record<string, boolean> = {};
      Object.keys(configs).forEach(key => {
        initialExpandedPanels[key] = false;
      });
      setExpandedPanels(initialExpandedPanels);

      // Limpar o card selecionado quando a UF mudar
      setSelectedCard(null);
      setIsFullScreenMode(false);

      if (!isInitialized.current) {
        isInitialized.current = true;
      }

      return configs;
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      setError('Não foi possível carregar as configurações dos dashboards.');
      return null;
    }
  }, [uf]);

  // Função para alternar a expansão de um painel
  const togglePanelExpansion = (dashboardKey: string) => {
    setExpandedPanels(prev => ({
      ...prev,
      [dashboardKey]: !prev[dashboardKey]
    }));

    // Se o painel for recolhido e tiver um card selecionado desse painel, limpar a seleção
    if (selectedCard && selectedCard.dashboardKey === dashboardKey && expandedPanels[dashboardKey]) {
      setSelectedCard(null);
      setIsFullScreenMode(false);
    }
  };

  // Função para selecionar um card
  const handleCardSelect = (dashboardKey: string, cardIndex: number) => {
    // Se o mesmo card for clicado novamente, desselecionar
    if (selectedCard &&
        selectedCard.dashboardKey === dashboardKey &&
        selectedCard.cardIndex === cardIndex) {
      setSelectedCard(null);
      setIsFullScreenMode(false);
      return;
    }

    setSelectedCard({ dashboardKey, cardIndex });
    setIsFullScreenMode(true);

    // Garantir que o painel esteja expandido
    if (!expandedPanels[dashboardKey]) {
      setExpandedPanels(prev => ({
        ...prev,
        [dashboardKey]: true
      }));
    }
  };

  // Função para fechar o card selecionado
  const handleCloseCardDetail = () => {
    setSelectedCard(null);
    setIsFullScreenMode(false);
  };

  // Função para renderizar os cards de um dashboard
  const renderDashboardCards = (dashboardKey: string, config: DashboardConfig) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {config.dadosCartoes.map((card, index) => (
          <DashboardCard
            key={`${dashboardKey}-card-${index}`}
            card={card}
            index={index}
            dashboardKey={dashboardKey}
            onClick={() => handleCardSelect(dashboardKey, index)}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>
    );
  };

  // Função para obter o estilo de gradiente para um dashboard
  const getGradientStyle = (config: DashboardConfig) => {
    const { primaryColor, secondaryColor } = config;

    return {
      backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
      transition: 'all 0.3s ease',
    };
  };

  // Função para renderizar o conteúdo de um dashboard
  const renderDashboardContent = (dashboardKey: string, config: DashboardConfig) => {
    const isExpanded = expandedPanels[dashboardKey];
    const isSelected = selectedCard && selectedCard.dashboardKey === dashboardKey;
    const selectedIndex = isSelected ? selectedCard.cardIndex : -1;

    // Obter o estilo de gradiente para este dashboard
    const gradientStyle = getGradientStyle(config);

    return (
      <div
        key={dashboardKey}
        className={`dashboard-panel transition-all duration-300 ${
          isSelected ? 'selected-panel' : ''
        } ${isExpanded ? 'mb-3' : 'mb-4'}`}
        style={{
          opacity: 1,
          transform: 'translateY(0)',
          transition: 'all 0.3s ease'
        }}
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
            {/* Renderizar os cards ou o card selecionado */}
            {isSelected ? (
              <div className="relative">
                {/* Abas para navegação entre cards */}
                <div className="bg-black bg-opacity-80 p-2">
                  <TabSelector
                    dashboardKey={dashboardKey}
                    dashConfig={config}
                    selectedIndex={selectedIndex}
                    onSelectTab={handleCardSelect}
                    isDarkMode={isDarkMode}
                  />
                </div>

                {/* Visualização detalhada do card */}
                <CardDetailView
                  config={config}
                  cardIndex={selectedIndex}
                  onClose={handleCloseCardDetail}
                  isDarkMode={isDarkMode}
                />
              </div>
            ) : (
              <>
                <div className="p-4">
                  {renderDashboardCards(dashboardKey, config)}
                </div>

                {/* Rodapé do dashboard */}
                <div className="mt-4 pt-3 pb-4 text-right text-sm text-white text-opacity-90 px-6">
                  <span>© 2025 {config.title.split(':')[0]}. Todos os direitos reservados</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // Se houver erro, mostrar mensagem
  if (error) {
    return <ErrorMessage message={error} />;
  }

  // Se não houver configurações, mostrar mensagem de carregamento
  if (!dashboardConfigs) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Determinar quais dashboards mostrar e em que ordem
  const dashboardOrder = useMemo(() => {
    if (!dashboardConfigs) return [];

    // Usar a abordagem padrão
    // Sempre mostrar exatamente 3 dashboards: Congresso, Assembleia, Governo
    const uniqueKeys = {
      congresso: Object.keys(dashboardConfigs).find(key => key.startsWith('cg-')),
      assembleia: Object.keys(dashboardConfigs).find(key => key.startsWith('ale-')),
      governo: Object.keys(dashboardConfigs).find(key => key.startsWith('gov-'))
    };

    // Filtrar valores undefined e ordenar na sequência desejada
    let orderedKeys = [uniqueKeys.congresso, uniqueKeys.assembleia, uniqueKeys.governo].filter(Boolean) as string[];

    // Se houver um card selecionado, colocar o dashboard correspondente primeiro
    if (selectedCard) {
      const { dashboardKey } = selectedCard;
      const otherKeys = orderedKeys.filter(key => key !== dashboardKey);
      return [dashboardKey, ...otherKeys];
    }

    return orderedKeys;
  }, [dashboardConfigs, selectedCard]);

  return (
    <div
      className={`w-full py-2 transition-all duration-500 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      } ${isFullScreenMode ? 'fixed inset-0 z-50' : ''}`}
      style={{
        transition: 'all 0.5s ease',
        ...(isFullScreenMode && selectedCard && dashboardConfigs ? {
          backgroundColor: dashboardConfigs[selectedCard.dashboardKey].primaryColor,
          backgroundImage: `linear-gradient(to right, ${dashboardConfigs[selectedCard.dashboardKey].primaryColor}, ${dashboardConfigs[selectedCard.dashboardKey].secondaryColor})`,
          padding: '0',
          margin: '0',
          maxWidth: '100%',
          height: '100vh',
          overflow: 'auto'
        } : {})
      }}
    >
      {/* Renderizar apenas o dashboard selecionado quando em modo tela cheia */}
      {isFullScreenMode && selectedCard && dashboardConfigs ? (
        <div className="w-full">
          {renderDashboardContent(selectedCard.dashboardKey, dashboardConfigs[selectedCard.dashboardKey])}
        </div>
      ) : (
        dashboardConfigs && dashboardOrder.map(key => renderDashboardContent(key, dashboardConfigs[key]))
      )}
    </div>
  );
};
