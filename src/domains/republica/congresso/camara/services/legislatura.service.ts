import { db as firestore } from '../../../../../shared/services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export interface Legislatura {
  id: string;
  dataInicio: string;
  dataFim: string;
}

export const getLegislaturas = async (): Promise<Legislatura[]> => {
  const legislaturasCollection = collection(firestore, 'congressoNacional/camaraDeputados/legislatura');
  const querySnapshot = await getDocs(legislaturasCollection);

  const legislaturas = querySnapshot.docs
    .map(doc => {
      const data = doc.data();
      const id = parseInt(doc.id, 10);

      if (!isNaN(id) && id >= 43 && data.dataInicio && data.dataFim) {
        return {
          id: doc.id,
          dataInicio: data.dataInicio,
          dataFim: data.dataFim,
        };
      }
      return null;
    })
    .filter((l): l is Legislatura => l !== null)
    .sort((a, b) => parseInt(b.id) - parseInt(a.id));

  return legislaturas;
};

export const getLatestLegislaturaId = async (): Promise<number> => {
  const legislaturas = await getLegislaturas();
  if (legislaturas.length === 0) {
    // Retorna um valor padrão ou lança um erro se nenhuma legislatura for encontrada
    return 57; 
  }
  return parseInt(legislaturas[0].id, 10);
};
