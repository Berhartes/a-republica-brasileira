// src/pages/diagnostico-senador/index.tsx
import React, { useState } from 'react';
import { useSenadorPerfil } from '@/domains/congresso/senado/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import { logger } from '@/app/monitoring/logger';

/**
 * Página de diagnóstico para visualizar os dados disponíveis no Firestore para um senador
 */
const DiagnosticoSenadorPage: React.FC = () => {
  const [senadorId, setSenadorId] = useState<string>('6331'); // Sergio Moro como padrão
  const [inputId, setInputId] = useState<string>('6331');

  // Buscar dados do perfil do senador
  const {
    data: perfilSenador,
    isLoading: loadingPerfil,
    error: errorPerfil,
    refetch
  } = useSenadorPerfil(senadorId);

  const handleBuscarSenador = () => {
    setSenadorId(inputId);
  };

  // Função para renderizar um objeto como JSON formatado
  const renderJson = (data: any) => {
    return (
      <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[500px] text-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  // Componente para renderizar uma seção de dados
  const SecaoDados: React.FC<{titulo: string; dados: any; aberto?: boolean}> = ({ titulo, dados, aberto = false }) => {
    const [expandido, setExpandido] = useState<boolean>(aberto);

    if (!dados) return null;

    return (
      <div className="mb-4">
        <div
          className="flex justify-between items-center p-3 bg-gray-200 rounded-t-md cursor-pointer"
          onClick={() => setExpandido(!expandido)}
        >
          <h3 className="font-medium">{titulo}</h3>
          <span>{expandido ? '▼' : '►'}</span>
        </div>
        {expandido && (
          <div className="border border-gray-200 border-t-0 rounded-b-md p-3">
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[500px] text-sm">
              {JSON.stringify(dados, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Diagnóstico de Dados do Senador</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Buscar Senador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              type="text"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              placeholder="ID do Senador"
              className="max-w-xs"
            />
            <Button onClick={handleBuscarSenador}>Buscar</Button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Exemplos: 6331 (Sergio Moro), 5672 (Alan Rick), 5895 (Flávio Bolsonaro)
          </p>
        </CardContent>
      </Card>

      {loadingPerfil ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : errorPerfil ? (
        <Card className="mb-8 border-red-300">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-700">Erro ao carregar dados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{errorPerfil.toString()}</p>
          </CardContent>
        </Card>
      ) : !perfilSenador ? (
        <Card className="mb-8 border-yellow-300">
          <CardHeader className="bg-yellow-50">
            <CardTitle className="text-yellow-700">Nenhum dado encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Não foram encontrados dados para o senador com ID {senadorId}.</p>
          </CardContent>
        </Card>
      ) : (
        <div>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                {perfilSenador.foto && (
                  <img
                    src={perfilSenador.foto}
                    alt={perfilSenador.nome}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                )}
                <div>
                  <h2 className="text-2xl font-bold">{perfilSenador.nome}</h2>
                  <p className="text-gray-600">{perfilSenador.nomeCompleto}</p>
                  <div className="mt-2 flex gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {perfilSenador.partido?.sigla} - {perfilSenador.uf}
                    </span>
                    {'bloco' in perfilSenador && perfilSenador.bloco && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                        {perfilSenador.bloco.apelido || perfilSenador.bloco.nome}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <h2 className="text-2xl font-bold mb-4">Dados Disponíveis no Firestore</h2>

          <SecaoDados titulo="Dados Pessoais" dados={perfilSenador.dadosPessoais} aberto={true} />
          <SecaoDados titulo="Partido" dados={perfilSenador.partido} />
          {'bloco' in perfilSenador && <SecaoDados titulo="Bloco" dados={perfilSenador.bloco} />}
          <SecaoDados titulo="Telefones" dados={perfilSenador.telefones} />
          <SecaoDados titulo="Situação" dados={perfilSenador.situacao} />
          {'formacao' in perfilSenador && <SecaoDados titulo="Formação" dados={perfilSenador.formacao} />}
          {'mandatos' in perfilSenador && <SecaoDados titulo="Mandatos" dados={perfilSenador.mandatos} />}
          {'comissoes' in perfilSenador && <SecaoDados titulo="Comissões" dados={perfilSenador.comissoes} />}
          {'filiacoes' in perfilSenador && <SecaoDados titulo="Filiações" dados={perfilSenador.filiacoes} />}
          {'licencas' in perfilSenador && <SecaoDados titulo="Licenças" dados={perfilSenador.licencas} />}
          {'apartes' in perfilSenador && <SecaoDados titulo="Apartes" dados={perfilSenador.apartes} />}
          {'situacaoAtual' in perfilSenador && <SecaoDados titulo="Situação Atual" dados={perfilSenador.situacaoAtual} />}
          {'metadados' in perfilSenador && <SecaoDados titulo="Metadados" dados={perfilSenador.metadados} />}
          {'redeSocial' in perfilSenador && <SecaoDados titulo="Rede Social" dados={perfilSenador.redeSocial} />}

          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">Dados Completos (JSON)</h3>
            {renderJson(perfilSenador)}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticoSenadorPage;
