import React from 'react';
import { DashboardUnificado } from '../components/Dashboards';

const TesteDashboardSimples: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-900 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Teste Simplificado do Dashboard</h1>
          <p className="text-blue-200">Visualização direta do DashboardUnificado</p>
        </div>
      </header>
      
      <main className="container mx-auto py-8">
        {/* Renderizando diretamente o DashboardUnificado */}
        <DashboardUnificado uf="rj" isDarkMode={false} />
      </main>
      
      <footer className="bg-gray-800 text-white p-4 mt-8">
        <div className="container mx-auto text-center">
          <p>© 2025 A República Brasileira. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default TesteDashboardSimples;
