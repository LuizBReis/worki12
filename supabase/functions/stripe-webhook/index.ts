import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { stripe } from '../_shared/stripe.ts'

console.log('Stripe Webhook Function Started')

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('Error: missing stripe-signature header', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        const { user_id, wallet_id, type } = paymentIntent.metadata

        if (type === 'deposit' && wallet_id) {
          const amount = paymentIntent.amount / 100 // Convert back to currency unit

          // 1. Get current balance
          const { data: wallet } = await supabase
            .from('wallets')
            .select('balance')
            .eq('id', wallet_id)
            .single()

          if (wallet) {
            // 2. Update balance
            await supabase
              .from('wallets')
              .update({ balance: wallet.balance + amount })
              .eq('id', wallet_id)

            // 3. Log transaction
            await supabase.from('wallet_transactions').insert({
              wallet_id: wallet_id,
              amount: amount,
              type: 'credit',
              description: 'Depósito via Stripe',
              reference_id: paymentIntent.id
            })
          }
        }
        break
      }
      
      case 'account.updated': {
        const account = event.data.object
        if (account.details_submitted) {
          // Find worker with this stripe_account_id
          await supabase
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
