import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { DashboardUnificado } from './index';
import { todosEstados } from './dashboardConfig';

interface DashboardUnificadoUFProps {
  uf: string;
}

const DashboardUnificadoUF: React.FC<DashboardUnificadoUFProps> = ({ uf: initialUf }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Usar a UF passada como prop como estado inicial (garantindo que seja minúscula)
  const [currentUf, setCurrentUf] = useState(initialUf.toLowerCase());
  
  // Sincronizar com o tema do sistema e do cabeçalho
  useEffect(() => {
    // Verificar se há uma preferência salva no localStorage (definida pelo DarkModeToggle)
    const checkDarkMode = () => {
      const savedMode = localStorage.getItem("darkMode");
      if (savedMode) {
        setIsDarkMode(savedMode === "true");
      } else {
        // Se não houver preferência salva, usar a preferência do sistema
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setIsDarkMode(prefersDark);
      }
    };
    
    // Verificar inicialmente
    checkDarkMode();
    
    // Verificar quando o documento mudar (quando o DarkModeToggle alterar o tema)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setIsDarkMode(isDark);
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    // Verificar quando a preferência do sistema mudar
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      // Só aplicar se não houver preferência salva
      if (!localStorage.getItem("darkMode")) {
        setIsDarkMode(e.matches);
      }
    };
    
    darkModeMediaQuery.addEventListener('change', handleMediaChange);
    
    return () => {
      observer.disconnect();
      darkModeMediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);
  
  // Ouvir eventos de mudança de estado
  useEffect(() => {
    const handleStateChange = (event: CustomEvent) => {
      const newUf = event.detail.code.toLowerCase();
      console.log(`DashboardUnificadoUF: Estado alterado para: ${newUf} (anterior: ${currentUf})`);
      
      // Atualizar o estado com a nova UF
      setCurrentUf(newUf);
    };
    
    // Registrar o evento de mudança de estado
    console.log('DashboardUnificadoUF: Registrando listener para stateChange');
    window.addEventListener('stateChange' as any, handleStateChange as EventListener);
    
    // Não disparamos mais o evento inicial para evitar loops e sobreposições
    
    return () => {
      console.log('DashboardUnificadoUF: Removendo listener para stateChange');
      window.removeEventListener('stateChange' as any, handleStateChange as EventListener);
    };
  }, [currentUf]);
  
  // Verificar se a UF é válida (incluindo 'br' para Brasil)
  const validUf = currentUf in todosEstados ? currentUf : 'br';
  const ufNome = todosEstados[validUf];
  
  return (
    <div className="dashboard-container">
      {/* Renderizar o dashboard unificado */}
      <DashboardUnificado uf={validUf} isDarkMode={isDarkMode} />
      
      {/* Botão para alternar entre modo claro e escuro */}
      <button
        className={`fixed bottom-4 right-4 p-3 rounded-full shadow-lg z-50 ${
          isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-800'
        }`}
        onClick={() => {
          // Alternar o tema
          const newMode = !isDarkMode;
          setIsDarkMode(newMode);
          
          // Sincronizar com o localStorage e o tema do documento
          localStorage.setItem("darkMode", newMode.toString());
          
          // Aplicar classe ao documento para sincronizar com o cabeçalho
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

export default DashboardUnificadoUF;
