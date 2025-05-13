import React from 'react';
import { CardData } from './dashboardConfig';

interface DashboardCardProps {
  card: CardData;
  index: number;
  dashboardKey: string;
  onClick: () => void;
  isDarkMode?: boolean;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ 
  card, 
  index, 
  dashboardKey, 
  onClick,
  isDarkMode = false
}) => {

  // Determinar o ícone específico para cada tipo de card
  const getCardIcon = () => {
    const title = card.title.toLowerCase();
    
    if (title.includes('deputados')) {
      return 'fas fa-user-tie';
    } else if (title.includes('senadores')) {
      return 'fas fa-university';
    } else if (title.includes('ranking')) {
      return 'fas fa-trophy';
    } else if (title.includes('eleitorado')) {
      return 'fas fa-users';
    } else if (title.includes('estatísticas')) {
      return 'fas fa-chart-line';
    } else if (title.includes('orçamento')) {
      return 'fas fa-money-bill-wave';
    } else if (title.includes('projetos')) {
      return 'fas fa-file-alt';
    } else if (title.includes('audiências')) {
      return 'fas fa-microphone';
    } else if (title.includes('comissões')) {
      return 'fas fa-users-cog';
    } else {
      return card.icon;
    }
  };

  // Obter o ícone específico para este card
  const cardIcon = getCardIcon();

  // Get badge variant class based on badge text
  const getBadgeVariant = () => {
    const badgeText = card.badge.toLowerCase();
    
    if (badgeText.includes('2022') || badgeText.includes('eleitos')) {
      return 'bg-yellow-500 text-yellow-900';
    } else if (badgeText.includes('2023') || badgeText.includes('dados')) {
      return 'bg-green-500 text-green-900';
    } else if (badgeText.includes('2024') || badgeText.includes('atual')) {
      return 'bg-blue-500 text-blue-900';
    } else if (badgeText.includes('fiscal')) {
      return 'bg-orange-500 text-orange-900';
    } else if (badgeText.includes('ativas') || badgeText.includes('tempo real')) {
      return 'bg-green-500 text-green-900';
    } else if (badgeText.includes('2027') || badgeText.includes('mandatos')) {
      return 'bg-purple-500 text-purple-900';
    }
    return 'bg-gray-500 text-gray-900';
  };

  // Get variant classes based on dashboard key
  const getVariantClasses = () => {
    if (dashboardKey.startsWith('cg-')) {
      return 'bg-congress-primary dark:bg-congress-dark-primary hover:bg-congress-dark dark:hover:bg-congress-dark-accent border-l-4 border-congress-secondary dark:border-congress-dark-secondary';
    }
    if (dashboardKey.startsWith('ale-')) {
      return 'bg-assembly-primary dark:bg-assembly-dark-primary hover:bg-assembly-dark dark:hover:bg-assembly-dark-accent border-l-4 border-assembly-secondary dark:border-assembly-dark-secondary';
    }
    return 'bg-government-primary dark:bg-government-dark-primary hover:bg-government-dark dark:hover:bg-government-dark-accent border-l-4 border-government-secondary dark:border-government-dark-secondary';
  };

  return (
    <div 
      className={`
        p-5 rounded-xl cursor-pointer
        transition-all duration-300 
        hover:-translate-y-1 hover:shadow-xl
        ${getVariantClasses()}
      `}
      onClick={onClick}
      role="button"
      aria-labelledby={`card-title-${card.title.replace(/\s+/g, '-')}`}
      tabIndex={0}
      aria-describedby={`card-desc-${card.title.replace(/\s+/g, '-')}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <i className={`${cardIcon} text-xl`}></i>
            <h3 
              id={`card-title-${card.title.replace(/\s+/g, '-')}`}
              className="font-bold text-lg"
            >
              {card.title}
            </h3>
          </div>
          <p 
            id={`card-desc-${card.title.replace(/\s+/g, '-')}`}
            className="text-sm opacity-90"
          >
            {card.description}
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getBadgeVariant()}`}>
          {card.badge}
        </span>
      </div>
      
      <div className="text-2xl font-bold my-4">
        {card.value}
      </div>
      
      <div className="flex justify-between items-center mt-4 text-sm">
        <div className="flex items-center space-x-1">
          <i className="fas fa-calendar-alt"></i>
          <span>Próxima eleição: 2026</span>
        </div>
        <a 
          href={card.link} 
          className="flex items-center hover:underline"
          target="_blank" 
          rel="noopener noreferrer"
          aria-label={`Ver mais sobre ${card.title}`}
          onClick={(e) => e.stopPropagation()}
        >
          Ver mais <i className="fas fa-arrow-right ml-1"></i>
        </a>
      </div>
    </div>
  );
};

export default React.memo(DashboardCard);
