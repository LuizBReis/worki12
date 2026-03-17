import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Mock supabase
const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockFrom = vi.fn()

vi.mock('../lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: (...args: unknown[]) => mockGetSession(...args),
            onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
        },
        from: (...args: unknown[]) => mockFrom(...args),
    },
}))

// Mock logger
vi.mock('../lib/logger', () => ({
    logError: vi.fn(),
}))

// Mock ToastContext
vi.mock('../contexts/ToastContext', () => ({
    useToast: () => ({
        addToast: vi.fn(),
        removeToast: vi.fn(),
    }),
}))

import ProtectedRoute from './ProtectedRoute'

function renderRoute(path = '/dashboard') {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<div data-testid="outlet-content">Conteudo Protegido</div>} />
                    <Route path="/worker/onboarding" element={<div data-testid="worker-onboarding">Worker Onboarding</div>} />
                    <Route path="/company/onboarding" element={<div data-testid="company-onboarding">Company Onboarding</div>} />
                </Route>
                <Route path="/" element={<div data-testid="home-page">Home</div>} />
            </Routes>
        </MemoryRouter>
    )
}

describe('ProtectedRoute - Onboarding Gate', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockOnAuthStateChange.mockReturnValue({
            data: { subscription: { unsubscribe: vi.fn() } },
        })
    })

    it('worker com onboarding_completed=true renderiza Outlet', async () => {
        mockGetSession.mockResolvedValue({
            data: { session: { user: { id: 'w2', user_metadata: { user_type: 'work' } } } },
        })
        mockFrom.mockReturnValue({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({
                        data: { onboarding_completed: true },
                        error: null,
                    }),
                })),
            })),
        })

        renderRoute('/dashboard')

        await waitFor(() => {
            expect(screen.getByTestId('outlet-content')).toBeInTheDocument()
        })
    })

    it('rota /worker/onboarding com onboarding incompleto renderiza Outlet sem redirect', async () => {
        mockGetSession.mockResolvedValue({
            data: { session: { user: { id: 'w3', user_metadata: { user_type: 'work' } } } },
        })

        renderRoute('/worker/onboarding')

        await waitFor(() => {
            expect(screen.getByTestId('worker-onboarding')).toBeInTheDocument()
        })
    })

    it('usuario nao autenticado redireciona para /', async () => {
        mockGetSession.mockResolvedValue({
            data: { session: null },
        })

        renderRoute('/dashboard')

        await waitFor(() => {
            expect(screen.getByTestId('home-page')).toBeInTheDocument()
        })
    })

    it('empresa com onboarding_completed=true renderiza Outlet', async () => {
        mockGetSession.mockResolvedValue({
            data: { session: { user: { id: 'c1', user_metadata: { user_type: 'hire' } } } },
        })
        mockFrom.mockReturnValue({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({
                        data: { onboarding_completed: true },
                        error: null,
                    }),
                })),
            })),
        })

        renderRoute('/dashboard')

        await waitFor(() => {
            expect(screen.getByTestId('outlet-content')).toBeInTheDocument()
        })
    })
})
