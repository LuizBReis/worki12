import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { stripe, corsHeaders } from '../_shared/stripe.ts'

console.log('Stripe Transfer Function Started')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { jobId, applicationId, workerId } = await req.json()

    // 1. Validate Escrow
    const { data: escrow } = await supabase
      .from('escrow_transactions')
      .select('*')
      .eq('job_id', jobId)
      .eq('status', 'reserved')
      .single()

    if (!escrow) {
      throw new Error('Escrow not found or already released')
    }

    // 2. Get Worker Stripe Account
    const { data: worker } = await supabase
      .from('workers')
      .select('stripe_account_id, id')
      .eq('id', workerId)
      .single()

    if (!worker || !worker.stripe_account_id) {
      throw new Error('Worker has not connected Stripe account')
    }

    // 3. Calculate Transfer Amount (deduct 10% fee)
    const amount = escrow.amount
    const fee = amount * 0.10
    const transferAmount = Math.floor((amount - fee) * 100) // Cents

    // 4. Create Transfer
    const transfer = await stripe.transfers.create({
      amount: transferAmount,
      currency: 'brl',
      destination: worker.stripe_account_id,
      description: `Pagamento pelo Job: ${jobId}`,
      metadata: {
        job_id: jobId,
        application_id: applicationId
      }
    })

    // 5. Update Database
    // 5.1. Update Escrow
    const workerWalletId = (await supabase.from('wallets').select('id').eq('user_id', workerId).single()).data?.id

    await supabase
      .from('escrow_transactions')
      .update({
        status: 'released',
        application_id: applicationId,
        worker_wallet_id: workerWalletId,
        released_at: new Date().toISOString()
      })
      .eq('id', escrow.id)

    // 5.2. Log Transaction for Worker (Virtual Record)
    if (workerWalletId) {
        await supabase.from('wallet_transactions').insert({
            wallet_id: workerWalletId,
            amount: amount - fee, // Record net amount
            type: 'escrow_release',
            description: `Pagamento recebido (Transferido para Stripe)`,
            reference_id: transfer.id
        })
        
        // Optionally update balance if you want to show "Lifetime Earnings" or similar
        // But since money is in Stripe, maybe just tracking earnings_total in 'workers' table is enough
        const { data: currentWorker } = await supabase
            .from('workers')
            .select('earnings_total')
            .eq('id', workerId)
            .single()

        await supabase
            .from('workers')
            .update({
                earnings_total: (currentWorker?.earnings_total || 0) + (amount - fee)
            })
            .eq('id', workerId)
    }

    return new Response(
      JSON.stringify({ success: true, transferId: transfer.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
