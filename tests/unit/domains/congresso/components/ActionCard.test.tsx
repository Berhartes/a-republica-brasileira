import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import ActionCard from '../../../../../src/domains/congresso/components/ActionCard';
import type { Proposicao } from '../../../../../src/domains/congresso/types';
import '@testing-library/jest-dom';

describe('ActionCard', () => {
  const mockProposicao: Proposicao = {
    id: '1',
    numero: 123,
    ano: 2024,
    ementa: 'Teste de ementa',
    dataApresentacao: '2024-01-01',
    status: 'Em tramitação',
    tipo: 'PL',
    casa: 'senado',
  };

  it('deve renderizar corretamente com as informações da proposição', () => {
    render(<ActionCard proposicao={mockProposicao} />);

    expect(screen.getByText('PL 123/2024')).toBeInTheDocument();
    expect(screen.getByText(/Teste de ementa/)).toBeInTheDocument();
    expect(screen.getByText(/Em tramitação/)).toBeInTheDocument();
    expect(screen.getByText(/senado/i)).toBeInTheDocument();
  });

  it('deve chamar onSelect quando clicado', () => {
    const onSelect = vi.fn();
    render(<ActionCard proposicao={mockProposicao} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('PL 123/2024'));
    expect(onSelect).toHaveBeenCalledWith(mockProposicao);
  });
}); 