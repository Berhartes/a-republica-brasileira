/**
 * Modal de boas-vindas para novos usuários
 * Solicita que o usuário selecione seu estado eleitoral
 */

import React, { useState, useEffect } from 'react';
import { usePerfil } from '@/domains/usuario/hooks';
import { estadoEleitoralService } from '@/domains/usuario/services';
import { todosEstados } from '@/domains/congresso/components/Dashboards/dashboardConfig';

// Importar componentes UI
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/shared/components/ui/sheet/index';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/components/ui/select/index';
import { Button } from '@/shared/components/ui/button/index';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner/index';

export interface WelcomeModalProps {
  onComplete?: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<string>('br');
  const [isLoading, setIsLoading] = useState(false);
  
  const { perfil, atualizarConfiguracoes } = usePerfil();

  // Verificar se é a primeira visita
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedWelcome');
    const hasEstadoEleitoral = localStorage.getItem('estadoEleitoral');
    
    // Mostrar o modal se for a primeira visita ou se não tiver estado eleitoral definido
    if (!hasVisited || !hasEstadoEleitoral) {
      setIsOpen(true);
    }
  }, []);

  // Função para salvar o estado eleitoral
  const handleSaveState = async () => {
    setIsLoading(true);
    
    try {
      // Salvar no localStorage e disparar evento
      estadoEleitoralService.setEstadoEleitoral(selectedState);
      
      // Marcar como visitado
      localStorage.setItem('hasVisitedWelcome', 'true');
      
      // Salvar no perfil do usuário se estiver autenticado
      if (atualizarConfiguracoes && perfil) {
        const configData = estadoEleitoralService.criarConfigAtualizacao(selectedState, perfil);
        await atualizarConfiguracoes(configData);
      }
      
      // Fechar o modal
      setIsOpen(false);
      onComplete?.();
    } catch (error) {
      console.error('Erro ao salvar estado eleitoral:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para pular a seleção
  const handleSkip = () => {
    // Marcar como visitado mesmo que o usuário pule
    localStorage.setItem('hasVisitedWelcome', 'true');
    
    // Usar Brasil como padrão
    estadoEleitoralService.setEstadoEleitoral('br');
    
    // Fechar o modal
    setIsOpen(false);
    onComplete?.();
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Bem-vindo à República Brasileira</SheetTitle>
          <SheetDescription>
            Para personalizar sua experiência, selecione seu estado eleitoral.
            Isso nos ajudará a mostrar informações relevantes para você.
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6">
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label htmlFor="estado-eleitoral" className="text-sm font-medium">
                Estado Eleitoral
              </label>
              <div className="relative">
                <select
                  id="estado-eleitoral"
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="br">Brasil (Nacional)</option>
                  
                  {/* Região Sudeste */}
                  <option value="es">Espírito Santo</option>
                  <option value="mg">Minas Gerais</option>
                  <option value="rj">Rio de Janeiro</option>
                  <option value="sp">São Paulo</option>
                  
                  {/* Outras regiões */}
                  {Object.entries(todosEstados)
                    .filter(([uf]) => !['br', 'es', 'mg', 'rj', 'sp'].includes(uf))
                    .map(([uf, nome]) => (
                      <option key={uf} value={uf}>
                        {nome}
                      </option>
                    ))}
                </select>
              </div>
              
              <p className="text-sm text-muted-foreground mt-2">
                Este estado será usado como padrão ao abrir a aplicação.
                Você poderá alterá-lo a qualquer momento nas configurações.
              </p>
            </div>
          </div>
        </div>
        
        <SheetFooter className="flex justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleSkip}
            disabled={isLoading}
          >
            Pular por enquanto
          </Button>
          
          <Button
            type="button"
            onClick={handleSaveState}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Salvando...
              </>
            ) : 'Confirmar'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default WelcomeModal;
