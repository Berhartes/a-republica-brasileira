import React, { useEffect, useState, useRef } from 'react';
import { Link, Outlet, useRouter } from '@tanstack/react-router';
import { useMonitoring } from '@/app/monitoring';
import { ArrowLeft, MapPin, Bell } from 'lucide-react';
import { WelcomeModal } from '@/domains/usuario/components';
import usePageVisibility from '@/shared/hooks/use-page-visibility';

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

  // Estado global da UF
  const [uf, setUf] = useState(() => localStorage.getItem('estadoEleitoral') || 'br');

  // Variável para controlar se é a primeira montagem
  const isFirstMount = useRef(true);

  // Usar o hook de visibilidade da página
  const { isVisible } = usePageVisibility();

  // Disparar evento stateChange quando a UF mudar
  useEffect(() => {

    // Encontrar a flag completa para a UF atual
    const findFlag = () => {
      const lowerUf = uf.toLowerCase();

      // Mapeamento de códigos para nomes completos
      const stateNames: Record<string, string> = {
        'br': 'Brasil',
        'rj': 'Rio de Janeiro',
        'sp': 'São Paulo',
        'mg': 'Minas Gerais',
        'es': 'Espírito Santo',
        'ac': 'Acre',
        'al': 'Alagoas',
        'ap': 'Amapá',
        'am': 'Amazonas',
        'ba': 'Bahia',
        'ce': 'Ceará',
        'df': 'Distrito Federal',
        'go': 'Goiás',
        'ma': 'Maranhão',
        'mt': 'Mato Grosso',
        'ms': 'Mato Grosso do Sul',
        'pa': 'Pará',
        'pb': 'Paraíba',
        'pr': 'Paraná',
        'pe': 'Pernambuco',
        'pi': 'Piauí',
        'rn': 'Rio Grande do Norte',
        'rs': 'Rio Grande do Sul',
        'ro': 'Rondônia',
        'rr': 'Roraima',
        'sc': 'Santa Catarina',
        'se': 'Sergipe',
        'to': 'Tocantins'
      };

      // Determinar a URL da bandeira com base no código do estado
      let flagUrl = '/flags/brazil/flag_circle_brazil.png'; // Padrão para Brasil e estados sem bandeira específica

      if (lowerUf === 'rj') {
        flagUrl = '/flags/estados/rio-de-janeiro/flag_circle_rio_de_janeiro-removebg-preview.png';
      } else if (lowerUf === 'sp') {
        flagUrl = '/flags/estados/sao-paulo/flag_circle_sao_paulo.png';
      } else if (lowerUf === 'mg') {
        flagUrl = '/flags/estados/minas-gerais/flag_circle_minas_gerais.png';
      } else if (lowerUf === 'es') {
        flagUrl = '/flags/estados/espirito-santo/flag_circle_espírito_santo.png';
      }

      // Criar a flag com o nome correto e URL da bandeira
      return {
        code: lowerUf,
        name: stateNames[lowerUf] || lowerUf.toUpperCase(),
        flagUrl: flagUrl
      };
    };

    // Função para disparar o evento stateChange
    const dispatchStateChangeEvent = () => {
      console.log(`AppLayout: Preparando evento stateChange para UF: ${uf}`);
      const flag = findFlag();

      // Disparar evento stateChange com informações completas
      const stateChangeEvent = new CustomEvent('stateChange', {
        detail: {
          code: uf,
          name: flag.name,
          flagUrl: flag.flagUrl,
          flag: flag, // Incluir a flag completa
          dashboardKeys: [`cg-${uf}`, `ale-${uf}`, `gov-${uf}`] // Chaves padrão
        }
      });

      console.log(`AppLayout: Disparando evento stateChange para UF: ${uf} com flag:`, flag);
      window.dispatchEvent(stateChangeEvent);
    };

    // Só disparar o evento na primeira montagem ou quando a UF mudar explicitamente
    if (isFirstMount.current) {
      // Pequeno atraso para garantir que outros componentes já estejam montados
      setTimeout(() => {
        dispatchStateChangeEvent();
      }, 200);
      isFirstMount.current = false;
    } else {
      // Verificar se a página está visível antes de disparar o evento
      // Isso evita recargas desnecessárias quando a página ganha foco após Alt+Tab
      if (isVisible) {
        // Se não for a primeira montagem, só dispara se a UF mudou explicitamente
        dispatchStateChangeEvent();
      } else {
        console.log(`AppLayout: Evento stateChange não disparado porque a página não está visível`);
      }
    }
  }, [uf]);

  useEffect(() => {
    // Track page views and add page context
    const unsubscribe = router.subscribe('onLoad', () => {
      const route = router.state.location;

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
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors">
      {/* Modal de boas-vindas para seleção de estado eleitoral */}
      <WelcomeModal onComplete={handleEstadoEleitoralSelected} />
      {/* Header personalizado */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-congress-primary dark:bg-congress-dark-primary">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          {/* Seção esquerda: Menu e Logo */}
          <div className="flex items-center">
            {/* Menu de navegação */}
            <NavigationMenu />

            {/* Logo e título */}
            <Link to="/" className="flex items-center space-x-2">
              {/* Logo com fundo branco circular */}
              <div className="w-8 h-8 bg-white rounded-full items-center justify-center shadow-lg hidden sm:flex">
                <img
                  src="/logo/logo.png"
                  alt="Logo da República Brasileira"
                  className="w-6 h-6 object-contain transform hover:scale-105 transition-transform"
                  onError={(e) => {
                    console.log('Erro ao carregar a logo');
                    (e.target as HTMLImageElement).src = '/flags/brazil/flag_circle_brazil.png';
                  }}
                />
              </div>

              {/* Título da aplicação */}
              <span className="font-bold text-white">
                A República: Política de Bolso
              </span>
            </Link>
          </div>

          {/* Seção direita: Botões de ação */}
          <div className="flex items-center space-x-2">
            {/* Botão de voltar */}
            <button
              onClick={handleBack}
              className="p-2 text-white hover:bg-congress-dark dark:hover:bg-congress-dark-accent rounded-md transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            {/* Alternador de modo escuro/claro */}
            <DarkModeToggle />

            {/* Botão de localização */}
            <button className="p-2 text-white hover:bg-congress-dark dark:hover:bg-congress-dark-accent rounded-md transition-colors">
              <MapPin className="h-5 w-5" />
            </button>

            {/* Seletor de estado vinculado ao estado global */}
            <StateSelector onStateChange={(state: { code: string }) => {
              setUf(state.code.toLowerCase());
              localStorage.setItem('estadoEleitoral', state.code.toLowerCase());
            }} />

            {/* Botão do Senado */}
            <Link
              to="/senado"
              className="text-white hover:bg-congress-dark dark:hover:bg-congress-dark-accent rounded-md px-3 py-1.5 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              <span className="hidden md:inline">Senado</span>
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-blue-500 text-white">S</span>
            </Link>

            {/* Botão para a página de teste de dashboard */}
            <Link
              to="/teste-dashboard-simples"
              className="text-white hover:bg-congress-dark dark:hover:bg-congress-dark-accent rounded-md px-3 py-1.5 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              <span className="hidden md:inline">Teste Dashboard</span>
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-green-500 text-white">T</span>
            </Link>

            {/* Botão para a nova página de teste de dashboard */}
            <Link
              to="/novo-teste-dashboard"
              className="text-white hover:bg-congress-dark dark:hover:bg-congress-dark-accent rounded-md px-3 py-1.5 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              <span className="hidden md:inline">Novo Design</span>
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-purple-500 text-white">N</span>
            </Link>

            {/* Botão para a página de dashboards de backup */}
            <Link
              to="/dashbackup"
              className="text-white hover:bg-congress-dark dark:hover:bg-congress-dark-accent rounded-md px-3 py-1.5 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              <span className="hidden md:inline">Dashboards Backup</span>
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-orange-500 text-white">B</span>
            </Link>

            {/* Painel de busca */}
            <SearchPanel />

            {/* Botão de notificações */}
            <div className="relative">
              <button className="p-2 text-white hover:bg-congress-dark dark:hover:bg-congress-dark-accent rounded-md transition-colors">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Renderiza as páginas filhas */}
        <Outlet />
      </main>

      {/* Navegação do rodapé */}
      <footer className="fixed bottom-0 w-full border-t border-gray-800 bg-gray-900 py-2">
        <div className="container mx-auto px-4">
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
