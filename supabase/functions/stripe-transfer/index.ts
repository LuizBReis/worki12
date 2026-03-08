import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { stripe, corsHeaders } from '../_shared/stripe.ts'

console.log('Stripe Transfer Function Started')

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

    const { jobId, applicationId, workerId } = await req.json()

    if (!jobId || !workerId) throw new Error('jobId and workerId are required')

    // 0. Verify caller is the job owner (authorization check)
    const { data: job } = await supabaseAdmin
      .from('jobs')
      .select('company_id')
      .eq('id', jobId)
      .single()

    if (!job) throw new Error('Job not found')
    if (job.company_id !== user.id) throw new Error('Not authorized to release payment for this job')

    // 1. Validate Escrow
    const { data: escrow } = await supabaseAdmin
      .from('escrow_transactions')
      .select('*')
      .eq('job_id', jobId)
      .eq('status', 'reserved')
      .single()

    if (!escrow) {
      throw new Error('Escrow not found or already released')
    }

    // 2. Get Worker Stripe Account
    const { data: worker } = await supabaseAdmin
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
    const workerWalletId = (await supabaseAdmin.from('wallets').select('id').eq('user_id', workerId).single()).data?.id

    await supabaseAdmin
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
        await supabaseAdmin.from('wallet_transactions').insert({
            wallet_id: workerWalletId,
            amount: amount - fee, // Record net amount
            type: 'escrow_release',
            description: `Pagamento recebido (Transferido para Stripe)`,
            reference_id: transfer.id
        })
        
        // Atomically increment earnings_total using RPC to avoid race conditions
        await supabaseAdmin.rpc('increment_earnings', {
            p_worker_id: workerId,
            p_amount: amount - fee
        }).then(({ error }) => {
            // Fallback to direct update if RPC not available
            if (error) {
                return supabaseAdmin
                    .from('workers')
                    .update({ earnings_total: amount - fee })
                    .eq('id', workerId)
            }
        })
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
