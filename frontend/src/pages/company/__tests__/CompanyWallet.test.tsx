import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CompanyWallet from '../CompanyWallet'

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}))

vi.mock('../../../services/walletService', () => ({
  WalletService: {
    getOrCreateWallet: vi.fn(),
    getTransactions: vi.fn(),
    getCompanyEscrows: vi.fn(),
    syncBalance: vi.fn(),
  },
}))

vi.mock('../../../contexts/ToastContext', () => ({
  useToast: vi.fn(() => ({ addToast: vi.fn(), removeToast: vi.fn() })),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
  }
})

// Mock DepositModal to avoid deep dependency chains
vi.mock('../../../components/DepositModal', () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="deposit-modal">
        <button onClick={onClose}>Fechar Deposito</button>
      </div>
    ) : null,
}))

import { supabase } from '../../../lib/supabase'
import { WalletService } from '../../../services/walletService'
import { useToast } from '../../../contexts/ToastContext'
import { useNavigate } from 'react-router-dom'

const ESCROW_DATA = [
  {
    id: 'escrow-1',
    job_id: 'job-1',
    application_id: 'app-1',
    amount: 300,
    company_wallet_id: 'wallet-1',
    worker_wallet_id: null,
    status: 'reserved' as const,
    created_at: '2026-03-10T10:00:00Z',
    released_at: null,
    job: { title: 'Garcom para Evento' },
  },
  {
    id: 'escrow-2',
    job_id: 'job-2',
    application_id: 'app-2',
    amount: 500,
    company_wallet_id: 'wallet-1',
    worker_wallet_id: 'wallet-2',
    status: 'released' as const,
    created_at: '2026-03-05T10:00:00Z',
    released_at: '2026-03-08T10:00:00Z',
    job: { title: 'Barman para Festa' },
  },
]

function setupMocks(overrides: {
  balance?: number
  transactions?: unknown[]
  escrows?: unknown[]
} = {}) {
  const mockAddToast = vi.fn()
  vi.mocked(useToast).mockReturnValue({ addToast: mockAddToast, removeToast: vi.fn() })
  vi.mocked(useNavigate).mockReturnValue(vi.fn())

  vi.mocked(supabase.auth.getUser).mockResolvedValue({
    data: { user: { id: 'company-1' } },
    error: null,
  } as Awaited<ReturnType<typeof supabase.auth.getUser>>)

  vi.mocked(WalletService.getOrCreateWallet).mockResolvedValue({
    id: 'wallet-1',
    user_id: 'company-1',
    balance: overrides.balance ?? 2000,
    user_type: 'company',
    created_at: '',
    updated_at: '',
  })

  vi.mocked(WalletService.getTransactions).mockResolvedValue(
    (overrides.transactions ?? []) as Awaited<ReturnType<typeof WalletService.getTransactions>>
  )

  vi.mocked(WalletService.getCompanyEscrows).mockResolvedValue(
    (overrides.escrows ?? []) as Awaited<ReturnType<typeof WalletService.getCompanyEscrows>>
  )

  vi.mocked(WalletService.syncBalance).mockResolvedValue({ success: true, hasUpdates: false })

  return { mockAddToast }
}

function renderComponent() {
  return render(
    <MemoryRouter>
      <CompanyWallet />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CompanyWallet - Renderizacao de saldo', () => {
  it('exibe saldo da empresa formatado em R$ apos carregar', async () => {
    setupMocks({ balance: 2000 })
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('R$ 2000,00')).toBeInTheDocument()
    })
  })

  it('exibe titulo Carteira da Empresa', async () => {
    setupMocks()
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Carteira da Empresa')).toBeInTheDocument()
    })
  })
})

describe('CompanyWallet - Modal de deposito', () => {
  it('abre modal de deposito ao clicar Adicionar Saldo', async () => {
    setupMocks()
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('R$ 2000,00')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText(/Adicionar Saldo/i))

    expect(screen.getByTestId('deposit-modal')).toBeInTheDocument()
  })

  it('fecha modal de deposito ao clicar Fechar', async () => {
    setupMocks()
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('R$ 2000,00')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText(/Adicionar Saldo/i))
    expect(screen.getByTestId('deposit-modal')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Fechar Deposito'))

    await waitFor(() => {
      expect(screen.queryByTestId('deposit-modal')).not.toBeInTheDocument()
    })
  })
})

describe('CompanyWallet - Lista de escrows ativos', () => {
  it('exibe escrows com status reserved', async () => {
    setupMocks({ escrows: ESCROW_DATA })
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Garcom para Evento')).toBeInTheDocument()
    })

    // R$ 300,00 may appear in multiple places (escrow card + stats)
    const amounts = screen.getAllByText('R$ 300,00')
    expect(amounts.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Valores em Escrow')).toBeInTheDocument()
  })

  it('nao exibe secao de escrows quando nenhum escrow reservado', async () => {
    const releasedOnly = ESCROW_DATA.filter(e => e.status === 'released')
    setupMocks({ escrows: releasedOnly })
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('R$ 2000,00')).toBeInTheDocument()
    })

    expect(screen.queryByText('Valores em Escrow')).not.toBeInTheDocument()
  })
})

describe('CompanyWallet - Estado vazio', () => {
  it('exibe mensagem quando nao ha transacoes', async () => {
    setupMocks({ transactions: [], escrows: [] })
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Nenhuma transação registrada.')).toBeInTheDocument()
    })
  })
})

describe('CompanyWallet - Erro de rede', () => {
  it('navega para login quando usuario nao autenticado', async () => {
    const mockNavigate = vi.fn()
    vi.mocked(useToast).mockReturnValue({ addToast: vi.fn(), removeToast: vi.fn() })
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as unknown as Awaited<ReturnType<typeof supabase.auth.getUser>>)

    vi.mocked(WalletService.syncBalance).mockResolvedValue({ success: false })

    renderComponent()

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })
})
