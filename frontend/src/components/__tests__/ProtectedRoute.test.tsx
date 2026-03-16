import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ProtectedRoute from '../ProtectedRoute'

const mockNavigate = vi.fn()
const mockOutlet = vi.fn()

let mockPathname = '/dashboard'

vi.mock('react-router-dom', () => ({
  Navigate: (props: { to: string; replace?: boolean }) => {
    mockNavigate(props)
    return <div data-testid="navigate">Navigate to {props.to}</div>
  },
  Outlet: () => {
    mockOutlet()
    return <div data-testid="outlet">Protected Content</div>
  },
  useLocation: () => ({ pathname: mockPathname }),
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
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

vi.mock('../../lib/logger', () => ({
  logError: vi.fn(),
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname = '/dashboard'
    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: { unsubscribe: vi.fn() },
      },
    })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { onboarding_completed: true }, error: null }),
    })
  })

  it('mostra estado de loading inicialmente', () => {
    mockGetSession.mockReturnValue(new Promise(() => {}))

    render(<ProtectedRoute />)

    const loadingContainer = document.querySelector('.animate-pulse')
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

describe('ProtectedRoute - onboarding gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname = '/dashboard'
    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: { unsubscribe: vi.fn() },
      },
    })
  })

  it('worker sem onboarding_completed=true renderiza Navigate para /worker/onboarding', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'u1', user_metadata: { user_type: 'work' } },
        },
      },
    })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { onboarding_completed: false }, error: null }),
    })

    render(<ProtectedRoute />)

    await waitFor(() => {
      expect(screen.getByTestId('navigate')).toBeInTheDocument()
    })

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/worker/onboarding',
        replace: true,
      })
    )
  })

  it('worker com onboarding_completed=true renderiza Outlet (conteudo protegido)', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'u1', user_metadata: { user_type: 'work' } },
        },
      },
    })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { onboarding_completed: true }, error: null }),
    })

    render(<ProtectedRoute />)

    await waitFor(() => {
      expect(screen.getByTestId('outlet')).toBeInTheDocument()
    })

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('pathname /worker/onboarding com onboarding incompleto renderiza Outlet sem redirect', async () => {
    mockPathname = '/worker/onboarding'
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'u1', user_metadata: { user_type: 'work' } },
        },
      },
    })
    // Even though onboarding is not complete, we're on the onboarding route itself
    // so no redirect should happen
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { onboarding_completed: false }, error: null }),
    })

    render(<ProtectedRoute />)

    await waitFor(() => {
      expect(screen.getByTestId('outlet')).toBeInTheDocument()
    })

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('empresa sem onboarding_completed=true renderiza Navigate para /company/onboarding', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'u2', user_metadata: { user_type: 'hire' } },
        },
      },
    })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { onboarding_completed: false }, error: null }),
    })

    render(<ProtectedRoute />)

    await waitFor(() => {
      expect(screen.getByTestId('navigate')).toBeInTheDocument()
    })

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/company/onboarding',
        replace: true,
      })
    )
  })
})
