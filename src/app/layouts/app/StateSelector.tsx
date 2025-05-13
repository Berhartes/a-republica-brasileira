import React, { useState, useEffect } from "react";
import { usePerfil } from "@/domains/usuario/hooks";
import { estadoEleitoralService } from "@/domains/usuario/services";

interface StateOption {
  code: string;
  name: string;
  flagUrl: string;
}

// Brazil option
const BRAZIL_OPTION: StateOption = {
  code: 'BR',
  name: 'Brasil',
  flagUrl: '/flags/brazil/flag_circle_brazil.png',
};

// Estados do Sudeste
const SOUTHEAST_STATES: StateOption[] = [
  {
    code: 'RJ',
    name: 'Rio de Janeiro',
    flagUrl: '/flags/estados/rio-de-janeiro/flag_circle_rio_de_janeiro-removebg-preview.png',
  },
  {
    code: 'SP',
    name: 'São Paulo',
    flagUrl: '/flags/estados/sao-paulo/flag_circle_sao_paulo.png',
  },
  {
    code: 'MG',
    name: 'Minas Gerais',
    flagUrl: '/flags/estados/minas-gerais/flag_circle_minas_gerais.png',
  },
  {
    code: 'ES',
    name: 'Espírito Santo',
    flagUrl: '/flags/estados/espirito-santo/flag_circle_espirito_santo.png',
  }
];

// Estados do Norte
const NORTH_STATES: StateOption[] = [
  { code: 'AC', name: 'Acre', flagUrl: '/flags/brazil/flag_circle_brazil.png' },
  { code: 'AP', name: 'Amapá', flagUrl: '/flags/brazil/flag_circle_brazil.png' },
  { code: 'AM', name: 'Amazonas', flagUrl: '/flags/brazil/flag_circle_brazil.png' },
  { code: 'PA', name: 'Pará', flagUrl: '/flags/brazil/flag_circle_brazil.png' },
  { code: 'RO', name: 'Rondônia', flagUrl: '/flags/brazil/flag_circle_brazil.png' },
  { code: 'RR', name: 'Roraima', flagUrl: '/flags/brazil/flag_circle_brazil.png' },
  { code: 'TO', name: 'Tocantins', flagUrl: '/flags/brazil/flag_circle_brazil.png' }
];

// Estados do Nordeste
const NORTHEAST_STATES: StateOption[] = [
  { code: 'AL', name: 'Alagoas', flagUrl: '/flags/brazil/flag_circle_brazil.png' },
  { code: 'BA', name: 'Bahia', flagUrl: '/flags/brazil/flag_circle_brazil.png' },
  { code: 'CE', name: 'Ceará', flagUrl: '/flags/brazil/flag_circle_brazil.png' },
  { code: 'MA', name: 'Maranhão', flagUrl: '/flags/brazil/flag_circle_brazil.png' },
  { code: 'PB', name: 'Paraíba', flagUrl: '/flags/brazil/flag_circle_brazil.png' },
  { code: 'PE', name: 'Pernambuco', flagUrl: '/flags/brazil/flag_circle_brazil.png' },
  { code: 'PI', name: 'Piauí', flagUrl: '/flags/brazil/flag_circle_brazil.png' },
  { code: 'RN', name: 'Rio Grande do Norte', flagUrl: '/flags/brazil/flag_circle_brazil.png' },
  { code: 'SE', name: 'Sergipe', flagUrl: '/flags/brazil/flag_circle_brazil.png' }
];

// Estados do Centro-Oeste
const CENTRAL_WEST_STATES: StateOption[] = [
  { code: 'DF', name: 'Distrito Federal', flagUrl: '/flags/brazil/flag_circle_brazil.png' },
  { code: 'GO', name: 'Goiás', flagUrl: '/flags/brazil/flag_circle_brazil.png' },
  { code: 'MT', name: 'Mato Grosso', flagUrl: '/flags/brazil/flag_circle_brazil.png' },
  { code: 'MS', name: 'Mato Grosso do Sul', flagUrl: '/flags/brazil/flag_circle_brazil.png' }
];

// Estados do Sul
const SOUTH_STATES: StateOption[] = [
  { code: 'PR', name: 'Paraná', flagUrl: '/flags/brazil/flag_circle_brazil.png' },
  { code: 'RS', name: 'Rio Grande do Sul', flagUrl: '/flags/brazil/flag_circle_brazil.png' },
  { code: 'SC', name: 'Santa Catarina', flagUrl: '/flags/brazil/flag_circle_brazil.png' }
];

interface StateSelectorProps {
  onStateChange?: (state: StateOption) => void;
}

