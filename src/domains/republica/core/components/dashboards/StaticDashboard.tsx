/**
 * Componente de dashboard estático que carrega apenas uma vez
 * e não reage a mudanças de visibilidade ou foco da janela
 */
import React, { useState, useMemo } from 'react'; // Adicionado React e useEffect
import { getConfigPorUF, DashboardConfig } from './dashboardConfig';
import {
  // DashboardHeader, // Usado por BaseDashboardRenderer
  DashboardCard, // Usado como fallback em renderStaticCardComponent
  // TabSelector, // Usado por BaseDashboardRenderer
  // CardDetailView, // Usado por BaseDashboardRenderer
  ErrorMessage
} from './DashboardComponents';
import { useParlamentarCountByUF } from '../../hooks/useParlamentarCountByUF';
import { BaseDashboardRenderer, RenderCardComponentProps } from './BaseDashboardRenderer'; // Importar o renderer base

// Componente auxiliar para buscar contagem e renderizar DashboardCard
interface ParlamentarDashboardCardProps {
  card: DashboardConfig['dadosCartoes'][0];
  index: number;
  dashboardKey: string;
  onClick: () => void;
  isDarkMode?: boolean;
  ufForCount: string; // UF para buscar a contagem
  tipoParlamentar: 'deputados' | 'senadores';
}

const ParlamentarDashboardCard: React.FC<ParlamentarDashboardCardProps> = ({
  card,
  index,
  dashboardKey,
  onClick,
  isDarkMode,
  ufForCount,
  tipoParlamentar
}) => {
  const { count, isLoading } = useParlamentarCountByUF(tipoParlamentar, ufForCount);

  const cardValue = isLoading || count === null ? '...' : String(count); // Mostrar '...' durante o carregamento

  return (
    <DashboardCard
      card={{ ...card, value: cardValue }} // Sobrescreve o valor do card com a contagem
      index={index}
      dashboardKey={dashboardKey}
      onClick={onClick}
      isDarkMode={isDarkMode}
    />
  );
};


interface StaticDashboardProps {
  uf: string;
  isDarkMode?: boolean;
}

export const StaticDashboard = ({
  uf = 'br',
  isDarkMode = false
}: StaticDashboardProps) => {
  const [error, setError] = useState<string | null>(null);
  // const isInitialized = useRef(false); // Movido para BaseDashboardRenderer ou não mais necessário da mesma forma

  const dashboardConfigs = useMemo(() => {
    try {
      // console.log(`StaticDashboard: Carregando configurações para UF: ${uf}`);
      return getConfigPorUF(uf.toLowerCase());
    } catch (err: any) {
      console.error('Erro ao carregar configurações no StaticDashboard:', err);
      setError('Não foi possível carregar as configurações dos dashboards.');
      return null;
    }
  }, [uf]);

  // Lógica de expandedPanels, selectedCard, isFullScreenMode, etc., movida para BaseDashboardRenderer

  const renderStaticCardComponent = (props: RenderCardComponentProps) => {
    const cardTitleLower = props.card.title.toLowerCase();
    // A UF para contagem é passada como props.ufForCount, que é a 'uf' do StaticDashboard
    const currentDashboardUF = props.ufForCount || uf; 

    if (cardTitleLower.includes('deputados federais')) {
      return (
        <ParlamentarDashboardCard
          key={`${props.dashboardKey}-card-${props.index}-deputados`}
          card={props.card}
          index={props.index}
          dashboardKey={props.dashboardKey}
          onClick={props.onClick}
          isDarkMode={props.isDarkMode}
          ufForCount={currentDashboardUF}
          tipoParlamentar="deputados"
        />
      );
    } else if (cardTitleLower.includes('senadores')) {
      return (
        <ParlamentarDashboardCard
          key={`${props.dashboardKey}-card-${props.index}-senadores`}
          card={props.card}
          index={props.index}
          dashboardKey={props.dashboardKey}
          onClick={props.onClick}
          isDarkMode={props.isDarkMode}
          ufForCount={currentDashboardUF}
          tipoParlamentar="senadores"
        />
      );
    }
    return (
      <DashboardCard
        key={props.key}
        card={props.card}
        index={props.index}
        dashboardKey={props.dashboardKey}
        onClick={props.onClick}
        isDarkMode={props.isDarkMode}
      />
    );
  };
  
  const renderStaticFooter = (_dashboardKey: string, config: DashboardConfig) => (
    <div className="mt-4 pt-3 pb-4 text-right text-sm text-white text-opacity-90 px-6">
      <span>© 2025 {config.title.split(':')[0]}. Todos os direitos reservados</span>
      {/* Links específicos podem ser adicionados aqui se necessário, ou mantidos como no DashboardUnificado */}
    </div>
  );


  if (error) {
    return <ErrorMessage message={error} />;
  }
  // BaseDashboardRenderer lida com o estado de carregamento de dashboardConfigs
   if (!dashboardConfigs && !error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <BaseDashboardRenderer
      uf={uf}
      isDarkMode={isDarkMode}
      dashboardConfigs={dashboardConfigs}
      renderCardComponent={renderStaticCardComponent}
      renderDashboardFooter={renderStaticFooter} // Pode ser o mesmo footer ou um específico
    />
  );
};
