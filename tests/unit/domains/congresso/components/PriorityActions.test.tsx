import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { PriorityActions } from '../../../../../src/domains/congresso/components/PriorityActions';
import type { Proposicao } from '../../../../../src/domains/congresso/types';

describe('PriorityActions', () => {
  const mockProposicoes: Proposicao[] = [
    {
      id: '1',
      numero: 123,
      ano: 2024,
      ementa: 'Teste de ementa 1',
      dataApresentacao: '2024-01-01',
      status: 'Em tramitação',
      tipo: 'PL',
      casa: 'senado',
    },
    {
      id: '2',
      numero: 456,
      ano: 2024,
      ementa: 'Teste de ementa 2',
      dataApresentacao: '2024-01-02',
      status: 'Em análise',
      tipo: 'PEC',
      casa: 'camara',
    },
  ];

  it('deve renderizar mensagem quando não houver proposições', () => {
    render(<PriorityActions proposicoes={[]} />);
    expect(screen.getByText('Nenhuma proposição prioritária encontrada.')).toBeInTheDocument();
  });

  it('deve renderizar lista de proposições quando houver dados', () => {
    render(<PriorityActions proposicoes={mockProposicoes} />);
    
    expect(screen.getByText('Proposições Prioritárias')).toBeInTheDocument();
    expect(screen.getByText(/Teste de ementa 1/)).toBeInTheDocument();
    expect(screen.getByText(/Teste de ementa 2/)).toBeInTheDocument();
    expect(screen.getByText('PL 123/2024')).toBeInTheDocument();
    expect(screen.getByText('PEC 456/2024')).toBeInTheDocument();
  });
}); 