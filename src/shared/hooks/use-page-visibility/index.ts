// src/shared/hooks/use-page-visibility/index.ts
import { useEffect, useRef, useState } from 'react';

/**
 * Hook para monitorar a visibilidade da página
 * 
 * Este hook permite que componentes reajam a mudanças na visibilidade da página,
 * como quando o usuário alterna entre abas ou minimiza o navegador.
 * 
 * @returns Um objeto com o estado atual de visibilidade da página
 * 
 * @example
 * const { isVisible, wasVisible } = usePageVisibility();
 * 
 * useEffect(() => {
 *   if (isVisible && !wasVisible) {
 *     // A página acabou de se tornar visível novamente
 *     console.log('Página voltou a ser visível');
 *   }
 * }, [isVisible, wasVisible]);
 */
export function usePageVisibility() {
  // Estado para controlar se a página está visível atualmente
  const [isVisible, setIsVisible] = useState<boolean>(
    document.visibilityState === 'visible'
  );
  
  // Referência para armazenar o estado anterior de visibilidade
  const wasVisibleRef = useRef<boolean>(isVisible);
  
  useEffect(() => {
    // Função para lidar com mudanças na visibilidade da página
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      wasVisibleRef.current = isVisible;
      setIsVisible(visible);
    };
    
    // Adicionar listener para o evento visibilitychange
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Remover listener quando o componente for desmontado
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isVisible]);
  
  // Retornar o estado atual e o estado anterior de visibilidade
  return {
    isVisible,
    wasVisible: wasVisibleRef.current
  };
}

export default usePageVisibility;
