/**
 * Arquivo unificado dos componentes principais de dashboard
 * Combina DashboardUnificado e DashboardUnificadoUF
 */
import { useState, useMemo } from 'react';
import { getConfigPorUF, DashboardConfig } from './dashboardConfig';
import {
  // DashboardHeader, // Será usado por BaseDashboardRenderer
  DashboardCard, // Necessário para renderCardComponent em DashboardUnificado
  // TabSelector, // Será usado por BaseDashboardRenderer
  // CardDetailView, // Será usado por BaseDashboardRenderer
  ErrorMessage
} from './DashboardComponents';
// FlagDashboardDebug e usePageVisibility são gerenciados por useDashboardShell e DashboardShellControls

import { useDashboardShell } from '../../hooks/useDashboardShell';
import { DashboardShellControls } from './DashboardShellControls';
import { BaseDashboardRenderer, RenderCardComponentProps } from './BaseDashboardRenderer'; // Importar o renderer base

// ============= DashboardUnificado =============
interface DashboardUnificadoProps {
  uf: string;
  isDarkMode?: boolean;
}

export const DashboardUnificado = ({ uf, isDarkMode = false }: DashboardUnificadoProps) => {
  const [error, setError] = useState<string | null>(null);

  const dashboardConfigs = useMemo(() => {
    try {
      // console.log(`DashboardUnificado: Carregando configurações para UF: ${uf}`);
      return getConfigPorUF(uf); // uf já deve estar em minúsculas e validada pelo hook/pai
    } catch (err: any) {
      console.error('Erro ao carregar configurações no DashboardUnificado:', err);
      setError('Não foi possível carregar as configurações dos dashboards.');
      return null;
    }
  }, [uf]);

  // A lógica de expandedPanels, selectedCard, isFullScreenMode, useEffect para stateChange,
  // togglePanelExpansion, handleCardSelect, handleCloseCardDetail, getGradientStyle,
  // renderDashboardContent, e dashboardOrder foi movida para BaseDashboardRenderer.

  const renderStandardCard = (props: RenderCardComponentProps) => (
    <DashboardCard
      key={props.key}
      card={props.card}
      index={props.index}
      dashboardKey={props.dashboardKey}
      onClick={props.onClick}
      isDarkMode={props.isDarkMode}
    />
  );

  const renderUnificadoFooter = (dashboardKey: string, config: DashboardConfig) => (
    <div className="mt-4 pt-3 pb-4 text-right text-sm text-white text-opacity-90 px-6">
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
  );

  if (error) {
    return <ErrorMessage message={error} />;
  }
  // O BaseDashboardRenderer já tem uma mensagem de carregamento se dashboardConfigs for null.
  // No entanto, para evitar passar null para BaseDashboardRenderer se houver erro aqui,
  // podemos retornar o spinner aqui também.
  if (!dashboardConfigs && !error) { // Adicionado !error para não mostrar spinner se já houver erro
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
      renderCardComponent={renderStandardCard}
      renderDashboardFooter={renderUnificadoFooter}
    />
  );
};

// ============= DashboardUnificadoUF =============
interface DashboardUnificadoUFProps {
  uf: string;
}

export const DashboardUnificadoUF = ({ uf: initialUf }: DashboardUnificadoUFProps) => {
  const {
    // currentUf, // Não precisamos mais do currentUf diretamente aqui, pois validUf é usado
    validUf,
    isDarkMode,
    setIsDarkMode,
  } = useDashboardShell({ initialUf });

  // A lógica de useEffect para darkMode, currentUf, e stateChange foi movida para o hook useDashboardShell.
  // A lógica de validação da UF também está no hook (retornando validUf).

  return (
    <div className="dashboard-container">
      <DashboardUnificado uf={validUf} isDarkMode={isDarkMode} />

      <DashboardShellControls
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
    </div>
  );
};
