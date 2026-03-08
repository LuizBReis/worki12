import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { stripe, corsHeaders } from '../_shared/stripe.ts'

console.log('Stripe Payout Function Started')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) throw new Error('Unauthorized')

    const { amount } = await req.json()

    // 1. Get Worker Stripe Account
    const { data: worker } = await supabaseAdmin
      .from('workers')
      .select('stripe_account_id, id')
      .eq('id', user.id)
      .single()

    if (!worker || !worker.stripe_account_id) {
      throw new Error('Conta bancária não configurada')
    }

    // 2. Check Balance in Stripe Account
    const balance = await stripe.balance.retrieve({
        stripeAccount: worker.stripe_account_id
    })

    const available = balance.available.find(b => b.currency === 'brl')?.amount || 0
    const requestAmount = Math.round(amount * 100)

    if (available < requestAmount) {
        throw new Error(`Saldo insuficiente no Stripe. Disponível: R$ ${(available/100).toFixed(2)}`)
    }

    // 3. Create Payout
    const payout = await stripe.payouts.create({
      amount: requestAmount,
      currency: 'brl',
    }, {
      stripeAccount: worker.stripe_account_id,
    })

    // 4. Log Transaction (Debit)
    const workerWalletId = (await supabaseAdmin.from('wallets').select('id').eq('user_id', user.id).single()).data?.id

    if (workerWalletId) {
        await supabaseAdmin.from('wallet_transactions').insert({
            wallet_id: workerWalletId,
            amount: -amount,
            type: 'debit',
            description: 'Saque para conta bancária',
            reference_id: payout.id
        })
        
        // Atomically deduct from local wallet balance
        await supabaseAdmin.rpc('update_wallet_balance', {
            p_wallet_id: workerWalletId,
            p_amount: -amount
        })
    }

    return new Response(
      JSON.stringify({ success: true, payoutId: payout.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
