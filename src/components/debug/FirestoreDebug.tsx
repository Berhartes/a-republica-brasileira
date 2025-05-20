import React, { useState, useEffect } from 'react';
import { verificarDadosSenadores, verificarSenador } from '@/utils/verificar-firestore';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import { db } from '@/shared/services/firebase';
import { getApp } from 'firebase/app';

/**
 * Componente para testar a conectividade com o Firestore
 */
const FirestoreDebug: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [senadorId, setSenadorId] = useState<string>('6331'); // Sergio Moro como padrão
  const [configInfo, setConfigInfo] = useState<any>(null);

  // Carregar informações de configuração ao montar o componente
  useEffect(() => {
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 5) + '...',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID?.substring(0, 10) + '...',
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
      useEmulator: import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'
    };
    setConfigInfo(config);
  }, []);

  /**
   * Verifica a estrutura de dados no Firestore
   */
  const handleVerificarDados = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await verificarDadosSenadores();
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verifica se um senador específico existe no Firestore
   */
  const handleVerificarSenador = async () => {
    if (!senadorId) {
      setError('Informe o ID do senador');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await verificarSenador(senadorId);
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Testa a conexão direta com o Firestore
   */
  const handleTestarConexaoDireta = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('Testando conexão direta com o Firestore...');

      // Tentar acessar um documento que sabemos que existe
      const senadorId = '6331'; // Sergio Moro
      const path = `congressoNacional/senadoFederal/perfis/${senadorId}`;

      console.log(`Tentando acessar: ${path}`);

      // Registrar a configuração atual
      console.log('Configuração do Firebase:', {
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        useEmulator: import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'
      });

      // Tentar acessar o documento diretamente
      const docRef = doc(db, path);
      console.log('Referência do documento criada:', docRef.path);

      const docSnap = await getDoc(docRef);
      console.log('Documento obtido, existe:', docSnap.exists());

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('Dados do documento:', data);

        setResults({
          status: 'success',
          message: 'Conexão direta bem-sucedida!',
          paths: [{
            path,
            exists: true,
            data: {
              nome: data.nome,
              partido: data.partido?.sigla,
              uf: data.uf
            }
          }]
        });
      } else {
        console.log('Documento não encontrado');
        setResults({
          status: 'warning',
          message: 'Documento não encontrado',
          paths: [{
            path,
            exists: false
          }]
        });
      }
    } catch (err) {
      console.error('Erro na conexão direta:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Testa a conexão com o Firestore usando o senador 6331 (Sergio Moro)
   */
  const handleTestarSenador6331 = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('Testando conexão com o Firestore usando o senador 6331 (Sergio Moro)...');

      // Tentar acessar o documento do senador 6331
      const senadorId = '6331'; // Sergio Moro
      const path = `congressoNacional/senadoFederal/perfis/${senadorId}`;

      console.log(`Tentando acessar: ${path}`);

      // Tentar acessar o documento diretamente
      const docRef = doc(db, path);
      console.log('Referência do documento criada:', docRef.path);

      const docSnap = await getDoc(docRef);
      console.log('Documento obtido, existe:', docSnap.exists());

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('Dados do documento:', data);

        setResults({
          status: 'success',
          message: 'Perfil do senador 6331 (Sergio Moro) encontrado!',
          senador: {
            id: senadorId,
            nome: data.nome || 'Nome não disponível',
            partido: data.partido?.sigla || 'Partido não disponível',
            uf: data.uf || 'UF não disponível',
            foto: data.foto ? 'Disponível' : 'Não disponível'
          }
        });
      } else {
        console.log('Documento não encontrado');
        setResults({
          status: 'warning',
          message: 'Perfil do senador 6331 (Sergio Moro) não encontrado',
          path
        });
      }
    } catch (err) {
      console.error('Erro ao buscar perfil do senador 6331:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verifica a configuração do Firebase
   */
  const handleVerificarConfiguracao = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('Verificando configuração do Firebase...');

      // Obter a instância atual do Firebase
      const app = getApp();
      const options = app.options;

      console.log('Opções do Firebase:', {
        apiKey: options.apiKey?.substring(0, 5) + '...',
        projectId: options.projectId,
        appId: options.appId?.substring(0, 10) + '...'
      });

      // Verificar se o Firestore está inicializado
      console.log('Firestore inicializado:', !!db);

      // Verificar se estamos usando emuladores
      const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
      console.log('Usando emuladores:', useEmulators);

      setResults({
        status: 'success',
        message: 'Configuração do Firebase verificada',
        config: {
          apiKey: options.apiKey?.substring(0, 5) + '...',
          projectId: options.projectId,
          appId: options.appId?.substring(0, 10) + '...',
          useEmulators,
          firestoreInitialized: !!db
        }
      });
    } catch (err) {
      console.error('Erro ao verificar configuração:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Diagnóstico do Firestore</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Informações de Configuração */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Configuração do Firebase</h3>
            {configInfo ? (
              <pre className="bg-white p-4 rounded-lg overflow-auto max-h-40 text-sm">
                {JSON.stringify(configInfo, null, 2)}
              </pre>
            ) : (
              <p>Carregando configurações...</p>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Button
                onClick={handleVerificarConfiguracao}
                disabled={loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Verificar Configuração
              </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <Button
                onClick={handleVerificarDados}
                disabled={loading}
                className="flex-1"
              >
                Verificar Estrutura de Dados
              </Button>

              <Button
                onClick={handleTestarConexaoDireta}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Testar Conexão Direta
              </Button>

              <Button
                onClick={handleTestarSenador6331}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Testar Senador 6331
              </Button>
            </div>

            <div className="flex flex-1 gap-2">
              <Input
                placeholder="ID do senador"
                value={senadorId}
                onChange={(e) => setSenadorId(e.target.value)}
                disabled={loading}
              />
              <Button
                onClick={handleVerificarSenador}
                disabled={loading || !senadorId}
              >
                Verificar
              </Button>
            </div>
          </div>

          {loading && (
            <div className="flex justify-center p-8">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-red-800">Erro</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {results && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-800">Resultados</h3>

              <div className="mt-4">
                <p className="font-medium">Status: <span className={results.status === 'success' ? 'text-green-600' : results.status === 'warning' ? 'text-yellow-600' : 'text-red-600'}>{results.status}</span></p>
                <p className="text-gray-700">{results.message}</p>
              </div>

              {results.config && (
                <div className="mt-4 border border-gray-200 rounded-lg p-3">
                  <h4 className="font-medium mb-2">Configuração do Firebase:</h4>
                  <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(results.config, null, 2)}
                  </pre>
                </div>
              )}

              {results.senador && (
                <div className="mt-4 border border-gray-200 rounded-lg p-3">
                  <h4 className="font-medium mb-2">Dados do Senador:</h4>
                  <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(results.senador, null, 2)}
                  </pre>
                </div>
              )}

              {results.paths && results.paths.length > 0 && (
                <div className="mt-4 space-y-4">
                  <h4 className="font-medium">Caminhos verificados:</h4>

                  {results.paths.map((path: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <p className="font-medium break-all">{path.path}</p>

                      {path.exists === false ? (
                        <p className="text-red-600">Não encontrado</p>
                      ) : path.empty ? (
                        <p className="text-yellow-600">Coleção vazia</p>
                      ) : (
                        <div>
                          {path.count !== undefined && (
                            <p className="text-green-600">{path.count} documentos encontrados</p>
                          )}

                          {path.sampleDocId && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">Exemplo (ID: {path.sampleDocId}):</p>
                              <p className="text-sm text-gray-600">Campos: {path.sampleDocFields?.join(', ')}</p>
                            </div>
                          )}

                          {path.data && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">Nome: {path.data.nome}</p>
                              <p className="text-sm text-gray-600">Partido: {path.data.partido}</p>
                              <p className="text-sm text-gray-600">UF: {path.data.uf}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {path.error && (
                        <p className="text-red-600 mt-2">{path.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FirestoreDebug;
