import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../lib/supabase', () => ({
    supabase: {
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
        from: vi.fn((t: string) => {
            if (t === 'applications') return { select: vi.fn(() => ({ eq: vi.fn(() => ({ data: [], error: null })) })) }
            return { select: vi.fn(() => ({ eq: vi.fn(() => ({ gte: vi.fn(() => ({ order: vi.fn(() => ({
                data: [
                    { id: 'j1', title: 'Garcom', location: 'SP', budget: 300, status: 'open', start_date: '2026-12-01', created_at: '2026-01-01', company: { name: 'A' } },
                    { id: 'j2', title: 'Cozinheiro', location: 'Remoto', budget: 100, status: 'open', start_date: '2026-12-01', created_at: '2026-01-01', company: { name: 'B' } },
                    { id: 'j3', title: 'Barman', location: 'RJ', budget: 500, status: 'open', start_date: '2026-12-01', created_at: '2026-01-01', company: { name: 'C' } },
                ],
                error: null,
            })) })) })) })) }
        }),
    },
}))
vi.mock('../contexts/ToastContext', () => ({ useToast: () => ({ addToast: vi.fn() }) }))
vi.mock('../lib/logger', () => ({ logError: vi.fn() }))
vi.mock('../hooks/useJobApplication', () => ({ useJobApplication: () => ({ applyingId: null, applyForJob: vi.fn() }) }))
vi.mock('../components/JobCard', () => ({ default: ({ job }: { job: { id: string; title: string } }) => <div data-testid={`job-${job.id}`}>{job.title}</div> }))

import Jobs from './Jobs'

describe('Jobs - Filtragem', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('renderiza todas as vagas sem filtro', async () => {
        render(<MemoryRouter><Jobs /></MemoryRouter>)
        await waitFor(() => {
            expect(screen.getByTestId('job-j1')).toBeInTheDocument()
            expect(screen.getByTestId('job-j2')).toBeInTheDocument()
            expect(screen.getByTestId('job-j3')).toBeInTheDocument()
        })
    })

    it('exibe contador de resultados', async () => {
        render(<MemoryRouter><Jobs /></MemoryRouter>)
        await waitFor(() => { expect(screen.getByText(/3 vagas encontradas/i)).toBeInTheDocument() })
    })
})
