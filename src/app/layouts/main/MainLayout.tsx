import React from 'react';
import { useTheme } from '@/app/providers/theme';

// Definindo a interface para as props do componente
interface MainLayoutProps {
  children: React.ReactNode;
}

// Componente de layout principal
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <div className="transition-colors duration-200">
      <main 
        className={`
          max-w-7xl mx-auto space-y-8 min-h-screen 
          ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'}
          p-4 sm:p-8 transition-colors
        `}
      >
        {children}
      </main>
    </div>
  );
};

export default MainLayout;