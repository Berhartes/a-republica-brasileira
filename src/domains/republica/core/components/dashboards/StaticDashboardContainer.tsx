/**
 * Container para o dashboard estático
 * Este componente carrega o dashboard apenas uma vez e não reage a mudanças de visibilidade
 * mas ainda responde a mudanças de estado (UF)
 */
import { StaticDashboard } from './StaticDashboard';
import { useDashboardShell } from '../../hooks/useDashboardShell'; // Importar o novo hook
import { DashboardShellControls } from './DashboardShellControls'; // Importar os controles

interface StaticDashboardContainerProps {
  uf: string;
}

export const StaticDashboardContainer = ({ uf: initialUf }: StaticDashboardContainerProps) => {
  const {
    // currentUf, // Não precisamos mais do currentUf diretamente aqui, pois validUf é usado
    validUf,
    isDarkMode,
    setIsDarkMode,
  } = useDashboardShell({ initialUf });

  // Os console.log e a lógica de isInitialized foram movidos para o hook ou não são mais necessários aqui.

  return (
    <div className="dashboard-container">
      <StaticDashboard uf={validUf} isDarkMode={isDarkMode} />

      <DashboardShellControls
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
    </div>
  );
};
