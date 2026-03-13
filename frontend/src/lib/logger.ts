import * as Sentry from '@sentry/react'

export function logError(error: unknown, context?: string) {
  console.error(`[${context ?? 'App'}]`, error)
  if (import.meta.env.PROD) {
    Sentry.captureException(error, { extra: { context } })
  }
}

export function logWarn(message: string, context?: string) {
  console.warn(`[${context ?? 'App'}]`, message)
  if (import.meta.env.PROD) {
    Sentry.captureMessage(message, { level: 'warning', extra: { context } })
  }
}
