// src/domains/congresso/camara/components/DeputadoDetalhes/index.tsx
import React, { useState } from 'react';
import { DeputadoDetalhesProps, GrupoDespesa } from './types';
import { useDeputado, useDespesasDeputado } from '../../hooks';
import { Card } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { XCircle } from 'lucide-react';

export const DeputadoDetalhes: React.FC<DeputadoDetalhesProps> = ({ id, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>('info');
  
  const { 
    data: deputado, 
    isLoading: isLoadingDeputado, 
    error: deputadoError 
  } = useDeputado(id);
  
  const { 
    data: despesas = [], 
    isLoading: isLoadingDespesas 
  } = useDespesasDeputado(id);

  // Formatar valor monetário
  const formatarValor = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Formatar data
  const formatarData = (dataString?: string): string => {
    if (!dataString) return 'Data não disponível';
    
    try {
      const data = new Date(dataString);
      return new Intl.DateTimeFormat('pt-BR').format(data);
    } catch (error) {
      return dataString;
    }
  };

  // Calcular total de despesas
  const calcularTotalDespesas = (): number => {
    return despesas.reduce((total, despesa) => total + (despesa.valorDocumento || 0), 0);
  };

  // Agrupar despesas por tipo
  const agruparDespesasPorTipo = (): GrupoDespesa[] => {
    const grupos: Record<string, { total: number; quantidade: number }> = {};
    
    despesas.forEach((despesa) => {
      const tipo = despesa.tipoDespesa || 'Outros';
      if (!grupos[tipo]) {
        grupos[tipo] = {
          total: 0,
          quantidade: 0
        };
      }
      
      grupos[tipo].total += despesa.valorDocumento || 0;
      grupos[tipo].quantidade += 1;
    });
    
    return Object.entries(grupos)
      .map(([tipo, dados]) => ({ tipo, ...dados }))
      .sort((a, b) => b.total - a.total);
  };

  if (isLoadingDeputado) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              <Skeleton className="h-48 w-48 rounded-lg" />
              <div className="space-y-4 flex-1">
                <Skeleton className="h-6 w-3/4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (deputadoError || !deputado) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="p-6 max-w-4xl w-full">
          <div className="text-center py-8">
            <p className="text-lg">Deputado não encontrado.</p>
            <button 
              onClick={onClose}
              className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md"
            >
              Fechar
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Detalhes do Deputado</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fechar"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>
        
        {/* Informações básicas */}
        <div className="flex flex-col md:flex-row mb-6">
          <div className="w-full md:w-1/3 mb-4 md:mb-0 flex justify-center">
            <img 
              src={deputado.urlFoto || 'https://via.placeholder.com/200'} 
              alt={`Foto de ${deputado.nome}`}
              className="w-48 h-48 object-cover rounded-lg"
              loading="lazy"
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://via.placeholder.com/200?text=Sem+Foto';
              }}
            />
          </div>
          <div className="w-full md:w-2/3 md:pl-6">
            <h3 className="text-xl font-semibold mb-2">{deputado.nome}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <p><span className="font-medium">Partido:</span> {deputado.siglaPartido || 'Não informado'}</p>
              <p><span className="font-medium">UF:</span> {deputado.siglaUf || 'Não informado'}</p>
              <p><span className="font-medium">Email:</span> {deputado.email || 'Não informado'}</p>
              <p><span className="font-medium">Situação:</span> {deputado.situacao || 'Em exercício'}</p>
              {deputado.dataNascimento && (
                <p><span className="font-medium">Data de nascimento:</span> {formatarData(deputado.dataNascimento)}</p>
              )}
            </div>
            
            {/* Link para o site da Câmara */}
            <div className="mt-4">
              <a 
                href={`https://www.camara.leg.br/deputados/${deputado.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80"
              >
                Ver no site da Câmara dos Deputados
              </a>
            </div>
          </div>
        </div>
        
        {/* Abas */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="despesas">Despesas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info">
            <div>
              <h3 className="text-lg font-semibold mb-4">Informações Adicionais</h3>
              
              {/* Gabinete */}
              {deputado.gabinete && (
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Gabinete</h4>
                  <div className="bg-muted p-4 rounded-lg">
                    <p><span className="font-medium">Número:</span> {deputado.gabinete.sala || 'Não informado'}</p>
                    <p><span className="font-medium">Prédio:</span> {deputado.gabinete.predio || 'Não informado'}</p>
                    <p><span className="font-medium">Andar:</span> {deputado.gabinete.andar || 'Não informado'}</p>
                    <p><span className="font-medium">Telefone:</span> {deputado.gabinete.telefone || 'Não informado'}</p>
                  </div>
                </div>
              )}
              
              {/* Redes sociais */}
              {deputado.redesSociais && deputado.redesSociais.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Redes Sociais</h4>
                  <ul className="list-disc list-inside bg-muted p-4 rounded-lg">
                    {deputado.redesSociais.map((rede, index) => (
                      <li key={index}>
                        <a 
                          href={rede.startsWith('http') ? rede : `https://${rede}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          {rede}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="despesas">
            <div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                <h3 className="text-lg font-semibold">Despesas Parlamentares</h3>
                <p className="text-lg font-medium">
                  Total: {formatarValor(calcularTotalDespesas())}
                </p>
              </div>
              
              {isLoadingDespesas ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : despesas.length === 0 ? (
                <div className="text-center py-8">
                  <p>Nenhuma despesa encontrada para este deputado.</p>
                </div>
              ) : (
                <>
                  {/* Resumo por tipo de despesa */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Resumo por Tipo de Despesa</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-card border border-border">
                        <thead>
                          <tr className="bg-muted">
                            <th className="py-2 px-4 border-b text-left">Tipo de Despesa</th>
                            <th className="py-2 px-4 border-b text-right">Quantidade</th>
                            <th className="py-2 px-4 border-b text-right">Valor Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {agruparDespesasPorTipo().map((grupo, index) => (
                            <tr key={index} className="hover:bg-muted/50">
                              <td className="py-2 px-4 border-b">{grupo.tipo}</td>
                              <td className="py-2 px-4 border-b text-right">{grupo.quantidade}</td>
                              <td className="py-2 px-4 border-b text-right">{formatarValor(grupo.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Lista detalhada de despesas */}
                  <div>
                    <h4 className="font-medium mb-2">Detalhamento das Despesas</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-card border border-border">
                        <thead>
                          <tr className="bg-muted">
                            <th className="py-2 px-4 border-b text-left">Data</th>
                            <th className="py-2 px-4 border-b text-left">Tipo</th>
                            <th className="py-2 px-4 border-b text-left">Fornecedor</th>
                            <th className="py-2 px-4 border-b text-right">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {despesas.slice(0, 50).map((despesa, index) => (
                            <tr key={index} className="hover:bg-muted/50">
                              <td className="py-2 px-4 border-b">{formatarData(despesa.dataDocumento)}</td>
                              <td className="py-2 px-4 border-b">{despesa.tipoDespesa}</td>
                              <td className="py-2 px-4 border-b">{despesa.nomeFornecedor || 'Sem descrição'}</td>
                              <td className="py-2 px-4 border-b text-right">{formatarValor(despesa.valorDocumento)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {despesas.length > 50 && (
                      <div className="text-center mt-4">
                        <p className="text-muted-foreground">
                          Mostrando 50 de {despesas.length} despesas
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};