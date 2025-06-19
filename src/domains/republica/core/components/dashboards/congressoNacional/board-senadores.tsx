import React from 'react';
import { CardData, DashboardConfig } from '../dashboardConfig';
import ParlamentaresPorEstadoList from '../ParlamentaresPorEstadoList';

// Definindo TextColorClasses diretamente aqui se não estiver em dashboardConfig
// ou importe de onde foi definida em board-rankingCongresso.tsx (ex: ./board-rankingCongresso)
// Por simplicidade, vou redefinir uma versão básica. Idealmente, seria compartilhada.
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

interface BoardSenadoresProps {
  cardData: CardData;
  config: DashboardConfig; // Para link, se necessário, ou outras configs gerais
  onClose: () => void;
  isDarkMode?: boolean;
  ufEstado: string;
  style: string; // 'colorido' ou 'transparente'
  textColors: TextColorClasses;
  parlamentarCount: number | null;
  onParlamentarCountChange: (count: number) => void;
  // Adicionando getContentStyle para consistência com o CardDetailView original
  // Se for muito complexo, podemos simplificar os estilos aqui.
  contentStyle: React.CSSProperties;
}

export const BoardSenadores: React.FC<BoardSenadoresProps> = ({
  cardData,
  onClose,
  isDarkMode,
  ufEstado,
  style,
  textColors,
  parlamentarCount,
  onParlamentarCountChange,
  contentStyle,
}) => {
  // A lógica de showSenadoresList pode ser inferida pelo tipo de cardData ou passada como prop
  const showSenadoresList = cardData.title.toLowerCase().includes('senadores');

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
            : `${textColors.icon} hover:opacity-80 p-1 rounded-full` // Ajuste para usar textColors.icon se disponível
          }
          aria-label="Fechar detalhes"
        >
          <i className={`fas fa-times text-lg ${style !== 'colorido' ? textColors.icon : ''}`}></i>
        </button>
      </div>

      <div className={style === 'colorido' && !isDarkMode ? "p-4 bg-gray-50 rounded-lg mb-4" : style === 'colorido' && isDarkMode ? "p-4 bg-slate-700 rounded-lg mb-4" : "p-4 bg-white/10 rounded-lg mb-4"}>
        {/* A descrição principal do board agora vem de cardData.details.description */}
        {/* A propriedade cardData.description foi removida da interface CardData, usamos cardData.label para a visão geral */}
        <div className={textColors.description} dangerouslySetInnerHTML={{ __html: cardData.details.description }} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className={style === 'colorido' && !isDarkMode ? "p-3 bg-white border border-gray-200 rounded-lg" : style === 'colorido' && isDarkMode ? "p-3 bg-slate-800 border border-slate-600 rounded-lg" : "p-3 bg-white/20 border border-white/30 rounded-lg"}>
            <p className={textColors.label}>
              {/* Rótulo do valor principal vem de cardData.details.mainValueLabel ou fallback para "Total" */}
              {cardData.details.mainValueLabel || 'Total'}
            </p>
            <p className={textColors.value}>
              {/* O valor pode vir de parlamentarCount (se aplicável e passado) ou de cardData.value */}
              {parlamentarCount !== null ? parlamentarCount : cardData.value}
            </p>
          </div>

          <div className={style === 'colorido' && !isDarkMode ? "p-3 bg-white border border-gray-200 rounded-lg" : style === 'colorido' && isDarkMode ? "p-3 bg-slate-800 border border-slate-600 rounded-lg" : "p-3 bg-white/20 border border-white/30 rounded-lg"}>
            <p className={textColors.label}>
              {/* Rótulo do período vem de cardData.details.periodLabel ou fallback para "Período" */}
              {cardData.details.periodLabel || 'Período'}
            </p>
            <p className={`text-lg font-medium ${style === 'colorido' && isDarkMode ? 'text-gray-200' : style === 'colorido' && !isDarkMode ? 'text-gray-700' : 'text-white'}`}>
              {/* Valor do período no board vem de cardData.details.boardPeriodValue ou fallback para cardData.period */}
              {cardData.details.boardPeriodValue || cardData.period}
            </p>
          </div>
        </div>
      </div>

      {showSenadoresList && ufEstado && (
        <div className={style === 'colorido' && !isDarkMode ? "border-t border-gray-200 pt-4 mt-4" : style === 'colorido' && isDarkMode ? "border-t border-slate-600 pt-4 mt-4" : "border-t border-white/20 pt-4 mt-4"}>
          <ParlamentaresPorEstadoList
            tipoParlamentar={'senadores'}
            uf={ufEstado}
            isDarkMode={isDarkMode}
            onCountChange={onParlamentarCountChange}
            // Passar o estilo do dashboard para consistência interna, se ParlamentaresPorEstadoList precisar
            // dashboardStyle={style}
          />
        </div>
      )}

      {/* Seção de Informações Adicionais, renderizada se cardData.details.additionalInfo existir */}
      {cardData.details.additionalInfo && cardData.details.additionalInfo.length > 0 && (
        <div className={style === 'colorido' && !isDarkMode ? "border-t border-gray-200 pt-4 mt-4" : style === 'colorido' && isDarkMode ? "border-t border-slate-600 pt-4 mt-4" : "border-t border-white/20 pt-4 mt-4"}>
          <h4 className={textColors.section}>
            {/* Título da seção de informações adicionais vem de cardData.details.additionalInfoSectionTitle */}
            {cardData.details.additionalInfoSectionTitle || 'Informações Adicionais'}
          </h4>
          <ul className="space-y-2 mt-2">
            {cardData.details.additionalInfo.map((info, index) => (
              <li key={index} className={`flex items-center ${textColors.item}`}>
                {info.icon && <i className={`${info.icon} mr-2 ${textColors.icon}`}></i>}
                {/* O texto da informação adicional, substituindo {ufEstado} se presente */}
                <span>{info.text.replace('{ufEstado}', ufEstado || 'Brasil')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Link externo, renderizado se cardData.link existir */}
      {cardData.link && (
        <div className="mt-6 text-right">
          <a
            href={cardData.link}
            className={`${textColors.button} font-medium py-2 px-4 rounded inline-flex items-center`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* Texto do botão de link externo vem de cardData.details.externalLinkText */}
            <span>{cardData.details.externalLinkText || 'Ver mais'}</span>
            <i className={`fas fa-external-link-alt ml-2 ${textColors.icon}`}></i>
          </a>
        </div>
      )}
    </div>
  );
};
