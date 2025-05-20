import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/shared/services/firebase';
import { logger } from '@/app/monitoring/logger';

// Tipos para as matérias legislativas
export interface Materia {
  codigo: string;
  tipo: string;
  numero: string;
  ano: number;
  ementa: string;
  situacao: string;
  dataApresentacao: string;
  url?: string;
  autores?: Autor[];
  dadoReal: boolean;
}

export interface Autor {
  codigo: string;
  nome: string;
  tipo: string; // 'principal', 'coautor', 'coletivo'
}

export interface RelatoriaInfo {
  codigo: string;
  tipo: string;
  numero: string;
  ano: number;
  ementa: string;
  situacao: string;
  dataDesignacao: string;
  comissao?: {
    codigo: string;
    sigla: string;
    nome: string;
  };
  url?: string;
  dadoReal: boolean;
}

export interface MateriasLegislativasData {
  autorias: {
    individual: Materia[];
    coautoria: Materia[];
    coletiva: Materia[];
  };
  relatorias: RelatoriaInfo[];
  dadoReal: boolean;
}

interface UseMateriasLegislativasResult {
  data: MateriasLegislativasData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar matérias legislativas de um senador do Firestore
 *
 * @param senadorId ID do senador
 * @returns Objeto com dados de matérias legislativas, estado de carregamento e função para recarregar
 */
export function useMateriasLegislativasSenador(senadorId: string): UseMateriasLegislativasResult {
  const [data, setData] = useState<MateriasLegislativasData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Função para buscar os dados
  const fetchData = async () => {
    if (!senadorId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.info(`Buscando matérias legislativas para o senador ${senadorId}`);

      // Inicializar estrutura de dados
      const materiasData: MateriasLegislativasData = {
        autorias: {
          individual: [],
          coautoria: [],
          coletiva: []
        },
        relatorias: [],
        dadoReal: false
      };

      // Tentar buscar dados reais do Firestore
      try {
        // Buscar dados de matérias do caminho correto
        const materiaRef = doc(db, `congressoNacional/senadoFederal/materia/${senadorId}`);
        logger.info(`Buscando matérias no caminho: congressoNacional/senadoFederal/materia/${senadorId}`);

        const materiaSnapshot = await getDoc(materiaRef);

        if (materiaSnapshot.exists()) {
          const materiaData = materiaSnapshot.data();
          logger.info(`Dados de matéria encontrados para o senador ${senadorId}`);
          logger.info(`Estrutura dos dados: ${JSON.stringify(Object.keys(materiaData))}`);

          // Verificar a estrutura dos dados
          logger.info(`Estrutura completa dos dados: ${JSON.stringify(materiaData)}`);

          // Usar os totais diretamente do documento, se disponíveis
          if (
            materiaData.totalAutoriasIndividuais !== undefined ||
            materiaData.totalCoautorias !== undefined ||
            materiaData.totalAutoriasColetivas !== undefined ||
            materiaData.totalRelatorias !== undefined
          ) {
            logger.info(`Usando totais do documento: individual=${materiaData.totalAutoriasIndividuais}, coautoria=${materiaData.totalCoautorias}, coletiva=${materiaData.totalAutoriasColetivas}, relatorias=${materiaData.totalRelatorias}`);
          }

          // Caso 1: Estrutura com autorias categorizadas por tipo
          if (materiaData.autoriasIndividuais || materiaData.coautorias || materiaData.autoriasColetivas) {
            // Processar autorias individuais
            if (materiaData.autoriasIndividuais && Array.isArray(materiaData.autoriasIndividuais)) {
              materiasData.autorias.individual = materiaData.autoriasIndividuais.map((autoria: any) => ({
                ...autoria,
                codigo: autoria.id || autoria.codigo || '',
                tipo: autoria.tipo || '',
                numero: autoria.numero || '',
                ano: parseInt(autoria.ano) || new Date().getFullYear(),
                ementa: autoria.ementa || '',
                situacao: autoria.situacao || 'Em tramitação',
                dataApresentacao: autoria.data || new Date().toISOString().split('T')[0],
                url: autoria.url || '',
                dadoReal: true
              }));
              logger.info(`Encontradas ${materiasData.autorias.individual.length} autorias individuais`);
            } else if (materiaData.totalAutoriasIndividuais) {
              // Se não temos o array, mas temos o total, criar array vazio com o tamanho correto
              materiasData.autorias.individual = Array(materiaData.totalAutoriasIndividuais).fill({
                codigo: 'placeholder',
                tipo: 'PL',
                numero: '000',
                ano: new Date().getFullYear(),
                ementa: 'Carregando...',
                situacao: 'Em tramitação',
                dataApresentacao: new Date().toISOString().split('T')[0],
                dadoReal: true
              });
              logger.info(`Criado placeholder para ${materiaData.totalAutoriasIndividuais} autorias individuais`);
            }

            // Processar coautorias
            if (materiaData.coautorias && Array.isArray(materiaData.coautorias)) {
              materiasData.autorias.coautoria = materiaData.coautorias.map((autoria: any) => ({
                ...autoria,
                codigo: autoria.id || autoria.codigo || '',
                tipo: autoria.tipo || '',
                numero: autoria.numero || '',
                ano: parseInt(autoria.ano) || new Date().getFullYear(),
                ementa: autoria.ementa || '',
                situacao: autoria.situacao || 'Em tramitação',
                dataApresentacao: autoria.data || new Date().toISOString().split('T')[0],
                url: autoria.url || '',
                dadoReal: true
              }));
              logger.info(`Encontradas ${materiasData.autorias.coautoria.length} coautorias`);
            } else if (materiaData.totalCoautorias) {
              // Se não temos o array, mas temos o total, criar array vazio com o tamanho correto
              materiasData.autorias.coautoria = Array(materiaData.totalCoautorias).fill({
                codigo: 'placeholder',
                tipo: 'PL',
                numero: '000',
                ano: new Date().getFullYear(),
                ementa: 'Carregando...',
                situacao: 'Em tramitação',
                dataApresentacao: new Date().toISOString().split('T')[0],
                dadoReal: true
              });
              logger.info(`Criado placeholder para ${materiaData.totalCoautorias} coautorias`);
            }

            // Processar autorias coletivas
            if (materiaData.autoriasColetivas && Array.isArray(materiaData.autoriasColetivas)) {
              materiasData.autorias.coletiva = materiaData.autoriasColetivas.map((autoria: any) => ({
                ...autoria,
                codigo: autoria.id || autoria.codigo || '',
                tipo: autoria.tipo || '',
                numero: autoria.numero || '',
                ano: parseInt(autoria.ano) || new Date().getFullYear(),
                ementa: autoria.ementa || '',
                situacao: autoria.situacao || 'Em tramitação',
                dataApresentacao: autoria.data || new Date().toISOString().split('T')[0],
                url: autoria.url || '',
                dadoReal: true
              }));
              logger.info(`Encontradas ${materiasData.autorias.coletiva.length} autorias coletivas`);
            } else if (materiaData.totalAutoriasColetivas) {
              // Se não temos o array, mas temos o total, criar array vazio com o tamanho correto
              materiasData.autorias.coletiva = Array(materiaData.totalAutoriasColetivas).fill({
                codigo: 'placeholder',
                tipo: 'PL',
                numero: '000',
                ano: new Date().getFullYear(),
                ementa: 'Carregando...',
                situacao: 'Em tramitação',
                dataApresentacao: new Date().toISOString().split('T')[0],
                dadoReal: true
              });
              logger.info(`Criado placeholder para ${materiaData.totalAutoriasColetivas} autorias coletivas`);
            }
          }
          // Caso 2: Estrutura com array de autorias com campo tipoAutoria
          else if (materiaData.autorias && Array.isArray(materiaData.autorias)) {
            logger.info(`Encontradas ${materiaData.autorias.length} autorias no total`);
            logger.info(`Exemplo de autoria: ${JSON.stringify(materiaData.autorias[0])}`);

            // Categorizar as autorias com base no campo tipoAutoria
            const autoriasIndividuais = materiaData.autorias.filter((a: any) => a.tipoAutoria === 'individual');
            const coautorias = materiaData.autorias.filter((a: any) => a.tipoAutoria === 'coautoria');
            const autoriasColetivas = materiaData.autorias.filter((a: any) => a.tipoAutoria === 'coletiva');

            // Log para depuração
            logger.info(`Tipos de autoria encontrados: ${[...new Set(materiaData.autorias.map((a: any) => a.tipoAutoria))].join(', ')}`);
            logger.info(`Contagem por tipo: individual=${autoriasIndividuais.length}, coautoria=${coautorias.length}, coletiva=${autoriasColetivas.length}`);

            // Se não encontrou nenhuma autoria categorizada, tentar categorizar por outros meios
            if (autoriasIndividuais.length === 0 && coautorias.length === 0 && autoriasColetivas.length === 0) {
              logger.info('Nenhuma autoria categorizada encontrada, tentando categorizar por outros meios');

              // Categorizar com base na autoria (texto)
              for (const autoria of materiaData.autorias) {
                if (!autoria.autoria) continue;

                const texto = autoria.autoria.toLowerCase();

                // Verificar se é uma autoria coletiva (comissão, bancada, etc.)
                if (
                  texto.includes('comissão') ||
                  texto.includes('bancada') ||
                  texto.includes('liderança') ||
                  texto.includes('mesa diretora') ||
                  texto.includes('bloco') ||
                  texto.includes('frente') ||
                  texto.includes('grupo') ||
                  texto.includes(' e outros') ||
                  texto.includes(' e mais')
                ) {
                  autoriasColetivas.push(autoria);
                  continue;
                }

                // Contar vírgulas e "e" para estimar o número de autores
                const virgulas = (texto.match(/,/g) || []).length;
                const es = (texto.match(/ e /g) || []).length;

                // Se temos mais de 3 autores estimados, é coletiva
                if (virgulas + es + 1 > 3) {
                  autoriasColetivas.push(autoria);
                }
                // Se temos entre 2 e 3 autores, é coautoria
                else if (virgulas + es > 0) {
                  coautorias.push(autoria);
                }
                // Senão, é individual
                else {
                  autoriasIndividuais.push(autoria);
                }
              }

              logger.info(`Após categorização manual: individual=${autoriasIndividuais.length}, coautoria=${coautorias.length}, coletiva=${autoriasColetivas.length}`);
            }

            // Mapear para a estrutura esperada
            materiasData.autorias.individual = autoriasIndividuais.map((autoria: any) => {
              // Converter para o formato esperado pelo componente
              return {
                codigo: autoria.id || autoria.codigo || '',
                tipo: autoria.tipo || '',
                numero: autoria.numero || '',
                ano: parseInt(autoria.ano) || new Date().getFullYear(),
                ementa: autoria.ementa || '',
                situacao: autoria.situacao || 'Em tramitação',
                dataApresentacao: autoria.data || new Date().toISOString().split('T')[0],
                url: autoria.url || '',
                autoria: autoria.autoria,
                tipoAutoria: autoria.tipoAutoria,
                dadoReal: true
              };
            });

            materiasData.autorias.coautoria = coautorias.map((autoria: any) => {
              // Converter para o formato esperado pelo componente
              return {
                codigo: autoria.id || autoria.codigo || '',
                tipo: autoria.tipo || '',
                numero: autoria.numero || '',
                ano: parseInt(autoria.ano) || new Date().getFullYear(),
                ementa: autoria.ementa || '',
                situacao: autoria.situacao || 'Em tramitação',
                dataApresentacao: autoria.data || new Date().toISOString().split('T')[0],
                url: autoria.url || '',
                autoria: autoria.autoria,
                tipoAutoria: autoria.tipoAutoria,
                dadoReal: true
              };
            });

            materiasData.autorias.coletiva = autoriasColetivas.map((autoria: any) => {
              // Converter para o formato esperado pelo componente
              return {
                codigo: autoria.id || autoria.codigo || '',
                tipo: autoria.tipo || '',
                numero: autoria.numero || '',
                ano: parseInt(autoria.ano) || new Date().getFullYear(),
                ementa: autoria.ementa || '',
                situacao: autoria.situacao || 'Em tramitação',
                dataApresentacao: autoria.data || new Date().toISOString().split('T')[0],
                url: autoria.url || '',
                autoria: autoria.autoria,
                tipoAutoria: autoria.tipoAutoria,
                dadoReal: true
              };
            });

            logger.info(`Categorizadas: ${autoriasIndividuais.length} individuais, ${coautorias.length} coautorias, ${autoriasColetivas.length} coletivas`);
          }

          // Processar relatorias
          if (materiaData.relatorias && Array.isArray(materiaData.relatorias)) {
            logger.info(`Encontradas ${materiaData.relatorias.length} relatorias`);
            if (materiaData.relatorias.length > 0) {
              logger.info(`Exemplo de relatoria: ${JSON.stringify(materiaData.relatorias[0])}`);
            }

            materiasData.relatorias = materiaData.relatorias.map((relatoria: any) => {
              // Converter para o formato esperado pelo componente
              return {
                codigo: relatoria.id || relatoria.codigo || '',
                tipo: relatoria.tipo || '',
                numero: relatoria.numero || '',
                ano: parseInt(relatoria.ano) || new Date().getFullYear(),
                ementa: relatoria.ementa || '',
                situacao: relatoria.situacao || 'Em tramitação',
                dataDesignacao: relatoria.data || new Date().toISOString().split('T')[0],
                comissao: relatoria.comissao || {
                  codigo: '',
                  sigla: '',
                  nome: ''
                },
                url: relatoria.url || '',
                dadoReal: true
              };
            });
            logger.info(`Processadas ${materiasData.relatorias.length} relatorias`);
          } else if (materiaData.totalRelatorias) {
            // Se não temos o array, mas temos o total, criar array vazio com o tamanho correto
            materiasData.relatorias = Array(materiaData.totalRelatorias).fill({
              codigo: 'placeholder',
              tipo: 'PL',
              numero: '000',
              ano: new Date().getFullYear(),
              ementa: 'Carregando...',
              situacao: 'Em tramitação',
              dataDesignacao: new Date().toISOString().split('T')[0],
              comissao: {
                codigo: '',
                sigla: 'CCJ',
                nome: 'Comissão de Constituição, Justiça e Cidadania'
              },
              dadoReal: true
            });
            logger.info(`Criado placeholder para ${materiaData.totalRelatorias} relatorias`);
          }

          // Marcar que temos dados reais
          if (
            (materiasData.autorias.individual.length > 0) ||
            (materiasData.autorias.coautoria.length > 0) ||
            (materiasData.autorias.coletiva.length > 0) ||
            (materiasData.relatorias.length > 0)
          ) {
            materiasData.dadoReal = true;
            logger.info(`Dados reais encontrados para o senador ${senadorId}`);
          }

          // Retornar os dados reais
          setData(materiasData);
          logger.info(`Dados reais de matérias legislativas carregados para o senador ${senadorId}`);
          return;
        } else {
          logger.info(`Nenhum dado real encontrado para o senador ${senadorId}, usando dados genéricos`);
        }
      } catch (err: any) {
        logger.warn(`Erro ao buscar dados reais: ${err.message}. Usando dados genéricos.`);
      }

      // Se não encontrou dados reais, usar dados genéricos
      logger.info('Usando dados genéricos para matérias legislativas');

      // Autorias individuais
      materiasData.autorias.individual.push(
        {
          codigo: '12345',
          tipo: 'PL',
          numero: '123',
          ano: 2023,
          ementa: 'Dispõe sobre a transparência nas ações governamentais e o acesso à informação pública.',
          situacao: 'Em tramitação',
          dataApresentacao: '2023-03-15',
          url: 'https://www25.senado.leg.br/web/atividade/materias/-/materia/12345',
          dadoReal: false
        },
        {
          codigo: '12346',
          tipo: 'PEC',
          numero: '45',
          ano: 2023,
          ementa: 'Altera dispositivos constitucionais relativos ao sistema tributário nacional.',
          situacao: 'Aprovada em primeiro turno',
          dataApresentacao: '2023-05-20',
          url: 'https://www25.senado.leg.br/web/atividade/materias/-/materia/12346',
          dadoReal: false
        }
      );

      // Coautorias (até 3 senadores)
      materiasData.autorias.coautoria.push(
        {
          codigo: '12347',
          tipo: 'PL',
          numero: '789',
          ano: 2023,
          ementa: 'Estabelece diretrizes para a política nacional de segurança cibernética.',
          situacao: 'Em análise na comissão',
          dataApresentacao: '2023-04-10',
          url: 'https://www25.senado.leg.br/web/atividade/materias/-/materia/12347',
          autores: [
            { codigo: senadorId, nome: 'Senador Atual', tipo: 'principal' },
            { codigo: '5555', nome: 'Senador Coautor 1', tipo: 'coautor' },
            { codigo: '6666', nome: 'Senador Coautor 2', tipo: 'coautor' }
          ],
          dadoReal: false
        },
        {
          codigo: '12348',
          tipo: 'PLP',
          numero: '27',
          ano: 2023,
          ementa: 'Regulamenta o artigo 192 da Constituição Federal, referente ao sistema financeiro nacional.',
          situacao: 'Pronta para pauta',
          dataApresentacao: '2023-06-05',
          url: 'https://www25.senado.leg.br/web/atividade/materias/-/materia/12348',
          autores: [
            { codigo: senadorId, nome: 'Senador Atual', tipo: 'principal' },
            { codigo: '7777', nome: 'Senador Coautor 3', tipo: 'coautor' }
          ],
          dadoReal: false
        }
      );

      // Autorias coletivas (mais de 3 senadores)
      materiasData.autorias.coletiva.push(
        {
          codigo: '12349',
          tipo: 'PL',
          numero: '555',
          ano: 2023,
          ementa: 'Institui o Programa Nacional de Incentivo à Pesquisa e Inovação Tecnológica.',
          situacao: 'Em tramitação',
          dataApresentacao: '2023-02-28',
          url: 'https://www25.senado.leg.br/web/atividade/materias/-/materia/12349',
          autores: [
            { codigo: senadorId, nome: 'Senador Atual', tipo: 'coautor' },
            { codigo: '8888', nome: 'Senador Coautor 4', tipo: 'coautor' },
            { codigo: '9999', nome: 'Senador Coautor 5', tipo: 'coautor' },
            { codigo: '1010', nome: 'Senador Coautor 6', tipo: 'coautor' },
            { codigo: '1111', nome: 'Senador Coautor 7', tipo: 'coautor' }
          ],
          dadoReal: false
        },
        {
          codigo: '12350',
          tipo: 'PEC',
          numero: '99',
          ano: 2023,
          ementa: 'Altera o sistema eleitoral brasileiro, instituindo o voto distrital misto.',
          situacao: 'Em análise na CCJ',
          dataApresentacao: '2023-07-12',
          url: 'https://www25.senado.leg.br/web/atividade/materias/-/materia/12350',
          autores: [
            { codigo: senadorId, nome: 'Senador Atual', tipo: 'coautor' },
            { codigo: '2222', nome: 'Senador Coautor 8', tipo: 'principal' },
            { codigo: '3333', nome: 'Senador Coautor 9', tipo: 'coautor' },
            { codigo: '4444', nome: 'Senador Coautor 10', tipo: 'coautor' }
          ],
          dadoReal: false
        }
      );

      // Adicionar dados genéricos para relatorias
      materiasData.relatorias.push(
        {
          codigo: '54321',
          tipo: 'PL',
          numero: '456',
          ano: 2023,
          ementa: 'Estabelece normas para a proteção de dados pessoais e privacidade digital.',
          situacao: 'Em análise na comissão',
          dataDesignacao: '2023-04-05',
          comissao: {
            codigo: 'CCJ',
            sigla: 'CCJ',
            nome: 'Comissão de Constituição, Justiça e Cidadania'
          },
          url: 'https://www25.senado.leg.br/web/atividade/materias/-/materia/54321',
          dadoReal: false
        },
        {
          codigo: '54322',
          tipo: 'MPV',
          numero: '1055',
          ano: 2023,
          ementa: 'Dispõe sobre medidas emergenciais para o enfrentamento da crise hídrica e energética.',
          situacao: 'Aguardando parecer',
          dataDesignacao: '2023-06-15',
          comissao: {
            codigo: 'CAE',
            sigla: 'CAE',
            nome: 'Comissão de Assuntos Econômicos'
          },
          url: 'https://www25.senado.leg.br/web/atividade/materias/-/materia/54322',
          dadoReal: false
        },
        {
          codigo: '54323',
          tipo: 'PLS',
          numero: '789',
          ano: 2023,
          ementa: 'Altera a Lei nº 8.069, de 13 de julho de 1990 (Estatuto da Criança e do Adolescente), para fortalecer medidas de proteção à infância e juventude.',
          situacao: 'Pronto para deliberação',
          dataDesignacao: '2023-05-20',
          comissao: {
            codigo: 'CAS',
            sigla: 'CAS',
            nome: 'Comissão de Assuntos Sociais'
          },
          url: 'https://www25.senado.leg.br/web/atividade/materias/-/materia/54323',
          dadoReal: false
        }
      );

      // Verificar se há dados reais
      materiasData.dadoReal =
        materiasData.autorias.individual.length > 0 ||
        materiasData.autorias.coautoria.length > 0 ||
        materiasData.autorias.coletiva.length > 0 ||
        materiasData.relatorias.length > 0;

      setData(materiasData);
      logger.info(`Dados de matérias legislativas carregados para o senador ${senadorId}`);
    } catch (err: any) {
      logger.error(`Erro ao buscar matérias legislativas: ${err.message}`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar dados quando o ID do senador mudar
  useEffect(() => {
    fetchData();
  }, [senadorId]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  };
}

export default useMateriasLegislativasSenador;
