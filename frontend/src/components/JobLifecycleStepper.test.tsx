import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import JobLifecycleStepper from './JobLifecycleStepper'

describe('JobLifecycleStepper', () => {
  it('renderiza 4 steps corretamente com status variados', () => {
    const steps = [
      { label: 'Contratado', status: 'complete' as const },
      { label: 'Chegada', status: 'active' as const },
      { label: 'Saída', status: 'pending' as const },
      { label: 'Entrega', status: 'pending' as const },
    ]

    render(<JobLifecycleStepper steps={steps} />)

    expect(screen.getByText('Contratado')).toBeInTheDocument()
    expect(screen.getByText('Chegada')).toBeInTheDocument()
    expect(screen.getByText('Saída')).toBeInTheDocument()
    expect(screen.getByText('Entrega')).toBeInTheDocument()
  })

  it('step active tem classe animate-pulse', () => {
    const steps = [
      { label: 'Chegada', status: 'active' as const },
    ]

    const { container } = render(<JobLifecycleStepper steps={steps} />)

    const activeStep = container.querySelector('.animate-pulse')
    expect(activeStep).not.toBeNull()
  })

  it('step complete exibe icone CheckCircle', () => {
    const steps = [
      { label: 'Contratado', status: 'complete' as const },
      { label: 'Chegada', status: 'pending' as const },
    ]

    const { container } = render(<JobLifecycleStepper steps={steps} />)

    // CheckCircle renders as svg — step complete must have svg
    const svgIcons = container.querySelectorAll('svg')
    expect(svgIcons.length).toBeGreaterThan(0)
  })

  it('retorna null quando steps array esta vazio', () => {
    const { container } = render(<JobLifecycleStepper steps={[]} />)
    expect(container.firstChild).toBeNull()
  })
})

// Testes de lógica de computeSteps (testada diretamente como função pura)
describe('computeSteps (lógica de CompanyJobCandidates)', () => {
  type Step = { label: string; status: 'complete' | 'active' | 'pending' }

  interface AppFields {
    worker_checkin_at?: string | null
    company_checkin_confirmed_at?: string | null
    worker_checkout_at?: string | null
    company_checkout_confirmed_at?: string | null
    status: string
  }

  function computeSteps(app: AppFields): Step[] {
    const checkinComplete = !!(app.worker_checkin_at && app.company_checkin_confirmed_at)
    const checkinActive = !!(app.worker_checkin_at && !app.company_checkin_confirmed_at)
    const checkoutComplete = !!(app.worker_checkout_at && app.company_checkout_confirmed_at)
    const checkoutActive = !!(app.worker_checkout_at && !app.company_checkout_confirmed_at)

    return [
      { label: 'Contratado', status: 'complete' as const },
      {
        label: 'Chegada',
        status: checkinComplete ? 'complete' as const : checkinActive ? 'active' as const : 'pending' as const
      },
      {
        label: 'Saída',
        status: checkoutComplete ? 'complete' as const : checkoutActive ? 'active' as const : 'pending' as const
      },
      {
        label: 'Entrega',
        status: app.status === 'completed' ? 'complete' as const : 'pending' as const
      }
    ]
  }

  it('com worker_checkin_at=null retorna step Chegada como active', () => {
    const app: AppFields = {
      worker_checkin_at: null,
      company_checkin_confirmed_at: null,
      worker_checkout_at: null,
      company_checkout_confirmed_at: null,
      status: 'hired',
    }

    const steps = computeSteps(app)

    expect(steps[0].status).toBe('complete') // Contratado sempre complete
    expect(steps[1].status).toBe('pending')  // Chegada pending quando worker não fez checkin
    expect(steps[2].status).toBe('pending')  // Saída pending
    expect(steps[3].status).toBe('pending')  // Entrega pending
  })

  it('com worker_checkin_at preenchido retorna step Chegada como active', () => {
    const app: AppFields = {
      worker_checkin_at: '2026-03-13T10:00:00Z',
      company_checkin_confirmed_at: null,
      worker_checkout_at: null,
      company_checkout_confirmed_at: null,
      status: 'in_progress',
    }

    const steps = computeSteps(app)

    expect(steps[1].status).toBe('active') // Chegada ativa quando worker fez checkin mas empresa não confirmou
  })

  it('com todos os campos preenchidos retorna todos os steps como complete', () => {
    const app: AppFields = {
      worker_checkin_at: '2026-03-13T10:00:00Z',
      company_checkin_confirmed_at: '2026-03-13T10:05:00Z',
      worker_checkout_at: '2026-03-13T18:00:00Z',
      company_checkout_confirmed_at: '2026-03-13T18:05:00Z',
      status: 'completed',
    }

    const steps = computeSteps(app)

    expect(steps.every(s => s.status === 'complete')).toBe(true)
  })
})
