import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}))

import * as Sentry from '@sentry/react'
import { logError, logWarn } from './logger'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('logError', () => {
  it('não chama Sentry.captureException em ambiente de teste (PROD=false)', () => {
    // In test environment, import.meta.env.PROD is false by default
    const error = new Error('teste')
    logError(error, 'TestContext')

    // Sentry should NOT be called since we're in test/dev environment
    expect(Sentry.captureException).not.toHaveBeenCalled()
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
  it('não chama Sentry.captureMessage em ambiente de teste (PROD=false)', () => {
    logWarn('mensagem de aviso', 'TestContext')

    expect(Sentry.captureMessage).not.toHaveBeenCalled()
  })

  it('sempre chama console.warn independente do ambiente', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logWarn('aviso', 'TestContext')

    expect(consoleSpy).toHaveBeenCalledWith('[TestContext]', 'aviso')
    consoleSpy.mockRestore()
  })
})
