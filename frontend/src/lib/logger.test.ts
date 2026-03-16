import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

import * as Sentry from '@sentry/react'
import { logError, logWarn } from './logger'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('logError - em ambiente DEV (PROD=false)', () => {
  it('NAO chama Sentry.captureException quando import.meta.env.PROD e false', () => {
    const error = new Error('erro dev')
    logError('Contexto dev', error)

    expect(Sentry.captureException).not.toHaveBeenCalled()
    expect(Sentry.captureMessage).not.toHaveBeenCalled()
  })

  it('chama console.error em modo DEV', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('teste console')
    logError('Contexto', error)

    expect(consoleSpy).toHaveBeenCalledWith('Contexto', error)
    consoleSpy.mockRestore()
  })
})

describe('logError - em ambiente PROD (PROD=true)', () => {
  beforeEach(() => {
    vi.stubEnv('PROD', true)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('chama Sentry.captureException quando error e instancia de Error', () => {
    const error = new Error('erro de teste')
    logError('Contexto do erro', error)

    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      extra: { message: 'Contexto do erro' },
    })
  })

  it('chama Sentry.captureMessage quando error nao e instancia de Error', () => {
    logError('Contexto do erro', 'string de erro')

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Contexto do erro: string de erro',
      'error'
    )
  })

  it('chama Sentry.captureMessage com apenas message quando error e undefined', () => {
    logError('Apenas mensagem')

    expect(Sentry.captureMessage).toHaveBeenCalledWith('Apenas mensagem', 'error')
  })
})

describe('logWarn - em ambiente DEV (PROD=false)', () => {
  it('NAO chama Sentry.captureMessage quando import.meta.env.PROD e false', () => {
    logWarn('Aviso dev', 'detalhe')

    expect(Sentry.captureMessage).not.toHaveBeenCalled()
  })

  it('chama console.warn em modo DEV', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logWarn('Aviso', 'detalhe')

    expect(consoleSpy).toHaveBeenCalledWith('Aviso', 'detalhe')
    consoleSpy.mockRestore()
  })
})

describe('logWarn - em ambiente PROD (PROD=true)', () => {
  beforeEach(() => {
    vi.stubEnv('PROD', true)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('chama Sentry.captureMessage com nivel warning', () => {
    logWarn('Aviso de teste', 'detalhe')

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Aviso de teste: detalhe',
      'warning'
    )
  })

  it('chama Sentry.captureMessage com string vazia quando detail e undefined', () => {
    logWarn('Aviso sem detalhe')

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Aviso sem detalhe: ',
      'warning'
    )
  })
})
