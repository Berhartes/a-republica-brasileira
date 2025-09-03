// src/domains/republica/congresso/camara/pages/DeputadosPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useDeputados } from '../hooks/useDeputados';
import { useLegislaturas } from '../hooks/useLegislaturas';
import { DeputadoCard } from '../components/DeputadoCard';
import { LoadingSpinner } from "@/shared/components/ui/loading-spinner";
import { Alert, AlertTitle, AlertDescription } from "@/shared/components/ui/alert";
import { InfoCircledIcon } from "@radix-ui/react-icons";

interface Estado {
  sigla: string;
  nome: string;
}

const DeputadosPage: React.FC = () => {
  const [isFiltrosVisiveis, setIsFiltrosVisiveis] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estado, setEstado] = useState('TODOS');
  const [partido, setPartido] = useState('TODOS');
  const [legislatura, setLegislatura] = useState('57');
  const [ordenarPor, setOrdenarPor] = useState('Decrescente');
  const [situacaoMandato, setSituacaoMandato] = useState('TODOS');
  const [condicaoEleitoral, setCondicaoEleitoral] = useState('TODOS');
  const [sexo, setSexo] = useState('TODOS');
  const [favoriteDeputados, setFavoriteDeputados] = useState<any>({});

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favoriteDeputados') || '{}');
    setFavoriteDeputados(favorites);
  }, []);

  const { data: legislaturas } = useLegislaturas();

  const [appliedFilters, setAppliedFilters] = useState({});

  const deputadosParams = useMemo(() => ({
    nome: searchTerm,
    siglaUf: estado,
    siglaPartido: partido,
    idLegislatura: parseInt(legislatura),
    situacao: situacaoMandato,
    condicaoEleitoral: condicaoEleitoral,
    sexo: sexo,
    ...appliedFilters,
  }), [searchTerm, estado, partido, legislatura, situacaoMandato, condicaoEleitoral, sexo, appliedFilters]);

  const { data: deputados, isLoading, error } = useDeputados(deputadosParams);

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
      idLegislatura: parseInt(legislatura),
      situacao: situacaoMandato,
      condicaoEleitoral: condicaoEleitoral,
      sexo: sexo,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Deputados</h1>

      <div className="flex justify-center mb-4">
        <button onClick={() => setIsFiltrosVisiveis(!isFiltrosVisiveis)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
          {isFiltrosVisiveis ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>
      </div>

      {isFiltrosVisiveis && (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="mb-4">
            <input type="text" placeholder="BUSCAR POR NOME" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"/>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Estado:</label>
              <select value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                <option value="TODOS">TODOS</option>
                {estadosBrasileiros.map(e => <option key={e.sigla} value={e.sigla}>{e.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Partidos:</label>
              <select value={partido} onChange={(e) => setPartido(e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                <option value="TODOS">TODOS</option>
                {partidos.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Legislatura:</label>
              <select value={legislatura} onChange={(e) => setLegislatura(e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                {legislaturas?.map(l => (
                  <option key={l.id} value={l.id}>
                    {`${new Date(l.dataInicio).getFullYear()}-${new Date(l.dataFim).getFullYear()} (${l.id})`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ordenar por:</label>
              <select value={ordenarPor} onChange={(e) => setOrdenarPor(e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                <option>Decrescente</option>
                <option>Crescente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Situação do Mandato:</label>
              <select value={situacaoMandato} onChange={(e) => setSituacaoMandato(e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                <option value="TODOS">TODOS</option>
                <option>Exercício</option>
                <option>Suplência</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Condição Eleitoral:</label>
              <select value={condicaoEleitoral} onChange={(e) => setCondicaoEleitoral(e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                <option value="TODOS">TODOS</option>
                <option>Titular</option>
                <option>Suplente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sexo:</label>
              <select value={sexo} onChange={(e) => setSexo(e.target.value)} className="w-full p-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
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

      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
          <p className="ml-2">Carregando deputados...</p>
        </div>
      )}
      {error && (
         <Alert className="mb-4" variant="destructive">
          <InfoCircledIcon className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            {error.message}
          </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deputados
          ?.sort((a, b) => {
            const aIsFavorite = !!favoriteDeputados[a.id];
            const bIsFavorite = !!favoriteDeputados[b.id];
            if (aIsFavorite && !bIsFavorite) return -1;
            if (!aIsFavorite && bIsFavorite) return 1;
            return 0;
          })
          .map(deputado => (
            <DeputadoCard key={deputado.id} deputado={deputado} isFavorite={false} />
        ))}
      </div>
    </div>
  );
};

export default DeputadosPage;
