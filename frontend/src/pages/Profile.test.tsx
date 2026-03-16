import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Profile from './Profile'

const mockAddToast = vi.fn()

vi.mock('../contexts/ToastContext', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}))

const mockUpdateUser = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
      }),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'user-1',
          full_name: 'Worker Test',
          city: 'SP',
          phone: '11999999999',
          bio: 'Bio test',
          pix_key: 'pix@test.com',
          primary_role: 'Garcom',
          roles: ['Garcom'],
          cover_url: null,
          avatar_url: null,
          verified_identity: false,
          level: 1,
          xp: 50,
          rating_average: null,
          completed_jobs_count: 0,
          earnings_total: 0,
          experience_years: null,
          availability: null,
        },
        error: null,
      }),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn(),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
      }),
    },
  },
}))

function renderProfile() {
  return render(
    <MemoryRouter>
      <Profile />
    </MemoryRouter>
  )
}

describe('Profile - secao Seguranca', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateUser.mockResolvedValue({ error: null })
  })

  it('botao Alterar Senha esta desabilitado quando campos de senha estao vazios', async () => {
    renderProfile()

    await waitFor(() => {
      expect(screen.getByText('Seguranca')).toBeInTheDocument()
    })

    const button = screen.getByRole('button', { name: /alterar senha/i })
    expect(button).toBeDisabled()
  })

  it('exibe erro "As senhas nao coincidem." quando newPassword !== confirmPassword', async () => {
    const user = userEvent.setup()
    renderProfile()

    await waitFor(() => {
      expect(screen.getByText('Seguranca')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('Nova senha'), 'Senha12345')
    await user.type(screen.getByLabelText('Confirmar senha'), 'SenhaDiferente')
    await user.click(screen.getByRole('button', { name: /alterar senha/i }))

    await waitFor(() => {
      expect(screen.getByText('As senhas nao coincidem.')).toBeInTheDocument()
    })
  })

  it('exibe erro "A senha deve ter pelo menos 8 caracteres." quando senha curta', async () => {
    const user = userEvent.setup()
    renderProfile()

    await waitFor(() => {
      expect(screen.getByText('Seguranca')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('Nova senha'), 'abc')
    await user.type(screen.getByLabelText('Confirmar senha'), 'abc')
    await user.click(screen.getByRole('button', { name: /alterar senha/i }))

    await waitFor(() => {
      expect(screen.getByText('A senha deve ter pelo menos 8 caracteres.')).toBeInTheDocument()
    })
  })

  it('supabase.auth.updateUser e chamado com a senha correta quando campos validos', async () => {
    const user = userEvent.setup()
    renderProfile()

    await waitFor(() => {
      expect(screen.getByText('Seguranca')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('Nova senha'), 'NovaSenha123')
    await user.type(screen.getByLabelText('Confirmar senha'), 'NovaSenha123')
    await user.click(screen.getByRole('button', { name: /alterar senha/i }))

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'NovaSenha123' })
    })
  })

  it('exibe toast "Senha alterada com sucesso." apos updateUser retornar sem erro', async () => {
    const user = userEvent.setup()
    renderProfile()

    await waitFor(() => {
      expect(screen.getByText('Seguranca')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('Nova senha'), 'NovaSenha123')
    await user.type(screen.getByLabelText('Confirmar senha'), 'NovaSenha123')
    await user.click(screen.getByRole('button', { name: /alterar senha/i }))

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('Senha alterada com sucesso.', 'success')
    })
  })

  it('campos newPassword e confirmPassword sao resetados para vazio apos sucesso', async () => {
    const user = userEvent.setup()
    renderProfile()

    await waitFor(() => {
      expect(screen.getByText('Seguranca')).toBeInTheDocument()
    })

    const newPwField = screen.getByLabelText('Nova senha')
    const confirmPwField = screen.getByLabelText('Confirmar senha')

    await user.type(newPwField, 'NovaSenha123')
    await user.type(confirmPwField, 'NovaSenha123')
    await user.click(screen.getByRole('button', { name: /alterar senha/i }))

    await waitFor(() => {
      expect(newPwField).toHaveValue('')
      expect(confirmPwField).toHaveValue('')
    })
  })
})
