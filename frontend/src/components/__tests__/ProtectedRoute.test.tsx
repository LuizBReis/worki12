import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ProtectedRoute from '../ProtectedRoute'

const mockNavigate = vi.fn()
const mockOutlet = vi.fn()

vi.mock('react-router-dom', () => ({
  Navigate: (props: { to: string; replace?: boolean }) => {
    mockNavigate(props)
    return <div data-testid="navigate">Navigate to {props.to}</div>
  },
  Outlet: () => {
    mockOutlet()
    return <div data-testid="outlet">Protected Content</div>
  },
  useLocation: () => ({ pathname: '/dashboard' }),
}))

const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockFrom = vi.fn()

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      onAuthStateChange: () => mockOnAuthStateChange(),
    },
    from: () => mockFrom(),
  },
}))

vi.mock('../../lib/logger', () => ({
  logError: vi.fn(),
}))

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    addToast: vi.fn(),
    removeToast: vi.fn(),
  }),
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: { unsubscribe: vi.fn() },
      },
    })
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { onboarding_completed: true, accepted_tos: true }, error: null }),
        }),
      }),
    })
  })

  it('mostra estado de loading inicialmente', () => {
    mockGetSession.mockReturnValue(new Promise(() => {}))

    render(<ProtectedRoute />)

    const loadingContainer = document.querySelector('.animate-spin')
    expect(loadingContainer).toBeInTheDocument()
    expect(screen.queryByTestId('outlet')).not.toBeInTheDocument()
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
  })

  it('renderiza children quando usuario esta autenticado', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-123', user_metadata: { user_type: 'work' } },
        },
      },
    })

    render(<ProtectedRoute />)

    await waitFor(() => {
      expect(screen.getByTestId('outlet')).toBeInTheDocument()
    })

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument()
  })

  it('redireciona para / quando nao autenticado', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: null,
      },
    })

    render(<ProtectedRoute />)

    await waitFor(() => {
      expect(screen.getByTestId('navigate')).toBeInTheDocument()
    })

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/',
        replace: true,
      })
    )
    expect(screen.queryByTestId('outlet')).not.toBeInTheDocument()
  })
})
