import { useEffect, useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { doc, getDoc } from 'firebase/firestore';
import { db as firestore } from '@/shared/services/firebase';
import { blocoPerfilRoute } from '../routes';

interface Bloco {
  nome: string;
  lider: {
    id: number;
    nome: string;
    urlFoto: string;
  };
  membrosPartidos: {
    membros: {
      id: number;
      nome: string;
      urlFoto: string;
    }[];
  }[];
}

const BlocoPerfilPage = () => {
  const { id, legislatura } = useParams({ from: blocoPerfilRoute.id });
  const [bloco, setBloco] = useState<Bloco | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !legislatura) return;

    const fetchBloco = async () => {
      try {
        const blocoDocRef = doc(firestore, `congressoNacional/camaraDeputados/legislatura/${legislatura}/blocos/${id}`);
        const blocoDoc = await getDoc(blocoDocRef);

        if (blocoDoc.exists()) {
          setBloco(blocoDoc.data() as Bloco);
        } else {
          setError("Bloco não encontrado.");
        }
      } catch (err) {
        setError("Erro ao buscar dados do bloco.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBloco();
  }, [id, legislatura]);

  if (loading) {
    return <div className="container mx-auto p-4">Carregando...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4">{error}</div>;
  }

  if (!bloco) {
    return <div className="container mx-auto p-4">Nenhum dado de bloco encontrado.</div>;
  }

  const membros = bloco.membrosPartidos?.flatMap(p => p.membros) || [];
  const membrosUnicos = membros ? [...new Map(membros.map(item => [item.id, item])).values()] : [];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{bloco.nome}</h1>

      {bloco.lider && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Líder</h2>
          <Link to="/deputado/$id" params={{ id: bloco.lider.id.toString() }}>
            <div className="flex items-center">
              <img src={bloco.lider.urlFoto} alt={bloco.lider.nome} className="h-16 w-16 rounded-full mr-4" />
              <span>{bloco.lider.nome}</span>
            </div>
          </Link>
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

export default BlocoPerfilPage;
