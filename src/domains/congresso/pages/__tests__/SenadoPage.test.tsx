import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import SenadoPage from '../SenadoPage';
import { senadoApiService } from '@/domains/congresso/senado/services';

// Mock do serviço da API
vi.mock('@/domains/congresso/senado/services', () => ({
  senadoApiService: {
    buscarTodosSenadores: vi.fn()
  }
}));

// Mock do TanStack Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryFn }: { queryFn: () => Promise<any> }) => ({
    data: [],
    isLoading: false,
    error: null,
    refetch: vi.fn()
  })
}));

describe('SenadoPage', () => {
  it('deve renderizar o componente corretamente', () => {
    render(<SenadoPage />);
    expect(screen.getByText('Senado Federal')).toBeInTheDocument();
  });

  it('deve mostrar loading spinner durante o carregamento', () => {
    vi.mock('@tanstack/react-query', () => ({
      useQuery: () => ({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn()
      })
    }));

    render(<SenadoPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('deve mostrar mensagem de erro quando a API falha', () => {
    vi.mock('@tanstack/react-query', () => ({
      useQuery: () => ({
        data: undefined,
        isLoading: false,
        error: new Error('Erro ao carregar dados'),
        refetch: vi.fn()
      })
    }));

    render(<SenadoPage />);
    expect(screen.getByText('Erro')).toBeInTheDocument();
  });

  it('deve mostrar dados mockados quando não há dados da API', async () => {
    vi.mock('@tanstack/react-query', () => ({
      useQuery: () => ({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })
    }));

    render(<SenadoPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Dados Simulados')).toBeInTheDocument();
    });
  });

  it('deve permitir atualizar os dados', async () => {
    const refetchMock = vi.fn();
    vi.mock('@tanstack/react-query', () => ({
      useQuery: () => ({
        data: [],
        isLoading: false,
        error: null,
        refetch: refetchMock
      })
    }));

    render(<SenadoPage />);
    
    const updateButton = screen.getByText('Atualizar Dados');
    updateButton.click();
    
    expect(refetchMock).toHaveBeenCalled();
  });
});
