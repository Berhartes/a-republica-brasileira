import React from 'react';
import { CardData, DashboardConfig } from '../dashboardConfig';

interface BoardOrcamentoAlerjProps {
  cardData: CardData;
  config: DashboardConfig;
  onClose: () => void;
  isDarkMode?: boolean;
  ufEstado: string;
  style: string;
  textColors: any; // Defina um tipo mais específico se souber
  contentStyle: any; // Defina um tipo mais específico se souber
}

export const BoardOrcamentoAlerj: React.FC<BoardOrcamentoAlerjProps> = ({
  cardData,
  onClose,
  isDarkMode,
  style,
  textColors,
  contentStyle,
}) => {
  return (
    <div className="p-4 rounded-lg" style={contentStyle}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`${textColors.title} flex items-center`}>
          <i className={`${cardData.icon || 'fas fa-info-circle'} ${textColors.icon} mr-2`}></i>
          {cardData.title}
        </h3>
        <button
          onClick={onClose}
          className={`p-1 rounded-full transition-colors duration-200 ${ style === 'colorido' ? (isDarkMode ? 'text-white hover:bg-white/20' : 'text-gray-700 hover:bg-gray-200') : (isDarkMode ? 'text-white hover:bg-white/20' : 'text-gray-700 hover:bg-gray-200') }`}
          aria-label="Fechar detalhes"
        >
          <i className={`fas fa-times text-xl ${textColors.icon}`}></i>
        </button>
      </div>
      {/* Conteúdo específico do board */}
      <div className="text-sm" style={{ color: textColors.descriptionColor }}>
        {/* O título agora vem de cardData.details.title */}
        <h3 className="text-lg font-semibold mb-2" style={{ color: textColors.baseColor }}>
          {cardData.details?.title || cardData.title}
        </h3>
        {/* A descrição agora vem de cardData.details.description e suporta HTML */}
        {cardData.details?.description && (
          <div dangerouslySetInnerHTML={{ __html: cardData.details.description }} />
        )}
      </div>

      <div className="mt-6 text-right">
        <a
          href={cardData.link}
          className={`${textColors.button || (isDarkMode ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white')} font-medium py-2 px-4 rounded inline-flex items-center`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Ver mais</span>
          <i className={`fas fa-external-link-alt ml-2 ${textColors.icon}`}></i>
        </a>
      </div>
    </div>
  );
};
