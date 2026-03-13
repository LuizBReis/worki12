import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TosGateModal from './TosGateModal'

// Mock supabase — use vi.fn() directly inside factory (hoisting safety)
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: { id: 'user-1' } } })
      ),
    },
  },
}))

// Mock useToast — use vi.fn() directly inside factory
vi.mock('../contexts/ToastContext', () => ({
  useToast: () => ({
    addToast: vi.fn(),
    removeToast: vi.fn(),
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TosGateModal', () => {
  it('renderiza com checkbox desmarcado inicialmente', () => {
    render(
      <TosGateModal userRole="worker" onAccepted={vi.fn()} />
    )

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(false)
    expect(screen.getByText('Termos de Uso Atualizados')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /aceitar e continuar/i })).toBeInTheDocument()
  })

  it('botão desabilitado quando checkbox desmarcado', () => {
    render(
      <TosGateModal userRole="worker" onAccepted={vi.fn()} />
    )

    const button = screen.getByRole('button', { name: /aceitar e continuar/i })
    expect(button).toBeDisabled()
  })

  it('botão habilitado quando checkbox marcado', () => {
    render(
      <TosGateModal userRole="company" onAccepted={vi.fn()} />
    )

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    const button = screen.getByRole('button', { name: /aceitar e continuar/i })
    expect(button).not.toBeDisabled()
  })
})
