// src/domains/congresso/pages/SenadorPerfilPage.tsx
import React, { useEffect, useState } from 'react';
import { useMatch, useNavigate } from '@tanstack/react-router';
import { SenadorPerfilGenerico } from "../senado/components";
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

  // Ano atual para dados
  const anoAtual = new Date().getFullYear();

  const handleVoltar = () => {
    navigate({ to: "/senado" });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center h-64">
          <LoadingSpinner />
          <div className="mt-4 text-gray-600">Carregando perfil do senador...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center">
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
      </div>

      {id ? (
        <SenadorPerfilGenerico id={id} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-red-600">ID do senador inválido.</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SenadorPerfilPage;
