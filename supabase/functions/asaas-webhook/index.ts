import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/asaas.ts';

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

        // --- 1. Security Check: IP Whitelist ---
        let clientIp = req.headers.get('x-forwarded-for') || '';
        clientIp = clientIp.split(',')[0].trim();

        if (clientIp && !ASAAS_IPS.includes(clientIp)) {
            console.warn(`Blocked request from unauthorized IP: ${clientIp}`);
            return new Response('Unauthorized IP', { status: 403 });
        }

        // --- 2. Security Check: Auth Token ---
        const asaasToken = req.headers.get('asaas-access-token');
        const expectedToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN') || 'workiasaas';

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

        // --- 3. Handle Transfer Events (Validação de Saque) ---
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

        // --- 4. Handle ACCOUNT_STATUS Events (Asaas Approval) ---
        if (eventTarget && eventTarget.startsWith('ACCOUNT_STATUS_')) {
            console.log('Received Account Status Webhook:', eventTarget);

            // Parse the event to determine which status field changed
            // Format: ACCOUNT_STATUS_{CATEGORY}_{STATUS}
            // e.g., ACCOUNT_STATUS_GENERAL_APPROVAL_APPROVED
            //        ACCOUNT_STATUS_COMMERCIAL_INFO_APPROVED
            //        ACCOUNT_STATUS_DOCUMENT_PENDING
            //        ACCOUNT_STATUS_BANK_ACCOUNT_INFO_REJECTED

            const accountId = body.account?.id || body.id;
            if (!accountId) {
                console.warn('Account status event without account ID');
                return new Response('No account ID', { status: 200 });
            }

            // Find wallet by asaas_wallet_id
            const { data: wallet } = await supabaseAdmin
                .from('wallets')
                .select('id, asaas_account_status')
                .eq('asaas_wallet_id', accountId)
                .single();

            if (wallet) {
                // Determine which field to update based on event name
                const currentStatus = wallet.asaas_account_status || {};
                let field = '';
                let status = '';

                if (eventTarget.includes('GENERAL_APPROVAL')) {
                    field = 'general';
                } else if (eventTarget.includes('COMMERCIAL_INFO')) {
                    field = 'commercialInfo';
                } else if (eventTarget.includes('BANK_ACCOUNT_INFO')) {
                    field = 'bankAccountInfo';
                } else if (eventTarget.includes('DOCUMENT')) {
                    field = 'documentation';
                }

                if (eventTarget.endsWith('APPROVED')) {
                    status = 'APPROVED';
                } else if (eventTarget.endsWith('REJECTED')) {
                    status = 'REJECTED';
                } else if (eventTarget.endsWith('PENDING')) {
                    status = 'PENDING';
                } else if (eventTarget.endsWith('AWAITING_APPROVAL')) {
                    status = 'AWAITING_APPROVAL';
                }

                if (field && status) {
                    currentStatus[field] = status;
                    await supabaseAdmin
                        .from('wallets')
                        .update({ asaas_account_status: currentStatus })
                        .eq('id', wallet.id);

                    console.log(`Updated wallet ${wallet.id}: ${field} = ${status}`);
                }
            } else {
                console.warn(`No wallet found for Asaas account: ${accountId}`);
            }

            return new Response('Account status processed', { status: 200 });
        }

        // --- 5. Handle Payment Events (Depósitos) ---
        if (eventTarget === 'PAYMENT_RECEIVED' || eventTarget === 'PAYMENT_CONFIRMED') {
            const payment = body.payment;

            if (!payment.externalReference) {
                return new Response('Ignored - No externalReference', { status: 200 });
            }

            const userId = payment.externalReference;
            const paymentId = payment.id;
            const amount = payment.value;

            const splitFee = 5;
            const netCompanyValue = amount * ((100 - splitFee) / 100);

            const { data: existingTx } = await supabaseAdmin
                .from('wallet_transactions')
                .select('id')
                .eq('reference_id', paymentId)
                .single();

            if (existingTx) {
                return new Response('Already processed', { status: 200 });
            }

            const { data: wallet } = await supabaseAdmin
                .from('wallets')
                .select('id, balance')
                .eq('user_id', userId)
                .single();

            if (!wallet) {
                console.error(`Wallet not found for user ${userId}`);
                return new Response('Wallet not found', { status: 404 });
            }

            const newBalance = Number(wallet.balance) + netCompanyValue;

            await supabaseAdmin
                .from('wallets')
                .update({ balance: newBalance })
                .eq('id', wallet.id);

            await supabaseAdmin
                .from('wallet_transactions')
                .insert({
                    wallet_id: wallet.id,
                    amount: netCompanyValue,
                    type: 'credit',
                    description: `Depósito via Pix (Taxa da plataforma já deduzida)`,
                    reference_id: paymentId
                });

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
