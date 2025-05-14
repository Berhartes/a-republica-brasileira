// src/components/senado/SenadorDetalhe.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import { senadoApi } from '../../core/utils/senado-api';

type RouteParams = Record<string, string | undefined>;

const SenadorDetalhe: React.FC = () => {
  const { id } = useParams({ from: '/senador/$id' });
  const [senador, setSenador] = useState<any>(null);
  const [mandatos, setMandatos] = useState<any[]>([]);
  const [comissoes, setComissoes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('perfil');

  useEffect(() => {
    const carregarDados = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Carregar dados do senador
        const dadosSenador = await senadoApi.obterDetalhesParlamentar(id);
        setSenador(dadosSenador);
        
        // Tentar carregar mandatos e comissões caso estejam disponíveis na API
        try {
          // Estas chamadas dependem da implementação específica do wrapper
          // Você pode precisar adaptar conforme a disponibilidade de endpoints
          const mandatosSenador = await senadoApi.obterMandatosParlamentar(id);
          setMandatos(Array.isArray(mandatosSenador) ? mandatosSenador : []);
          
          const comissoesSenador = await senadoApi.obterComissoesParlamentar(id);
          setComissoes(Array.isArray(comissoesSenador) ? comissoesSenador : []);
        } catch (subError) {
          console.warn('Não foi possível carregar dados complementares:', subError);
          // Definir arrays vazios para não quebrar a interface
          setMandatos([]);
          setComissoes([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar dados do senador:', err);
        setError('Não foi possível carregar os detalhes deste senador. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [id]);

  const renderPerfilTab = () => {
    if (!senador) return null;
    
    return (
      <div className="perfil-tab">
        <div className="senador-header">
          <div className="senador-foto">
            {senador.UrlFotoParlamentar ? (
              <img src={senador.UrlFotoParlamentar} alt={`Foto de ${senador.NomeParlamentar}`} />
            ) : (
              <div className="foto-placeholder">{senador.NomeParlamentar?.charAt(0)}</div>
            )}
          </div>
          
          <div className="senador-info-principal">
            <h1>{senador.NomeCompletoParlamentar}</h1>
            <h2>{senador.NomeParlamentar}</h2>
            
            <div className="partido-uf">
              <span className="partido">{senador.SiglaPartidoParlamentar}</span>
              <span className="uf">{senador.UfParlamentar}</span>
            </div>
            
            {senador.EmailParlamentar && (
              <div className="contato">
                <strong>E-mail:</strong> {senador.EmailParlamentar}
              </div>
            )}
            
            {senador.EnderecoCompletoGabinete && (
              <div className="endereco">
                <strong>Gabinete:</strong> {senador.EnderecoCompletoGabinete}
              </div>
            )}
            
            {senador.TelefoneGabinete && (
              <div className="telefone">
                <strong>Telefone:</strong> {senador.TelefoneGabinete}
              </div>
            )}
          </div>
        </div>
        
        <div className="senador-dados-pessoais">
          <h3>Dados Pessoais</h3>
          
          <div className="dados-grid">
            {senador.DataNascimento && (
              <div className="dado">
                <strong>Data de Nascimento:</strong> {formatarData(senador.DataNascimento)}
              </div>
            )}
            
            {senador.SexoParlamentar && (
              <div className="dado">
                <strong>Sexo:</strong> {senador.SexoParlamentar === 'M' ? 'Masculino' : 'Feminino'}
              </div>
            )}
            
            {senador.NaturalidadeParlamentar && (
              <div className="dado">
                <strong>Naturalidade:</strong> {senador.NaturalidadeParlamentar}
              </div>
            )}
          </div>
          
          {senador.UrlPaginaParlamentar && (
            <div className="links">
              <a href={senador.UrlPaginaParlamentar} target="_blank" rel="noopener noreferrer">
                Página Oficial no Senado
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMandatosTab = () => {
    if (!mandatos || mandatos.length === 0) {
      return <p className="info-indisponivel">Informações sobre mandatos não disponíveis.</p>;
    }
    
    return (
      <div className="mandatos-tab">
        <h3>Mandatos</h3>
        
        <div className="mandatos-lista">
          {mandatos.map((mandato, index) => (
            <div key={index} className="mandato-card">
              <div className="mandato-periodo">
                <strong>Período:</strong> {formatarData(mandato.DataInicio)} a {mandato.DataFim ? formatarData(mandato.DataFim) : 'Atual'}
              </div>
              
              {mandato.DescricaoParticipacao && (
                <div className="mandato-participacao">
                  <strong>Participação:</strong> {mandato.DescricaoParticipacao}
                </div>
              )}
              
              {mandato.Legislaturas && mandato.Legislaturas.length > 0 && (
                <div className="mandato-legislaturas">
                  <strong>Legislaturas:</strong>
                  <ul>
                    {mandato.Legislaturas.map((leg: any, legIndex: number) => (
                      <li key={legIndex}>{leg.NumeroLegislatura}ª Legislatura ({leg.DataInicio} - {leg.DataFim || 'Atual'})</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderComissoesTab = () => {
    if (!comissoes || comissoes.length === 0) {
      return <p className="info-indisponivel">Informações sobre participação em comissões não disponíveis.</p>;
    }
    
    return (
      <div className="comissoes-tab">
        <h3>Participação em Comissões</h3>
        
        <div className="comissoes-lista">
          {comissoes.map((comissao, index) => (
            <div key={index} className="comissao-card">
              <h4>{comissao.NomeComissao}</h4>
              <div className="comissao-sigla">
                <strong>Sigla:</strong> {comissao.SiglaComissao}
              </div>
              
              {comissao.DataInicio && (
                <div className="comissao-periodo">
                  <strong>Período:</strong> {formatarData(comissao.DataInicio)} a {comissao.DataFim ? formatarData(comissao.DataFim) : 'Atual'}
                </div>
              )}
              
              {comissao.DescricaoParticipacao && (
                <div className="comissao-participacao">
                  <strong>Participação:</strong> {comissao.DescricaoParticipacao}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Função auxiliar para formatar datas
  const formatarData = (dataString: string): string => {
    if (!dataString) return '';
    
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR');
    } catch {
      // Se não conseguir converter, retorna a própria string
      return dataString;
    }
  };

  if (loading) {
    return <div className="loading">Carregando dados do senador...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!senador) {
    return <div className="not-found">Senador não encontrado.</div>;
  }

  return (
    <div className="senador-detalhe-container">
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'perfil' ? 'active' : ''}`}
          onClick={() => setActiveTab('perfil')}
        >
          Perfil
        </button>
        <button 
          className={`tab-button ${activeTab === 'mandatos' ? 'active' : ''}`}
          onClick={() => setActiveTab('mandatos')}
        >
          Mandatos
        </button>
        <button 
          className={`tab-button ${activeTab === 'comissoes' ? 'active' : ''}`}
          onClick={() => setActiveTab('comissoes')}
        >
          Comissões
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'perfil' && renderPerfilTab()}
        {activeTab === 'mandatos' && renderMandatosTab()}
        {activeTab === 'comissoes' && renderComissoesTab()}
      </div>
      
      <div className="back-link">
        <a href="/senadores">← Voltar para a lista de senadores</a>
      </div>
    </div>
  );
};

export default SenadorDetalhe;
