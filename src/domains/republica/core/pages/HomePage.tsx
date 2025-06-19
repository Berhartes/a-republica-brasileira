// src/domains/republica/core/pages/HomePage.tsx
import { useEffect, useState } from 'react';
import { StaticDashboardContainer } from '@/domains/republica/core/components/dashboards/StaticDashboardContainer';
import { ActionCards } from '@/domains/republica/core/components/ActionCards';
import { usePerfil } from '@/domains/usuario/hooks';

// Componente para o cabeçalho da página
const PageHeader = () => (
  <header className="mb-6">
    <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
      Bem-vindo à República
    </h1>
    <p className="text-lg text-gray-600 dark:text-gray-300">
      A nossa politica em um só lugar.
    </p>
  </header>
);

// Componente para a seção de dashboards
const DashboardSection = ({ isLoading, uf }: { isLoading: boolean; uf: string }) => (
  <section>
    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Dashboards</h2>
    {isLoading ? (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-congress-primary"></div>
      </div>
    ) : (
      <div className="w-full">
        <StaticDashboardContainer uf={uf} />
      </div>
    )}
  </section>
);

const HomePage = () => {
  const { isLoadingPerfil } = usePerfil();
  const [currentUf, setCurrentUf] = useState(() => localStorage.getItem('estadoEleitoral') || 'br');

  useEffect(() => {
    const handleStateChange = (event: any) => {
      const newUf = event.detail.code.toLowerCase();
      if (newUf !== currentUf) {
        setCurrentUf(newUf);
        localStorage.setItem('estadoEleitoral', newUf);
      }
    };

    window.addEventListener('stateChange', handleStateChange);
    return () => {
      window.removeEventListener('stateChange', handleStateChange);
    };
  }, [currentUf]);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <PageHeader />

      {/* Ações Prioritárias */}
      <section>
        <ActionCards />
      </section>

      {/* Dashboards */}
      <DashboardSection isLoading={isLoadingPerfil} uf={currentUf} />
    </div>
  );
};

export default HomePage;
