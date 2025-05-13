import React, { useState, useMemo } from 'react';
import { CardData, DashboardConfig } from './dashboardConfig';

// Props para o componente de teste
interface TestDashboardProps {
  config: DashboardConfig;
  isDarkMode?: boolean;
}

// Componente de teste que implementa o novo design estético
const TestDashboard: React.FC<TestDashboardProps> = ({ 
  config, 
  isDarkMode = false 
}) => {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [isMainCardExpanded, setIsMainCardExpanded] = useState(false);

  // Determinar a chave do dashboard com base no título
  const dashboardKey = useMemo(() => {
    if (!config) return 'cg';
    
    if (config.title.toLowerCase().includes('congresso')) {
      return 'cg';
    } else if (config.title.toLowerCase().includes('assembleia') || 
               config.title.toLowerCase().includes('alerj')) {
      return 'ale';
    } else if (config.title.toLowerCase().includes('governo')) {
      return 'gov';
    } else {
      return 'cg'; // Fallback para congresso
    }
  }, [config]);

  // Obter as cores do tema com base no tipo de dashboard
  const getThemeColors = () => {
    if (dashboardKey === 'cg') {
      return {
        primaryColor: config?.primaryColor || '#005c97',
        secondaryColor: config?.secondaryColor || '#0096c7',
        accentColor: '#00bfff',
        selectedTabColor: '#00aaff'
      };
    } else if (dashboardKey === 'ale') {
      return {
        primaryColor: config?.primaryColor || '#065f46',
        secondaryColor: config?.secondaryColor || '#047857',
        accentColor: '#10B981',
        selectedTabColor: '#10B981'
      };
    } else {
      return {
        primaryColor: config?.primaryColor || '#c72c41',
        secondaryColor: config?.secondaryColor || '#a51c30',
        accentColor: '#E63946',
        selectedTabColor: '#E63946'
      };
    }
  };

  const themeColors = getThemeColors();

  // Estilo do gradiente para o card principal
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${themeColors.primaryColor}, ${themeColors.secondaryColor})`,
    color: 'white',
    transition: 'all 0.3s ease',
  };

  // Função para alternar a expansão do card principal
  const toggleMainCard = () => {
    console.log("Toggling main card");
    setIsMainCardExpanded(!isMainCardExpanded);
    if (expandedCard !== null) {
      setExpandedCard(null);
    }
  };

  // Função para selecionar um card específico
  const selectCard = (index: number) => {
    console.log("Selecting card", index);
    setExpandedCard(index);
  };

  // Função para fechar o card detalhado
  const closeDetailView = () => {
    console.log("Closing detail view");
    setExpandedCard(null);
  };

  // Renderizar o card principal
  const renderMainCard = () => {
    return (
      <section 
        className="rounded-xl shadow-2xl cursor-pointer relative hover:shadow-2xl transition-all duration-300"
        style={gradientStyle}
        role="region"
        aria-expanded={isMainCardExpanded}
        onClick={toggleMainCard}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            toggleMainCard();
          }
        }}
      >
        <div className="p-6 sm:p-8 relative">
          <div className="flex items-center justify-between text-white">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
                <i className={config.icon}></i>
                {config.title}
              </h2>
              <p className="text-cyan-200 text-sm sm:text-base flex items-center gap-1">
                <i className={config.iconSubtitle || "fas fa-info-circle"}></i>
                {config.subtitle}
              </p>
            </div>
            <span 
              className={`text-cyan-300 text-xl sm:text-2xl transition-transform duration-300 ${isMainCardExpanded ? 'rotate-180' : ''} bg-white/10 p-2 rounded-full hover:bg-white/20`}
              onClick={(e) => {
                e.stopPropagation(); // Evita que o clique se propague para o section
                toggleMainCard();
              }}
              aria-label={isMainCardExpanded ? "Recolher painel" : "Expandir painel"}
            >
              <i className="fas fa-chevron-down"></i>
            </span>
          </div>
          
          {isMainCardExpanded && (
            <div className="container-abas flex mt-4 gap-2 flex-wrap">
              {config.dadosCartoes.map((card, index) => (
                <div 
                  key={index}
                  className={`py-2 px-4 rounded-full text-white text-sm cursor-pointer transition-all
                    ${expandedCard === index 
                      ? 'bg-white bg-opacity-30 font-bold' 
                      : 'bg-white bg-opacity-10 hover:bg-opacity-20'}`}
                  onClick={(e) => {
                    e.stopPropagation(); // Evita que o clique se propague para o section
                    selectCard(index);
                  }}
                >
                  {card.title}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Indicador visual de que o card é clicável */}
        {!isMainCardExpanded && (
          <div className="absolute bottom-2 right-2 text-white/50 text-xs flex items-center">
            <i className="fas fa-hand-pointer mr-1"></i>
            <span>Clique para expandir</span>
          </div>
        )}
      </section>
    );
  };

  // Renderizar os cards quando o card principal está expandido
  const renderCards = () => {
    if (!isMainCardExpanded) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {config.dadosCartoes.map((card, index) => (
          <div 
            key={index}
            className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-4 shadow-md cursor-pointer transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl"
            style={gradientStyle}
            onClick={(e) => {
              e.stopPropagation();
              selectCard(index);
            }}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <i className={card.icon}></i>
                  {card.title}
                </h3>
                <p className="text-sm text-cyan-200 mt-1">{card.description}</p>
              </div>
              <span 
                className="text-xs font-medium px-2 py-1 rounded-full"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.4)'
                }}
              >
                {card.badge}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-3xl font-bold text-white">{card.value}</p>
                </div>
                <div className="text-right">
                  <a 
                    href={card.link} 
                    className="text-cyan-200 hover:underline text-sm"
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Ver mais →
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Renderizar a visualização detalhada de um card
  const renderDetailView = () => {
    if (expandedCard === null) return null;
    
    const cardData = config.dadosCartoes[expandedCard];
    
    return (
      <div 
        className="p-6 mt-2 rounded-lg text-white"
        style={{
          ...gradientStyle,
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
      >
        <div className="mt-4 p-5 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg shadow-md">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <i className={cardData.icon}></i>
              {cardData.title}
            </h3>
            
            <button 
              onClick={closeDetailView}
              className="text-white hover:text-white/80 p-1 rounded-full hover:bg-white/10"
              aria-label="Fechar detalhes"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>
          
          <div className="mb-4">
            <p className="text-white mb-3">
              Informações detalhadas sobre {cardData.title.toLowerCase()} do RJ.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-white/20 border border-white/30 rounded-lg">
                <p className="text-white text-sm mb-1">
                  Total
                </p>
                <p className="text-2xl font-bold text-white">
                  {cardData.value}
                </p>
              </div>
              
              <div className="p-3 bg-white/20 border border-white/30 rounded-lg">
                <p className="text-white text-sm mb-1">
                  Última atualização
                </p>
                <p className="text-lg font-medium text-white">
                  Março 2025
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/20 pt-4 mt-4">
            <h4 className="text-white font-medium mb-2">
              Informações adicionais
            </h4>
            <ul className="text-white space-y-2">
              <li className="flex items-center">
                <i className="fas fa-calendar-check mr-2"></i>
                <span>Mandato atual: 2023-2027</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-map-marker-alt mr-2"></i>
                <span>Representação: Estado do Rio de Janeiro</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-users mr-2"></i>
                <span>Participação por partido disponível no link abaixo</span>
              </li>
            </ul>
            
            <div className="mt-6 text-right">
              <a 
                href={cardData.link} 
                className="bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded inline-flex items-center"
                target="_blank" 
                rel="noopener noreferrer"
              >
                <span>Acesse o portal oficial</span>
                <i className="fas fa-external-link-alt ml-2"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {renderMainCard()}
      {renderCards()}
      {renderDetailView()}
    </div>
  );
};

export default TestDashboard;
