// src/domains/congresso/camara/components/DeputadoCard/index.tsx
import React from 'react';
import { Deputado } from '../../types';

interface DeputadoCardProps {
  deputado: Deputado;
  onSelect?: (deputado: Deputado) => void;
}

export const DeputadoCard: React.FC<DeputadoCardProps> = ({ 
  deputado, 
  onSelect 
}) => {
  const handleClick = () => {
    onSelect?.(deputado);
  };

  return (
    <div 
      className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      {deputado.urlFoto && (
        <img 
          src={deputado.urlFoto} 
          alt={`Foto de ${deputado.nome}`}
          className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
          loading="lazy"
        />
      )}
      <h3 className="text-lg font-semibold text-center">{deputado.nome}</h3>
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 text-center">
        <p>Partido: {deputado.siglaPartido}</p>
        <p>Estado: {deputado.siglaUf}</p>
      </div>
    </div>
  );
};