// src/domains/congresso/pages/SenadorPerfilPage.tsx
import React, { useEffect, useState } from 'react';
import { useMatch, useNavigate } from '@tanstack/react-router';
import { SenadorDetalhes } from "../senado/components";
import { LoadingSpinner } from "../../../shared/components/ui/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/components/ui/card";

interface SenadorPerfilPageProps {}

const SenadorPerfilPage: React.FC<SenadorPerfilPageProps> = () => {
  const match = useMatch({ from: '/senador/$id' });
  const id = match?.params.id;
  const navigate = useNavigate();
  const [ano, setAno] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState<boolean>(false);

  // Validar ID do senador
  useEffect(() => {
    if (!id || isNaN(Number(id))) {
      navigate({ to: '/senado' });
    }
  }, [id, navigate]);

  // Gerar opções de anos para o filtro
  const anoAtual = new Date().getFullYear();
  const anos = Array.from({ length: 8 }, (_, i) => anoAtual - i);

  const handleChangeAno = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAno(Number(e.target.value));
  };

  const handleVoltar = () => {
    navigate({ to: "/senado" });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center h-64">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Carregando perfil do senador...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={handleVoltar}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 flex items-center"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Voltar
        </button>
        
        <div className="flex items-center">
          <label htmlFor="ano" className="mr-2 text-sm font-medium">
            Ano:
          </label>
          <select
            id="ano"
            className="p-2 border rounded"
            value={ano}
            onChange={handleChangeAno}
          >
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {id && !isNaN(Number(id)) ? (
        <SenadorDetalhes id={Number(id)} ano={ano} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">ID do senador inválido.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SenadorPerfilPage;
