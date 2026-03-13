import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CompanyJobCandidates from './CompanyJobCandidates'

// Mock WalletService — must not reference outer variables in factory
vi.mock('../../services/walletService', () => ({
  WalletService: {
    releaseEscrow: vi.fn().mockResolvedValue({ success: true }),
  },
}))

// Mock supabase — factory with only inline vi.fn()
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}))

// Mock ToastContext
vi.mock('../../contexts/ToastContext', () => ({
  useToast: vi.fn(() => ({ addToast: vi.fn(), removeToast: vi.fn() })),
}))

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
  }
})

// Import mocked modules for assertions
import { supabase } from '../../lib/supabase'
import { WalletService } from '../../services/walletService'
import { useToast } from '../../contexts/ToastContext'
import { useNavigate } from 'react-router-dom'

function buildChain(overrides: Record<string, unknown> = {}) {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
    update: vi.fn().mockReturnThis(),
  }
  return { ...chain, ...overrides }
}

const JOB_DATA = { title: 'Garcom para Evento' }
const APP_DATA = [
  {
    id: 'app-1',
    job_id: 'job-123',
    worker_id: 'worker-1',
    status: 'in_progress',
    cover_letter: 'Olá, quero trabalhar.',
    created_at: new Date().toISOString(),
    worker: {
      id: 'worker-1',
      full_name: 'João Silva',
      avatar_url: null,
      city: 'São Paulo',
      level: 2,
      rating_average: 4.8,
      reviews_count: 10,
      tags: [],
    },
    worker_checkin_at: new Date().toISOString(),
    worker_checkout_at: new Date().toISOString(),
    company_checkin_confirmed_at: new Date().toISOString(),
    company_checkout_confirmed_at: new Date().toISOString(),
  },
]

function setupDefaultMocks() {
  const mockAddToast = vi.fn()
  const mockRemoveToast = vi.fn()
  vi.mocked(useToast).mockReturnValue({ addToast: mockAddToast, removeToast: mockRemoveToast })
  vi.mocked(useNavigate).mockReturnValue(vi.fn())

  vi.mocked(supabase.auth.getUser).mockResolvedValue({
    data: { user: { id: 'company-user-1' } },
    error: null,
  } as Awaited<ReturnType<typeof supabase.auth.getUser>>)

  const jobChain = buildChain({
    single: vi.fn().mockResolvedValue({ data: JOB_DATA, error: null }),
  })

  const appChain = buildChain({
    order: vi.fn().mockResolvedValue({ data: APP_DATA, error: null }),
    update: vi.fn().mockReturnValue(buildChain({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })

  const escrowChain = buildChain({
    single: vi.fn().mockResolvedValue({ data: { status: 'reserved' }, error: null }),
  })

  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'jobs') return jobChain as unknown as ReturnType<typeof supabase.from>
    if (table === 'applications') return appChain as unknown as ReturnType<typeof supabase.from>
    if (table === 'escrow_transactions') return escrowChain as unknown as ReturnType<typeof supabase.from>
    return buildChain() as unknown as ReturnType<typeof supabase.from>
  })

  return { mockAddToast }
}

function renderComponent() {
  return render(
    <MemoryRouter initialEntries={['/company/jobs/job-123/candidates']}>
      <Routes>
        <Route path="/company/jobs/:id/candidates" element={<CompanyJobCandidates />} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CompanyJobCandidates — modal de confirmação de entrega', () => {
  it('modal de confirmação abre ao clicar botão Confirmar Entrega', async () => {
    setupDefaultMocks()
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Confirmar Entrega'))

    expect(screen.getByRole('heading', { name: /Confirmar Entrega/i })).toBeInTheDocument()
    expect(screen.getByText(/O pagamento será liberado imediatamente ao profissional/)).toBeInTheDocument()
  })

  it('modal fecha ao clicar Cancelar sem chamar releaseEscrow', async () => {
    setupDefaultMocks()
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Confirmar Entrega'))

    expect(screen.getByText(/O pagamento será liberado imediatamente ao profissional/)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Cancelar'))

    await waitFor(() => {
      expect(screen.queryByText(/O pagamento será liberado imediatamente ao profissional/)).not.toBeInTheDocument()
    })

    expect(WalletService.releaseEscrow).not.toHaveBeenCalled()
  })

  it('toast de sucesso aparece após releaseEscrow retornar sucesso', async () => {
    const { mockAddToast } = setupDefaultMocks()
    vi.mocked(WalletService.releaseEscrow).mockResolvedValueOnce({ success: true })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Confirmar Entrega'))

    await waitFor(() => {
      expect(screen.getByText(/O pagamento será liberado imediatamente ao profissional/)).toBeInTheDocument()
    })

    // Get "Confirmar" button inside modal (not the list button)
    const buttons = screen.getAllByRole('button')
    const confirmarModal = buttons.find(b => b.textContent?.trim() === 'Confirmar')
    expect(confirmarModal).toBeDefined()
    fireEvent.click(confirmarModal!)

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        'Entrega confirmada! Pagamento liberado ao profissional.',
        'success'
      )
    })
  })

  it('toast de erro aparece quando releaseEscrow retorna success=false', async () => {
    const { mockAddToast } = setupDefaultMocks()
    vi.mocked(WalletService.releaseEscrow).mockResolvedValueOnce({ success: false, error: 'Falha no pagamento' })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Confirmar Entrega'))

    await waitFor(() => {
      expect(screen.getByText(/O pagamento será liberado imediatamente ao profissional/)).toBeInTheDocument()
    })

    const buttons = screen.getAllByRole('button')
    const confirmarModal = buttons.find(b => b.textContent?.trim() === 'Confirmar')
    expect(confirmarModal).toBeDefined()
    fireEvent.click(confirmarModal!)

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        'Erro ao liberar pagamento. Tente novamente.',
        'error'
      )
    })
  })
})
