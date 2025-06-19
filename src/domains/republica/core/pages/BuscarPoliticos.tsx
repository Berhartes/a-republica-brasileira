// src/domains/republica/core/pages/BuscarPoliticos.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useDeputados } from '../../congresso/camara/hooks/useDeputados';
import { useLegislaturas } from '../../congresso/camara/hooks/useLegislaturas';
import { DeputadoCard } from '../../congresso/camara/components/DeputadoCard';
import useDarkMode from '@/shared/hooks/use-dark-mode';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db as firestore } from '@/shared/services/firebase';
import { Link } from '@tanstack/react-router';

interface Estado {
  sigla: string;
  nome: string;
}

const BuscarPoliticos: React.FC = () => {
  const [isFiltrosVisiveis, setIsFiltrosVisiveis] = useState(true);
  const [activeTab, setActiveTab] = useState('politicos');
  const [casa, setCasa] = useState('camara');
  const [searchTerm, setSearchTerm] = useState('');
  const [estado, setEstado] = useState('TODOS');
  const [partido, setPartido] = useState('TODOS');
  const [legislatura, setLegislatura] = useState('57');
  const [ordenarPor, setOrdenarPor] = useState('Decrescente');
  const [situacaoMandato, setSituacaoMandato] = useState('TODOS');
  const [condicaoEleitoral, setCondicaoEleitoral] = useState('TODOS');
  const [sexo, setSexo] = useState('TODOS');
  const [bloco, setBloco] = useState('TODOS');
  const [blocos, setBlocos] = useState<any[]>([]);
  const [selectedPartidoData, setSelectedPartidoData] = useState<any>(null);
  const [selectedBlocoData, setSelectedBlocoData] = useState<any>(null);

  const { isDarkMode } = useDarkMode();
  const { data: legislaturas } = useLegislaturas();

  const [appliedFilters, setAppliedFilters] = useState<{
    nome: string;
    siglaUf: string;
    siglaPartido: string;
    idLegislatura: number | string; // Permitir string para o valor do select, converter depois
    situacao: string;
    condicaoEleitoral: string;
    sexo: string;
    idBloco: string | undefined; // Corrigido para aceitar string ou undefined
  }>({
    nome: '',
    siglaUf: 'TODOS',
    siglaPartido: 'TODOS',
    idLegislatura: 57, // Default legislatura ID
    situacao: 'TODOS',
    condicaoEleitoral: 'TODOS',
    sexo: 'TODOS',
    idBloco: undefined,
  });

  // deputadosParams agora depende apenas de appliedFilters
  const deputadosParams = useMemo(() => ({
    ...appliedFilters,
    idLegislatura: typeof appliedFilters.idLegislatura === 'string'
      ? parseInt(appliedFilters.idLegislatura)
      : appliedFilters.idLegislatura,
    idBloco: appliedFilters.idBloco === 'TODOS' ? undefined : appliedFilters.idBloco,
  }), [appliedFilters]);

  const { data: deputados, isLoading, error } = useDeputados(deputadosParams);

  // deputadosFiltrados não é mais necessário para filtrar por bloco,
  // mas ainda pode ser usado se houver outras manipulações do lado do cliente.
  // Por enquanto, vamos apenas definir com base em 'deputados'.
  // Se 'deputados' já vem filtrado da API, este useEffect pode ser simplificado ou removido
  // e 'deputados' usado diretamente no map.
  // Para manter a lógica de ordenação de favoritos, vamos manter deputadosFiltrados por enquanto.
  const [deputadosFiltrados, setDeputadosFiltrados] = useState<any[] | undefined>([]);
  const [favoriteDeputados, setFavoriteDeputados] = useState<any>({});

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favoriteDeputados') || '{}');
    setFavoriteDeputados(favorites);
  }, []);

  useEffect(() => {
    // Agora que idBloco é passado para useDeputados,
    // 'deputados' já deve vir filtrado pela API.
    // Apenas atualizamos deputadosFiltrados quando 'deputados' mudar.
    setDeputadosFiltrados(deputados);
  }, [deputados]);

  useEffect(() => {
    const fetchPartidoData = async () => {
      if (partido === 'TODOS') {
        setSelectedPartidoData(null);
        return;
      }

      const partidosRef = collection(firestore, `congressoNacional/camaraDeputados/legislatura/${legislatura}/partidos`);
      const q = query(partidosRef, where("sigla", "==", partido));
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const partidoData = querySnapshot.docs[0].data();
        setSelectedPartidoData({ id: querySnapshot.docs[0].id, ...partidoData });
      }
    };

    const fetchBlocos = async () => {
      const blocosRef = collection(firestore, `congressoNacional/camaraDeputados/legislatura/${legislatura}/blocos`);
      const querySnapshot = await getDocs(blocosRef);
      const blocosData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBlocos(blocosData);
    };

    fetchPartidoData();
    fetchBlocos();
  }, [partido, legislatura]);

  useEffect(() => {
    const fetchBlocoData = async () => {
      if (bloco === 'TODOS') {
        setSelectedBlocoData(null);
        return;
      }
      const blocoData = blocos.find(b => b.id === bloco);
      setSelectedBlocoData(blocoData);
    };
    fetchBlocoData();
  }, [bloco, blocos]);

  const estadosBrasileiros: Estado[] = [
    { sigla: 'AC', nome: 'Acre' }, { sigla: 'AL', nome: 'Alagoas' }, { sigla: 'AP', nome: 'Amapá' },
    { sigla: 'AM', nome: 'Amazonas' }, { sigla: 'BA', nome: 'Bahia' }, { sigla: 'CE', nome: 'Ceará' },
    { sigla: 'DF', nome: 'Distrito Federal' }, { sigla: 'ES', nome: 'Espírito Santo' }, { sigla: 'GO', nome: 'Goiás' },
    { sigla: 'MA', nome: 'Maranhão' }, { sigla: 'MT', nome: 'Mato Grosso' }, { sigla: 'MS', nome: 'Mato Grosso do Sul' },
    { sigla: 'MG', nome: 'Minas Gerais' }, { sigla: 'PA', nome: 'Pará' }, { sigla: 'PB', nome: 'Paraíba' },
    { sigla: 'PR', nome: 'Paraná' }, { sigla: 'PE', nome: 'Pernambuco' }, { sigla: 'PI', nome: 'Piauí' },
    { sigla: 'RJ', nome: 'Rio de Janeiro' }, { sigla: 'RN', nome: 'Rio Grande do Norte' }, { sigla: 'RS', nome: 'Rio Grande do Sul' },
    { sigla: 'RO', nome: 'Rondônia' }, { sigla: 'RR', nome: 'Roraima' }, { sigla: 'SC', nome: 'Santa Catarina' },
    { sigla: 'SP', nome: 'São Paulo' }, { sigla: 'SE', nome: 'Sergipe' }, { sigla: 'TO', nome: 'Tocantins' },
  ];

  const partidos = ['MDB', 'PT', 'PSDB', 'PL', 'UNIÃO', 'PP', 'PSD', 'PSB', 'REPUBLICANOS', 'PDT'];

  const handleAtualizarFiltros = () => {
    setAppliedFilters({
      nome: searchTerm,
      siglaUf: estado,
      siglaPartido: partido,
      idLegislatura: legislatura, // Mantém como string aqui, será convertido em deputadosParams
      situacao: situacaoMandato,
      condicaoEleitoral: condicaoEleitoral,
      sexo: sexo,
      idBloco: bloco === 'TODOS' ? undefined : bloco,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 text-gray-800 dark:text-white">
      <h1 className="text-3xl font-bold mb-8 text-center">Busca de Políticos</h1>

      <div className="flex justify-center mb-4">
        <button onClick={() => setIsFiltrosVisiveis(!isFiltrosVisiveis)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white font-bold py-2 px-4 rounded">
          {isFiltrosVisiveis ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>
      </div>

      {isFiltrosVisiveis && (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-center border-b border-gray-200 dark:border-slate-700 mb-4">
            {/* As classes de activeTab precisam de uma lógica mais complexa se quisermos cores diferentes para dark/light no estado ativo */}
            {/* Por ora, simplificando para manter a cor do texto do tema, e a borda azul sempre */}
            <button onClick={() => setActiveTab('politicos')} className={`py-2 px-4 text-sm font-medium ${activeTab === 'politicos' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 dark:text-slate-400'}`}>DOS POLÍTICOS</button>
            <button onClick={() => setActiveTab('partidos')} className={`py-2 px-4 text-sm font-medium ${activeTab === 'partidos' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 dark:text-slate-400'}`}>DOS PARTIDOS</button>
            <button onClick={() => setActiveTab('estados')} className={`py-2 px-4 text-sm font-medium ${activeTab === 'estados' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 dark:text-slate-400'}`}>DOS ESTADOS</button>
          </div>

          <div className="flex justify-center items-center space-x-4 mb-4">
            <label className="flex items-center">
              <input type="radio" name="casa" value="camara" checked={casa === 'camara'} onChange={(e) => setCasa(e.target.value)} className="form-radio h-4 w-4 text-blue-600"/>
              <span className="ml-2">CÂMARA</span>
            </label>
            <label className="flex items-center">
              <input type="radio" name="casa" value="senado" checked={casa === 'senado'} onChange={(e) => setCasa(e.target.value)} className="form-radio h-4 w-4 text-blue-600"/>
              <span className="ml-2">SENADO</span>
            </label>
            <label className="flex items-center">
              <input type="radio" name="casa" value="congresso" checked={casa === 'congresso'} onChange={(e) => setCasa(e.target.value)} className="form-radio h-4 w-4 text-blue-600"/>
              <span className="ml-2">CONGRESSO</span>
            </label>
          </div>

          <div className="mb-4">
            <input type="text" placeholder="BUSCAR POR NOME" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 bg-white border-gray-300 dark:bg-slate-800 dark:border-slate-700 dark:text-white rounded-md"/>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Estado:</label>
              <select value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full p-2 bg-white border-gray-300 dark:bg-slate-800 dark:border-slate-700 dark:text-white rounded-md">
                <option value="TODOS">TODOS</option>
                {estadosBrasileiros.map(e => <option key={e.sigla} value={e.sigla}>{e.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Partidos:</label>
              <select value={partido} onChange={(e) => setPartido(e.target.value)} className="w-full p-2 bg-white border-gray-300 dark:bg-slate-800 dark:border-slate-700 dark:text-white rounded-md">
                <option value="TODOS">TODOS</option>
                {partidos.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bloco:</label>
              <select value={bloco} onChange={(e) => setBloco(e.target.value)} className="w-full p-2 bg-white border-gray-300 dark:bg-slate-800 dark:border-slate-700 dark:text-white rounded-md">
                <option value="TODOS">TODOS</option>
                {blocos.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Legislatura:</label>
              <select value={legislatura} onChange={(e) => setLegislatura(e.target.value)} className="w-full p-2 bg-white border-gray-300 dark:bg-slate-800 dark:border-slate-700 dark:text-white rounded-md">
                {legislaturas?.map(l => (
                  <option key={l.id} value={l.id}>
                    {`${new Date(l.dataInicio).getFullYear()}-${new Date(l.dataFim).getFullYear()} (${l.id})`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ordenar por:</label>
              <select value={ordenarPor} onChange={(e) => setOrdenarPor(e.target.value)} className="w-full p-2 bg-white border-gray-300 dark:bg-slate-800 dark:border-slate-700 dark:text-white rounded-md">
                <option>Decrescente</option>
                <option>Crescente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Situação do Mandato:</label>
              <select value={situacaoMandato} onChange={(e) => setSituacaoMandato(e.target.value)} className="w-full p-2 bg-white border-gray-300 dark:bg-slate-800 dark:border-slate-700 dark:text-white rounded-md">
                <option value="TODOS">TODOS</option>
                <option>Exercício</option>
                <option>Suplência</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Condição Eleitoral:</label>
              <select value={condicaoEleitoral} onChange={(e) => setCondicaoEleitoral(e.target.value)} className="w-full p-2 bg-white border-gray-300 dark:bg-slate-800 dark:border-slate-700 dark:text-white rounded-md">
                <option value="TODOS">TODOS</option>
                <option>Titular</option>
                <option>Suplente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sexo:</label>
              <select value={sexo} onChange={(e) => setSexo(e.target.value)} className="w-full p-2 bg-white border-gray-300 dark:bg-slate-800 dark:border-slate-700 dark:text-white rounded-md">
                <option value="TODOS">TODOS</option>
                <option>Masculino</option>
                <option>Feminino</option>
              </select>
            </div>
          </div>

          <div className="flex justify-center">
            <button onClick={handleAtualizarFiltros} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">
              Atualizar Filtros
            </button>
          </div>
        </div>
      )}

      {selectedPartidoData && (
        <div className="mb-8">
          <Link to="/partido/$id" params={{ id: selectedPartidoData.id }}>
            <div className="p-4 rounded-lg shadow-md flex items-center bg-gray-200 dark:bg-gray-700">
              <img src={selectedPartidoData.urlLogo} alt={`Logo do ${selectedPartidoData.nome}`} className="h-16 w-16 mr-4" />
              <div>
                <h2 className="text-xl font-bold">{selectedPartidoData.nome}</h2>
                <p>{selectedPartidoData.sigla}</p>
              </div>
            </div>
          </Link>
        </div>
      )}

      {selectedBlocoData && (
        <div className="mb-8">
          <Link to="/bloco/$id/legislatura/$legislatura" params={{ id: selectedBlocoData.id, legislatura: legislatura }}>
            <div className="p-4 rounded-lg shadow-md bg-gray-200 dark:bg-gray-700">
              <h2 className="text-xl font-bold">{selectedBlocoData.nome}</h2>
              {selectedBlocoData.lider && <p>Líder: {selectedBlocoData.lider.nome}</p>}
            </div>
          </Link>
        </div>
      )}

      {isLoading && <p>Carregando...</p>}
      {error && <p>Erro ao carregar os dados: {error.message}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Renderiza diretamente 'deputados' se 'deputadosFiltrados' for apenas uma cópia */}
        {/* Ou mantém 'deputadosFiltrados' se houver outras lógicas de cliente */}
        {/* Com a mudança acima, deputadosFiltrados é agora apenas 'deputados' */}
        {deputadosFiltrados 
          ?.slice() // Cria uma cópia para não mutar o array original de useDeputados
          .sort((a, b) => {
            const aIsFavorite = !!favoriteDeputados[a.id];
            const bIsFavorite = !!favoriteDeputados[b.id];
            if (aIsFavorite && !bIsFavorite) return -1;
            if (!aIsFavorite && bIsFavorite) return 1;
            return 0;
          })
          .map(deputado => (
            <DeputadoCard key={deputado.id} deputado={deputado} isFavorite={!!favoriteDeputados[deputado.id]} />
        ))}
      </div>
    </div>
  );
};

export default BuscarPoliticos;
