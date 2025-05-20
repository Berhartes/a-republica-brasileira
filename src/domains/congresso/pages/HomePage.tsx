// src/domains/congresso/pages/HomePage.tsx
import { useEffect, useState } from 'react';
import { StaticDashboardContainer } from '@/domains/congresso/components/Dashboards';
import { ActionCards } from '@/domains/congresso/components/ActionCards';
import { usePerfil } from '@/domains/usuario/hooks';

const HomePage = () => {
  const { isLoadingPerfil } = usePerfil(); // Removida a variável perfil que não estava sendo utilizada
  // Usar o valor do localStorage como fallback
  const [currentUf, setCurrentUf] = useState(() => localStorage.getItem('estadoEleitoral') || 'br');

  // Não precisamos mais deste useEffect, pois não estamos recebendo initialUf como prop

  // Ouvir eventos de mudança de estado (stateChange)
  useEffect(() => {
    console.log(`HomePage: Configurando listener para eventos stateChange`);

    const handleStateChange = (event: any) => {
      const newUf = event.detail.code.toLowerCase();
      console.log(`HomePage: Evento stateChange recebido para UF: ${newUf}`);

      // Atualizar o estado local apenas se for diferente do atual
      if (newUf !== currentUf) {
        setCurrentUf(newUf);

        // Atualizar o localStorage para garantir consistência
        localStorage.setItem('estadoEleitoral', newUf);
      }
    };

    // Adicionar o listener
    window.addEventListener('stateChange', handleStateChange);

    // Remover o listener quando o componente for desmontado
    return () => {
      window.removeEventListener('stateChange', handleStateChange);
    };
  }, [currentUf]);

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Bem-vindo à República Brasileira
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Página inicial com dashboards e ações prioritárias.
        </p>
      </header>
      {/* Ações Prioritárias */}
      <section className="mb-4">
        <ActionCards />
      </section>
      {/* Dashboards - usando DashboardUnificadoUF com a UF recebida do header */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Dashboards</h2>
        {isLoadingPerfil ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-congress-primary"></div>
          </div>
        ) : (
          <div className="w-full">
            <StaticDashboardContainer uf={currentUf} />
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
