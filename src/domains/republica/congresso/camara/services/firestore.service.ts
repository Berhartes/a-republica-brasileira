import { db as firestore } from '../../../../../shared/services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Deputado } from '../schemas';
import { getLatestLegislaturaId } from './legislatura.service';

export interface UseDeputadosFirestoreParams {
  siglaUf?: string;
  siglaPartido?: string;
  idBloco?: string;
  nome?: string;
  idLegislatura?: number;
  situacao?: string;
  condicaoEleitoral?: string;
  sexo?: string;
}

export const getDeputadosFromFirestore = async (params?: UseDeputadosFirestoreParams): Promise<Deputado[]> => {
  const legislaturaId = params?.idLegislatura || await getLatestLegislaturaId();
  let deputadosQuery = query(collection(firestore, `congressoNacional/camaraDeputados/legislatura/${legislaturaId}/deputados`));

  if (params?.siglaUf && params.siglaUf !== 'TODOS') {
    deputadosQuery = query(deputadosQuery, where('siglaUf', '==', params.siglaUf));
  }
  if (params?.siglaPartido && params.siglaPartido !== 'TODOS') {
    deputadosQuery = query(deputadosQuery, where('siglaPartido', '==', params.siglaPartido));
  }
  if (params?.idBloco && params.idBloco !== 'TODOS') {
    // A filtragem por bloco será feita no lado do cliente
  }
  if (params?.nome) {
    // Firestore não suporta busca de substring nativamente de forma eficiente.
    // A busca por nome será feita no lado do cliente por enquanto.
  }
  if (params?.sexo && params.sexo !== 'TODOS') {
    const sexoQuery = params.sexo === 'Masculino' ? 'M' : 'F';
    deputadosQuery = query(deputadosQuery, where('sexo', '==', sexoQuery));
  }

  const querySnapshot = await getDocs(deputadosQuery);
  let deputados = querySnapshot.docs.map(doc => doc.data() as Deputado);

  if (params?.nome) {
    const nomeFilter = params.nome.toLowerCase();
    deputados = deputados.filter(deputado =>
      deputado.nome.toLowerCase().includes(nomeFilter)
    );
  }

  if (params?.situacao && params.situacao !== 'TODOS') {
    deputados = deputados.filter(deputado =>
      deputado.mandatos?.some(mandato => mandato.situacao === params.situacao)
    );
  } else {
    // Por padrão, retorna apenas deputados em exercício se nenhum filtro de situação for especificado.
    deputados = deputados.filter(deputado =>
      deputado.mandatos?.some(mandato => mandato.situacao === 'Exercício')
    );
  }

  if (params?.condicaoEleitoral && params.condicaoEleitoral !== 'TODOS') {
    deputados = deputados.filter(deputado =>
      deputado.mandatos?.some(mandato => mandato.condicaoEleitoral === params.condicaoEleitoral)
    );
  }

  return deputados;
};
