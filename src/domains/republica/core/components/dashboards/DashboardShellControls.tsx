import React from 'react';

interface DashboardShellControlsProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean | ((prevState: boolean) => boolean)) => void;
}

export const DashboardShellControls: React.FC<DashboardShellControlsProps> = ({
  isDarkMode,
  setIsDarkMode,
}) => {
  return (
    <>
      {/* Botão para alternar entre modo claro e escuro */}
      <button
        className={`fixed bottom-4 right-4 p-3 rounded-full shadow-lg z-50 transition-colors ${
          isDarkMode
            ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
            : 'bg-white text-gray-800 hover:bg-gray-200'
        }`}
        onClick={() => setIsDarkMode(!isDarkMode)}
        aria-label={isDarkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
      >
        <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'} text-lg`}></i>
      </button>
    </>
  );
};
