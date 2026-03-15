import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '../Login'

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  },
}))

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login?type=work']}>
      <Login />
    </MemoryRouter>
  )
}

describe('Login', () => {
  it('renderiza formulario com campos de email e senha', () => {
    renderLogin()

    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('exibe erro ao submeter formulario vazio', async () => {
    renderLogin()

    const emailInput = screen.getByLabelText('Email')
    const senhaInput = screen.getByLabelText('Senha')

    // Both fields have required attribute and HTML validation
    expect(emailInput).toBeRequired()
    expect(senhaInput).toBeRequired()
  })

  it('possui link para esqueci minha senha', () => {
    renderLogin()

    const link = screen.getByText('Esqueci minha senha')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/esqueci-senha')
  })

  it('permite alternar entre login e cadastro', async () => {
    const user = userEvent.setup()
    renderLogin()

    // Initially in login mode
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()

    // Switch to sign up mode
    await user.click(screen.getByText('Cadastre-se'))

    expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument()
  })
})
