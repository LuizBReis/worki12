import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { stripe } from '../_shared/stripe.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

console.log('Stripe Webhook Function Started')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('Error: missing stripe-signature header', { status: 400 })
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured')
    return new Response('Server misconfigured', { status: 500 })
  }

  try {
    const body = await req.text()
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    )

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        const { user_id, wallet_id, type } = paymentIntent.metadata

        if (type === 'deposit' && wallet_id && user_id) {
          const amount = paymentIntent.amount / 100

          // Use atomic RPC - handles dedup via unique constraint on reference_id
          const { data: credited, error: rpcError } = await supabaseAdmin.rpc('credit_deposit', {
            p_user_id: user_id,
            p_amount: amount,
            p_payment_id: paymentIntent.id,
            p_description: 'Deposito via Stripe'
          })

          if (rpcError && rpcError.code !== '23505') {
            console.error('credit_deposit RPC error:', rpcError)
          }
        }
        break
      }

      case 'account.updated': {
        const account = event.data.object
        if (account.details_submitted) {
          await supabaseAdmin
            .from('workers')
            .update({ stripe_onboarding_completed: true })
            .eq('stripe_account_id', account.id)
        }
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error(`Webhook Error: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})
