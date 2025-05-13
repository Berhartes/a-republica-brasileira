import React, { useState, useEffect, useMemo } from 'react';
import DashboardHeader from './DashboardHeader';
import DashboardCard from './DashboardCard';
import TabSelector from './TabSelector';
import CardDetailView from './CardDetailView';
import ErrorMessage from './ErrorMessage';
import { getConfigPorUF, DashboardConfig } from './dashboardConfig';

interface DashboardUnificadoProps {
  uf: string;
  isDarkMode?: boolean;
}

const DashboardUnificado: React.FC<DashboardUnificadoProps> = ({ 
  uf = 'rj',
  isDarkMode = false
}) => {
  // Estado para controlar quais painéis estão expandidos (inicialmente todos retraídos)
  const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>({
    [`cg-${uf}`]: false,
    [`ale-${uf}`]: false,
    [`gov-${uf}`]: false
  });
  
  // Estado para controlar qual card está selecionado
  const [selectedCard, setSelectedCard] = useState<{ dashboardKey: string; cardIndex: number } | null>(null);
  
  // Estado para controlar o modo de tela cheia quando um card está selecionado
  const [isFullScreenMode, setIsFullScreenMode] = useState<boolean>(false);
  
  // Estado para mensagens de erro
  const [error, setError] = useState<string | null>(null);
  
  // Obter configurações dos dashboards para a UF atual
  const dashboardConfigs = useMemo(() => {
    try {
      return getConfigPorUF(uf.toLowerCase());
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      setError('Não foi possível carregar as configurações dos dashboards.');
      return null;
    }
  }, [uf]);
  
  // Atualizar os painéis expandidos quando a UF mudar
  useEffect(() => {
    if (dashboardConfigs) {
      setExpandedPanels({
        [`cg-${uf}`]: false,
        [`ale-${uf}`]: false,
        [`gov-${uf}`]: false
      });
      
      // Limpar o card selecionado quando a UF mudar
      setSelectedCard(null);
      setIsFullScreenMode(false);
    }
  }, [uf, dashboardConfigs]);
  
  // Ouvir eventos de mudança de estado
  useEffect(() => {
    const handleStateChange = (event: CustomEvent) => {
      const newUf = event.detail.code.toLowerCase();
      console.log(`DashboardUnificado: Estado alterado para: ${newUf}`);
      
      // Atualizar a UF diretamente aqui para garantir que o dashboard responda ao evento
      if (newUf !== uf) {
        // Forçar a atualização do dashboard com a nova UF
        console.log(`DashboardUnificado: Atualizando UF de ${uf} para ${newUf}`);
        
        // Limpar o card selecionado quando a UF mudar
        setSelectedCard(null);
        setIsFullScreenMode(false);
        
        // Atualizar os painéis expandidos para a nova UF (todos retraídos)
        setExpandedPanels({
          [`cg-${newUf}`]: false,
          [`ale-${newUf}`]: false,
          [`gov-${newUf}`]: false
        });
      }
    };
    
    window.addEventListener('stateChange' as any, handleStateChange as EventListener);
    
    return () => {
      window.removeEventListener('stateChange' as any, handleStateChange as EventListener);
    };
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
        className={`dashboard-panel mb-4 transition-all duration-300 ${
          isSelected ? 'selected-panel' : ''
        }`}
        style={{
          opacity: 1,
          transform: 'translateY(0)',
          transition: 'all 0.3s ease'
        }}
      >
        <DashboardHeader
          config={config}
          isExpanded={isExpanded}
          onToggleExpand={() => togglePanelExpansion(dashboardKey)}
          dashboardKey={dashboardKey}
          isDarkMode={isDarkMode}
          selectedCard={isSelected ? { index: selectedIndex } : null}
        />
        
        {isExpanded && (
          <div 
            className="dashboard-content relative text-white rounded-b-xl overflow-hidden"
            style={{
              ...gradientStyle,
              maxHeight: isExpanded ? '2000px' : '0',
              opacity: isExpanded ? 1 : 0,
              marginTop: '-20px',
              paddingTop: '0',
              transition: 'all 0.5s ease'
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
              <div className="p-4">
                {renderDashboardCards(dashboardKey, config)}
              </div>
            )}
          </div>
        )}
        
        {/* Rodapé do dashboard */}
        {isExpanded && !isSelected && (
          <div 
            className="mt-4 pt-3 pb-4 text-right text-sm text-white text-opacity-90 px-6"
          >
            <span>© 2025 {config.title.split(':')[0]}. Todos os direitos reservados</span>
            {dashboardKey.startsWith('cg-') && (
              <a 
                href="https://www.congressonacional.leg.br/" 
                className="ml-2 text-white hover:text-white hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visite o site oficial
              </a>
            )}
            {dashboardKey.startsWith('ale-') && (
              <a 
                href="https://www.alerj.rj.gov.br/" 
                className="ml-2 text-white hover:text-white hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visite o site oficial
              </a>
            )}
            {dashboardKey.startsWith('gov-') && (
              <a 
                href="https://www.rj.gov.br/" 
                className="ml-2 text-white hover:text-white hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Portal do Governo
              </a>
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
    
    // Se for o Brasil (nacional), mostrar apenas os dashboards nacionais
    if (uf.toLowerCase() === 'br') {
      // Filtrar apenas os dashboards nacionais (Congresso Nacional, Câmara dos Deputados, Governo Federal)
      const keys = Object.keys(dashboardConfigs);
      return keys.filter(key => {
        const title = dashboardConfigs[key].title;
        return (
          title === 'Congresso Nacional' || 
          title === 'Câmara dos Deputados' || 
          title === 'Governo Federal'
        );
      }).sort((a, b) => {
        // Ordem para dashboards nacionais: Congresso, Câmara, Governo
        if (dashboardConfigs[a].title === 'Congresso Nacional') return -1;
        if (dashboardConfigs[b].title === 'Congresso Nacional') return 1;
        if (dashboardConfigs[a].title === 'Câmara dos Deputados') return -1;
        if (dashboardConfigs[b].title === 'Câmara dos Deputados') return 1;
        return 0;
      });
    }
    
    // Para estados, obter apenas um dashboard de cada tipo
    // Obter apenas as chaves únicas dos três tipos principais de dashboards
    const uniqueKeys = {
      congresso: Object.keys(dashboardConfigs).find(key => key.startsWith('cg-')),
      assembleia: Object.keys(dashboardConfigs).find(key => key.startsWith('ale-')),
      governo: Object.keys(dashboardConfigs).find(key => key.startsWith('gov-'))
    };
    
    // Filtrar valores undefined e ordenar na sequência desejada
    const orderedKeys = Object.values(uniqueKeys).filter(Boolean) as string[];
    
    // Se houver um card selecionado, colocar o dashboard correspondente primeiro
    if (selectedCard) {
      const { dashboardKey } = selectedCard;
      const otherKeys = orderedKeys.filter(key => key !== dashboardKey);
      return [dashboardKey, ...otherKeys];
    }
    
    return orderedKeys;
  }, [dashboardConfigs, selectedCard, uf]);
  
  return (
    <div 
      className={`container mx-auto px-4 py-4 transition-all duration-500 ${
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
      {isFullScreenMode && selectedCard && dashboardConfigs
        ? renderDashboardContent(selectedCard.dashboardKey, dashboardConfigs[selectedCard.dashboardKey])
        : dashboardConfigs && dashboardOrder.map(key => renderDashboardContent(key, dashboardConfigs[key]))
      }
    </div>
  );
};

export default DashboardUnificado;
