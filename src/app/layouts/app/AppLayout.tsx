import * as React from 'react';
import { useEffect } from 'react';
import { Link, Outlet, useRouter } from '@tanstack/react-router';
import { useMonitoring } from '@/app/monitoring';
import { ArrowLeft, MapPin, Bell } from 'lucide-react';
import { WelcomeModal } from '@/domains/usuario/components';

// Componentes do header
import NavigationMenu from './NavigationMenu';
import SearchPanel from './SearchPanel';
import UserProfile from './UserProfile';
import SettingsPanel from './SettingsPanel';
import DarkModeToggle from './DarkModeToggle';
import StateSelector from './StateSelector';

const AppLayout: React.FC = () => {
  const router = useRouter();
  const { trackAction, addPageProperties } = useMonitoring();

  useEffect(() => {
    // Track page views and add page context
    const unsubscribe = router.subscribe('onLoad', () => {
      const route = router.state?.currentLocation;
      
      // Only proceed if route is defined
      if (route) {
        // Track page view
        trackAction('page_view', {
          path: route.pathname || '/',
          search: route.search || '',
          hash: route.hash || '',
        });

        // Add page context
        addPageProperties({
          currentPath: route.pathname || '/',
          currentRoute: (route.pathname ? route.pathname.split('/')[1] : '') || 'home',
          timestamp: new Date().toISOString(),
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router, trackAction, addPageProperties]);

  const handleBack = () => {
    window.history.back();
  };

  // Função para rastrear a seleção de estado eleitoral
  const handleEstadoEleitoralSelected = () => {
    trackAction('estado_eleitoral_selected', {
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors">
      {/* Modal de boas-vindas para seleção de estado eleitoral */}
      <WelcomeModal onComplete={handleEstadoEleitoralSelected} />
      {/* Header personalizado */}
      <header className="fixed top-0 z-50 w-full border-b border-[#1B2B4E] bg-[#152341] shadow-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl">
          {/* Seção esquerda: Menu e Logo */}
          <div className="flex items-center">
            {/* Menu de navegação */}
            <NavigationMenu />
            
            {/* Logo e título */}
            <Link to="/" className="flex items-center ml-6">
              {/* Título da aplicação */}
              <span className="font-bold text-white text-xl tracking-wide">
                A República: Política de Bolso
              </span>
            </Link>
          </div>
          
          {/* Seção direita: Botões de ação */}
          <div className="flex items-center space-x-4">
            {/* Botão de voltar */}
            <button 
              onClick={handleBack}
              className="p-2 text-white/80 hover:text-white hover:bg-[#1B2B4E] active:bg-[#152341] rounded-md transition-all duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            
            {/* Alternador de modo escuro/claro */}
            <DarkModeToggle />
            
            {/* Botão de localização */}
            <button className="p-2 text-white/80 hover:text-white hover:bg-[#1B2B4E] rounded-md transition-all duration-200">
              <MapPin className="h-5 w-5" />
            </button>
            
            {/* Seletor de estado */}
            <StateSelector />
            
            {/* Botão do Senado */}
            <Link
              to="/senado"
              className="text-white/80 hover:text-white hover:bg-[#1B2B4E] rounded-md px-3 py-1.5 text-sm font-medium flex items-center gap-2 transition-all duration-200"
            >
              <span className="hidden md:inline">Senado</span>
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-blue-500 text-white">S</span>
            </Link>
            
            {/* Botão para a página de teste de dashboard */}
            <Link
              to="/teste-dashboard-simples"
              className="text-white/80 hover:text-white hover:bg-[#1B2B4E] rounded-md px-3 py-1.5 text-sm font-medium flex items-center gap-2 transition-all duration-200"
            >
              <span className="hidden md:inline">Teste Dashboard</span>
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-green-500 text-white">T</span>
            </Link>
            
            {/* Botão para a nova página de teste de dashboard */}
            <Link
              to="/novo-teste-dashboard"
              className="text-white/80 hover:text-white hover:bg-[#1B2B4E] rounded-md px-3 py-1.5 text-sm font-medium flex items-center gap-2 transition-all duration-200"
            >
              <span className="hidden md:inline">Novo Design</span>
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-purple-500 text-white">N</span>
            </Link>
            
            {/* Painel de busca */}
            <SearchPanel />
            
            {/* Botão de notificações */}
            <div className="relative">
              <button className="p-2 text-white/80 hover:text-white hover:bg-[#1B2B4E] rounded-md transition-all duration-200">
                <Bell className="h-5 w-5" />
              </button>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
            
            {/* Perfil do usuário */}
            <UserProfile />
            
            {/* Configurações */}
            <SettingsPanel />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 mt-24 mb-20 flex-grow">
        <Outlet />
      </main>

      {/* Navegação do rodapé */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-800 bg-gray-900 py-2 shadow-lg">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex justify-around">
            <Link to="/" className="flex flex-col items-center p-2 text-blue-400 hover:text-blue-300 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span className="text-xs">Início</span>
            </Link>
            <Link to="/peticoes" className="flex flex-col items-center p-2 text-gray-400 hover:text-gray-300 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
              <span className="text-xs">Petições</span>
            </Link>
            <Link to="/charts" className="flex flex-col items-center p-2 text-gray-400 hover:text-gray-300 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <span className="text-xs">Gráficos</span>
            </Link>
            <Link to="/perfil" className="flex flex-col items-center p-2 text-gray-400 hover:text-gray-300 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="text-xs">Perfil</span>
            </Link>
            <Link to="/admin" className="flex flex-col items-center p-2 text-gray-400 hover:text-gray-300 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span className="text-xs">Admin</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
