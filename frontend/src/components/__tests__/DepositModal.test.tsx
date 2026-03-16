import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DepositModal from '../DepositModal'

const mockAddToast = vi.fn()

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}))

vi.mock('../../services/walletService', () => ({
  WalletService: {
    createDeposit: vi.fn(),
  },
}))

describe('DepositModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza formulario de deposito quando aberto', () => {
    render(<DepositModal {...defaultProps} />)

    expect(screen.getByText('Adicionar Créditos')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument()
    expect(screen.getByText('Gerar Fatura (PIX, Boleto ou Cartão)')).toBeInTheDocument()
  })

  it('nao renderiza quando isOpen=false', () => {
    render(<DepositModal {...defaultProps} isOpen={false} />)

    expect(screen.queryByText('Adicionar Créditos')).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('0.00')).not.toBeInTheDocument()
  })

  it('valida valor minimo de deposito (deve ser maior que 0)', async () => {
    render(<DepositModal {...defaultProps} />)

    const input = screen.getByPlaceholderText('0.00')
    fireEvent.change(input, { target: { value: '2' } })

    const button = screen.getByText('Gerar Fatura (PIX, Boleto ou Cartão)')
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        'O valor mínimo para depósito é R$ 5,00',
        'error'
      )
    })
  })

  it('valida valor maximo de deposito', async () => {
    render(<DepositModal {...defaultProps} />)

    const input = screen.getByPlaceholderText('0.00')
    fireEvent.change(input, { target: { value: '60000' } })

    const button = screen.getByText('Gerar Fatura (PIX, Boleto ou Cartão)')
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        'O valor máximo para depósito é R$ 50.000,00',
        'error'
      )
    })
  })

  it('botao desabilitado quando campo valor esta vazio', () => {
    render(<DepositModal {...defaultProps} />)

    const button = screen.getByText('Gerar Fatura (PIX, Boleto ou Cartão)')
    expect(button).toBeDisabled()
  })
})
