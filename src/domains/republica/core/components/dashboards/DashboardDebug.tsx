/**
 * Arquivo unificado de componentes de depuração e teste para dashboards
 * Contém: FlagDashboardDebug, TestDashboard
 */
import { useState, useEffect } from 'react';
import { Flag } from '../../models/Flag';

// ============= FlagDashboardDebug =============
interface FlagDashboardDebugProps {
  uf?: string;
}

export const FlagDashboardDebug = ({ uf = 'br' }: FlagDashboardDebugProps) => {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [selectedFlag, setSelectedFlag] = useState<Flag | null>(null);
  const [dashboardKeys, setDashboardKeys] = useState<string[]>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [newDashboardKey, setNewDashboardKey] = useState<string>('');

  // Carregar todas as bandeiras
  useEffect(() => {
    // Importar o flagService dinamicamente para evitar problemas de "require is not defined"
    import('../../services/FlagService').then(module => {
      const flagService = module.flagService;

      const allFlags = flagService.getAllFlags();
      setFlags(allFlags);

      // Selecionar a bandeira atual
      const currentFlag = flagService.getFlag(uf);
      if (currentFlag) {
        setSelectedFlag(currentFlag);
        setDashboardKeys(currentFlag.dashboardKeys || []);
      }

      // Atualizar informações de depuração
      setDebugInfo(flagService.debug());
    }).catch(error => {
      console.error('Erro ao importar flagService:', error);
    });
  }, [uf]);

  // Função para vincular dashboards a uma bandeira
  const handleLinkDashboards = () => {
    if (!selectedFlag) return;

    import('../../services/FlagService').then(module => {
      const flagService = module.flagService;

      // Vincular os dashboards à bandeira
      flagService.linkFlagToDashboards(selectedFlag.code, dashboardKeys);

      // Atualizar informações de depuração
      setDebugInfo(flagService.debug());

      // Disparar evento de mudança de estado para atualizar os componentes
      const stateChangeEvent = new CustomEvent('stateChange', {
        detail: {
          code: selectedFlag.code,
          name: selectedFlag.name,
          dashboardKeys: dashboardKeys,
          flag: selectedFlag
        }
      });

      window.dispatchEvent(stateChangeEvent);

      alert(`Dashboards vinculados à bandeira ${selectedFlag.name} com sucesso!`);
    }).catch(error => {
      console.error('Erro ao importar flagService:', error);
    });
  };

  // Função para selecionar uma bandeira
  const handleSelectFlag = (code: string) => {
    import('../../services/FlagService').then(module => {
      const flagService = module.flagService;

      const flag = flagService.getFlag(code);
      if (flag) {
        setSelectedFlag(flag);
        setDashboardKeys(flag.dashboardKeys || []);
      }
    }).catch(error => {
      console.error('Erro ao importar flagService:', error);
    });
  };

  // Função para adicionar uma chave de dashboard
  const handleAddDashboardKey = () => {
    if (newDashboardKey.trim() !== '') {
      if (!dashboardKeys.includes(newDashboardKey)) {
        setDashboardKeys([...dashboardKeys, newDashboardKey]);
      }
      setNewDashboardKey('');
    } else {
      // Se o campo estiver vazio, mostrar um prompt para o usuário inserir a chave
      const key = prompt('Digite a chave do dashboard (ex: cg-rj, ale-sp, gov-br):');
      if (key && key.trim() !== '' && !dashboardKeys.includes(key)) {
        setDashboardKeys([...dashboardKeys, key]);
      }
    }
  };

  // Função para remover uma chave de dashboard
  const handleRemoveDashboardKey = (key: string) => {
    setDashboardKeys(dashboardKeys.filter(k => k !== key));
  };

  return (
    <div className="flag-dashboard-debug">
      <h2 className="text-xl font-bold mb-4">Depuração de Bandeiras e Dashboards</h2>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Bandeiras Disponíveis</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {flags.map(flag => (
            <button
              key={flag.code}
              className={`p-2 rounded border ${
                selectedFlag?.code === flag.code
                  ? 'bg-blue-500 text-white border-blue-700'
                  : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
              }`}
              onClick={() => handleSelectFlag(flag.code)}
            >
              {flag.name} ({flag.code.toUpperCase()})
            </button>
          ))}
        </div>
      </div>

      {selectedFlag && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Dashboards Vinculados</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {dashboardKeys.map(key => (
              <div key={key} className="bg-blue-100 px-2 py-1 rounded flex items-center">
                <span>{key}</span>
                <button
                  className="ml-2 text-red-500"
                  onClick={() => handleRemoveDashboardKey(key)}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              className="border rounded px-2 py-1 flex-grow"
              placeholder="Nova chave de dashboard (ex: cg-rj)"
              value={newDashboardKey}
              onChange={(e) => setNewDashboardKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddDashboardKey();
                }
              }}
            />
            <button
              className="bg-green-500 text-white px-3 py-1 rounded"
              onClick={handleAddDashboardKey}
            >
              Adicionar
            </button>
          </div>

          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={handleLinkDashboards}
          >
            Vincular Dashboards
          </button>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Informações de Depuração</h3>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60 text-sm">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
};

// TestDashboard removido
