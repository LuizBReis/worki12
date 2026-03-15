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

import ProtectedRoute from './ProtectedRoute'

function renderRoute(path = '/dashboard', children = <div data-testid="outlet-content">Conteudo Protegido</div>) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={children} />
                    <Route path="/worker/onboarding" element={<div data-testid="worker-onboarding">Worker Onboarding</div>} />
                    <Route path="/company/onboarding" element={<div data-testid="company-onboarding">Company Onboarding</div>} />
                </Route>
                <Route path="/" element={<div data-testid="login-page">Login</div>} />
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

    it('worker sem onboarding_completed redireciona para /worker/onboarding', async () => {
        mockGetSession.mockResolvedValue({
            data: { session: { user: { id: 'w1', user_metadata: { user_type: 'work' } } } },
        })
        mockFrom.mockReturnValue({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({
                        data: { onboarding_completed: false },
                        error: null,
                    }),
                })),
            })),
        })

        renderRoute('/dashboard')

        await waitFor(() => {
            expect(screen.getByTestId('worker-onboarding')).toBeInTheDocument()
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

    it('empresa sem onboarding_completed redireciona para /company/onboarding', async () => {
        mockGetSession.mockResolvedValue({
            data: { session: { user: { id: 'c1', user_metadata: { user_type: 'hire' } } } },
        })
        mockFrom.mockReturnValue({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({
                        data: { onboarding_completed: false },
                        error: null,
                    }),
                })),
            })),
        })

        renderRoute('/dashboard')

        await waitFor(() => {
            expect(screen.getByTestId('company-onboarding')).toBeInTheDocument()
        })
    })
})
