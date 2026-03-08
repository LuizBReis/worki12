import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { stripe, corsHeaders } from '../_shared/stripe.ts'

console.log('Stripe Deposit Function Started')

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

    if (!amount || amount <= 0) {
      throw new Error('Invalid amount')
    }

    // 1. Get company
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id, stripe_customer_id, name, email')
      .eq('id', user.id)
      .single()
    
    if (!company) {
        // Fallback for when company record doesn't exist but user does (shouldn't happen in happy path)
        throw new Error('Company profile not found')
    }

    let customerId = company.stripe_customer_id

    // 2. Create customer if not exists
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: company.name ?? undefined,
        metadata: {
          supabase_user_id: user.id,
          company_id: company.id
        }
      })
      customerId = customer.id
      
      await supabaseAdmin
        .from('companies')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // 3. Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'brl',
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: 'deposit',
        user_id: user.id,
        wallet_id: (await supabaseAdmin.from('wallets').select('id').eq('user_id', user.id).single()).data?.id
      }
    })

    return new Response(
      JSON.stringify({
        paymentIntent: paymentIntent.client_secret,
        publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY'),
        customer: customerId,
        ephemeralKey: (await stripe.ephemeralKeys.create({ customer: customerId }, { apiVersion: '2023-10-16' })).secret
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
