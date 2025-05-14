// src/domains/congresso/pages/HomePage.tsx
import React, { useEffect, useState } from "react";
import { DashboardUnificadoUF } from "@/domains/congresso/components/Dashboards";
import { ActionCards } from "@/domains/congresso/components/ActionCards";
import { usePerfil } from "@/domains/usuario/hooks";

interface HomePageProps {}

const HomePage: React.FC<HomePageProps> = () => {
  // Estado para armazenar a UF atual (padrão: Brasil)
  const [currentUf, setCurrentUf] = useState<string>("br");
  
  // Obter o perfil do usuário para verificar o estado eleitoral
  const { perfil, isLoadingPerfil } = usePerfil();
  
  // Atualizar a UF quando o perfil for carregado
  useEffect(() => {
    if (perfil && perfil.estadoEleitoral) {
      console.log(`HomePage: Usando estado eleitoral do perfil: ${perfil.estadoEleitoral}`);
      setCurrentUf(perfil.estadoEleitoral);
    }
  }, [perfil]);

  return (
    <div className="space-y-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Bem-vindo à República Brasileira
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Página inicial com dashboards e ações prioritárias.
        </p>
      </header>
      
      {/* Ações Prioritárias */}
      <section className="mb-8">
        <ActionCards />
      </section>
      
      {/* Dashboards - usando DashboardUnificadoUF com a UF do perfil do usuário */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Dashboards</h2>
        {isLoadingPerfil ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-congress-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardUnificadoUF uf={currentUf} />
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;