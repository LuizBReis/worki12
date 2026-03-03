import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, ASAAS_API_URL, getAsaasHeaders } from '../_shared/asaas.ts';

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
        if (!asaasApiKey) {
            throw new Error('A variável secreta ASAAS_API_KEY não está configurada.');
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
        if (userError || !user) throw new Error('Invalid Token');

        // Get user wallet
        const { data: wallet, error: walletError } = await supabaseAdmin
            .from('wallets')
            .select('id, balance, asaas_customer_id')
            .eq('user_id', user.id)
            .single();

        if (walletError || !wallet) {
            return new Response(JSON.stringify({
                success: true,
                hasUpdates: false,
                totalSynced: 0,
                message: 'Carteira não encontrada.'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            });
        }

        // Fetch received/confirmed payments for this user from Asaas
        // We use externalReference to filter only this user's payments
        let hasUpdates = false;
        let totalSynced = 0;

        // Fetching both RECEIVED and CONFIRMED
        const statuses = ['RECEIVED', 'CONFIRMED'];

        const splitFee = 5; // Platform fee deduction

        for (const status of statuses) {
            const asaasRes = await fetch(`${ASAAS_API_URL}/payments?externalReference=${user.id}&status=${status}&limit=100`, {
                headers: getAsaasHeaders() // Using the MASTER apiKey, since payments are created on the master with splits
            });

            if (!asaasRes.ok) {
                console.error('Error fetching Asaas payments:', await asaasRes.text());
                continue;
            }

            const asaasData = await asaasRes.json();
            const payments = asaasData.data || [];

            for (const payment of payments) {
                const paymentId = payment.id;
                const amount = payment.value;

                // Check if we already processed this payment
                const { data: existingTx } = await supabaseAdmin
                    .from('wallet_transactions')
                    .select('id')
                    .eq('reference_id', paymentId)
                    .single();

                if (!existingTx) {
                    // Not processed yet! Let's process it exactly like the webhook does.
                    const netCompanyValue = amount * ((100 - splitFee) / 100);

                    // Insert transaction log FIRST to catch UNIQUE constraint violations
                    // If two requests try to sync the same payment concurrently, the second insert will throw because of the UNIQUE constraint on reference_id
                    await supabaseAdmin
                        .from('wallet_transactions')
                        .insert({
                            wallet_id: wallet.id,
                            amount: netCompanyValue,
                            type: 'credit',
                            description: `Depósito sincronizado (Taxa deduzida)`,
                            reference_id: paymentId
                        })
                        .throwOnError();

                    // Re-fetch latest balance just before updating to avoid overwrites
                    const { data: currentWallet } = await supabaseAdmin
                        .from('wallets')
                        .select('balance')
                        .eq('id', wallet.id)
                        .single();

                    const newBalance = Number(currentWallet?.balance || 0) + netCompanyValue;

                    // Update wallet balance AFTER transaction successfully recorded
                    await supabaseAdmin
                        .from('wallets')
                        .update({ balance: newBalance })
                        .eq('id', wallet.id)
                        .throwOnError();

                    totalSynced += netCompanyValue;
                    hasUpdates = true;
                }
            }
        }

        return new Response(JSON.stringify({
            success: true,
            hasUpdates,
            totalSynced,
            message: hasUpdates ? `Sincronizados R$ ${totalSynced.toFixed(2)} de novos depósitos.` : 'Tudo já está atualizado.'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('Sync Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
