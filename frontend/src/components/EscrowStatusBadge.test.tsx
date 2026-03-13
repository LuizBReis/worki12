import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EscrowStatusBadge from './EscrowStatusBadge'

describe('EscrowStatusBadge', () => {
  it('renderiza badge Pagamento Reservado quando escrowStatus=reserved', () => {
    render(<EscrowStatusBadge escrowStatus="reserved" />)
    expect(screen.getByText('Pagamento Reservado')).toBeInTheDocument()
  })

  it('renderiza badge Pagamento Liberado quando escrowStatus=released', () => {
    render(<EscrowStatusBadge escrowStatus="released" />)
    expect(screen.getByText('Pagamento Liberado')).toBeInTheDocument()
  })

  it('retorna null quando escrowStatus=null', () => {
    const { container } = render(<EscrowStatusBadge escrowStatus={null} />)
    expect(container.firstChild).toBeNull()
  })
})
