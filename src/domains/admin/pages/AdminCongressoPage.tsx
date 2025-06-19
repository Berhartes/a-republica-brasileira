// src/domains/congresso/pages/AdminPage.tsx
import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';

interface Log {
  message: string;
  timestamp: string;
  type: 'info' | 'error' | 'success';
}

const AdminPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deputadoId, setDeputadoId] = useState<string>('');
  const [logs, setLogs] = useState<Log[]>([]);

  // Função para adicionar logs
  const addLog = (message: string, type: Log['type'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prevLogs) => [...prevLogs, { message, timestamp, type }]);
  };

  // Função para limpar logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Função simulada para sincronizar deputados
  const handleSincronizarDeputados = async () => {
    try {
      setLoading(true);
      setResult(null);
      setError(null);
      clearLogs();

      addLog('Iniciando sincronização de deputados...');

      // Simulação de processamento
      await new Promise(resolve => setTimeout(resolve, 1500));

      addLog('Conectando à API da Câmara...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1000));

      addLog('Baixando dados dos deputados...', 'info');
      await new Promise(resolve => setTimeout(resolve, 2000));

      addLog('Processando dados...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1000));

      addLog('Salvando no banco de dados...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1500));

      const count = 513;
      setResult(`${count} deputados sincronizados com sucesso!`);
      addLog(`${count} deputados sincronizados com sucesso!`, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao sincronizar deputados: ${errorMessage}`);
      addLog(`Erro ao sincronizar deputados: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Função simulada para sincronizar legislaturas
  const handleSincronizarLegislaturas = async () => {
    try {
      setLoading(true);
      setResult(null);
      setError(null);
      clearLogs();

      addLog('Iniciando sincronização de legislaturas...');

      // Simulação de processamento
      await new Promise(resolve => setTimeout(resolve, 1500));

      addLog('Conectando à API da Câmara...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1000));

      addLog('Baixando dados das legislaturas...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1500));

      addLog('Processando dados...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1000));

      addLog('Salvando no banco de dados...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const count = 5;
      setResult(`${count} legislaturas sincronizadas com sucesso!`);
      addLog(`${count} legislaturas sincronizadas com sucesso!`, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao sincronizar legislaturas: ${errorMessage}`);
      addLog(`Erro ao sincronizar legislaturas: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Função simulada para sincronizar partidos
  const handleSincronizarPartidos = async () => {
    try {
      setLoading(true);
      setResult(null);
      setError(null);
      clearLogs();

      addLog('Iniciando sincronização de partidos...');

      // Simulação de processamento
      await new Promise(resolve => setTimeout(resolve, 1000));

      addLog('Conectando à API da Câmara...', 'info');
      await new Promise(resolve => setTimeout(resolve, 800));

      addLog('Baixando dados dos partidos...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1200));

      addLog('Processando dados...', 'info');
      await new Promise(resolve => setTimeout(resolve, 800));

      addLog('Salvando no banco de dados...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const count = 33;
      setResult(`${count} partidos sincronizados com sucesso!`);
      addLog(`${count} partidos sincronizados com sucesso!`, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao sincronizar partidos: ${errorMessage}`);
      addLog(`Erro ao sincronizar partidos: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Função simulada para sincronizar despesas de um deputado
  const handleSincronizarDespesasDeputado = async () => {
    if (!deputadoId) {
      setError('Por favor, informe o ID do deputado.');
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      setError(null);
      clearLogs();

      addLog(`Iniciando sincronização de despesas do deputado ${deputadoId}...`);

      // Simulação de processamento
      await new Promise(resolve => setTimeout(resolve, 1000));

      addLog('Conectando à API da Câmara...', 'info');
      await new Promise(resolve => setTimeout(resolve, 800));

      addLog(`Baixando dados de despesas do deputado ${deputadoId}...`, 'info');
      await new Promise(resolve => setTimeout(resolve, 2000));

      addLog('Processando dados...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1000));

      addLog('Salvando no banco de dados...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1500));

      const count = Math.floor(Math.random() * 500) + 100;
      setResult(`${count} despesas do deputado ${deputadoId} sincronizadas com sucesso!`);
      addLog(`${count} despesas do deputado ${deputadoId} sincronizadas com sucesso!`, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao sincronizar despesas do deputado ${deputadoId}: ${errorMessage}`);
      addLog(`Erro ao sincronizar despesas do deputado ${deputadoId}: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Função simulada para sincronizar todos os dados
  const handleSincronizarTodosDados = async () => {
    try {
      setLoading(true);
      setResult(null);
      setError(null);
      clearLogs();

      addLog('Iniciando sincronização completa de dados...');

      // Simulação de processamento para legislaturas
      addLog('Sincronizando legislaturas...', 'info');
      await new Promise(resolve => setTimeout(resolve, 2000));
      addLog('Legislaturas sincronizadas com sucesso!', 'success');

      // Simulação de processamento para partidos
      addLog('Sincronizando partidos...', 'info');
      await new Promise(resolve => setTimeout(resolve, 2500));
      addLog('Partidos sincronizados com sucesso!', 'success');

      // Simulação de processamento para deputados
      addLog('Sincronizando deputados...', 'info');
      await new Promise(resolve => setTimeout(resolve, 3000));
      addLog('Deputados sincronizados com sucesso!', 'success');

      // Simulação de processamento para despesas
      addLog('Sincronizando despesas...', 'info');
      await new Promise(resolve => setTimeout(resolve, 4000));
      addLog('Despesas sincronizadas com sucesso!', 'success');

      const resultado = {
        legislaturas: 5,
        partidos: 33,
        deputados: 513,
        despesas: 24567
      };

      setResult(
        `Sincronização completa finalizada com sucesso!\n` +
          `- ${resultado.legislaturas} legislaturas\n` +
          `- ${resultado.partidos} partidos\n` +
          `- ${resultado.deputados} deputados\n` +
          `- ${resultado.despesas} despesas`,
      );

      addLog('Sincronização completa finalizada com sucesso!', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro na sincronização completa: ${errorMessage}`);
      addLog(`Erro na sincronização completa: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Administração</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Sincronização de Dados</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleSincronizarDeputados}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            Sincronizar Deputados
          </button>

          <button
            onClick={handleSincronizarLegislaturas}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            Sincronizar Legislaturas
          </button>

          <button
            onClick={handleSincronizarPartidos}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            Sincronizar Partidos
          </button>

          <div className="flex space-x-2">
            <input
              type="text"
              value={deputadoId}
              onChange={(e) => setDeputadoId(e.target.value)}
              placeholder="ID do Deputado"
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
            />
            <button
              onClick={handleSincronizarDespesasDeputado}
              disabled={loading || !deputadoId}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
            >
              Sincronizar Despesas
            </button>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={handleSincronizarTodosDados}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-md disabled:opacity-50 font-medium"
          >
            Sincronizar Todos os Dados
          </button>
        </div>

        <div className="mb-6">
          <Link
            to="/diagnostico-senador"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-md font-medium flex items-center justify-center"
          >
            Diagnóstico de Senador
          </Link>
        </div>

        {loading && (
          <div className="text-center py-4">
            <p className="text-lg">Sincronizando dados...</p>
            <div className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 animate-pulse"></div>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-green-100 dark:bg-green-900 border border-green-400 text-green-700 dark:text-green-300 px-4 py-3 rounded mb-4">
            <p className="whitespace-pre-line">{result}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Logs</h2>
          <button
            onClick={clearLogs}
            className="text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-3 py-1 rounded"
          >
            Limpar Logs
          </button>
        </div>

        <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md h-64 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Nenhum log disponível.</p>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`mb-1 ${
                  log.type === 'error'
                    ? 'text-red-600 dark:text-red-400'
                    : log.type === 'success'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-800 dark:text-gray-300'
                }`}
              >
                <span className="text-gray-500 dark:text-gray-500">[{log.timestamp}]</span>{' '}
                {log.message}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Funcionalidade em Desenvolvimento</h3>
        <p className="text-yellow-700">
          Esta é uma versão simulada do painel de administração. As funções de sincronização não estão conectadas a APIs reais.
        </p>
      </div>
    </div>
  );
};

export default AdminPage;