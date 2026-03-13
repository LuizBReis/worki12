/**
 * Logger centralizado do projeto Worki.
 * Substitui console.error em toda a aplicação para permitir
 * integração futura com serviços de monitoramento (ex: Sentry).
 */

export function logError(error: unknown, context: string): void {
    // Em produção, aqui seria integrado Sentry ou similar
    // Por ora, mantém o log no console para debug
    console.error(`[${context}]`, error);
}
