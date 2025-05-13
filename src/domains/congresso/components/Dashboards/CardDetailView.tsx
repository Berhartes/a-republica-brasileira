import React, { useMemo } from 'react';
import { DashboardConfig } from './dashboardConfig';

interface CardDetailViewProps {
  config: DashboardConfig;
  cardIndex: number;
  onClose: () => void;
  isDarkMode?: boolean;
}

const CardDetailView: React.FC<CardDetailViewProps> = ({ 
  config, 
  cardIndex, 
  onClose,
  isDarkMode = false
}) => {
  // Determinar a chave do dashboard com base nas cores e título
  const dashboardKey = useMemo(() => {
    if (!config) return null;
    
    // Verificar o tipo de dashboard
    if (config.title.toLowerCase().includes('congresso')) {
      return 'cg';
    } else if (config.title.toLowerCase().includes('assembleia') || 
               config.title.toLowerCase().includes('câmara legislativa') || 
               config.title.toLowerCase().includes('alerj') || 
               config.title.toLowerCase().includes('cldf')) {
      return 'ale';
    } else if (config.title.toLowerCase().includes('governo')) {
      return 'gov';
    } else {
      // Se não conseguir determinar pelo título, usar as cores
      const primaryColor = config.primaryColor;
      if (primaryColor.startsWith('#005c97') || primaryColor.startsWith('#0077b6') || primaryColor.startsWith('#01579B')) {
        return 'cg';
      } else if (primaryColor.startsWith('#065f46') || primaryColor.startsWith('#004D40')) {
        return 'ale';
      } else if (primaryColor.startsWith('#c72c41') || primaryColor.startsWith('#B71C1C')) {
        return 'gov';
      } else {
        return 'cg'; // Fallback para congresso
      }
    }
  }, [config]);

  // Verificar se config e dadosCartoes existem antes de acessar
  const cardData = config?.dadosCartoes?.[cardIndex];
  
  // Usar diretamente as cores da configuração
  const colors = useMemo(() => {
    // Determinar a cor temática com base no tipo de dashboard
    let themeColor = "";
    
    // Extrair o tipo de dashboard (cg, ale, gov)
    const dashboardType = dashboardKey;
    
    if (dashboardType === 'cg') {
      themeColor = 'blue';
    } else if (dashboardType === 'ale') {
      themeColor = 'green';
    } else if (dashboardType === 'gov') {
      themeColor = 'red';
    } else {
      // Fallback para azul (congresso)
      themeColor = 'blue';
    }
    
    // Usar as cores da configuração
    const primaryColor = config?.primaryColor;
    const secondaryColor = config?.secondaryColor;
    
    return { themeColor, primaryColor, secondaryColor };
  }, [dashboardKey, config]);
  
  // Verificar se é o card de Ranking de Atividades (verificação case-insensitive)
  const isRankingAtividades = cardData?.title?.toLowerCase().includes("ranking de atividades");
  
  // Verificação alternativa para garantir que o card de Ranking seja identificado
  const isRankingCard = 
    cardData?.title?.toLowerCase().includes("ranking") && 
    (cardData?.icon === "fas fa-trophy" || cardData?.description?.toLowerCase().includes("deputados mais ativos"));
  
  const shouldShowRanking = isRankingAtividades || isRankingCard;
  
  // Se não houver dados, mostrar mensagem de erro
  if (!config || !cardData) {
    return (
      <div className="p-6 mt-2 rounded-lg bg-red-50 text-red-700">
        <h3 className="text-xl font-bold mb-2">Erro ao carregar detalhes</h3>
        <p>Não foi possível carregar os detalhes deste cartão.</p>
        <button 
          onClick={onClose}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Fechar
        </button>
      </div>
    );
  }
  
  // Função para obter o estilo de gradiente para o dashboard
  const getGradientStyle = () => {
    const { primaryColor, secondaryColor } = config;
    
    return {
      backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
      color: 'white',
      transition: 'all 0.3s ease',
    };
  };
  
  // Função para obter o estilo de fundo para o conteúdo do card
  const getContentStyle = () => {
    return {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    };
  };
  
  // Se for o card de Ranking de Atividades, renderizar um conteúdo específico
  if (shouldShowRanking) {
    return (
      <div 
      className="rounded-lg area-exibicao text-white"
      style={{
        ...getGradientStyle(),
        display: 'block',
        opacity: 1, 
        transform: 'translateY(0)',
        marginTop: '10px',
        paddingTop: '24px',
        paddingBottom: '24px',
        paddingLeft: '24px',
        paddingRight: '24px',
        zIndex: 5,
        position: 'relative',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        borderRadius: '18px'
      }}
        role="tabpanel"
        aria-labelledby={`tab-${cardIndex}`}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2 cursor-pointer hover:underline">
            <i className={cardData.icon}></i>
            {cardData.title}
          </h3>
          
          <button 
            onClick={onClose}
            className="text-white hover:text-white/80 p-1 rounded-full hover:bg-white/10"
            aria-label="Fechar detalhes"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>
        
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-gray-700 mb-4">
            Este componente exibiria o ranking de atividades dos deputados, incluindo filtros, lista paginada e gráfico de barras.
          </p>
          <div className="flex flex-col gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-medium mb-2">Filtros</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-2 rounded">Estado</div>
                <div className="bg-gray-50 p-2 rounded">Partido</div>
                <div className="bg-gray-50 p-2 rounded">Ordenação</div>
                <div className="bg-gray-50 p-2 rounded">Tipo de Despesa</div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="font-medium mb-2">Lista de Deputados</h4>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                      <div>
                        <div className="font-medium">Deputado {i}</div>
                        <div className="text-xs text-gray-500">Partido-UF</div>
                      </div>
                    </div>
                    <div className="font-bold text-green-600">R$ {(Math.random() * 100000).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="rounded-lg area-exibicao text-white"
      style={{
        ...getGradientStyle(),
        display: 'block',
        opacity: 1, 
        transform: 'translateY(0)',
        marginTop: '10px',
        paddingTop: '24px',
        paddingBottom: '24px',
        paddingLeft: '24px',
        paddingRight: '24px',
        zIndex: 5,
        position: 'relative',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        borderRadius: '18px'
      }}
      role="tabpanel"
      aria-labelledby={`tab-${cardIndex}`}
    >
      <div className="mt-4 p-5 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg shadow-md">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2 cursor-pointer hover:underline">
            <i className={cardData.icon}></i>
            {cardData.title}
          </h3>
          
          <button 
            onClick={onClose}
            className="text-white hover:text-white/80 p-1 rounded-full hover:bg-white/10"
            aria-label="Fechar detalhes"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>
        
        <div className="p-4 bg-white/10 rounded-lg mb-4">
          <p className="text-white mb-3 cursor-pointer hover:underline">
            {cardData.description}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-3 bg-white/20 border border-white/30 rounded-lg">
              <p className="text-white text-sm mb-1 cursor-pointer">
                Total
              </p>
              <p className="text-2xl font-bold text-white cursor-pointer hover:opacity-80">
                {cardData.value}
              </p>
            </div>
            
            <div className="p-3 bg-white/20 border border-white/30 rounded-lg">
              <p className="text-white text-sm mb-1 cursor-pointer">
                Última atualização
              </p>
              <p className="text-lg font-medium text-white cursor-pointer hover:underline">
                Março 2025
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/20 pt-4 mt-4">
          <h4 className="text-white font-medium mb-2 cursor-pointer hover:underline">
            Informações adicionais
          </h4>
          <ul className="text-white space-y-2">
            <li className="flex items-center cursor-pointer hover:underline">
              <i className="fas fa-calendar-check mr-2"></i>
              <span>Mandato atual: 2023-2027</span>
            </li>
            <li className="flex items-center cursor-pointer hover:underline">
              <i className="fas fa-map-marker-alt mr-2"></i>
              <span>Representação: Estado do Rio de Janeiro</span>
            </li>
            <li className="flex items-center cursor-pointer hover:underline">
              <i className="fas fa-users mr-2"></i>
              <span>Participação por partido disponível no link abaixo</span>
            </li>
          </ul>
          
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
      </div>
    </div>
  );
};

export default React.memo(CardDetailView);
