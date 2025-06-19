import React, { useEffect, useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { Card, CardTitle, CardContent } from "@/shared/components/ui/card";
import { LoadingSpinner } from "@/shared/components/ui/loading-spinner";
import { logger } from "@/app/monitoring/logger";
import { useDeputados } from '../../../congresso/camara/hooks/useDeputados';
import { useSenadores } from '../../../congresso/senado/hooks/useSenadores';
import type { Deputado } from "@/domains/republica/congresso/camara/schemas";
import type { Senador } from "@/domains/republica/congresso/senado/schemas";

type Parlamentar = Deputado | Senador;

interface ParlamentaresPorEstadoListProps {
  tipoParlamentar: 'deputados' | 'senadores';
  uf: string;
  isDarkMode?: boolean;
  onCountChange?: (count: number) => void;
}

const ParlamentaresPorEstadoList: React.FC<ParlamentaresPorEstadoListProps> = ({ tipoParlamentar, uf, isDarkMode, onCountChange }) => {
  const deputadosParams = useMemo(() => ({
    siglaUf: uf,
    situacao: 'Exercício',
    itens: 100,
  }), [uf]);

  const senadoresParams = useMemo(() => ({
    siglaUf: uf,
  }), [uf]);

  const { data: deputadosData, isLoading: isLoadingDeputados, error: errorDeputados } = useDeputados(
    deputadosParams,
    { enabled: tipoParlamentar === 'deputados' && !!uf }
  );

  const { data: senadoresData, isLoading: isLoadingSenadores, error: errorSenadores } = useSenadores({
    ...senadoresParams,
    enabled: tipoParlamentar === 'senadores' && !!uf,
  });

  const parlamentares = useMemo(() => (tipoParlamentar === 'deputados' ? deputadosData : senadoresData) || [], [deputadosData, senadoresData, tipoParlamentar]);
  const isLoading = isLoadingDeputados || isLoadingSenadores;
  const error = errorDeputados || errorSenadores;

  useEffect(() => {
    if (!isLoading) {
      const count = parlamentares?.length || 0;
      onCountChange?.(count);
      if (count === 0) {
        logger.warn(`Nenhum ${tipoParlamentar} em exercício encontrado para o estado ${uf} após filtros.`);
      }
    }
  }, [parlamentares, isLoading, onCountChange, tipoParlamentar, uf]);

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center h-40 p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
        <LoadingSpinner />
        <p className={`ml-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Carregando {tipoParlamentar}...</p>
      </div>
    );
  }

  if (error) {
    return <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-800 text-red-100' : 'bg-red-100 text-red-700'}`}>{error.message}</div>;
  }

  if (parlamentares.length === 0) {
    return <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Nenhum {tipoParlamentar} em exercício encontrado para {uf.toUpperCase()}.</div>;
  }

  const textColorClass = isDarkMode ? 'text-gray-200' : 'text-gray-800';
  const subTextColorClass = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const cardBgClass = isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-gray-50';
  const linkBgClass = isDarkMode ? 'bg-emerald-700 hover:bg-emerald-600 text-white' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700';

  return (
    <div className="parlamentares-list my-4">
      <h3 className={`text-base font-semibold mb-2 ${textColorClass}`}>
        {tipoParlamentar === 'deputados' ? 'Deputados Federais' : 'Senadores'} em exercício de {uf.toUpperCase()}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {parlamentares.map((parlamentar: Parlamentar) => (
          <Card key={parlamentar.id} className={`${cardBgClass} transition-shadow shadow-sm`}>
            <CardContent className="p-2">
              <div className="flex flex-col items-center text-center">
                <img
                  src={parlamentar.urlFoto || `https://via.placeholder.com/80?text=${(parlamentar as Deputado).nomeEleitoral?.charAt(0) || parlamentar.nome?.charAt(0) || 'P'}`}
                  alt={(parlamentar as Deputado).nomeEleitoral || parlamentar.nome || 'Parlamentar'}
                  className="w-16 h-16 rounded-full object-cover mb-2 border border-gray-300 dark:border-gray-600"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.onerror = null;
                    const nomeEleitoral = (parlamentar as Deputado).nomeEleitoral;
                    const nome = parlamentar.nome;
                    const initialChar = nomeEleitoral?.charAt(0) || nome?.charAt(0);
                    const initial = initialChar ? initialChar.toUpperCase() : (tipoParlamentar === 'deputados' ? 'D' : 'S');
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${initial}&background=random&color=fff&size=80`;
                  }}
                />
                <CardTitle className={`text-sm font-medium ${textColorClass} truncate w-full px-1`} title={(parlamentar as Deputado).nomeEleitoral || parlamentar.nome || 'Nome não disponível'}>
                  {(parlamentar as Deputado).nomeEleitoral || parlamentar.nome || 'Nome não disponível'}
                </CardTitle>
                <p className={`text-xxs ${subTextColorClass} mb-0.5`}>
                  {parlamentar.siglaPartido || '?'} - {parlamentar.siglaUf || '?'}
                </p>
                <p className={`text-xxs ${subTextColorClass} mb-1 break-all truncate w-full px-1`} title={parlamentar.email || 'Email não disponível'}>
                  {parlamentar.email || ''}
                </p>
                <Link
                  to={tipoParlamentar === 'deputados' ? '/deputado/$id' : '/senador/$id'}
                  params={{ id: String(parlamentar.id) }}
                  className={`px-2 py-0.5 text-xxs rounded transition-colors ${linkBgClass}`}
                >
                  Ver perfil
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ParlamentaresPorEstadoList;
