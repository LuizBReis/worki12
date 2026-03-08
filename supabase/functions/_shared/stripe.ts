import Stripe from 'https://esm.sh/stripe@14.14.0';

export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const ALLOWED_ORIGIN = Deno.env.get('CORS_ORIGIN') || (Deno.env.get('ENVIRONMENT') === 'production' ? '' : '*');

export const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
