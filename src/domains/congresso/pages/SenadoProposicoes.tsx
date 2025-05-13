// src/domains/congresso/pages/SenadoProposicoes.tsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { senadoApiService } from "../senado/services";
import { ProposicoesCard } from "../senado/components";
import { LoadingSpinner } from "../../../shared/components/ui/loading-spinner";
import { Card, CardHeader, CardTitle, CardContent } from "../../../shared/components/ui/card";
import type { Senador, Materia } from '../senado/types/index';

interface SenadoProposicoesProps {}

const SenadoProposicoes: React.FC<SenadoProposicoesProps> = () => {
  const [senadorSelecionado, setSenadorSelecionado] = useState<Senador | null>(null);
  const [filtro, setFiltro] = useState<string>('');

  // Buscar lista de senadores
  const { 
    data: senadoresResponse,
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['senadores'],
    queryFn: async () => {
      return await senadoApiService.getSenadores({ page: 1, limit: 100 });
    }
  });

  const senadores = senadoresResponse?.data || [];

  // Buscar proposições do senador selecionado
  const { 
    data: materiasResponse,
    isLoading: loadingProposicoes 
  } = useQuery({
    queryKey: ['materias', senadorSelecionado?.id],
    queryFn: async () => {
      if (!senadorSelecionado?.id) return { data: [] };
      
      // Usar o ano atual, a API agora faz fallback para anos anteriores se necessário
      const anoAtual = new Date().getFullYear();
      return await senadoApiService.getMaterias({ 
        senadorId: senadorSelecionado.id.toString(),
        page: 1,
        limit: 50
      });
    },
    enabled: !!senadorSelecionado?.id
  });

  const proposicoes = materiasResponse?.data || [];

  // Selecionar o primeiro senador por padrão
  useEffect(() => {
    if (senadores.length > 0 && !senadorSelecionado) {
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

  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiltro(e.target.value);
  };

  // Filtrar proposições com base no termo de busca
  const proposicoesFiltradas = proposicoes.filter((p: Materia) => {
    if (!filtro) return true;
    
    const termoFiltro = filtro.toLowerCase();
    
    return (
      (p.ementa && p.ementa.toLowerCase().includes(termoFiltro)) ||
      (p.explicacao && p.explicacao.toLowerCase().includes(termoFiltro)) ||
      (p.numero && p.numero.toString().includes(filtro)) ||
      (p.ano && p.ano.toString().includes(filtro)) ||
      (p.situacao && p.situacao.toLowerCase().includes(termoFiltro))
    );
  });

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
      <h1 className="text-2xl font-bold mb-6">Proposições do Senado</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="senador-select" className="block text-sm font-medium mb-2">
            Selecione um Senador:
          </label>
          <select
            id="senador-select"
            className="w-full p-2 border rounded-md"
            value={senadorSelecionado?.id || ''}
            onChange={handleSenadorChange}
          >
            {senadores.map((senador: Senador) => (
              <option key={`senador-${senador.id}`} value={senador.id}>
                {senador.nome} ({senador.siglaPartido}/{senador.siglaUf})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="filtro" className="block text-sm font-medium mb-2">
            Filtrar Proposições:
          </label>
          <input
            type="text"
            id="filtro"
            className="w-full p-2 border rounded-md"
            placeholder="Buscar por tipo, número, ano ou texto..."
            value={filtro}
            onChange={handleFiltroChange}
          />
        </div>
      </div>

      {loadingProposicoes ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : senadorSelecionado ? (
        <div className="grid grid-cols-1 gap-4">
          {proposicoesFiltradas.length > 0 ? (
            proposicoesFiltradas.map((proposicao: Materia) => (
              <ProposicoesCard 
                key={proposicao.id} 
                senadorId={Number(senadorSelecionado.id)} 
                ano={proposicao.ano} 
              />
            ))
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Nenhuma Proposição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">
                  {filtro 
                    ? 'Nenhuma proposição encontrada com os critérios de busca.' 
                    : 'Este senador não possui proposições registradas.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Selecione um Senador</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Selecione um senador para visualizar as proposições.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SenadoProposicoes;
