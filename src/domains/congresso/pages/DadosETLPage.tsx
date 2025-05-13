import React, { useState, useEffect } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger,
  Button,
  Alert, 
  AlertTitle, 
  AlertDescription,
  LoadingSpinner
} from '@/shared/components/ui/ui-components';
import { ResumoDadosETL } from '../components/etl/ResumoDadosETL';
import { TabelaSenadores } from '../components/etl/TabelaSenadores';
import { TabelaVotacoes } from '../components/etl/TabelaVotacoes';
import { logger } from '../../../app/monitoring/logger';

// Dados mockados para desenvolvimento
const dadosMock = {
  metadata: {
    ultima_atualizacao: new Date(),
    total_legislaturas: 56,
    total_senadores: 81,
    total_materias: 1245,
    total_votacoes: 387,
    total_comissoes: 24
  },
  senadores: Array.from({ length: 10 }, (_, i) => ({
    id: `senador-${i + 1}`,
    nome: `Senador ${i + 1}`,
    nomeCivil: `Nome Civil ${i + 1}`,
    siglaPartido: ['MDB', 'PT', 'PL', 'PSDB', 'PP'][Math.floor(Math.random() * 5)],
    siglaUf: ['SP', 'RJ', 'MG', 'BA', 'RS'][Math.floor(Math.random() * 5)],
    email: `senador${i + 1}@senado.leg.br`,
    sexo: i % 2 === 0 ? 'M' : 'F' as 'M' | 'F'
  })),
  votacoes: Array.from({ length: 10 }, (_, i) => ({
    id: `votacao-${i + 1}`,
    data: new Date(Date.now() - i * 86400000),
    titulo: `Votação sobre projeto ${i + 1}`,
    resultado: ['Aprovado', 'Rejeitado', 'Retirado', 'Em andamento'][Math.floor(Math.random() * 4)],
    materia: {
      id: `materia-${i + 1}`,
      sigla: ['PL', 'PEC', 'MP', 'PDL'][Math.floor(Math.random() * 4)],
      numero: Math.floor(Math.random() * 1000) + 1,
      ano: 2023
    },
    resumoVotos: {
      sim: Math.floor(Math.random() * 50) + 20,
      nao: Math.floor(Math.random() * 30) + 10,
      abstencao: Math.floor(Math.random() * 10),
      ausente: Math.floor(Math.random() * 10),
      total: 81
    }
  }))
};

const DadosETLPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('resumo');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState(dadosMock);
  const [isAtualizando, setIsAtualizando] = useState(false);

  // Simular carregamento de dados
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setIsLoading(true);
        // Aqui seria a chamada real para a API/Firestore
        // Por enquanto, apenas simulamos um delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Usar dados mockados por enquanto
        setData(dadosMock);
        setError(null);
      } catch (err) {
        logger.error('Erro ao carregar dados ETL:', err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido ao carregar dados'));
      } finally {
        setIsLoading(false);
      }
    };

    carregarDados();
  }, []);

  const handleAtualizarDados = async () => {
    try {
      setIsAtualizando(true);
      // Aqui seria a chamada para executar o ETL novamente
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Atualizar os dados após a execução
      setData({
        ...data,
        metadata: {
          ...data.metadata,
          ultima_atualizacao: new Date()
        }
      });
      
      // Mostrar mensagem de sucesso (poderia ser um toast)
      alert('Dados atualizados com sucesso!');
    } catch (err) {
      logger.error('Erro ao atualizar dados ETL:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido ao atualizar dados'));
    } finally {
      setIsAtualizando(false);
    }
  };

  const handleVerDetalhesSenador = (senadorId: string) => {
    // Navegar para a página de detalhes do senador
    window.location.href = `/senador/${senadorId}`;
  };

  const handleVerDetalhesVotacao = (votacaoId: string) => {
    // Navegar para a página de detalhes da votação
    alert(`Detalhes da votação ${votacaoId} seriam exibidos aqui`);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dados ETL do Senado</h1>
        <Button 
          onClick={handleAtualizarDados} 
          disabled={isLoading || isAtualizando}
        >
          {isAtualizando ? (
            <>
              <LoadingSpinner className="mr-2 h-4 w-4" />
              Atualizando...
            </>
          ) : (
            'Atualizar Dados'
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <ResumoDadosETL 
        isLoading={isLoading} 
        error={error} 
        metadata={data.metadata} 
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="senadores">Senadores</TabsTrigger>
          <TabsTrigger value="votacoes">Votações</TabsTrigger>
          <TabsTrigger value="comissoes">Comissões</TabsTrigger>
        </TabsList>
        
        <TabsContent value="senadores">
          <TabelaSenadores 
            isLoading={isLoading} 
            error={error} 
            senadores={data.senadores} 
            onVerDetalhes={handleVerDetalhesSenador}
          />
        </TabsContent>
        
        <TabsContent value="votacoes">
          <TabelaVotacoes 
            isLoading={isLoading} 
            error={error} 
            votacoes={data.votacoes} 
            onVerDetalhes={handleVerDetalhesVotacao}
          />
        </TabsContent>
        
        <TabsContent value="comissoes">
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Dados de comissões serão implementados em breve</p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Sobre os Dados</h2>
        <p className="text-gray-600 mb-2">
          Esta página exibe os dados extraídos da API do Senado Federal através do processo ETL (Extração, Transformação e Carga).
        </p>
        <p className="text-gray-600">
          Os dados são atualizados periodicamente e armazenados no Firestore para consulta rápida e eficiente.
        </p>
      </div>
    </div>
  );
};

export default DadosETLPage;
