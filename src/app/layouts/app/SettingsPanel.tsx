import React from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetTitle 
} from "@/shared/components/ui/sheet/index";
import { Settings } from "lucide-react";

interface SettingsPanelProps {}

export const SettingsPanel: React.FC<SettingsPanelProps> = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="p-2 text-white hover:bg-[#234780] rounded-md">
          <Settings className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent className="bg-gray-900 text-white">
        <SheetTitle className="text-white">Configurações</SheetTitle>
        <div className="flex flex-col gap-4 mt-8">
          <p className="text-gray-400">
            Painel de configurações em desenvolvimento.
          </p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-300">Aparência</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Modo escuro</span>
                <div className="w-10 h-5 bg-blue-600 rounded-full relative">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-gray-300">Notificações</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Ativar notificações</span>
                <div className="w-10 h-5 bg-blue-600 rounded-full relative">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-gray-300">Privacidade</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Compartilhar dados de uso</span>
                <div className="w-10 h-5 bg-gray-600 rounded-full relative">
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsPanel;
