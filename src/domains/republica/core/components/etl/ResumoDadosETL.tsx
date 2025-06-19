import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/shared/components/ui/ui-components";

interface ResumoDadosETLProps {
  isLoading: boolean;
  error?: Error | null;
  metadata: {
    ultima_atualizacao?: Date;
    total_legislaturas?: number;
    total_senadores?: number;
    total_materias?: number;
    total_votacoes?: number;
    total_comissoes?: number;
  };
}

export const ResumoDadosETL: React.FC<ResumoDadosETLProps> = ({ 
  isLoading, 
  error, 
  metadata 
}) => {
  const formatarData = (data?: Date) => {
    if (!data) return 'Não disponível';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(data);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Última Atualização</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-6 w-full" />
          ) : error ? (
            <p className="text-red-500">Erro ao carregar dados</p>
          ) : (
            <p className="text-xl font-semibold">
              {formatarData(metadata.ultima_atualizacao)}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Legislaturas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-6 w-full" />
          ) : error ? (
            <p className="text-red-500">Erro ao carregar dados</p>
          ) : (
            <p className="text-xl font-semibold">
              {metadata.total_legislaturas?.toLocaleString() || '0'}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Senadores</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-6 w-full" />
          ) : error ? (
            <p className="text-red-500">Erro ao carregar dados</p>
          ) : (
            <p className="text-xl font-semibold">
              {metadata.total_senadores?.toLocaleString() || '0'}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Matérias Legislativas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-6 w-full" />
          ) : error ? (
            <p className="text-red-500">Erro ao carregar dados</p>
          ) : (
            <p className="text-xl font-semibold">
              {metadata.total_materias?.toLocaleString() || '0'}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Votações</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-6 w-full" />
          ) : error ? (
            <p className="text-red-500">Erro ao carregar dados</p>
          ) : (
            <p className="text-xl font-semibold">
              {metadata.total_votacoes?.toLocaleString() || '0'}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-6 w-full" />
          ) : error ? (
            <p className="text-red-500">Erro ao carregar dados</p>
          ) : (
            <p className="text-xl font-semibold">
              {metadata.total_comissoes?.toLocaleString() || '0'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
