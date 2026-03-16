import * as Sentry from '@sentry/react';

export function logError(message: string, error?: unknown) {
  if (import.meta.env.DEV) {
    console.error(message, error);
  }
  if (import.meta.env.PROD) {
    if (error instanceof Error) {
      Sentry.captureException(error, { extra: { message } });
    } else if (error) {
      Sentry.captureMessage(`${message}: ${String(error)}`, 'error');
    } else {
      Sentry.captureMessage(message, 'error');
    }
  }
}

export function logWarn(message: string, detail?: unknown) {
  if (import.meta.env.DEV) {
    console.warn(message, detail);
  }
  if (import.meta.env.PROD) {
    Sentry.captureMessage(`${message}: ${String(detail || '')}`, 'warning');
  }
}