export const StateSelector: React.FC<StateSelectorProps> = ({ 
  onStateChange 
}) => {
  const [selectedState, setSelectedState] = useState<StateOption>(BRAZIL_OPTION);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedRegions, setExpandedRegions] = useState<string[]>(['southeast']);
  
  // Usar o hook usePerfil para acessar e atualizar o perfil do usuário
  const { perfil, atualizarConfiguracoes } = usePerfil();

  // Encontrar o estado selecionado
  const findSelectedState = (code: string): StateOption => {
    // Verificar primeiro nos estados do sudeste
    const southeastState = SOUTHEAST_STATES.find(state => state.code.toLowerCase() === code.toLowerCase());
    if (southeastState) return southeastState;
    
    // Verificar em todos os outros estados
    const allStates = [
      ...NORTH_STATES,
      ...NORTHEAST_STATES,
      ...CENTRAL_WEST_STATES,
      ...SOUTH_STATES
    ];
    
    const otherState = allStates.find(state => state.code.toLowerCase() === code.toLowerCase());
    if (otherState) return otherState;
    
    // Se não encontrar, retornar o Brasil
    if (code.toLowerCase() === 'br') return BRAZIL_OPTION;
    
    // Padrão para RJ se nada for encontrado
    return SOUTHEAST_STATES[0];
  };

  // Atualizar o estado selecionado quando o selectedUF mudar
  useEffect(() => {
    const handleStateChange = (event: CustomEvent) => {
      const newCode = event.detail.code.toLowerCase();
      setSelectedState(findSelectedState(newCode));
      
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
    if (SOUTHEAST_STATES.some(state => state.code === code)) return 'southeast';
    if (NORTH_STATES.some(state => state.code === code)) return 'north';
    if (NORTHEAST_STATES.some(state => state.code === code)) return 'northeast';
    if (CENTRAL_WEST_STATES.some(state => state.code === code)) return 'central-west';
    if (SOUTH_STATES.some(state => state.code === code)) return 'south';
    return null;
  };

  // Inicializar o estado selecionado com base no perfil do usuário ou localStorage
  useEffect(() => {
    // Tentar obter do localStorage primeiro (para usuários não autenticados)
    const localEstado = localStorage.getItem('estadoEleitoral');
    
    if (localEstado) {
      console.log(`StateSelector: Usando estado eleitoral do localStorage: ${localEstado}`);
      setSelectedState(findSelectedState(localEstado));
      return;
    }
    
    // Se não houver no localStorage, tentar obter do perfil
    if (perfil && perfil.estadoEleitoral) {
      const estadoUf = perfil.estadoEleitoral.toLowerCase();
      console.log(`StateSelector: Usando estado eleitoral do perfil: ${estadoUf}`);
      setSelectedState(findSelectedState(estadoUf));
      
      // Salvar no localStorage também
      localStorage.setItem('estadoEleitoral', estadoUf);
    } else {
      // Se não houver estado eleitoral definido, usar Brasil como padrão
      console.log('StateSelector: Nenhum estado eleitoral definido, usando Brasil como padrão');
      setSelectedState(BRAZIL_OPTION);
      
      // Não salvamos 'br' no localStorage para que o modal de boas-vindas apareça
    }
    
    // Disparar evento stateChange para sincronizar outros componentes
    const stateCode = selectedState.code.toLowerCase();
    const stateChangeEvent = new CustomEvent('stateChange', { 
      detail: { 
        code: stateCode,
        name: selectedState.name
      } 
    });
    window.dispatchEvent(stateChangeEvent);
  }, [perfil]);

  const handleStateChange = (state: StateOption) => {
    setSelectedState(state);
    setIsOpen(false);
    
    if (onStateChange) {
      onStateChange(state);
    }
    
    const stateCode = state.code.toLowerCase();
    
    // Usar o serviço para salvar o estado eleitoral e disparar o evento
    estadoEleitoralService.setEstadoEleitoral(stateCode);
    
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
      <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-700 flex-shrink-0">
        <img 
          src={state.flagUrl} 
          alt={`Bandeira de ${state.name}`}
          className="w-full h-full object-cover"
          onError={(e) => {
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
        className="flex items-center justify-center bg-transparent hover:bg-[#234780] rounded-full overflow-hidden border-2 border-white/30 w-8 h-8"
        aria-label={`Selecionar estado: ${selectedState.name}`}
      >
        <img 
          src={selectedState.flagUrl}
          alt={`Bandeira de ${selectedState.name}`}
          className="w-6 h-6 object-cover"
        />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-md shadow-lg z-50 max-h-[70vh] overflow-y-auto">
          <div className="py-2 px-3 bg-gray-800 text-white sticky top-0 z-10">
            <h3 className="font-medium">Selecione um estado</h3>
          </div>
          
          {/* Brazil option */}
          {renderStateItem(BRAZIL_OPTION)}
          
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
          
          {expandedRegions.includes('southeast') && SOUTHEAST_STATES.map(renderStateItem)}
          
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
          
          {expandedRegions.includes('north') && NORTH_STATES.map(renderStateItem)}
          
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
          
          {expandedRegions.includes('northeast') && NORTHEAST_STATES.map(renderStateItem)}
          
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
          
          {expandedRegions.includes('central-west') && CENTRAL_WEST_STATES.map(renderStateItem)}
          
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
          
          {expandedRegions.includes('south') && SOUTH_STATES.map(renderStateItem)}
        </div>
      )}
    </div>
  );
};

export default StateSelector;
