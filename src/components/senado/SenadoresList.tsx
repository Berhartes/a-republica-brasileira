// src/components/senado/SenadoresList.tsx
import React, { useState, useEffect } from 'react';
import { senadoApi } from '../../core/utils/senado-api';
import './SenadoresList.css';

interface SenadorProps {
  codigo: string;
  nome: string;
  partido: string;
  uf: string;
  foto?: string;
}

const Senador: React.FC<SenadorProps> = ({ codigo, nome, partido, uf, foto }) => {
  return (
    <div className="senador-card">
      <div className="senador-foto">
        {foto ? (
          <img src={foto} alt={`Foto de ${nome}`} />
        ) : (
          <div className="foto-placeholder">
            {nome.charAt(0)}
          </div>
        )}
      </div>
      <div className="senador-info">
        <h3>{nome}</h3>
        <p>
          <span className="partido">{partido}</span>
          <span className="uf">{uf}</span>
        </p>
        <div className="flex gap-2">
          <a href={`/senador/${codigo}`} className="ver-detalhes">
            Ver detalhes
          </a>
          <a href={`/senador/${codigo}`} className="ver-perfil">
            Ver perfil
          </a>
        </div>
      </div>
    </div>
  );
};

const SenadoresList: React.FC = () => {
  const [senadores, setSenadores] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroPartido, setFiltroPartido] = useState<string>('');
  const [filtroUF, setFiltroUF] = useState<string>('');
  const [partidos, setPartidos] = useState<any[]>([]);
  const [ufs, setUfs] = useState<string[]>([]);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);

        // Carregar senadores
        const dadosSenadores = await senadoApi.obterParlamentares(true);
        setSenadores(Array.isArray(dadosSenadores) ? dadosSenadores : []);

        // Carregar partidos
        const dadosPartidos = await senadoApi.obterPartidos();
        setPartidos(Array.isArray(dadosPartidos) ? dadosPartidos : []);

        // Extrair lista de UFs a partir dos senadores
        const ufsUnicas = Array.isArray(dadosSenadores)
          ? [...new Set(dadosSenadores.map((s: any) => s.UfParlamentar))]
          : [];
        setUfs((ufsUnicas as string[]).sort());

        setError(null);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Não foi possível carregar os dados dos senadores. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  // Filtrar senadores com base nos critérios selecionados
  const senadoresFiltrados = senadores.filter(senador => {
    const partidoMatch = !filtroPartido || senador.SiglaPartidoParlamentar === filtroPartido;
    const ufMatch = !filtroUF || senador.UfParlamentar === filtroUF;
    return partidoMatch && ufMatch;
  });

  const handleLimparFiltros = () => {
    setFiltroPartido('');
    setFiltroUF('');
  };

  if (loading) {
    return <div className="loading">Carregando senadores...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="senadores-container">
      <h1>Senadores em Exercício</h1>

      <div className="filtros">
        <div className="filtro-grupo">
          <label htmlFor="filtro-partido">Partido:</label>
          <select
            id="filtro-partido"
            value={filtroPartido}
            onChange={(e) => setFiltroPartido(e.target.value)}
          >
            <option value="">Todos os partidos</option>
            {partidos.map(partido => (
              <option key={partido.Codigo} value={partido.Sigla}>
                {partido.Sigla} - {partido.Nome}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-grupo">
          <label htmlFor="filtro-uf">Estado:</label>
          <select
            id="filtro-uf"
            value={filtroUF}
            onChange={(e) => setFiltroUF(e.target.value)}
          >
            <option value="">Todos os estados</option>
            {ufs.map(uf => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        </div>

        <button onClick={handleLimparFiltros} className="limpar-filtros">
          Limpar filtros
        </button>
      </div>

      <div className="resultados">
        <p>
          {senadoresFiltrados.length} {senadoresFiltrados.length === 1 ? 'senador encontrado' : 'senadores encontrados'}
        </p>
      </div>

      <div className="senadores-grid">
        {senadoresFiltrados.map(senador => (
          <Senador
            key={senador.CodigoParlamentar}
            codigo={senador.CodigoParlamentar}
            nome={senador.NomeParlamentar}
            partido={senador.SiglaPartidoParlamentar}
            uf={senador.UfParlamentar}
            foto={senador.UrlFotoParlamentar}
          />
        ))}
      </div>
    </div>
  );
};

export default SenadoresList;
