import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle
} from "@/shared/components/ui/sheet/index";
import { Settings } from "lucide-react";
import { useDashboardStyle } from "@/domains/congresso/contexts/DashboardStyleContext";

interface SettingsPanelProps {}

export const SettingsPanel: React.FC<SettingsPanelProps> = () => {
  // Estado para controlar o modo escuro
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode === "true";
  });

  // Estado para controlar notificações
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const savedNotifications = localStorage.getItem("notificationsEnabled");
    return savedNotifications !== "false"; // Ativado por padrão
  });

  // Estado para controlar compartilhamento de dados
  const [shareDataEnabled, setShareDataEnabled] = useState(() => {
    const savedShareData = localStorage.getItem("shareDataEnabled");
    return savedShareData === "true"; // Desativado por padrão
  });

  // Usar o contexto de estilo do dashboard
  const { style, toggleStyle } = useDashboardStyle();

  // Atualizar o modo escuro quando mudar
  useEffect(() => {
    localStorage.setItem("darkMode", isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Atualizar as notificações quando mudar
  useEffect(() => {
    localStorage.setItem("notificationsEnabled", notificationsEnabled.toString());
  }, [notificationsEnabled]);

  // Atualizar o compartilhamento de dados quando mudar
  useEffect(() => {
    localStorage.setItem("shareDataEnabled", shareDataEnabled.toString());
  }, [shareDataEnabled]);

  // Função para alternar um switch
  const toggleSwitch = (current: boolean, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(!current);
  };

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
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-300">Aparência</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Modo escuro</span>
                <button
                  className={`w-10 h-5 rounded-full relative ${isDarkMode ? 'bg-blue-600' : 'bg-gray-600'}`}
                  onClick={() => toggleSwitch(isDarkMode, setIsDarkMode)}
                  aria-pressed={isDarkMode}
                  role="switch"
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                      isDarkMode ? 'right-0.5' : 'left-0.5'
                    }`}
                  ></div>
                </button>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-400">Estilo dos dashboards</span>
                <div className="flex items-center space-x-2">
                  <button
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      style === 'colorido'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => style !== 'colorido' && toggleStyle()}
                    title="Cards com fundo branco"
                  >
                    Estilo 1 (Branco)
                  </button>
                  <button
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      style === 'branco'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    onClick={() => style !== 'branco' && toggleStyle()}
                    title="Cards com fundo colorido/transparente"
                  >
                    Estilo 2 (Colorido)
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-gray-300">Notificações</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Ativar notificações</span>
                <button
                  className={`w-10 h-5 rounded-full relative ${notificationsEnabled ? 'bg-blue-600' : 'bg-gray-600'}`}
                  onClick={() => toggleSwitch(notificationsEnabled, setNotificationsEnabled)}
                  aria-pressed={notificationsEnabled}
                  role="switch"
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                      notificationsEnabled ? 'right-0.5' : 'left-0.5'
                    }`}
                  ></div>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-gray-300">Privacidade</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Compartilhar dados de uso</span>
                <button
                  className={`w-10 h-5 rounded-full relative ${shareDataEnabled ? 'bg-blue-600' : 'bg-gray-600'}`}
                  onClick={() => toggleSwitch(shareDataEnabled, setShareDataEnabled)}
                  aria-pressed={shareDataEnabled}
                  role="switch"
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                      shareDataEnabled ? 'right-0.5' : 'left-0.5'
                    }`}
                  ></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsPanel;
