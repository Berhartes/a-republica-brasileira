import { TestDashboard } from '../components/Dashboards';
import { getConfigPorUF } from '../components/Dashboards/dashboardConfig';

const NovoTesteDashboard = () => {
  // Obter a configuração para o Rio de Janeiro
  const dashboardConfigs = getConfigPorUF('rj');
  const congessoConfig = dashboardConfigs['cg-rj'];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-900 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Novo Design de Dashboard</h1>
          <p className="text-blue-200">Visualização do novo design estético</p>
        </div>
      </header>

      <main className="container mx-auto py-8">
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-2">Sobre este teste</h2>
          <p className="mb-4">
            Esta página demonstra o novo design estético para os dashboards, baseado no exemplo fornecido.
            As principais mudanças incluem:
          </p>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li>Cabeçalho com ícones integrados aos títulos</li>
            <li>Design mais limpo e fluido, com menos divisões visuais</li>
            <li>Efeito de backdrop-blur para os cartões</li>
            <li>Botão de expansão/colapso no canto superior direito</li>
            <li>Navegação por abas mais integrada ao design</li>
            <li>Descrições contextuais para cada dashboard</li>
            <li>Gradientes mais uniformes e consistentes</li>
          </ul>
        </div>

        {/* Renderizar o componente de teste com a configuração do Congresso */}
        <TestDashboard config={congessoConfig} isDarkMode={false} />
      </main>

      <footer className="bg-gray-800 text-white p-4 mt-8">
        <div className="container mx-auto text-center">
          <p>© 2025 A República Brasileira. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default NovoTesteDashboard;
