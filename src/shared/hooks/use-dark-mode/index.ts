// src/shared/hooks/useDarkMode/index.ts
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { logger } from '@/shared/utils/logger';

// Átomo persistente para o tema
export const darkModeAtom = atomWithStorage<boolean>('darkMode', false);

/**
 * Hook para controlar o modo escuro/claro da aplicação
 * 
 * @returns Objeto com o estado atual do tema e função para alternar
 * 
 * @example
 * const { isDarkMode, toggleDarkMode } = useDarkMode();
 * 
 * // Usar o estado
 * <div className={isDarkMode ? 'dark-theme' : 'light-theme'}>
 *   <button onClick={toggleDarkMode}>
 *     Alternar tema
 *   </button>
 * </div>
 */
export const useDarkMode = (): {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
} => {
  const [isDarkMode, setIsDarkMode] = useAtom(darkModeAtom);
  
  const toggleDarkMode = () => {
    try {
      setIsDarkMode(!isDarkMode);
      
      // Opcional: Aplicar classe no documento para estilização global
      if (!isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      logger.error('Erro ao alternar modo escuro:', error);
    }
  };
  
  return {
    isDarkMode,
    toggleDarkMode
  };
};

export default useDarkMode;