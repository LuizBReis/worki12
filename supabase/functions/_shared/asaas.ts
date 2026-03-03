export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const ASAAS_API_URL = Deno.env.get('ASAAS_ENVIRONMENT') === 'production'
    ? 'https://api.asaas.com/v3'
    : 'https://sandbox.asaas.com/api/v3';

export const getAsaasHeaders = (apiKey?: string) => ({
    'Content-Type': 'application/json',
    'access_token': apiKey || Deno.env.get('ASAAS_API_KEY') || '',
});
