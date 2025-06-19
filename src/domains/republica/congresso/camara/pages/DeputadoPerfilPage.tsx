// src/domains/congresso/pages/DeputadoPerfilPage.tsx
import * as React from 'react';
import { useMatch, useNavigate } from '@tanstack/react-router';
import DeputadoPerfilGenerico from '@/domains/republica/congresso/camara/components/DeputadoPerfilGenerico'; // Importar o novo componente
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"; // Manter se necessário para fallback

interface DeputadoPerfilPageProps {}

const DeputadoPerfilPage: React.FC<DeputadoPerfilPageProps> = () => {
  const match = useMatch({ from: '/deputado/$id' });
  const id = match?.params.id;
  const navigate = useNavigate();

  // Não precisamos mais da validação de ID aqui, pois DeputadoPerfilGenerico pode lidar com ID indefinido
  // ou podemos adicionar uma verificação simples.

  const handleVoltar = () => {
    navigate({ to: "/deputados" }); // Navegar de volta para a lista de deputados
  };

  // O loading principal será tratado dentro de DeputadoPerfilGenerico
  // Podemos remover o estado de loading daqui se DeputadoPerfilGenerico já o gerencia.

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
        <DeputadoPerfilGenerico id={id} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-red-600">ID do deputado inválido ou não fornecido.</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DeputadoPerfilPage;
