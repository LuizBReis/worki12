import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Jobs from './Jobs'

const mockJobs = [
  {
    id: '1',
    title: 'Garcom Evento',
    budget: 100,
    location: 'Sao Paulo, SP',
    status: 'open',
    start_date: new Date(Date.now() + 86400000 * 7).toISOString(),
    company: { name: 'Empresa A', logo_url: undefined, rating_average: undefined, reviews_count: undefined },
    candidates_count: 0,
  },
  {
    id: '2',
    title: 'Bartender Noturno',
    budget: 300,
    location: 'Rio de Janeiro, RJ',
    status: 'open',
    start_date: new Date(Date.now() + 86400000 * 7).toISOString(),
    company: { name: 'Empresa B', logo_url: undefined, rating_average: undefined, reviews_count: undefined },
    candidates_count: 0,
  },
  {
    id: '3',
    title: 'Chef de Cozinha',
    budget: 250,
    location: 'Sao Paulo, SP',
    status: 'open',
    start_date: new Date(Date.now() + 86400000 * 7).toISOString(),
    company: { name: 'Empresa C', logo_url: undefined, rating_average: undefined, reviews_count: undefined },
    candidates_count: 0,
  },
]

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'u1' } },
      }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'applications') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            data: [],
            error: null,
          }),
        }
      }
      // jobs table
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockJobs, error: null }),
      }
    }),
  },
}))

vi.mock('../hooks/useJobApplication', () => ({
  useJobApplication: () => ({
    applyingId: null,
    applyForJob: vi.fn(),
  }),
}))

vi.mock('../contexts/ToastContext', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}))

vi.mock('../services/analytics', () => ({
  AnalyticsService: {
    trackJobView: vi.fn(),
  },
}))

function renderJobs(initialPath = '/jobs') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Jobs />
    </MemoryRouter>
  )
}

describe('Jobs - filtragem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('filtra vagas com budget >= minBudget quando minBudget=200', async () => {
    renderJobs('/jobs?minBudget=200')

    await waitFor(() => {
      expect(screen.getByText('Bartender Noturno')).toBeInTheDocument()
    })

    expect(screen.getByText('Chef de Cozinha')).toBeInTheDocument()
    // Garcom Evento has budget 100, should be filtered out
    expect(screen.queryByText('Garcom Evento')).not.toBeInTheDocument()
  })

  it('filtra vagas por cidade quando city=SP', async () => {
    renderJobs('/jobs?city=SP')

    await waitFor(() => {
      expect(screen.getByText('Garcom Evento')).toBeInTheDocument()
    })

    expect(screen.getByText('Chef de Cozinha')).toBeInTheDocument()
    // Bartender is in RJ, should be filtered out
    expect(screen.queryByText('Bartender Noturno')).not.toBeInTheDocument()
  })

  it('retorna 0 vagas quando nenhuma vaga corresponde a todos os filtros ativos', async () => {
    renderJobs('/jobs?minBudget=999&city=XYZ')

    await waitFor(() => {
      expect(screen.getByText('Nenhuma vaga encontrada com esses filtros.')).toBeInTheDocument()
    })
  })

  it('botao Limpar filtros aparece quando hasActiveFilters=true', async () => {
    renderJobs('/jobs?role=Garcom')

    await waitFor(() => {
      expect(screen.getByText(/vagas? encontradas?/)).toBeInTheDocument()
    })

    // The "Limpar filtros" button in the results counter section
    const clearButtons = screen.getAllByText('Limpar filtros')
    expect(clearButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('botao Limpar filtros nao aparece quando todos os filtros sao padrao', async () => {
    renderJobs('/jobs')

    await waitFor(() => {
      expect(screen.getByText(/vagas? encontradas?/)).toBeInTheDocument()
    })

    // When no active filters, the "Limpar filtros" button should NOT appear
    // in the counter section. It might still appear in empty state but not when there are results
    const counterSection = screen.getByText(/vagas? encontradas?/).closest('div')
    const clearBtn = counterSection?.querySelector('button')
    expect(clearBtn).toBeNull()
  })
})
