import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Button,
  Skeleton,
  Badge
} from "@/shared/components/ui/ui-components";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

interface Votacao {
  id: string;
  data: Date;
  titulo: string;
  resultado: string;
  materia: {
    id: string;
    sigla: string;
    numero: number;
    ano: number;
  };
  resumoVotos: {
    sim: number;
    nao: number;
    abstencao: number;
    ausente: number;
    total: number;
  };
}

interface TabelaVotacoesProps {
  isLoading: boolean;
  error?: Error | null;
  votacoes: Votacao[];
  onVerDetalhes?: (votacaoId: string) => void;
}

export const TabelaVotacoes: React.FC<TabelaVotacoesProps> = ({
  isLoading,
  error,
  votacoes,
  onVerDetalhes
}) => {
  const [filtro, setFiltro] = useState('');
  
  const votacoesFiltradas = votacoes.filter(votacao => 
    votacao.titulo.toLowerCase().includes(filtro.toLowerCase()) ||
    votacao.materia.sigla.toLowerCase().includes(filtro.toLowerCase()) ||
    votacao.resultado.toLowerCase().includes(filtro.toLowerCase()) ||
    `${votacao.materia.numero}`.includes(filtro) ||
    `${votacao.materia.ano}`.includes(filtro)
  );

  const formatarData = (data: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(data);
  };

  const getResultadoBadgeVariant = (resultado: string) => {
    const resultadoLower = resultado.toLowerCase();
    if (resultadoLower.includes('aprovad')) return 'success';
    if (resultadoLower.includes('rejeitad')) return 'destructive';
    if (resultadoLower.includes('retirad')) return 'outline';
    return 'secondary';
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Votações</CardTitle>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Filtrar votações..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="max-w-xs"
              disabled={isLoading}
            />
            <Button variant="ghost" size="icon" disabled={isLoading}>
              <MagnifyingGlassIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-red-500">Erro ao carregar votações</p>
            <p className="text-sm text-gray-500">{error.message}</p>
          </div>
        ) : votacoesFiltradas.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">Nenhuma votação encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Matéria</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Votos (Sim/Não)</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {votacoesFiltradas.map((votacao) => (
                  <TableRow key={votacao.id}>
                    <TableCell>{formatarData(votacao.data)}</TableCell>
                    <TableCell>
                      {votacao.materia.sigla} {votacao.materia.numero}/{votacao.materia.ano}
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={votacao.titulo}>
                      {votacao.titulo}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getResultadoBadgeVariant(votacao.resultado)}>
                        {votacao.resultado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">{votacao.resumoVotos.sim}</span>
                      {' / '}
                      <span className="text-red-600 font-medium">{votacao.resumoVotos.nao}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onVerDetalhes && onVerDetalhes(votacao.id)}
                      >
                        Ver detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
