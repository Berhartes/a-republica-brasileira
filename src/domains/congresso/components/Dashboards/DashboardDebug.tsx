/**
 * Arquivo unificado de componentes de depuração e teste para dashboards
 * Contém: FlagDashboardDebug, TestDashboard
 */
import { useState, useEffect, useMemo } from 'react';
import { Flag } from '../../models/Flag';
import { CardData, DashboardConfig } from './dashboardConfig';

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

// ============= TestDashboard =============
interface TestDashboardProps {
  config: DashboardConfig;
  isDarkMode?: boolean;
}

export const TestDashboard = ({
  config,
  isDarkMode = false
}: TestDashboardProps) => {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [isMainCardExpanded, setIsMainCardExpanded] = useState(false);

  // Determinar a chave do dashboard com base no título
  const dashboardKey = useMemo(() => {
    if (!config) return 'cg';

    if (config.title.toLowerCase().includes('congresso')) {
      return 'cg';
    } else if (config.title.toLowerCase().includes('assembleia') ||
               config.title.toLowerCase().includes('alerj')) {
      return 'ale';
    } else if (config.title.toLowerCase().includes('governo')) {
      return 'gov';
    } else {
      return 'cg'; // Fallback para congresso
    }
  }, [config]);

  // Função para renderizar o card principal
  const renderMainCard = () => {
    if (!config) return null;

    return (
      <div
        className={`
          rounded-xl overflow-hidden shadow-xl cursor-pointer
          transition-all duration-500 transform
          ${isMainCardExpanded ? 'scale-100' : 'hover:scale-[1.02]'}
        `}
        onClick={() => setIsMainCardExpanded(!isMainCardExpanded)}
      >
        <div
          className="p-6 text-white"
          style={{
            backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
          }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">{config.title}</h2>
              <p className="text-white text-opacity-90">{config.subtitle}</p>
            </div>
            <div className="text-4xl">
              <i className={config.icon}></i>
            </div>
          </div>

          {isMainCardExpanded && (
            <div className="mt-6 animate-fadeIn">
              <p className="mb-4">
                Este dashboard apresenta informações sobre {config.title.split(':')[0]}.
                Explore os cards abaixo para mais detalhes.
              </p>

              <div className="flex flex-wrap gap-2">
                {config.dadosCartoes.map((card, index) => (
                  <span
                    key={index}
                    className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm"
                  >
                    {card.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Função para renderizar os cards
  const renderCards = () => {
    if (!config || !config.dadosCartoes) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {config.dadosCartoes.map((cardData, index) => (
          <div
            key={index}
            className={`
              bg-white rounded-lg shadow-md overflow-hidden cursor-pointer
              transition-all duration-300 transform
              ${expandedCard === index ? 'col-span-full row-span-2 scale-100' : 'hover:scale-[1.03]'}
            `}
            onClick={() => setExpandedCard(expandedCard === index ? null : index)}
          >
            {expandedCard === index ? (
              <div
                className="p-6 text-white h-full"
                style={{
                  backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <i className={`${cardData.icon} text-3xl mr-3`}></i>
                    <div>
                      <h3 className="text-2xl font-bold">{cardData.title}</h3>
                      <p className="text-white text-opacity-80">{cardData.description}</p>
                    </div>
                  </div>
                  <button
                    className="text-white text-opacity-80 hover:text-opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedCard(null);
                    }}
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>

                <div className="mb-4">
                  <div className="text-5xl font-bold mb-2">{cardData.value}</div>
                  <div className="inline-block px-2 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                    {cardData.badge}
                  </div>
                </div>

                <div
                  className="mb-6 prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: cardData.content || '' }}
                />

                <div className="mt-6 text-right">
                  <a
                    href={cardData.link}
                    className="bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded inline-flex items-center"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Acesse o portal oficial</span>
                    <i className="fas fa-external-link-alt ml-2"></i>
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">{cardData.title}</h3>
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: `${config.primaryColor}20`,
                      color: config.primaryColor
                    }}
                  >
                    {cardData.badge}
                  </span>
                </div>
                <p className="text-3xl font-bold mb-1" style={{ color: config.primaryColor }}>{cardData.value}</p>
                <p className="text-sm text-gray-600 mb-3">{cardData.description}</p>
                <div className="flex justify-end">
                  <button
                    className="text-sm font-medium"
                    style={{ color: config.primaryColor }}
                  >
                    Ver detalhes →
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Função para renderizar a visualização detalhada
  const renderDetailView = () => {
    if (expandedCard === null || !config || !config.dadosCartoes[expandedCard]) return null;

    const cardData = config.dadosCartoes[expandedCard];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
          <div
            className="p-6 text-white"
            style={{
              backgroundImage: `linear-gradient(to right, ${config.primaryColor}, ${config.secondaryColor})`,
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <i className={`${cardData.icon} text-3xl mr-3`}></i>
                <div>
                  <h3 className="text-2xl font-bold">{cardData.title}</h3>
                  <p className="text-white text-opacity-80">{cardData.description}</p>
                </div>
              </div>
              <button
                className="text-white text-opacity-80 hover:text-opacity-100"
                onClick={() => setExpandedCard(null)}
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-4">
              <div className="text-4xl font-bold mb-2" style={{ color: config.primaryColor }}>{cardData.value}</div>
              <div
                className="inline-block px-2 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: `${config.primaryColor}20`,
                  color: config.primaryColor
                }}
              >
                {cardData.badge}
              </div>
            </div>

            <div
              className="mb-6 prose max-w-none"
              dangerouslySetInnerHTML={{ __html: cardData.content || '' }}
            />

            <div className="mt-6 text-right">
              <a
                href={cardData.link}
                className="inline-flex items-center px-4 py-2 rounded font-medium text-white"
                style={{ backgroundColor: config.primaryColor }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Acesse o portal oficial</span>
                <i className="fas fa-external-link-alt ml-2"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {renderMainCard()}
      {renderCards()}
      {renderDetailView()}
    </div>
  );
};
