/**
 * Arquivo unificado dos componentes principais de dashboard
 * Combina DashboardUnificado e DashboardUnificadoUF
 */
import { useState, useEffect, useMemo } from 'react';
import { getConfigPorUF, DashboardConfig, todosEstados } from './dashboardConfig';
import {
  DashboardHeader,
  DashboardCard,
  TabSelector,
  CardDetailView,
  ErrorMessage
} from './DashboardComponents';

// ============= DashboardUnificado =============
interface DashboardUnificadoProps {
  uf: string;
  isDarkMode?: boolean;
}

export const DashboardUnificado = ({
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
      console.log(`DashboardUnificado: Carregando configurações para UF: ${uf}`);

      // Usar o método original para obter as configurações
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
      // Criar novo estado com todos os painéis recolhidos
      const newExpandedPanels: Record<string, boolean> = {
        [`cg-${uf}`]: false,
        [`ale-${uf}`]: false,
        [`gov-${uf}`]: false
      };

      setExpandedPanels(newExpandedPanels);

      // Limpar o card selecionado quando a UF mudar
      setSelectedCard(null);
      setIsFullScreenMode(false);
    }
  }, [uf, dashboardConfigs]);

  // Ouvir eventos de mudança de estado (stateChange)
  useEffect(() => {
    console.log(`DashboardUnificado: Configurando listener para eventos stateChange`);

    const handleStateChange = (event: any) => {
      const newUf = event.detail.code.toLowerCase();
      console.log(`DashboardUnificado: Evento stateChange recebido para UF: ${newUf}`);

      // Verificar se a UF mudou
      if (newUf !== uf) {
        console.log(`DashboardUnificado: Mudando UF de ${uf} para ${newUf}`);

        // Atualizar os painéis expandidos com as chaves padrão
        const newExpandedPanels: Record<string, boolean> = {
          [`cg-${newUf}`]: false,
          [`ale-${newUf}`]: false,
          [`gov-${newUf}`]: false
        };

        setExpandedPanels(newExpandedPanels);

        // Limpar o card selecionado
        setSelectedCard(null);
        setIsFullScreenMode(false);
      }
    };

    // Adicionar o listener
    window.addEventListener('stateChange', handleStateChange);

    // Remover o listener quando o componente for desmontado
    return () => {
      window.removeEventListener('stateChange', handleStateChange);
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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
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

          {isExpanded && isSelected && (
            <div
              style={{
                position: 'absolute',
                bottom: '-20px',
                left: '-10px',
                zIndex: 20
              }}
            >
              <TabSelector
                dashboardKey={dashboardKey}
                dashConfig={config}
                selectedIndex={selectedIndex}
                onSelectTab={handleCardSelect}
                isDarkMode={isDarkMode}
              />
            </div>
          )}
        </div>

        {isExpanded && (
          <div
            className="dashboard-content relative text-white rounded-b-xl overflow-hidden"
            style={{
              ...gradientStyle,
              maxHeight: isExpanded ? '2000px' : '0',
              opacity: isExpanded ? 1 : 0,
              marginTop: '2px',
              paddingTop: '0',
              transition: 'all 0.5s ease',
              borderBottomLeftRadius: '18px',
              borderBottomRightRadius: '18px'
            }}
          >
            {/* Renderizar os cards ou o card selecionado */}
            {isSelected ? (
              <div className="relative">
                {/* Visualização detalhada do card */}
                <CardDetailView
                  config={config}
                  cardIndex={selectedIndex}
                  onClose={handleCloseCardDetail}
                  isDarkMode={isDarkMode}
                />
              </div>
            ) : (
              <div className="p-3">
                {renderDashboardCards(dashboardKey, config)}

                {/* Rodapé do dashboard dentro da estrutura colorida */}
                <div className="mt-1 text-right text-xs text-white text-opacity-80">
                  <span>© 2025 {config.title.split(':')[0]}. Todos os direitos reservados</span>
                </div>
              </div>
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

    console.log(`DashboardUnificado: Determinando ordem dos dashboards para UF: ${uf}`);

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
  }, [dashboardConfigs, selectedCard, uf]);

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

// ============= DashboardUnificadoUF =============
interface DashboardUnificadoUFProps {
  uf: string;
}

export const DashboardUnificadoUF = ({ uf: initialUf }: DashboardUnificadoUFProps) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Inicializar com o valor do localStorage, se disponível, ou usar o initialUf
  const [currentUf, setCurrentUf] = useState(() => {
    const savedUf = localStorage.getItem('estadoEleitoral');
    return savedUf || initialUf;
  });

  // Sincronizar com o tema do sistema e do cabeçalho
  useEffect(() => {
    const checkDarkMode = () => {
      const savedMode = localStorage.getItem("darkMode");
      if (savedMode) {
        setIsDarkMode(savedMode === "true");
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setIsDarkMode(prefersDark);
      }
    };

    checkDarkMode();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setIsDarkMode(isDark);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("darkMode")) {
        setIsDarkMode(e.matches);
      }
    };

    darkModeMediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      observer.disconnect();
      darkModeMediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  // Atualizar currentUf quando a prop initialUf mudar
  useEffect(() => {
    setCurrentUf(initialUf);
  }, [initialUf]);

  // Ouvir eventos de mudança de estado (stateChange)
  useEffect(() => {
    console.log(`DashboardUnificadoUF: Configurando listener para eventos stateChange`);

    const handleStateChange = (event: any) => {
      const newUf = event.detail.code.toLowerCase();
      console.log(`DashboardUnificadoUF: Evento stateChange recebido para UF: ${newUf}`);

      // Atualizar o estado local
      setCurrentUf(newUf);

      // Forçar a atualização da bandeira no localStorage
      localStorage.setItem('estadoEleitoral', newUf);

      // Não precisamos mais importar o flagService aqui
      console.log(`DashboardUnificadoUF: Atualizada UF para ${newUf}`);
    };

    // Adicionar o listener
    window.addEventListener('stateChange', handleStateChange);

    // Remover o listener quando o componente for desmontado
    return () => {
      window.removeEventListener('stateChange', handleStateChange);
    };
  }, []);

  // Usar sempre a prop currentUf, protegendo contra undefined
  const validUf = typeof currentUf === 'string' && currentUf ?
    (currentUf.toLowerCase() in todosEstados ? currentUf.toLowerCase() : 'br') : 'br';

  // Estado para controlar a exibição do componente de depuração
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="dashboard-container">
      <DashboardUnificado uf={validUf} isDarkMode={isDarkMode} />

      {/* Botão para mostrar/ocultar o componente de depuração */}
      <button
        className={`fixed bottom-4 left-4 p-3 rounded-full shadow-lg z-50 bg-blue-500 text-white`}
        onClick={() => setShowDebug(!showDebug)}
        aria-label="Depuração de Bandeiras"
      >
        <i className="fas fa-flag"></i>
      </button>

      {/* Componente de depuração */}
      {showDebug && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">Depuração de Bandeiras e Dashboards</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowDebug(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-4">
              <p>Componente de depuração não disponível</p>
            </div>
          </div>
        </div>
      )}

      {/* Botão para alternar entre modo claro e escuro */}
      <button
        className={`fixed bottom-4 right-4 p-3 rounded-full shadow-lg z-50 ${
          isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-800'
        }`}
        onClick={() => {
          const newMode = !isDarkMode;
          setIsDarkMode(newMode);
          localStorage.setItem("darkMode", newMode.toString());
          if (newMode) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }}
        aria-label={isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
      >
        <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
      </button>
    </div>
  );
};
