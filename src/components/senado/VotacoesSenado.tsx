// src/components/senado/VotacoesSenado.tsx
import * as React from 'react';
import { useState, useEffect } from 'react';
import { senadoApi } from '../../core/utils/senado-api';

const VotacoesSenado: React.FC = () => {
  const [votacoes, setVotacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<string>('30'); // Últimos 30 dias por padrão

  useEffect(() => {
    carregarVotacoes();
  }, [periodo]);

  const carregarVotacoes = async () => {
    try {
      setLoading(true);
      
      // Converter o período para dias
      const dias = parseInt(periodo, 10);
      
      const hoje = new Date();
      const dataFim = senadoApi.formatarData(hoje);
      
      const dataInicial = new Date();
      dataInicial.setDate(dataInicial.getDate() - dias);
      const dataInicio = senadoApi.formatarData(dataInicial);
      
      // Carregar as votações do período selecionado
      const votacoesData = await senadoApi.obterVotacoesPorPeriodo(dataInicio, dataFim);
      
      setVotacoes(Array.isArray(votacoesData) ? votacoesData : []);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar votações:', err);
      setError('Não foi possível carregar os dados de votações. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Formata a data para exibição
  const formatarData = (dataString: string): string => {
    if (!dataString) return 'Data não disponível';
    
    try {
      // Se a data vier no formato YYYYMMDD (comum na API)
      if (dataString.length === 8 && !dataString.includes('-')) {
        const ano = dataString.substring(0, 4);
        const mes = dataString.substring(4, 6);
        const dia = dataString.substring(6, 8);
        return `${dia}/${mes}/${ano}`;
      }
      
      // Se vier como string ISO
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR');
    } catch {
      return dataString;
    }
  };

  // Determina a classe CSS com base no resultado
  const getResultadoClass = (resultado: string): string => {
    if (!resultado) return '';
    
    const resultadoLower = resultado.toLowerCase();
    if (resultadoLower.includes('aprovad')) return 'resultado-aprovado';
    if (resultadoLower.includes('rejeitad')) return 'resultado-rejeitado';
    if (resultadoLower.includes('retirad')) return 'resultado-retirado';
    return '';
  };

  return (
    <div className="votacoes-container">
      <h1>Votações no Senado Federal</h1>
      
      <div className="filtros-votacoes">
        <div className="filtro-periodo">
          <label htmlFor="periodo">Período:</label>
          <select 
            id="periodo" 
            value={periodo} 
            onChange={(e) => setPeriodo(e.target.value)}
          >
            <option value="7">Últimos 7 dias</option>
            <option value="15">Últimos 15 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="60">Últimos 60 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="180">Últimos 6 meses</option>
            <option value="365">Último ano</option>
          </select>
        </div>
        
        <button className="atualizar-btn" onClick={carregarVotacoes}>
          Atualizar
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Carregando votações...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : votacoes.length === 0 ? (
        <div className="sem-resultados">
          Nenhuma votação encontrada no período selecionado.
        </div>
      ) : (
        <>
          <div className="resultados-contagem">
            <p>{votacoes.length} votações encontradas</p>
          </div>
          
          <div className="votacoes-lista">
            {votacoes.map((votacao, index) => (
              <div key={index} className="votacao-card">
                <div className="votacao-header">
                  <div className="votacao-data">
                    {formatarData(votacao.DataSessao)}
                  </div>
                  
                  <div className={`votacao-resultado ${getResultadoClass(votacao.Resultado)}`}>
                    {votacao.Resultado || 'Resultado não informado'}
                  </div>
                </div>
                
                <h3 className="votacao-materia">
                  {votacao.DescricaoVotacao || 'Descrição não disponível'}
                </h3>
                
                {votacao.SiglaMateria && votacao.NumeroMateria && votacao.AnoMateria && (
                  <div className="votacao-identificacao">
                    {votacao.SiglaMateria} {votacao.NumeroMateria}/{votacao.AnoMateria}
                  </div>
                )}
                
                {votacao.DescricaoTramitacao && (
                  <div className="votacao-tramitacao">
                    <strong>Tramitação:</strong> {votacao.DescricaoTramitacao}
                  </div>
                )}
                
                <div className="votacao-detalhes">
                  {votacao.TotalVotosSim !== undefined && (
                    <div className="votos-sim">
                      <span className="label">Sim:</span> {votacao.TotalVotosSim}
                    </div>
                  )}
                  
                  {votacao.TotalVotosNao !== undefined && (
                    <div className="votos-nao">
                      <span className="label">Não:</span> {votacao.TotalVotosNao}
                    </div>
                  )}
                  
                  {votacao.TotalVotosAbstencao !== undefined && (
                    <div className="votos-abstencao">
                      <span className="label">Abstenção:</span> {votacao.TotalVotosAbstencao}
                    </div>
                  )}
                </div>
                
                <a href={`/votacao/${votacao.CodigoSessaoVotacao}`} className="ver-mais">
                  Ver detalhes da votação →
                </a>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default VotacoesSenado;
