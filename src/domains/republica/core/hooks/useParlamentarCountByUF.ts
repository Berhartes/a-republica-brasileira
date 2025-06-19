import { useState, useEffect } from 'react';
import { db } from '@/shared/services/firebase';
import { collection, getDocs, query, where, Query } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import type { Senador } from '@/domains/republica/congresso/senado/schemas';
import { logger } from '@/app/monitoring/logger';
import { getLatestLegislaturaId } from '../../congresso/camara/services/legislatura.service';

type ParlamentarType = 'deputados' | 'senadores';

export function useParlamentarCountByUF(tipoParlamentar: ParlamentarType, uf: string | null | undefined) {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uf) {
      setCount(0); // Ou null, dependendo de como quer tratar UF inválida/ausente
      setIsLoading(false);
      return;
    }

    const fetchCount = async () => {
      setIsLoading(true);
      setError(null);
      setCount(null); // Reseta a contagem ao iniciar nova busca

      try {
        let parlamentaresRef;
        let firestoreQuery: Query<DocumentData>;

        if (tipoParlamentar === 'deputados') {
          const legislaturaId = await getLatestLegislaturaId();
          parlamentaresRef = collection(db, `congressoNacional/camaraDeputados/legislatura/${legislaturaId}/deputados`);
          firestoreQuery = query(
            parlamentaresRef,
            where('siglaUf', '==', uf.toUpperCase())
          );
        } else { // Senadores
          parlamentaresRef = collection(db, 'congressoNacional/senadoFederal/atual/senadores/itens');
          // Para senadores, buscamos todos e filtramos no cliente pela UF
          firestoreQuery = query(parlamentaresRef);
        }

        const querySnapshot = await getDocs(firestoreQuery);

        if (querySnapshot.empty) {
          if (tipoParlamentar === 'deputados') {
            logger.warn(`[useParlamentarCountByUF] Nenhum deputado encontrado para ${uf} via Firestore.`);
          } else {
            logger.warn(`[useParlamentarCountByUF] Coleção de senadores vazia no Firestore.`);
          }
          setCount(0);
        } else {
          if (tipoParlamentar === 'senadores') {
            const todosSenadores = querySnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                siglaUf: data.uf || data.siglaUf || data.UfParlamentar,
                // Apenas o campo siglaUf é necessário para a contagem aqui
              } as Partial<Senador>;
            });
            const senadoresFiltradosPorUf = todosSenadores.filter(
              s => s.siglaUf?.toUpperCase() === uf.toUpperCase()
            );
            setCount(senadoresFiltradosPorUf.length);
            logger.info(`[useParlamentarCountByUF] Senadores para ${uf}: ${senadoresFiltradosPorUf.length} (de ${todosSenadores.length} totais)`);
          } else { // Deputados
            const deputados = querySnapshot.docs.map(doc => doc.data());
            const deputadosEmExercicio = deputados.filter(deputado =>
              deputado.mandatos?.some((mandato: any) => mandato.situacao === 'Exercício')
            );
            setCount(deputadosEmExercicio.length);
            logger.info(`[useParlamentarCountByUF] Deputados em exercício para ${uf}: ${deputadosEmExercicio.length}`);
          }
        }
      } catch (err) {
        logger.error(`[useParlamentarCountByUF] Erro ao buscar contagem de ${tipoParlamentar} para ${uf}:`, err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
        setCount(0); // Ou null
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();
  }, [tipoParlamentar, uf]);

  return { count, isLoading, error };
}
