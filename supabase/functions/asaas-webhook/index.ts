import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/asaas.ts';

// Production IPs - log only in sandbox, enforce in production
const ASAAS_IPS = [
    '52.67.12.206',
    '18.230.8.159',
    '54.94.136.112',
    '54.94.183.101'
];

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // --- 1. IP Check: log in sandbox, block in production ---
        const forwarded = req.headers.get('x-forwarded-for');
        const clientIp = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
        const isProduction = Deno.env.get('ASAAS_ENVIRONMENT') === 'production';

        if (!ASAAS_IPS.includes(clientIp)) {
            if (isProduction) {
                console.warn(`Blocked request from unauthorized IP: ${clientIp}`);
                return new Response('Unauthorized IP', { status: 403 });
            }
            console.log(`Sandbox: allowing request from IP ${clientIp}`);
        }

        // --- 2. Security Check: Auth Token ---
        const asaasToken = req.headers.get('asaas-access-token');
        const expectedToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN');

        if (!expectedToken) {
            console.error('ASAAS_WEBHOOK_TOKEN not configured');
            return new Response('Server misconfigured', { status: 500 });
        }

        if (asaasToken !== expectedToken) {
            console.warn('Blocked request: Invalid Webhook Token');
            return new Response('Unauthorized Token', { status: 401 });
        }

        const bodyText = await req.text();
        if (!bodyText) {
            return new Response('Empty body', { status: 400 });
        }

        let body;
        try {
            body = JSON.parse(bodyText);
        } catch (e) {
            return new Response('Invalid JSON', { status: 400 });
        }

        const eventTarget = body.event;

        // --- 3. Handle Transfer Events (withdrawal validation) ---
        if (eventTarget && eventTarget.startsWith('TRANSFER_')) {
            console.log('Received Transfer Webhook:', eventTarget, body.transfer?.id);
            return new Response(JSON.stringify({ status: "approved" }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!eventTarget && body.object === 'transfer') {
            console.log('Received Transfer Validation Payload:', body.id);
            return new Response(JSON.stringify({ status: "approved" }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // --- 4. Handle Payment Events (Deposits) - ATOMIC ---
        if (eventTarget === 'PAYMENT_RECEIVED' || eventTarget === 'PAYMENT_CONFIRMED') {
            const payment = body.payment;

            if (!payment.externalReference) {
                return new Response('Ignored - No externalReference', { status: 200 });
            }

            const userId = payment.externalReference;

            // Validate externalReference is a valid UUID before using as user_id
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(userId)) {
                console.warn('Invalid externalReference (not a UUID):', userId);
                return new Response('Ignored - Invalid externalReference format', { status: 200 });
            }
            const paymentId = payment.id;
            const amount = payment.value;

            // Use atomic RPC - handles dedup via unique constraint
            const { data: credited, error: rpcError } = await supabaseAdmin.rpc('credit_deposit', {
                p_user_id: userId,
                p_amount: amount,
                p_payment_id: paymentId,
                p_description: 'Deposito via Pix'
            });

            if (rpcError) {
                console.error('credit_deposit RPC error:', rpcError);
                // If it's a unique constraint violation, it means already processed
                if (rpcError.code === '23505') {
                    return new Response('Already processed', { status: 200 });
                }
                throw new Error(rpcError.message);
            }

            if (!credited) {
                return new Response('Already processed', { status: 200 });
            }

            return new Response('Processed successfully', { status: 200 });
        }

        return new Response('Event ignored', { status: 200 });
    } catch (error: any) {
        console.error('Webhook Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
