import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/asaas.ts';
import { sendEmail, hiredEmail, paymentReceivedEmail, depositConfirmedEmail, newApplicationEmail } from '../_shared/email.ts';

// This function is called internally (from other edge functions or DB triggers)
// to send email notifications for key events.

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // Auth validation: only service_role can call this function
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return new Response(
            JSON.stringify({ error: 'Authorization header required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const token = authHeader.replace('Bearer ', '');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (token !== serviceRoleKey) {
        return new Response(
            JSON.stringify({ error: 'Service role required' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { type, userId, data } = await req.json();

        if (!type || !userId) {
            return new Response(JSON.stringify({ error: 'type and userId required' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
            });
        }

        // Get user email
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (userError || !user?.email) {
            console.error('User not found for notification:', userId);
            return new Response(JSON.stringify({ success: false, reason: 'user_not_found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
            });
        }

        let emailPayload;

        switch (type) {
            case 'hired': {
                const template = hiredEmail(data.workerName, data.jobTitle, data.companyName);
                template.to = user.email;
                emailPayload = template;
                break;
            }
            case 'payment_received': {
                const template = paymentReceivedEmail(data.workerName, data.amount, data.jobTitle);
                template.to = user.email;
                emailPayload = template;
                break;
            }
            case 'deposit_confirmed': {
                const template = depositConfirmedEmail(data.companyName, data.amount);
                template.to = user.email;
                emailPayload = template;
                break;
            }
            case 'new_application': {
                const template = newApplicationEmail(data.companyName, data.workerName, data.jobTitle);
                template.to = user.email;
                emailPayload = template;
                break;
            }
            default:
                return new Response(JSON.stringify({ success: false, reason: 'unknown_type' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
                });
        }

        // Also insert in-app notification
        await supabaseAdmin.from('notifications').insert({
            user_id: userId,
            type: type === 'hired' || type === 'new_application' ? 'status_change' : 'payment',
            title: emailPayload.subject,
            message: emailPayload.subject,
        });

        const sent = await sendEmail(emailPayload);

        return new Response(JSON.stringify({ success: true, emailSent: sent }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200
        });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('Notification Error:', msg);
        return new Response(JSON.stringify({ error: msg }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
        });
    }
});
