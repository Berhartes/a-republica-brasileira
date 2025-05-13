// Este arquivo contém os componentes de dashboard que foram removidos da HomePage
// Eles estão sendo guardados aqui para referência futura ou caso precisem ser restaurados

import React, { useState, useEffect } from "react";
import DashboardHeader from './DashboardHeader';
import DashboardCard from './DashboardCard';
import { configDashboardsRJ, DashboardConfig, todosEstados } from './dashboardConfig';
import { DashboardUnificado } from "./index";
import { DashboardUnificadoUF } from "./index";

// Componente DashboardSelector (removido)
export const DashboardSelector: React.FC = () => {
  // Estado para armazenar a UF atual
  const [currentUf, setCurrentUf] = useState('rj');
  
  // Escutar eventos de mudança de estado
  useEffect(() => {
    const handleStateChange = (event: CustomEvent) => {
      const newUf = event.detail.code.toLowerCase();
      console.log(`DashboardSelector: Estado alterado para: ${newUf}`);
      setCurrentUf(newUf);
    };
    
    // Registrar o listener para o evento stateChange
    window.addEventListener('stateChange' as any, handleStateChange as EventListener);
    
    // Limpar o listener quando o componente for desmontado
    return () => {
      window.removeEventListener('stateChange' as any, handleStateChange as EventListener);
    };
  }, []);
  
  // Verificar se a UF é válida
  const validUf = currentUf in todosEstados ? currentUf : 'rj';
  
  return (
    <div className="dashboard-selector">
      <DashboardUnificado uf={validUf} isDarkMode={false} />
    </div>
  );
};

// Código completo do DashboardSimples (removido)
export const DashboardSimples: React.FC<{isDarkMode?: boolean}> = ({ 
  isDarkMode = false
}) => {
  // Estado para controlar quais painéis estão expandidos (inicialmente todos retraídos)
  const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>({
    'cg-rj': false,
    'ale-rj': false,
    'gov-rj': false
  });
  
  // Função para alternar a expansão de um painel
  const togglePanelExpansion = (dashboardKey: string) => {
    setExpandedPanels(prev => ({
      ...prev,
      [dashboardKey]: !prev[dashboardKey]
    }));
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
            onClick={() => {}} // Sem funcionalidade de seleção para simplificar
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
    
    // Obter o estilo de gradiente para este dashboard
    const gradientStyle = getGradientStyle(config);
    
    return (
      <div 
        key={dashboardKey}
        className="dashboard-panel mb-4 transition-all duration-300"
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
          selectedCard={null}
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
            <div className="p-4">
              {renderDashboardCards(dashboardKey, config)}
            </div>
          </div>
        )}
        
        {/* Rodapé do dashboard */}
        {isExpanded && (
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
  
  // Dashboards fixos para o Rio de Janeiro
  const dashboards = [
    { key: 'cg-rj', config: configDashboardsRJ['cg-rj'] },
    { key: 'ale-rj', config: configDashboardsRJ['ale-rj'] },
    { key: 'gov-rj', config: configDashboardsRJ['gov-rj'] }
  ];
  
  return (
    <div 
      className={`container mx-auto px-4 py-4 transition-all duration-500 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}
    >
      {/* Renderizar apenas os 3 dashboards do Rio de Janeiro */}
      {dashboards.map(dashboard => 
        renderDashboardContent(dashboard.key, dashboard.config)
      )}
    </div>
  );
};

// Componente que renderiza os 3 dashboards originais
export const DashboardsOriginal: React.FC = () => {
  return (
    <div className="dashboards-backup">
      <DashboardSimples isDarkMode={false} />
    </div>
  );
};

/*
Instruções para restaurar os dashboards na HomePage:

1. Importe o componente desejado:
   import { DashboardsOriginal } from "@/domains/congresso/components/Dashboards/DashboardsBackup";
   ou
   import { DashboardSimples } from "@/domains/congresso/components/Dashboards";
   ou
   import { DashboardUnificado } from "@/domains/congresso/components/Dashboards";
   ou
   import { DashboardUnificadoUF } from "@/domains/congresso/components/Dashboards";

2. Adicione o componente na seção apropriada da HomePage:
   <DashboardsOriginal />
   ou
   <DashboardSimples isDarkMode={false} />
   ou
   <DashboardUnificado uf="rj" isDarkMode={false} />
   ou
   <DashboardUnificadoUF uf="rj" />
*/
