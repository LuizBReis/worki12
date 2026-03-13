import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

// Mock supabase — factories use vi.fn() directly inside to avoid hoisting issues
const mockUnsubscribe = vi.fn()

vi.mock('../lib/supabase', () => {
  const mockEq = vi.fn()
  const mockSingle = vi.fn()
  const mockSelect = vi.fn(() => ({ eq: mockEq }))
  const mockFrom = vi.fn(() => ({ select: mockSelect }))

  mockEq.mockImplementation(() => ({ single: mockSingle }))
  mockSingle.mockResolvedValue({ data: null, error: null })

  return {
    supabase: {
      auth: {
        getSession: vi.fn(() =>
          Promise.resolve({ data: { session: null } })
        ),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
      },
      from: mockFrom,
    },
  }
})

// Mock TosGateModal to keep tests simple
vi.mock('./TosGateModal', () => ({
  default: ({ userRole }: { userRole: string }) => (
    <div data-testid="tos-gate-modal">TosGateModal userRole={userRole}</div>
  ),
}))

// Mock ToastContext
vi.mock('../contexts/ToastContext', () => ({
  useToast: () => ({
    addToast: vi.fn(),
    removeToast: vi.fn(),
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockUnsubscribe.mockReset()
})

function renderProtectedRoute(children = <div data-testid="outlet-content">Conteúdo Protegido</div>) {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={children} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute — TOS gate', () => {
  it('renderiza TosGateModal quando tosAccepted é false', async () => {
    const { supabase } = await import('../lib/supabase')

    // Session exists
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } as never },
      error: null,
    })

    // Worker with accepted_tos = false
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({ data: { accepted_tos: false }, error: null })
          ),
        })),
      })),
    } as never)

    renderProtectedRoute()

    await waitFor(() => {
      expect(screen.getByTestId('tos-gate-modal')).toBeInTheDocument()
    })
  })

  it('renderiza Outlet quando tosAccepted é true', async () => {
    const { supabase } = await import('../lib/supabase')

    // Session exists
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'user-2' } } as never },
      error: null,
    })

    // Worker with accepted_tos = true
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({ data: { accepted_tos: true }, error: null })
          ),
        })),
      })),
    } as never)

    renderProtectedRoute()

    await waitFor(() => {
      expect(screen.getByTestId('outlet-content')).toBeInTheDocument()
      expect(screen.queryByTestId('tos-gate-modal')).not.toBeInTheDocument()
    })
  })
})
