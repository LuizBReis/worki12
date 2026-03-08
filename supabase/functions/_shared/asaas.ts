const CORS_ORIGIN = Deno.env.get('CORS_ORIGIN');
const IS_PRODUCTION = Deno.env.get('ASAAS_ENVIRONMENT') === 'production';

// In production, CORS_ORIGIN must be set (e.g. https://worki.com.br)
// In sandbox/dev, allow all origins for testing
const ALLOWED_ORIGIN = CORS_ORIGIN || (IS_PRODUCTION ? '' : '*');

if (IS_PRODUCTION && !CORS_ORIGIN) {
    console.error('CRITICAL: CORS_ORIGIN must be set in production. All requests will be blocked.');
}

export const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const ASAAS_API_URL = Deno.env.get('ASAAS_ENVIRONMENT') === 'production'
    ? 'https://api.asaas.com/v3'
    : 'https://sandbox.asaas.com/api/v3';

export const getAsaasHeaders = (apiKey?: string) => {
    const token = apiKey || Deno.env.get('ASAAS_API_KEY');
    if (!token) {
        throw new Error('ASAAS_API_KEY is not configured');
    }
    return {
        'Content-Type': 'application/json',
        'access_token': token,
    };
};
