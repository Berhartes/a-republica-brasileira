// src/domains/congresso/pages/SenadoMapaVotacoes.tsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { senadoApiService } from "../senado/services";
import { VotacoesPanel } from "../senado/components";
import { LoadingSpinner } from "../../../shared/components/ui/loading-spinner";
import { Card, CardHeader, CardTitle, CardContent } from "../../../shared/components/ui/card";
import type { Senador } from '../senado/types/index';

interface SenadoMapaVotacoesProps {}

const SenadoMapaVotacoes: React.FC<SenadoMapaVotacoesProps> = () => {
  const [senadorSelecionado, setSenadorSelecionado] = useState<Senador | null>(null);
  const [periodo, setPeriodo] = useState({
    inicio: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // 1º de janeiro do ano atual
    fim: new Date().toISOString().split('T')[0] // hoje
  });

  // Usar TanStack Query para buscar senadores
  const { 
    data: senadores = [],
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['senadores'],
    queryFn: async () => {
      const response = await senadoApiService.getSenadores();
      return response.data;
    }
  });

  // Buscar votações do senador selecionado
  const { 
    isLoading: loadingVotacoes
  } = useQuery({
    queryKey: ['votacoes', senadorSelecionado?.id, periodo],
    queryFn: async () => {
      if (!senadorSelecionado?.id) return null;
      const response = await senadoApiService.getVotacoes({
        senadorId: senadorSelecionado.id.toString(),
        dataInicio: periodo.inicio,
        dataFim: periodo.fim,
        page: 1,
        limit: 50
      });
      return response.data;
    },
    enabled: !!senadorSelecionado?.id
  });

  useEffect(() => {
    // Selecionar o primeiro senador por padrão se houver dados
    if (senadores && senadores.length > 0 && !senadorSelecionado) {
      setSenadorSelecionado(senadores[0]);
    }
  }, [senadores, senadorSelecionado]);

  const handleSenadorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const senadorId = event.target.value;
    const senador = senadores.find((s: Senador) => s.id.toString() === senadorId);
    if (senador) {
      setSenadorSelecionado(senador);
    }
  };

  const handlePeriodoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPeriodo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-700">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Mapa de Votações do Senado</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="senador-select" className="block text-sm font-medium mb-2">
            Selecione um Senador:
          </label>
          <select
            id="senador-select"
            className="w-full p-2 border rounded-md"
            value={senadorSelecionado?.id.toString() || ''}
            onChange={handleSenadorChange}
          >
            {senadores.map((senador: Senador, index: number) => (
              <option key={`${senador.id}-${index}`} value={senador.id}>
                {senador.nome} ({senador.siglaPartido}/{senador.siglaUf})
              </option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="inicio" className="block text-sm font-medium mb-2">
              Data Inicial:
            </label>
            <input
              type="date"
              id="inicio"
              name="inicio"
              className="w-full p-2 border rounded-md"
              value={periodo.inicio}
              onChange={handlePeriodoChange}
            />
          </div>
          <div>
            <label htmlFor="fim" className="block text-sm font-medium mb-2">
              Data Final:
            </label>
            <input
              type="date"
              id="fim"
              name="fim"
              className="w-full p-2 border rounded-md"
              value={periodo.fim}
              onChange={handlePeriodoChange}
            />
          </div>
        </div>
      </div>

      {loadingVotacoes ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : senadorSelecionado ? (
        <VotacoesPanel key={senadorSelecionado.id} senadorId={Number(senadorSelecionado.id)} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Selecione um Senador</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Selecione um senador para visualizar as votações.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SenadoMapaVotacoes;
