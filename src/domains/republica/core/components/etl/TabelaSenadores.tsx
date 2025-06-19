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
  Skeleton
} from "@/shared/components/ui/ui-components";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

interface Senador {
  id: string;
  nome: string;
  nomeCivil: string;
  siglaPartido: string;
  siglaUf: string;
  urlFoto?: string;
  email?: string;
  sexo: 'M' | 'F';
}

interface TabelaSenadoresProps {
  isLoading: boolean;
  error?: Error | null;
  senadores: Senador[];
  onVerDetalhes?: (senadorId: string) => void;
  onVerPerfil?: (senadorId: string) => void;
}

export const TabelaSenadores: React.FC<TabelaSenadoresProps> = ({
  isLoading,
  error,
  senadores,
  onVerDetalhes,
  onVerPerfil
}) => {
  const [filtro, setFiltro] = useState('');

  const senadoresFiltrados = senadores.filter(senador =>
    senador.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    senador.siglaPartido.toLowerCase().includes(filtro.toLowerCase()) ||
    senador.siglaUf.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Senadores</CardTitle>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Filtrar senadores..."
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
            <p className="text-red-500">Erro ao carregar senadores</p>
            <p className="text-sm text-gray-500">{error.message}</p>
          </div>
        ) : senadoresFiltrados.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">Nenhum senador encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Partido</TableHead>
                  <TableHead>UF</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {senadoresFiltrados.map((senador) => (
                  <TableRow key={senador.id}>
                    <TableCell className="font-medium">{senador.nome}</TableCell>
                    <TableCell>{senador.siglaPartido}</TableCell>
                    <TableCell>{senador.siglaUf}</TableCell>
                    <TableCell>{senador.email || 'Não disponível'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onVerDetalhes && onVerDetalhes(senador.id)}
                        >
                          Ver detalhes
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => onVerPerfil && onVerPerfil(senador.id)}
                        >
                          Ver perfil
                        </Button>
                      </div>
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
