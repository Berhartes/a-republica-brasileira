import React, { useState, useEffect, useMemo } from "react";
import { usePerfil } from "@/domains/usuario/hooks";
import { estadoEleitoralService } from "@/domains/usuario/services";
import { Flag } from "@/domains/congresso/models/Flag";

// Use the Flag model from our domain
type StateOption = Flag;

// Definir opções de estado padrão
const DEFAULT_BRAZIL_OPTION: StateOption = {
  code: 'BR',
  name: 'Brasil',
  flagUrl: '/flags/brazil/flag_circle_brazil.png',
  dashboardKeys: ['cg-br', 'ale-br', 'gov-br']
};

interface StateSelectorProps {
  onStateChange?: (state: StateOption) => void;
}

export const StateSelector: React.FC<StateSelectorProps> = ({
  onStateChange
}) => {
  const [selectedState, setSelectedState] = useState<StateOption>(DEFAULT_BRAZIL_OPTION);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedRegions, setExpandedRegions] = useState<string[]>(['southeast']);

  // Estados para armazenar as bandeiras
  const [brazilOption, setBrazilOption] = useState<StateOption>(DEFAULT_BRAZIL_OPTION);
  const [southeastStates, setSoutheastStates] = useState<StateOption[]>([]);
  const [northStates, setNorthStates] = useState<StateOption[]>([]);
  const [northeastStates, setNortheastStates] = useState<StateOption[]>([]);
  const [centralWestStates, setCentralWestStates] = useState<StateOption[]>([]);
  const [southStates, setSouthStates] = useState<StateOption[]>([]);

  // Inicializar as bandeiras
  useEffect(() => {
    // Importar o flagService
    import('@/domains/congresso/services/FlagService').then(module => {
      const flagService = module.flagService;

      // Inicializar a bandeira do Brasil
      const brFlag = flagService.getFlag('BR') || DEFAULT_BRAZIL_OPTION;
      setBrazilOption(brFlag);

      // Inicializar as bandeiras do Sudeste
      const seStates = [
        flagService.getFlag('RJ'),
        flagService.getFlag('SP'),
        flagService.getFlag('MG'),
        flagService.getFlag('ES')
      ].filter(Boolean) as StateOption[];
      setSoutheastStates(seStates);

      // Inicializar as bandeiras do Norte
      const nStates = [
        flagService.getFlag('AC'),
        flagService.getFlag('AP'),
        flagService.getFlag('AM'),
        flagService.getFlag('PA'),
        flagService.getFlag('RO'),
        flagService.getFlag('RR'),
        flagService.getFlag('TO')
      ].filter(Boolean) as StateOption[];
      setNorthStates(nStates);

      // Inicializar as bandeiras do Nordeste
      const neStates = [
        flagService.getFlag('AL'),
        flagService.getFlag('BA'),
        flagService.getFlag('CE'),
        flagService.getFlag('MA'),
        flagService.getFlag('PB'),
        flagService.getFlag('PE'),
        flagService.getFlag('PI'),
        flagService.getFlag('RN'),
        flagService.getFlag('SE')
      ].filter(Boolean) as StateOption[];
      setNortheastStates(neStates);

      // Inicializar as bandeiras do Centro-Oeste
      const cwStates = [
        flagService.getFlag('DF'),
        flagService.getFlag('GO'),
        flagService.getFlag('MT'),
        flagService.getFlag('MS')
      ].filter(Boolean) as StateOption[];
      setCentralWestStates(cwStates);

      // Inicializar as bandeiras do Sul
      const sStates = [
        flagService.getFlag('PR'),
        flagService.getFlag('RS'),
        flagService.getFlag('SC')
      ].filter(Boolean) as StateOption[];
      setSouthStates(sStates);

      // Inicializar o estado selecionado
      const localEstado = localStorage.getItem('estadoEleitoral');
      if (localEstado) {
        const state = findSelectedState(localEstado, brFlag, seStates, nStates, neStates, cwStates, sStates);
        setSelectedState(state);
      }
    }).catch(error => {
      console.error('Erro ao importar flagService:', error);
    });
  }, []);

  // Usar o hook usePerfil para acessar e atualizar o perfil do usuário
  const { perfil, atualizarConfiguracoes } = usePerfil();

  // Encontrar o estado selecionado
  const findSelectedState = (
    code: string,
    brOption = brazilOption,
    seStates = southeastStates,
    nStates = northStates,
    neStates = northeastStates,
    cwStates = centralWestStates,
    sStates = southStates
  ): StateOption => {
    // Verificar primeiro nos estados do sudeste
    const southeastState = seStates.find(state => state?.code?.toLowerCase() === code.toLowerCase());
    if (southeastState) return southeastState;

    // Verificar em todos os outros estados
    const allStates = [
      ...nStates,
      ...neStates,
      ...cwStates,
      ...sStates
    ];

    const otherState = allStates.find(state => state?.code?.toLowerCase() === code.toLowerCase());
    if (otherState) return otherState;

    // Se não encontrar, retornar o Brasil
    if (code.toLowerCase() === 'br') return brOption;

    // Padrão para o primeiro estado do sudeste se nada for encontrado
    return seStates[0] || DEFAULT_BRAZIL_OPTION;
  };

  // Atualizar o estado selecionado quando o selectedUF mudar
  useEffect(() => {
    const handleStateChange = (event: CustomEvent) => {
      const newCode = event.detail.code.toLowerCase();
      console.log(`StateSelector: Recebido evento stateChange para UF: ${newCode}`);

      // Se o evento incluir a flag completa, usá-la diretamente
      if (event.detail.flag) {
        console.log(`StateSelector: Usando flag do evento para ${newCode}`);
        setSelectedState(event.detail.flag);
      } else {
        // Caso contrário, buscar a flag usando findSelectedState
        console.log(`StateSelector: Buscando flag para ${newCode}`);
        setSelectedState(findSelectedState(newCode));
      }

      // Expandir a região do estado selecionado
      const region = getStateRegion(newCode);
      if (region && !expandedRegions.includes(region)) {
        setExpandedRegions([...expandedRegions, region]);
      }
    };

    window.addEventListener('stateChange' as any, handleStateChange as EventListener);

    return () => {
      window.removeEventListener('stateChange' as any, handleStateChange as EventListener);
    };
  }, [expandedRegions]);

  // Determinar a região de um estado
  const getStateRegion = (code: string): string | null => {
    code = code.toUpperCase();
    if (southeastStates.some(state => state?.code === code)) return 'southeast';
    if (northStates.some(state => state?.code === code)) return 'north';
    if (northeastStates.some(state => state?.code === code)) return 'northeast';
    if (centralWestStates.some(state => state?.code === code)) return 'central-west';
    if (southStates.some(state => state?.code === code)) return 'south';
    return null;
  };

  // Inicializar o estado selecionado com base no perfil do usuário ou localStorage
  useEffect(() => {
    // Importar o flagService
    import('@/domains/congresso/services/FlagService').then(module => {
      const flagService = module.flagService;

      // Tentar obter do localStorage primeiro (para usuários não autenticados)
      const localEstado = localStorage.getItem('estadoEleitoral');
      let stateToUse: StateOption;

      if (localEstado) {
        console.log(`StateSelector: Usando estado eleitoral do localStorage: ${localEstado}`);
        stateToUse = findSelectedState(localEstado);
        setSelectedState(stateToUse);
      } else if (perfil && perfil.estadoEleitoral) {
        // Se não houver no localStorage, tentar obter do perfil
        const estadoUf = perfil.estadoEleitoral.toLowerCase();
        console.log(`StateSelector: Usando estado eleitoral do perfil: ${estadoUf}`);
        stateToUse = findSelectedState(estadoUf);
        setSelectedState(stateToUse);

        // Salvar no localStorage também
        localStorage.setItem('estadoEleitoral', estadoUf);
      } else {
        // Se não houver estado eleitoral definido, usar Brasil como padrão
        console.log('StateSelector: Nenhum estado eleitoral definido, usando Brasil como padrão');
        stateToUse = brazilOption;
        setSelectedState(stateToUse);

        // Não salvamos 'br' no localStorage para que o modal de boas-vindas apareça
      }

      // Garantir que a bandeira tenha dashboards associados
      const stateCode = stateToUse.code.toLowerCase();
      if (!stateToUse.dashboardKeys || stateToUse.dashboardKeys.length === 0) {
        // Se a bandeira não tiver dashboards associados, criar uma associação explícita
        const defaultDashboardKeys = [`cg-${stateCode}`, `ale-${stateCode}`, `gov-${stateCode}`];
        flagService.linkFlagToDashboards(stateCode, defaultDashboardKeys);

        // Atualizar o estado com a bandeira atualizada
        const newState = flagService.getFlag(stateCode);
        if (newState) {
          stateToUse = newState;
          setSelectedState(newState);
        }
      }

      // Disparar evento stateChange para sincronizar outros componentes
      // Usar stateToUse em vez de selectedState para garantir que estamos usando o valor mais recente
      setTimeout(() => {
        const dashboardKeys = stateToUse.dashboardKeys || flagService.getDashboardKeysForFlag(stateCode);

        console.log(`StateSelector: Disparando evento stateChange inicial para: ${stateCode}`);
        console.log(`StateSelector: Dashboards associados:`, dashboardKeys);

        const stateChangeEvent = new CustomEvent('stateChange', {
          detail: {
            code: stateCode,
            name: stateToUse.name,
            dashboardKeys: dashboardKeys,
            flag: stateToUse
          }
        });
        window.dispatchEvent(stateChangeEvent);
      }, 100); // Pequeno atraso para garantir que outros componentes já estejam montados
    }).catch(error => {
      console.error('Erro ao importar flagService:', error);

      // Mesmo sem o flagService, ainda podemos inicializar o estado selecionado
      const localEstado = localStorage.getItem('estadoEleitoral');
      let stateToUse: StateOption;

      if (localEstado) {
        stateToUse = findSelectedState(localEstado);
      } else if (perfil && perfil.estadoEleitoral) {
        stateToUse = findSelectedState(perfil.estadoEleitoral.toLowerCase());
        localStorage.setItem('estadoEleitoral', perfil.estadoEleitoral.toLowerCase());
      } else {
        stateToUse = brazilOption;
      }

      setSelectedState(stateToUse);

      // Disparar um evento básico
      const stateCode = stateToUse.code.toLowerCase();
      const defaultDashboardKeys = [`cg-${stateCode}`, `ale-${stateCode}`, `gov-${stateCode}`];

      const stateChangeEvent = new CustomEvent('stateChange', {
        detail: {
          code: stateCode,
          name: stateToUse.name,
          dashboardKeys: defaultDashboardKeys,
          flag: stateToUse
        }
      });
      window.dispatchEvent(stateChangeEvent);
    });
  }, [perfil, brazilOption]);

  const handleStateChange = (state: StateOption) => {
    setSelectedState(state);
    setIsOpen(false);

    if (onStateChange) {
      onStateChange(state);
    }

    const stateCode = state.code.toLowerCase();

    // Usar o serviço para salvar o estado eleitoral e disparar o evento
    estadoEleitoralService.setEstadoEleitoral(stateCode);

    // Salvar no localStorage para persistir entre recarregamentos da página
    localStorage.setItem('estadoEleitoral', stateCode);

    // Importar o flagService para garantir que a bandeira tenha dashboards associados
    import('@/domains/congresso/services/FlagService').then(module => {
      const flagService = module.flagService;

      let updatedState = state;

      // Garantir que a bandeira tenha dashboards associados
      if (!updatedState.dashboardKeys || updatedState.dashboardKeys.length === 0) {
        // Se a bandeira não tiver dashboards associados, criar uma associação explícita
        const defaultDashboardKeys = [`cg-${stateCode}`, `ale-${stateCode}`, `gov-${stateCode}`];
        flagService.linkFlagToDashboards(stateCode, defaultDashboardKeys);

        // Atualizar o estado com a bandeira atualizada
        const newState = flagService.getFlag(stateCode);
        if (newState) {
          updatedState = newState;
          setSelectedState(newState);
        }
      }

      // Get dashboard keys for this state
      const dashboardKeys = updatedState.dashboardKeys || flagService.getDashboardKeysForFlag(stateCode);

      console.log(`StateSelector: Alterando estado para: ${stateCode}`);
      console.log(`StateSelector: Dashboards associados:`, dashboardKeys);

      // Dispatch a custom event with state and dashboard information
      const stateChangeEvent = new CustomEvent('stateChange', {
        detail: {
          code: stateCode,
          name: updatedState.name,
          dashboardKeys: dashboardKeys,
          flag: updatedState
        }
      });
      window.dispatchEvent(stateChangeEvent);
    }).catch(error => {
      console.error('Erro ao importar flagService:', error);

      // Mesmo sem o flagService, ainda podemos disparar um evento básico
      const defaultDashboardKeys = [`cg-${stateCode}`, `ale-${stateCode}`, `gov-${stateCode}`];

      const stateChangeEvent = new CustomEvent('stateChange', {
        detail: {
          code: stateCode,
          name: state.name,
          dashboardKeys: defaultDashboardKeys,
          flag: state
        }
      });
      window.dispatchEvent(stateChangeEvent);
    });

    // Salvar o estado eleitoral no perfil do usuário
    if (atualizarConfiguracoes && stateCode !== 'br') {
      console.log(`StateSelector: Salvando estado eleitoral no perfil: ${stateCode}`);

      // Usar o serviço para criar o objeto de configuração
      const configData = estadoEleitoralService.criarConfigAtualizacao(stateCode, perfil);

      // Atualizar o perfil
      atualizarConfiguracoes(configData);
    }
  };

  const toggleRegion = (region: string) => {
    if (expandedRegions.includes(region)) {
      setExpandedRegions(expandedRegions.filter(r => r !== region));
    } else {
      setExpandedRegions([...expandedRegions, region]);
    }
  };

  // Renderizar um item de estado
  const renderStateItem = (state: StateOption) => (
    <div
      key={state.code}
      className={`p-3 cursor-pointer flex items-center gap-3 hover:bg-gray-800 ${selectedState.code === state.code ? 'bg-gray-800' : ''}`}
      onClick={() => handleStateChange(state)}
    >
      <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-700 flex-shrink-0 flex items-center justify-center bg-white">
        <img
          src={state.flagUrl}
          alt={`Bandeira de ${state.name}`}
          className="w-6 h-6 object-contain"
          onError={(e) => {
            console.log(`Erro ao carregar imagem: ${state.flagUrl}`);
            (e.target as HTMLImageElement).src = '/images/placeholder-avatar.png';
          }}
        />
      </div>
      <span className={state.code === "BR" ? "font-bold text-blue-400" : "text-white"}>
        {state.name}
      </span>
      {selectedState.code === state.code && (
        <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
      )}
    </div>
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center bg-white hover:bg-[#f0f0f0] rounded-full overflow-hidden border-2 border-white/30 w-8 h-8"
        aria-label={`Selecionar estado: ${selectedState.name}`}
      >
        <img
          src={selectedState.flagUrl}
          alt={`Bandeira de ${selectedState.name}`}
          className="w-6 h-6 object-contain"
          onError={(e) => {
            console.log(`Erro ao carregar imagem: ${selectedState.flagUrl}`);
            (e.target as HTMLImageElement).src = '/images/placeholder-avatar.png';
          }}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-md shadow-lg z-50 max-h-[70vh] overflow-y-auto">
          <div className="py-2 px-3 bg-gray-800 text-white sticky top-0 z-10">
            <h3 className="font-medium">Selecione um estado</h3>
          </div>

          {/* Brazil option */}
          {renderStateItem(brazilOption)}

          <div className="border-t border-gray-800 my-1"></div>

          {/* Sudeste - Sempre expandido por ser a região principal */}
          <div
            className="px-3 py-2 text-gray-300 text-sm sticky top-[40px] bg-gray-900 z-10 flex justify-between items-center cursor-pointer hover:bg-gray-800"
            onClick={() => toggleRegion('southeast')}
          >
            <span>Sudeste</span>
            <span className="text-xs">
              {expandedRegions.includes('southeast') ? '▼' : '►'}
            </span>
          </div>

          {expandedRegions.includes('southeast') && southeastStates.map(renderStateItem)}

          {/* Norte */}
          <div className="border-t border-gray-800 my-1"></div>
          <div
            className="px-3 py-2 text-gray-300 text-sm sticky top-[40px] bg-gray-900 z-10 flex justify-between items-center cursor-pointer hover:bg-gray-800"
            onClick={() => toggleRegion('north')}
          >
            <span>Norte</span>
            <span className="text-xs">
              {expandedRegions.includes('north') ? '▼' : '►'}
            </span>
          </div>

          {expandedRegions.includes('north') && northStates.map(renderStateItem)}

          {/* Nordeste */}
          <div className="border-t border-gray-800 my-1"></div>
          <div
            className="px-3 py-2 text-gray-300 text-sm sticky top-[40px] bg-gray-900 z-10 flex justify-between items-center cursor-pointer hover:bg-gray-800"
            onClick={() => toggleRegion('northeast')}
          >
            <span>Nordeste</span>
            <span className="text-xs">
              {expandedRegions.includes('northeast') ? '▼' : '►'}
            </span>
          </div>

          {expandedRegions.includes('northeast') && northeastStates.map(renderStateItem)}

          {/* Centro-Oeste */}
          <div className="border-t border-gray-800 my-1"></div>
          <div
            className="px-3 py-2 text-gray-300 text-sm sticky top-[40px] bg-gray-900 z-10 flex justify-between items-center cursor-pointer hover:bg-gray-800"
            onClick={() => toggleRegion('central-west')}
          >
            <span>Centro-Oeste</span>
            <span className="text-xs">
              {expandedRegions.includes('central-west') ? '▼' : '►'}
            </span>
          </div>

          {expandedRegions.includes('central-west') && centralWestStates.map(renderStateItem)}

          {/* Sul */}
          <div className="border-t border-gray-800 my-1"></div>
          <div
            className="px-3 py-2 text-gray-300 text-sm sticky top-[40px] bg-gray-900 z-10 flex justify-between items-center cursor-pointer hover:bg-gray-800"
            onClick={() => toggleRegion('south')}
          >
            <span>Sul</span>
            <span className="text-xs">
              {expandedRegions.includes('south') ? '▼' : '►'}
            </span>
          </div>

          {expandedRegions.includes('south') && southStates.map(renderStateItem)}
        </div>
      )}
    </div>
  );
};

export default StateSelector;
