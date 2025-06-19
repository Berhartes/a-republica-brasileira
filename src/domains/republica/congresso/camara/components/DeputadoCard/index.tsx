// src/domains/congresso/camara/components/DeputadoCard/index.tsx
import React from 'react';
import { Link } from '@tanstack/react-router';
import { Deputado } from '../../schemas';
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/card";
import { Star } from 'lucide-react';

interface DeputadoCardProps {
  deputado: Deputado;
  isFavorite: boolean;
}

export const DeputadoCard: React.FC<DeputadoCardProps> = ({ deputado, isFavorite }) => {
  const nomeDisplay = deputado.nomeEleitoral || deputado.nomeCivil || deputado.nome;

  return (
    <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg text-gray-900 dark:text-gray-100">{nomeDisplay}</CardTitle>
          {isFavorite && <Star className="w-5 h-5 text-yellow-500" />}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {deputado.siglaPartido || '?'} - {deputado.siglaUf || '?'}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start space-x-4">
          {deputado.urlFoto ? (
            <img
              src={deputado.urlFoto}
              alt={nomeDisplay || 'Deputado'}
              className="w-20 h-20 rounded-full object-cover"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                const target = e.currentTarget;
                target.onerror = null;
                const parent = target.parentNode;
                if (parent) {
                  const div = document.createElement('div');
                  div.className = "w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl";
                  const nome = nomeDisplay || 'DP';
                  const initials = nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('');
                  div.textContent = initials;
                  parent.replaceChild(div, target);
                }
              }}
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
              {nomeDisplay ? nomeDisplay.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : 'DP'}
            </div>
          )}
          <div className="text-gray-700 dark:text-gray-300">
            <div>Email: {deputado.email || 'Não disponível'}</div>
            <div className="flex space-x-2 mt-2">
              <Link
                to="/deputado/$id" params={{ id: String(deputado.id) }}
                className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors inline-block"
              >
                Ver perfil
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
