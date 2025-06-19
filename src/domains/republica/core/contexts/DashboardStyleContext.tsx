import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Definir os tipos de estilo disponíveis
export type DashboardStyle = 'colorido' | 'branco';

// Interface do contexto
interface DashboardStyleContextType {
  style: DashboardStyle;
  setStyle: (style: DashboardStyle) => void;
  toggleStyle: () => void;
}

// Criar o contexto com um valor padrão
const DashboardStyleContext = createContext<DashboardStyleContextType>({
  style: 'colorido',
  setStyle: () => {},
  toggleStyle: () => {},
});

// Hook personalizado para usar o contexto
export const useDashboardStyle = () => useContext(DashboardStyleContext);

// Props do provider
interface DashboardStyleProviderProps {
  children: ReactNode;
}

// Provider component
export const DashboardStyleProvider: React.FC<DashboardStyleProviderProps> = ({ children }) => {
  // Inicializar o estilo a partir do localStorage ou usar o padrão
  const [style, setStyle] = useState<DashboardStyle>(() => {
    const savedStyle = localStorage.getItem('dashboardStyle');
    return (savedStyle as DashboardStyle) || 'colorido';
  });

  // Função para alternar entre os estilos
  const toggleStyle = () => {
    setStyle(prevStyle => prevStyle === 'colorido' ? 'branco' : 'colorido');
  };

  // Salvar a preferência no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('dashboardStyle', style);
  }, [style]);

  return (
    <DashboardStyleContext.Provider value={{ style, setStyle, toggleStyle }}>
      {children}
    </DashboardStyleContext.Provider>
  );
};
