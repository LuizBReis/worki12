import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/asaas.ts';

const ADMIN_EMAILS = ['luizguilhermebarretodosreis@yahoo.com.br', 'oliveira9138@gmail.com'];

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Verify the caller is authenticated
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401
            });
        }

        // Create anon client to verify the user's JWT
        const supabaseAnon = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
        if (authError || !user || !ADMIN_EMAILS.includes(user.email || '')) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403
            });
        }

        // Admin client with service_role to bypass RLS
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { action } = await req.json();

        if (action === 'users') {
            // List auth users
            const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 100 });
            if (error) throw error;

            // Get worker/company profiles for enrichment
            const [workersRes, companiesRes] = await Promise.all([
                supabaseAdmin.from('workers').select('user_id, full_name, skills, city, state'),
                supabaseAdmin.from('companies').select('user_id, company_name, contact_name, sector'),
            ]);

            const workersMap = new Map((workersRes.data || []).map(w => [w.user_id, w]));
            const companiesMap = new Map((companiesRes.data || []).map(c => [c.user_id, c]));

            const enrichedUsers = users.map(u => ({
                id: u.id,
                email: u.email,
                user_type: u.user_metadata?.user_type || 'unknown',
                full_name: u.user_metadata?.full_name || '',
                created_at: u.created_at,
                email_confirmed_at: u.email_confirmed_at,
                last_sign_in_at: u.last_sign_in_at,
                profile: workersMap.get(u.id) || companiesMap.get(u.id) || null,
            }));

            return new Response(JSON.stringify({ users: enrichedUsers }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'escrows') {
            const { data, error } = await supabaseAdmin
                .from('escrow_transactions')
                .select('*, job:jobs(title, company_id)')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            return new Response(JSON.stringify({ escrows: data }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'stats') {
            const [workersRes, companiesRes, jobsRes, escrowReserved, escrowReleased, walletsRes, txRes] = await Promise.all([
                supabaseAdmin.from('workers').select('id', { count: 'exact', head: true }),
                supabaseAdmin.from('companies').select('id', { count: 'exact', head: true }),
                supabaseAdmin.from('jobs').select('id', { count: 'exact', head: true }),
                supabaseAdmin.from('escrow_transactions').select('amount').eq('status', 'reserved'),
                supabaseAdmin.from('escrow_transactions').select('amount').eq('status', 'released'),
                supabaseAdmin.from('wallets').select('balance, user_type'),
                supabaseAdmin.from('wallet_transactions').select('*').order('created_at', { ascending: false }).limit(20),
            ]);

            const reservedTotal = (escrowReserved.data || []).reduce((s: number, e: { amount: number }) => s + Number(e.amount), 0);
            const releasedTotal = (escrowReleased.data || []).reduce((s: number, e: { amount: number }) => s + Number(e.amount), 0);
            const platformBalance = (walletsRes.data || []).reduce((s: number, w: { balance: number }) => s + Number(w.balance), 0);

            return new Response(JSON.stringify({
                stats: {
                    totalWorkers: workersRes.count || 0,
                    totalCompanies: companiesRes.count || 0,
                    totalJobs: jobsRes.count || 0,
                    totalEscrowReserved: reservedTotal,
                    totalEscrowReleased: releasedTotal,
                    platformBalance,
                },
                transactions: txRes.data || [],
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400
        });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        console.error('Admin API Error:', msg);
        return new Response(JSON.stringify({ error: msg }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
        });
    }
});
