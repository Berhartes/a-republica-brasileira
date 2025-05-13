import React, { useMemo } from 'react';
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
  // Memoizar configurações de cores específicas para cada dashboard
  const styles = useMemo(() => {
    if (dashboardKey.startsWith('cg-')) {
      // Estilo Congresso - Azul
      const themeColor = isDarkMode ? "#3b82f6" : "#0077cc"; // Azul mais vibrante
      return {
        titleColor: isDarkMode ? "text-blue-300 hover:text-blue-200" : "text-blue-700 hover:text-blue-800",
        iconColor: themeColor,
        badgeStyle: isDarkMode 
          ? { backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)' }
          : { backgroundColor: '#e6f6ff', color: '#0077cc', border: '1px solid #bae6fd' },
        valueColor: isDarkMode ? "text-blue-300" : "text-blue-700",
        borderColor: isDarkMode ? "border-l-4 border-blue-400" : "border-l-4 border-blue-500",
        linkColor: isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800",
        descColor: isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800",
        cardBg: isDarkMode ? "bg-gray-800" : "bg-white",
        cardBorder: isDarkMode ? "border-gray-700" : "border-gray-200",
        cardShadow: isDarkMode ? "shadow-lg shadow-blue-900/10" : "shadow-md"
      };
    } else if (dashboardKey.startsWith('ale-')) {
      // Estilo ALERJ - Verde
      const themeColor = isDarkMode ? "#10b981" : "#087f5b"; // Verde mais vibrante
      return {
        titleColor: isDarkMode ? "text-green-300 hover:text-green-200" : "text-green-700 hover:text-green-800",
        iconColor: themeColor,
        badgeStyle: isDarkMode 
          ? { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)' }
          : { backgroundColor: '#edfcf5', color: '#087f5b', border: '1px solid #d1fae5' },
        valueColor: isDarkMode ? "text-green-300" : "text-green-700",
        borderColor: isDarkMode ? "border-l-4 border-green-400" : "border-l-4 border-green-500",
        linkColor: isDarkMode ? "text-green-400 hover:text-green-300" : "text-green-600 hover:text-green-800",
        descColor: isDarkMode ? "text-green-400 hover:text-green-300" : "text-green-600 hover:text-green-800",
        cardBg: isDarkMode ? "bg-gray-800" : "bg-white",
        cardBorder: isDarkMode ? "border-gray-700" : "border-gray-200",
        cardShadow: isDarkMode ? "shadow-lg shadow-green-900/10" : "shadow-md"
      };
    } else {
      // Estilo Governo - Vermelho
      const themeColor = isDarkMode ? "#f87171" : "#e63946"; // Vermelho mais vibrante
      return {
        titleColor: isDarkMode ? "text-red-300 hover:text-red-200" : "text-red-700 hover:text-red-800",
        iconColor: themeColor,
        badgeStyle: isDarkMode 
          ? { backgroundColor: 'rgba(248, 113, 113, 0.2)', color: '#fca5a5', border: '1px solid rgba(248, 113, 113, 0.4)' }
          : { backgroundColor: '#fff5f5', color: '#e63946', border: '1px solid #fed7d7' },
        valueColor: isDarkMode ? "text-red-300" : "text-red-700",
        borderColor: isDarkMode ? "border-l-4 border-red-400" : "border-l-4 border-red-500",
        linkColor: isDarkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-800",
        descColor: isDarkMode ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-800",
        cardBg: isDarkMode ? "bg-gray-800" : "bg-white",
        cardBorder: isDarkMode ? "border-gray-700" : "border-gray-200",
        cardShadow: isDarkMode ? "shadow-lg shadow-red-900/10" : "shadow-md"
      };
    }
  }, [dashboardKey, isDarkMode]);

  return (
    <div 
      className={`${styles.cardBg} transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl rounded-lg ${styles.borderColor} sm:rounded-xl p-5 ${styles.cardShadow} cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 border ${styles.cardBorder}`}
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
        <div className="flex items-center">
          <i className={`${card.icon} mr-2 text-lg`} style={{ color: styles.iconColor }}></i>
          <h3 
            id={`card-title-${card.title.replace(/\s+/g, '-')}`}
            className={`text-base font-bold ${styles.titleColor} cursor-pointer underline`}
          >
            {card.title}
          </h3>
        </div>
        <span 
          className="text-xs font-medium px-2 py-1 rounded-full"
          style={styles.badgeStyle}
        >
          {card.badge}
        </span>
      </div>
      
      <div>
        <p className={`text-4xl font-bold ${styles.valueColor} mb-1 cursor-pointer hover:opacity-80`}>{card.value}</p>
        <p 
          id={`card-desc-${card.title.replace(/\s+/g, '-')}`}
          className={`${styles.descColor} text-sm mb-3 cursor-pointer underline`}
        >
          {card.description}
        </p>
      </div>
      
      <div className={`mt-4 pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} flex justify-between items-center`}>
        <div className={`flex items-center ${styles.linkColor} text-xs cursor-pointer`}>
          <i className="fas fa-calendar-alt mr-1"></i>
          <span>Próxima eleição: 2026</span>
        </div>
        <a 
          href={card.link} 
          className={`${styles.linkColor} text-sm font-medium`}
          target="_blank" 
          rel="noopener noreferrer"
          aria-label={`Ver mais sobre ${card.title}`}
          onClick={(e) => e.stopPropagation()}
        >
          Detalhes →
        </a>
      </div>
    </div>
  );
};

export default React.memo(DashboardCard);
