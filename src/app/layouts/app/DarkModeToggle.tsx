import React from "react";
import { Moon, Sun } from "lucide-react";
import { useDarkMode } from "../../contexts/DarkModeContext";

interface DarkModeToggleProps {}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <button 
      onClick={toggleDarkMode}
      className="p-2 text-white hover:bg-congress-dark dark:hover:bg-congress-dark-accent rounded-md transition-colors"
      aria-label={isDarkMode ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5 text-yellow-300" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
};

export default DarkModeToggle;
