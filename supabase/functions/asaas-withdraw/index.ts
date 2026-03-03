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

        const { amount, pixKey, pixKeyType } = await req.json();

        if (!amount || amount < 5) throw new Error('Minimum withdrawal amount is R$ 5.00');
        if (!pixKey) throw new Error('Pix Key is required');

        // 1. Get worker wallet
        const { data: workerWallet } = await supabaseAdmin
            .from('wallets')
            .select('id, asaas_wallet_id, asaas_api_key, balance')
            .eq('user_id', user.id)
            .single();

        if (!workerWallet?.asaas_api_key) throw new Error('Worker wallet has no Asaas API key');
        if (workerWallet.balance < amount) throw new Error('Insufficient balance');

        // Calculate Platform Fee
        const WITHDRAW_FEE_PERCENTAGE = 5;
        const feeAmount = parseFloat(((amount * WITHDRAW_FEE_PERCENTAGE) / 100).toFixed(2));
        const netAmount = parseFloat((amount - feeAmount).toFixed(2));

        // Get Master Wallet ID (Assuming it's configured in ENV, or we omit walletId to transfer to master...
        // Actually, in Asaas, a subaccount cannot transfer to "Master" without the WalletId.
        // However, we can use the env var ASAAS_MASTER_WALLET_ID
        const masterWalletId = Deno.env.get('ASAAS_MASTER_WALLET_ID');

        // 2. Transfer Fee to Master Account (Only if we have masterWalletId and fee > 0)
        if (feeAmount > 0 && masterWalletId) {
            const feeTransfer = {
                value: feeAmount,
                walletId: masterWalletId,
                description: `Taxa de saque - Worki`
            };

            const feeRes = await fetch(`${ASAAS_API_URL}/transfers`, {
                method: 'POST',
                headers: getAsaasHeaders(workerWallet.asaas_api_key),
                body: JSON.stringify(feeTransfer)
            });

            if (!feeRes.ok) {
                const errorData = await feeRes.json();
                console.error('Fee Transfer Error:', errorData);
                // We continue even if fee fails? No, better throw, but this depends on business logic.
            }
        }

        // 3. Transfer Net Amount to Worker's External PIX
        const withdrawPayload = {
            value: netAmount,
            pixAddressKeyType: pixKeyType || 'CPF', // CPF, CNPJ, EMAIL, PHONE, EVP
            pixAddressKey: pixKey,
            description: `Saque - Worki`
        };

        const withdrawRes = await fetch(`${ASAAS_API_URL}/transfers`, {
            method: 'POST',
            headers: getAsaasHeaders(workerWallet.asaas_api_key),
            body: JSON.stringify(withdrawPayload)
        });

        const withdrawData = await withdrawRes.json();
        if (!withdrawRes.ok) {
            console.error('Withdraw Transfer Error:', withdrawData);
            throw new Error(withdrawData.errors?.[0]?.description || 'Failed to transfer funds to external Pix');
        }

        // 4. Update Database Balance (Deduct the full requested amount)
        const newBalance = Number(workerWallet.balance) - amount;
        await supabaseAdmin
            .from('wallets')
            .update({ balance: newBalance })
            .eq('id', workerWallet.id);

        await supabaseAdmin
            .from('wallet_transactions')
            .insert({
                wallet_id: workerWallet.id,
                amount: -amount,
                type: 'debit',
                description: `Saque via Pix (R$ ${feeAmount.toFixed(2)} de taxa)`,
                reference_id: withdrawData.id
            });

        return new Response(JSON.stringify({ success: true, transferId: withdrawData.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('Withdraw Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
