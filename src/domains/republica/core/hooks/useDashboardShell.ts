import { useState, useEffect, useCallback, useMemo } from 'react';
import { todosEstados } from '../components/dashboards/dashboardConfig'; // Ajustar o path se necessário
import usePageVisibility from '@/shared/hooks/use-page-visibility';
import { logger } from '@/app/monitoring/logger'; // Supondo que logger está acessível

interface UseDashboardShellProps {
  initialUf: string;
}

export const useDashboardShell = ({ initialUf }: UseDashboardShellProps) => {
  const [isDarkMode, setIsDarkModeState] = useState<boolean>(() => {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode) {
      return savedMode === "true";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [currentUf, setCurrentUf] = useState<string>(() => {
    const savedUf = localStorage.getItem('estadoEleitoral');
    return savedUf || initialUf || 'br'; // Fallback para 'br' se tudo for nulo
  });

  const [showDebug, setShowDebug] = useState<boolean>(false);
  const { isVisible } = usePageVisibility();

  // Efeito para aplicar a classe 'dark' no HTML e ouvir mudanças no sistema
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem("darkMode", isDarkMode.toString());

    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      // Apenas atualiza se não houver preferência explícita no localStorage
      if (localStorage.getItem("darkMode") === null) {
        setIsDarkModeState(e.matches);
      }
    };
    
    // Listener para mudanças no tema do sistema operacional
    darkModeMediaQuery.addEventListener('change', handleMediaChange);

    // Listener para mudanças na classe do elemento HTML (útil se outro script mudar)
    const observer = new MutationObserver(() => {
        const htmlIsDark = root.classList.contains('dark');
        if (htmlIsDark !== isDarkMode) {
            setIsDarkModeState(htmlIsDark);
        }
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    return () => {
      darkModeMediaQuery.removeEventListener('change', handleMediaChange);
      observer.disconnect();
    };
  }, [isDarkMode]);

  // Efeito para atualizar a UF quando a prop initialUf mudar
  useEffect(() => {
    if (initialUf && initialUf !== currentUf) {
      logger.info(`[useDashboardShell] Prop initialUf mudou de ${currentUf} para ${initialUf}`);
      setCurrentUf(initialUf);
      // Não atualiza o localStorage aqui, pois initialUf é uma prop de entrada,
      // o evento stateChange é o responsável por persistir a UF escolhida pelo usuário.
    }
  }, [initialUf, currentUf]);

  // Efeito para ouvir eventos globais de mudança de estado (UF)
  useEffect(() => {
    const handleStateChange = (event: Event) => {
      if (!isVisible) {
        logger.info('[useDashboardShell] Ignorando evento stateChange porque a página não está visível.');
        return;
      }
      
      const customEvent = event as CustomEvent<{ code: string }>;
      if (customEvent.detail && customEvent.detail.code) {
        const newUf = customEvent.detail.code.toLowerCase();
        logger.info(`[useDashboardShell] Evento stateChange recebido para UF: ${newUf}`);
        if (newUf !== currentUf) {
          setCurrentUf(newUf);
          localStorage.setItem('estadoEleitoral', newUf);
          logger.info(`[useDashboardShell] UF atualizada para ${newUf} e salva no localStorage.`);
        }
      }
    };

    window.addEventListener('stateChange', handleStateChange);
    logger.info('[useDashboardShell] Listener para stateChange configurado.');

    return () => {
      window.removeEventListener('stateChange', handleStateChange);
      logger.info('[useDashboardShell] Listener para stateChange removido.');
    };
  }, [currentUf, isVisible]);

  const validUf = useMemo(() => {
    const ufLower = currentUf?.toLowerCase();
    return ufLower && todosEstados[ufLower] ? ufLower : 'br';
  }, [currentUf]);

  const setIsDarkMode = useCallback((value: boolean | ((prevState: boolean) => boolean)) => {
    setIsDarkModeState(value);
    // A persistência e atualização da classe HTML já são tratadas no useEffect de isDarkMode
  }, []);

  return {
    currentUf, // UF como está, pode não ser válida ainda
    validUf,   // UF validada e padronizada para 'br' se inválida
    isDarkMode,
    setIsDarkMode,
    showDebug,
    setShowDebug,
  };
};
