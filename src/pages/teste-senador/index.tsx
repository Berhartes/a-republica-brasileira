import React, { useState } from 'react';
import { useSenadorPerfil } from '@/domains/congresso/senado/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';

/**
 * Página de teste para o perfil do senador 6331 (Sergio Moro)
 */
const TesteSenadorPage: React.FC = () => {
  const [senadorId, setSenadorId] = useState<string>('6331'); // Sergio Moro como padrão
  const [testId, setTestId] = useState<string>('6331');

  // Buscar dados do perfil do senador
  const {
    data: perfilSenador,
    isLoading: loadingPerfil,
    error: errorPerfil,
    refetch
  } = useSenadorPerfil(senadorId);

  const handleTestSenador = () => {
    setSenadorId(testId);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Teste de Perfil de Senador</h1>

      <div className="mb-6 flex gap-4">
        <Input
          placeholder="ID do senador"
          value={testId}
          onChange={(e) => setTestId(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={handleTestSenador}>Testar</Button>
        <Button onClick={() => refetch()} variant="outline">Recarregar</Button>
        <a
          href="/senador/6331"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 flex items-center"
        >
          Ver Perfil do Senador 6331
        </a>
        <a
          href="/diagnostico"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 flex items-center"
        >
          Diagnóstico Firestore
        </a>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Dados do Firestore - Senador {senadorId}</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPerfil ? (
            <div className="flex justify-center p-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : errorPerfil ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-red-800">Erro ao carregar dados</h3>
              <p className="text-red-700">{errorPerfil.message}</p>
            </div>
          ) : !perfilSenador ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-yellow-800">Nenhum dado encontrado</h3>
              <p className="text-yellow-700">Não foi possível encontrar dados para o senador {senadorId}.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                {perfilSenador.foto ? (
                  <img
                    src={perfilSenador.foto}
                    alt={perfilSenador.nome}
                    className="w-32 h-32 rounded-full border-4 border-emerald-500 object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-500">
                    {perfilSenador.nome?.charAt(0) || '?'}
                  </div>
                )}

                <div>
                  <h2 className="text-2xl font-bold">{perfilSenador.nome}</h2>
                  <p className="text-gray-600">{perfilSenador.nomeCompleto}</p>

                  <div className="flex items-center gap-2 mt-2">
                    {perfilSenador.partido && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                        {perfilSenador.partido.sigla} - {perfilSenador.uf}
                      </span>
                    )}

                    {'bloco' in perfilSenador && perfilSenador.bloco && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {perfilSenador.bloco.apelido || perfilSenador.bloco.nome}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Dados Completos:</h3>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                  {JSON.stringify(perfilSenador, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TesteSenadorPage;
