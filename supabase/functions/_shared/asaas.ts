const ALLOWED_ORIGIN = Deno.env.get('CORS_ORIGIN') || (Deno.env.get('ENVIRONMENT') === 'production' ? '' : '*');

if (!ALLOWED_ORIGIN) {
    console.warn('WARNING: CORS_ORIGIN env var is not set. Requests will be rejected in production.');
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
