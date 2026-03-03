import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, ASAAS_API_URL, getAsaasHeaders } from '../_shared/asaas.ts';

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
        if (userError || !user) throw new Error('Invalid Token');

        const { jobId, workerId } = await req.json();

        if (!jobId || !workerId) {
            throw new Error('jobId and workerId are required');
        }

        // 1. Get escrow transaction
        const { data: escrow } = await supabaseAdmin
            .from('escrow_transactions')
            .select('*')
            .eq('job_id', jobId)
            .eq('status', 'reserved')
            .single();

        if (!escrow) throw new Error('No reserved escrow found for this job');

        const amount = Number(escrow.amount);
        const companyWalletId = escrow.company_wallet_id;

        // 2. Get the actual wallets: Company to get API key, Worker to get wallet_id
        const { data: companyWallet } = await supabaseAdmin
            .from('wallets')
            .select('asaas_api_key')
            .eq('id', companyWalletId)
            .single();

        const { data: workerWallet } = await supabaseAdmin
            .from('wallets')
            .select('id, asaas_wallet_id, balance')
            .eq('user_id', workerId)
            .single();

        if (!companyWallet?.asaas_api_key) throw new Error('Company wallet has no Asaas API key');
        if (!workerWallet?.asaas_wallet_id) throw new Error('Worker wallet has no Asaas wallet ID');

        // 3. Initiate Transfer in Asaas from Company -> Worker
        const transferPayload = {
            value: amount,
            walletId: workerWallet.asaas_wallet_id,
            description: `Pagamento pela Vaga ${jobId}`
        };

        const asaasRes = await fetch(`${ASAAS_API_URL}/transfers`, {
            method: 'POST',
            headers: getAsaasHeaders(companyWallet.asaas_api_key),
            body: JSON.stringify(transferPayload)
        });

        const asaasData = await asaasRes.json();
        if (!asaasRes.ok) {
            console.error('Transfer Error:', asaasData);
            throw new Error(asaasData.errors?.[0]?.description || 'Failed to transfer funds in Asaas');
        }

        // 4. Update Database
        // Release escrow
        await supabaseAdmin
            .from('escrow_transactions')
            .update({
                status: 'released',
                released_at: new Date().toISOString(),
                worker_wallet_id: workerWallet.id
            })
            .eq('id', escrow.id);

        // Credit Worker Wallet
        const newBalance = Number(workerWallet.balance) + amount;
        await supabaseAdmin
            .from('wallets')
            .update({ balance: newBalance })
            .eq('id', workerWallet.id);

        // Log Wallet Transaction
        await supabaseAdmin
            .from('wallet_transactions')
            .insert({
                wallet_id: workerWallet.id,
                amount: amount,
                type: 'escrow_release',
                description: `Pagamento recebido pela vaga`,
                reference_id: jobId
            });

        return new Response(JSON.stringify({ success: true, transferId: asaasData.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('Checkout Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
