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
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) throw new Error('Invalid Token');

        const { amount, pixKey, pixKeyType } = await req.json();

        if (!amount || typeof amount !== 'number' || amount < 5) throw new Error('Minimum withdrawal amount is R$ 5.00');
        if (amount > 50000) throw new Error('Maximum withdrawal amount is R$ 50,000.00');
        if (!pixKey) throw new Error('Pix Key is required');

        // 1. Get user wallet (virtual balance)
        const { data: userWallet } = await supabaseAdmin
            .from('wallets')
            .select('id, balance')
            .eq('user_id', user.id)
            .single();

        if (!userWallet) throw new Error('Wallet not found');
        if (userWallet.balance < amount) throw new Error('Insufficient balance');

        // Calculate Platform Fee
        const WITHDRAW_FEE_PERCENTAGE = 5;
        const feeAmount = parseFloat(((amount * WITHDRAW_FEE_PERCENTAGE) / 100).toFixed(2));
        const netAmount = parseFloat((amount - feeAmount).toFixed(2));

        // 2. Atomically deduct balance FIRST (will fail if insufficient due to CHECK constraint)
        const { error: balanceError } = await supabaseAdmin.rpc('update_wallet_balance', {
            p_wallet_id: userWallet.id,
            p_amount: -amount
        });

        if (balanceError) {
            // CHECK constraint violation means insufficient balance
            if (balanceError.code === '23514') {
                throw new Error('Insufficient balance');
            }
            throw new Error(balanceError.message);
        }

        // 3. Transfer from MASTER account to user's external PIX key
        const withdrawPayload = {
            value: netAmount,
            pixAddressKeyType: pixKeyType || 'CPF',
            pixAddressKey: pixKey,
            description: `Saque Worki - ${user.id.substring(0, 8)}`
        };

        const withdrawRes = await fetch(`${ASAAS_API_URL}/transfers`, {
            method: 'POST',
            headers: getAsaasHeaders(),
            body: JSON.stringify(withdrawPayload)
        });

        const withdrawData = await withdrawRes.json();
        if (!withdrawRes.ok) {
            // Rollback: re-credit the balance since transfer failed
            const { error: rollbackError } = await supabaseAdmin.rpc('update_wallet_balance', {
                p_wallet_id: userWallet.id,
                p_amount: amount
            });

            if (rollbackError) {
                console.error('CRITICAL: Rollback failed! User wallet deducted but transfer failed. Manual intervention needed.', {
                    userId: user.id,
                    walletId: userWallet.id,
                    amount,
                    rollbackError
                });
            }

            console.error('Withdraw Transfer Error:', withdrawData);
            throw new Error(withdrawData.errors?.[0]?.description || 'Failed to transfer funds to external Pix');
        }

        // 4. Log transaction (balance already deducted)
        await supabaseAdmin
            .from('wallet_transactions')
            .insert({
                wallet_id: userWallet.id,
                amount: -amount,
                type: 'debit',
                description: `Saque via Pix (R$ ${feeAmount.toFixed(2)} de taxa, R$ ${netAmount.toFixed(2)} enviado)`,
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
