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

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('logError', () => {
  it('nao chama Sentry.captureException em ambiente de teste (PROD=false)', () => {
    const error = new Error('teste')
    logError(error, 'TestContext')

    expect(Sentry.captureException).not.toHaveBeenCalled()
  })

  it('chama Sentry.captureException quando PROD=true', () => {
    vi.stubEnv('PROD', true)

    const error = new Error('erro em producao')
    logError(error, 'ProdContext')

    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      extra: { context: 'ProdContext' },
    })
  })

  it('sempre chama console.error independente do ambiente', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('teste console')
    logError(error, 'TestContext')

    expect(consoleSpy).toHaveBeenCalledWith('[TestContext]', error)
    consoleSpy.mockRestore()
  })
})

describe('logWarn', () => {
  it('nao chama Sentry.captureMessage em ambiente de teste (PROD=false)', () => {
    logWarn('mensagem de aviso', 'TestContext')

    expect(Sentry.captureMessage).not.toHaveBeenCalled()
  })

  it('chama Sentry.captureMessage quando PROD=true', () => {
    vi.stubEnv('PROD', true)

    logWarn('aviso em producao', 'ProdContext')

    expect(Sentry.captureMessage).toHaveBeenCalledWith('aviso em producao', {
      level: 'warning',
      extra: { context: 'ProdContext' },
    })
  })

  it('sempre chama console.warn independente do ambiente', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logWarn('aviso', 'TestContext')

    expect(consoleSpy).toHaveBeenCalledWith('[TestContext]', 'aviso')
    consoleSpy.mockRestore()
  })
})
