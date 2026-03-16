import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JobCard from '../JobCard'

vi.mock('../../services/analytics', () => ({
  AnalyticsService: {
    trackJobView: vi.fn(),
  },
}))

const baseJob = {
  id: 'job-1',
  title: 'Garçom',
  location: 'São Paulo, SP',
  start_date: '2026-04-01T00:00:00',
  budget: 150,
  company: { name: 'Restaurante ABC', logo_url: undefined, rating_average: 4.5 },
  candidates_count: 3,
  work_start_time: '08:00',
  work_end_time: '16:00',
  has_lunch: true,
}

describe('JobCard', () => {
  it('renderiza titulo, empresa, localizacao e valor', () => {
    render(<JobCard job={baseJob} isApplied={false} onApply={vi.fn()} />)

    expect(screen.getByText('Garçom')).toBeInTheDocument()
    expect(screen.getByText(/Restaurante ABC/)).toBeInTheDocument()
    expect(screen.getByText(/São Paulo, SP/)).toBeInTheDocument()
    expect(screen.getByText(/R\$ 150/)).toBeInTheDocument()
  })

  it('mostra badge "Já Aplicado" quando isApplied=true', () => {
    render(<JobCard job={baseJob} isApplied={true} onApply={vi.fn()} />)

    expect(screen.getByText('Já Aplicado')).toBeInTheDocument()
    expect(screen.getByText('Candidatura Enviada')).toBeInTheDocument()
  })

  it('mostra botao "Candidatar-se" quando nao aplicado (variant=search)', () => {
    render(<JobCard job={baseJob} isApplied={false} onApply={vi.fn()} variant="search" />)

    expect(screen.getByText('Candidatar-se')).toBeInTheDocument()
  })

  it('mostra botao "Aceitar" quando variant=feed', () => {
    render(<JobCard job={baseJob} isApplied={false} onApply={vi.fn()} variant="feed" />)

    expect(screen.getByText('Aceitar')).toBeInTheDocument()
  })

  it('chama onApply ao clicar no botao de candidatura', async () => {
    const onApply = vi.fn()
    const user = userEvent.setup()

    render(<JobCard job={baseJob} isApplied={false} onApply={onApply} />)

    await user.click(screen.getByText('Candidatar-se'))
    expect(onApply).toHaveBeenCalledWith('job-1')
  })

  it('desabilita botao quando isApplying=true', () => {
    render(<JobCard job={baseJob} isApplied={false} onApply={vi.fn()} isApplying={true} />)

    const buttons = screen.getAllByRole('button')
    const applyBtn = buttons.find(b => b.className.includes('bg-black') || b.className.includes('bg-primary'))
    expect(applyBtn).toBeDisabled()
  })

  it('expande descricao ao clicar "Ver Detalhes"', async () => {
    const user = userEvent.setup()
    const jobWithDesc = { ...baseJob, description: 'Descricao detalhada do cargo' }

    render(<JobCard job={jobWithDesc} isApplied={false} onApply={vi.fn()} />)

    expect(screen.queryByText('Descricao detalhada do cargo')).not.toBeInTheDocument()

    await user.click(screen.getByText('Ver Detalhes'))

    expect(screen.getByText('Descricao detalhada do cargo')).toBeInTheDocument()
    expect(screen.getByText('Ver Menos')).toBeInTheDocument()
  })

  it('mostra rating da empresa quando disponivel', () => {
    render(<JobCard job={baseJob} isApplied={false} onApply={vi.fn()} />)

    expect(screen.getByText('4.5')).toBeInTheDocument()
  })

  it('mostra "Empresa Confidencial" quando empresa nao tem nome', () => {
    const jobNoCompany = { ...baseJob, company: undefined }
    render(<JobCard job={jobNoCompany} isApplied={false} onApply={vi.fn()} />)

    expect(screen.getByText('Empresa Confidencial')).toBeInTheDocument()
  })
})
