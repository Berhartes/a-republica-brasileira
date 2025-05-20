import React, { useRef, useState, useEffect } from 'react';
import './styles.css';

interface ScrollableSectionProps {
  children: React.ReactNode | React.ReactNode[];
  itemsToShow?: number;
  className?: string;
  itemClassName?: string;
  containerClassName?: string;
  maxHeight?: number;
}

/**
 * Componente que exibe uma seção com scroll vertical
 * Mostra um número limitado de itens inicialmente e permite scroll para ver mais
 *
 * @param children - Os itens a serem exibidos
 * @param itemsToShow - Número de itens a serem exibidos inicialmente (padrão: 5)
 * @param className - Classes CSS adicionais para o componente
 * @param itemClassName - Classes CSS adicionais para cada item
 * @param containerClassName - Classes CSS adicionais para o container
 * @param maxHeight - Altura máxima do container em pixels (padrão: calculado automaticamente)
 */
const ScrollableSection: React.FC<ScrollableSectionProps> = ({
  children,
  itemsToShow = 5,
  className = '',
  itemClassName = '',
  containerClassName = '',
  maxHeight
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showMoreButton, setShowMoreButton] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined);
  const [itemHeight, setItemHeight] = useState(0);

  // Verificar se há mais itens do que o limite para mostrar
  const childrenArray = React.Children.toArray(children);
  const hasMoreItems = childrenArray.length > itemsToShow;

  // Calcular a altura do container com base no número de itens a mostrar
  useEffect(() => {
    if (scrollContainerRef.current && hasMoreItems) {
      const items = scrollContainerRef.current.querySelectorAll('.scrollable-section-item');
      if (items.length > 0) {
        // Calcular a altura média de um item
        const firstItem = items[0] as HTMLElement;
        const itemHeightWithMargin = firstItem.offsetHeight;
        setItemHeight(itemHeightWithMargin);

        // Definir a altura do container para mostrar apenas o número especificado de itens
        if (!expanded) {
          const calculatedHeight = itemHeightWithMargin * itemsToShow;
          setContainerHeight(maxHeight || calculatedHeight);
        } else {
          setContainerHeight(undefined); // Sem limite quando expandido
        }

        // Verificar se precisa mostrar o botão "Ver mais"
        setShowMoreButton(true);
      }
    } else {
      setShowMoreButton(false);
      setContainerHeight(undefined);
    }
  }, [childrenArray, itemsToShow, hasMoreItems, expanded, maxHeight]);

  // Função para alternar entre expandido e contraído
  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <div className={`scrollable-section-wrapper ${className}`}>
      <div
        ref={scrollContainerRef}
        className={`scrollable-section-container ${containerClassName} ${hasMoreItems ? 'has-scroll' : ''}`}
        style={{
          maxHeight: containerHeight ? `${containerHeight}px` : undefined,
          overflow: hasMoreItems && !expanded ? 'hidden' : undefined
        }}
      >
        {childrenArray.map((child, index) => (
          <div
            key={index}
            className={`scrollable-section-item ${itemClassName}`}
          >
            {child}
          </div>
        ))}
      </div>

      {showMoreButton && (
        <div className="scrollable-section-footer">
          <button
            onClick={toggleExpand}
            className="show-more-button"
            aria-label={expanded ? "Ver menos" : "Ver mais"}
          >
            {expanded ? (
              <>
                <span>Ver menos</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
              </>
            ) : (
              <>
                <span>Ver mais</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ScrollableSection;
