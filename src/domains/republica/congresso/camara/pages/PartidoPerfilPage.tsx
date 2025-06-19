import { useEffect, useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { doc, getDoc } from 'firebase/firestore';
import { db as firestore } from '@/shared/services/firebase';
import { partidoPerfilRoute } from '../routes';

// Adicionar uma interface para o tipo de dados do partido
interface Partido {
  nome: string;
  sigla: string;
  urlLogo: string;
  lider: {
    id: number;
    nome: string;
    urlFoto: string;
  };
  status: {
    totalMembros: string;
  };
  lideres: {
    id: number;
    nome: string;
    titulo: string;
    urlFoto: string;
  }[];
  membros: {
    id: number;
    nome: string;
    urlFoto: string;
  }[];
}

const PartidoPerfilPage = () => {
  const { id } = useParams({ from: partidoPerfilRoute.id });
  const [partido, setPartido] = useState<Partido | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchPartido = async () => {
      try {
        const partidoDocRef = doc(firestore, `congressoNacional/camaraDeputados/legislatura/57/partidos/${id}`);
        const partidoDoc = await getDoc(partidoDocRef);

        if (partidoDoc.exists()) {
          setPartido(partidoDoc.data() as Partido);
        } else {
          setError("Partido não encontrado.");
        }
      } catch (err) {
        setError("Erro ao buscar dados do partido.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPartido();
  }, [id]);

  if (loading) {
    return <div className="container mx-auto p-4">Carregando...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4">{error}</div>;
  }

  if (!partido) {
    return <div className="container mx-auto p-4">Nenhum dado de partido encontrado.</div>;
  }

  const membrosUnicos = partido.membros ? [...new Map(partido.membros.map(item => [item.id, item])).values()] : [];

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-4">
        <img src={partido.urlLogo} alt={`Logo do ${partido.nome}`} className="h-24 w-24 mr-4" />
        <h1 className="text-3xl font-bold">{partido.nome} ({partido.sigla})</h1>
      </div>

      {partido.lider && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Líder</h2>
          <Link to="/deputado/$id" params={{ id: partido.lider.id.toString() }}>
            <div className="flex items-center">
              <img src={partido.lider.urlFoto} alt={partido.lider.nome} className="h-16 w-16 rounded-full mr-4" />
              <span>{partido.lider.nome}</span>
            </div>
          </Link>
        </div>
      )}

      {partido.status && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Informações</h2>
          <p>Total de membros: {partido.status.totalMembros}</p>
        </div>
      )}

      {partido.lideres && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Liderança</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partido.lideres.map((lider) => (
              <Link key={lider.id} to="/deputado/$id" params={{ id: lider.id.toString() }}>
                <div className="flex items-center">
                  <img src={lider.urlFoto} alt={lider.nome} className="h-16 w-16 rounded-full mr-4" />
                  <div>
                    <p className="font-bold">{lider.nome}</p>
                    <p>{lider.titulo}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {membrosUnicos.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-2">Membros</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {membrosUnicos.map((membro) => (
              <Link key={membro.id} to="/deputado/$id" params={{ id: membro.id.toString() }}>
                <div className="text-center">
                  <img src={membro.urlFoto} alt={membro.nome} className="h-24 w-24 rounded-full mx-auto mb-2" />
                  <p>{membro.nome}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PartidoPerfilPage;
