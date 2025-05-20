/**
 * Container para o dashboard estático
 * Este componente carrega o dashboard apenas uma vez e não reage a mudanças de visibilidade
 * mas ainda responde a mudanças de estado (UF)
 */
import { useState, useRef, useEffect } from 'react';
import { StaticDashboard } from './StaticDashboard';
import { FlagDashboardDebug } from './DashboardDebug';

interface StaticDashboardContainerProps {
  uf: string;
}

export const StaticDashboardContainer = ({ uf: initialUf }: StaticDashboardContainerProps) => {
  // Referência para garantir que o dashboard seja carregado apenas uma vez
  const isInitialized = useRef(false);

  // Estado para controlar o modo escuro
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode) {
      return savedMode === "true";
    } else {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
  });

  // Estado para controlar a UF atual
  const [currentUf, setCurrentUf] = useState(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      const savedUf = localStorage.getItem('estadoEleitoral');
      return savedUf || initialUf;
    }
    return initialUf;
  });

  // Ouvir eventos de mudança de estado (stateChange)
  useEffect(() => {
    console.log(`StaticDashboardContainer: Configurando listener para eventos stateChange`);

    const handleStateChange = (event: any) => {
      const newUf = event.detail.code.toLowerCase();
      console.log(`StaticDashboardContainer: Evento stateChange recebido para UF: ${newUf}`);

      // Atualizar o estado local sempre que receber um evento stateChange
      // Isso garante que o dashboard responda às mudanças de estado
      console.log(`StaticDashboardContainer: Atualizando UF de ${currentUf} para ${newUf}`);
      setCurrentUf(newUf);

      // Atualizar o localStorage
      localStorage.setItem('estadoEleitoral', newUf);
    };

    // Adicionar o listener
    window.addEventListener('stateChange', handleStateChange);

    // Remover o listener quando o componente for desmontado
    return () => {
      window.removeEventListener('stateChange', handleStateChange);
    };
  }, []);

  // Atualizar a UF quando a prop initialUf mudar
  useEffect(() => {
    if (initialUf !== currentUf) {
      console.log(`StaticDashboardContainer: Prop initialUf mudou de ${currentUf} para ${initialUf}`);
      setCurrentUf(initialUf);
    }
  }, [initialUf, currentUf]);

  // Estado para controlar a exibição do componente de depuração
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="dashboard-container">
      <StaticDashboard uf={currentUf} isDarkMode={isDarkMode} />

      {/* Botão para mostrar/ocultar o componente de depuração */}
      <button
        className={`fixed bottom-4 left-4 p-3 rounded-full shadow-lg z-50 bg-blue-500 text-white`}
        onClick={() => setShowDebug(!showDebug)}
        aria-label="Depuração de Bandeiras"
      >
        <i className="fas fa-flag"></i>
      </button>

      {/* Componente de depuração */}
      {showDebug && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">Depuração de Bandeiras e Dashboards</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowDebug(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-4">
              <FlagDashboardDebug uf={currentUf} />
            </div>
          </div>
        </div>
      )}

      {/* Botão para alternar entre modo claro e escuro */}
      <button
        className={`fixed bottom-4 right-4 p-3 rounded-full shadow-lg z-50 ${
          isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-800'
        }`}
        onClick={() => {
          const newMode = !isDarkMode;
          setIsDarkMode(newMode);
          localStorage.setItem("darkMode", newMode.toString());
          if (newMode) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }}
        aria-label={isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
      >
        <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
      </button>
    </div>
  );
};
