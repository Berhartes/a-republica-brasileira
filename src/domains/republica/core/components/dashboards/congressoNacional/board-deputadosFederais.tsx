import React from 'react';
import { CardData, DashboardConfig } from '../dashboardConfig';
import ParlamentaresPorEstadoList from '../ParlamentaresPorEstadoList';

// Reutilizando a interface TextColorClasses (idealmente, importada de um local comum)
interface TextColorClasses {
  title: string;
  description: string;
  value: string;
  label: string;
  section: string;
  item: string;
  button: string;
  icon: string;
  subtitle?: string;
  badge?: string;
  detailsColor?: string;
  baseColor?: string;
  baseColorHover?: string;
  descriptionColor?: string;
  lightColor?: string;
  bgColor?: string;
  borderColor?: string;
}

interface BoardDeputadosFederaisProps {
  cardData: CardData;
  config: DashboardConfig;
  onClose: () => void;
  isDarkMode?: boolean;
  ufEstado: string;
  style: string;
  textColors: TextColorClasses;
  // As props 'parlamentarCount' e 'onParlamentarCountChange' foram removidas
  // pois a contagem de parlamentares agora é gerenciada diretamente pelos dados do card.
  contentStyle: React.CSSProperties;
}

export const BoardDeputadosFederais: React.FC<BoardDeputadosFederaisProps> = ({
  cardData,
  onClose,
  isDarkMode,
  ufEstado,
  style,
  textColors,
  contentStyle,
}) => {
  // A lista de deputados só será exibida se o cardData.id for 'deputados-federais'
  const showDeputadosList = cardData.id === 'deputados-federais';

  return (
    <div className="mt-4 p-5 rounded-lg shadow-md" style={contentStyle}>
      <div className="flex justify-between items-start mb-4">
        <h3 className={`${textColors.title} flex items-center gap-2 cursor-pointer hover:underline`}>
          <i className={`${cardData.icon} ${textColors.icon}`}></i>
          {cardData.title}
        </h3>
        <button
          onClick={onClose}
          className={style === 'colorido'
            ? "text-white hover:text-white/80 hover:bg-white/10 p-1 rounded-full"
            : `${textColors.icon} hover:opacity-80 p-1 rounded-full`
          }
          aria-label="Fechar detalhes"
        >
          <i className={`fas fa-times text-lg ${style !== 'colorido' ? textColors.icon : ''}`}></i>
        </button>
      </div>

      <div className={style === 'colorido' && !isDarkMode ? "p-4 bg-gray-50 rounded-lg mb-4" : style === 'colorido' && isDarkMode ? "p-4 bg-slate-700 rounded-lg mb-4" : "p-4 bg-white/10 rounded-lg mb-4"}>
        <p className={textColors.description}>
          {cardData.label} {/* Usando cardData.label para a descrição curta */}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className={style === 'colorido' && !isDarkMode ? "p-3 bg-white border border-gray-200 rounded-lg" : style === 'colorido' && isDarkMode ? "p-3 bg-slate-800 border border-slate-600 rounded-lg" : "p-3 bg-white/20 border border-white/30 rounded-lg"}>
            <p className={textColors.label}>
              Total
            </p>
            <p className={textColors.value}>
              {cardData.value}
            </p>
          </div>

          <div className={style === 'colorido' && !isDarkMode ? "p-3 bg-white border border-gray-200 rounded-lg" : style === 'colorido' && isDarkMode ? "p-3 bg-slate-800 border border-slate-600 rounded-lg" : "p-3 bg-white/20 border border-white/30 rounded-lg"}>
            <p className={textColors.label}>
              Período
            </p>
            <p className={`text-lg font-medium ${style === 'colorido' && isDarkMode ? 'text-gray-200' : style === 'colorido' && !isDarkMode ? 'text-gray-700' : 'text-white'}`}>
              {cardData.period}
            </p>
          </div>
        </div>
      </div>

      {showDeputadosList && ufEstado && (
        <div className={style === 'colorido' && !isDarkMode ? "border-t border-gray-200 pt-4 mt-4" : style === 'colorido' && isDarkMode ? "border-t border-slate-600 pt-4 mt-4" : "border-t border-white/20 pt-4 mt-4"}>
          <ParlamentaresPorEstadoList
            tipoParlamentar={'deputados'}
            uf={ufEstado}
            isDarkMode={isDarkMode}
            // onCountChange removido, pois a contagem agora é estática no cardData
          />
        </div>
      )}

      <div className={style === 'colorido' && !isDarkMode ? "border-t border-gray-200 pt-4 mt-4" : style === 'colorido' && isDarkMode ? "border-t border-slate-600 pt-4 mt-4" : "border-t border-white/20 pt-4 mt-4"}>
        <h4 className={textColors.section}>
          {cardData.details.title}
        </h4>
        <div dangerouslySetInnerHTML={{ __html: cardData.details.description }} />

        {cardData.link && (
          <div className="mt-6 text-right">
            <a
              href={cardData.link}
              className={`${textColors.button} font-medium py-2 px-4 rounded inline-flex items-center`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Acesse o portal oficial</span>
              <i className={`fas fa-external-link-alt ml-2 ${textColors.icon}`}></i>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
