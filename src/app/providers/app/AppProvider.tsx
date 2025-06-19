import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the context type
interface AppContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  selectedUF: string;
  setSelectedUF: (uf: string) => void;
}

// Create the context with default values
const AppContext = createContext<AppContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {},
  isLoading: false,
  setIsLoading: () => {},
  selectedUF: 'BR',
  setSelectedUF: () => {},
});

// Props for the provider component
interface AppProviderProps {
  children: ReactNode;
}

// Provider component
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Initialize dark mode from localStorage or system preference
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      return savedMode === 'true';
    }
    return false; // Default to light mode
  });

  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Selected UF (state)
  const [selectedUF, setSelectedUF] = useState<string>('BR');

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Update localStorage and apply class when dark mode changes
  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode.toString());
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Context value
  const value = {
    isDarkMode,
    toggleDarkMode,
    isLoading,
    setIsLoading,
    selectedUF,
    setSelectedUF,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  
  return context;
};

export default AppContext;