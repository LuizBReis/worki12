import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/asaas.ts';

const ADMIN_EMAILS = ['luizguilhermebarretodosreis@yahoo.com.br', 'oliveira9138@gmail.com'];

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401
            });
        }

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

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { action } = await req.json();

        // Helper: build a map of wallet_id → { user_id, email, user_type, name }
        async function buildWalletUserMap() {
            const { data: wallets } = await supabaseAdmin.from('wallets').select('id, user_id, user_type');
            if (!wallets || wallets.length === 0) return new Map();

            const userIds = [...new Set(wallets.map((w: { user_id: string }) => w.user_id))];

            // Get auth users for emails
            const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 500 });
            const authMap = new Map(authUsers.map(u => [u.id, u]));

            // Get worker/company profiles for names
            const [workersRes, companiesRes] = await Promise.all([
                supabaseAdmin.from('workers').select('user_id, full_name').in('user_id', userIds),
                supabaseAdmin.from('companies').select('user_id, company_name, contact_name').in('user_id', userIds),
            ]);
            const workersMap = new Map((workersRes.data || []).map((w: { user_id: string; full_name: string }) => [w.user_id, w]));
            const companiesMap = new Map((companiesRes.data || []).map((c: { user_id: string; company_name: string; contact_name: string }) => [c.user_id, c]));

            const result = new Map();
            for (const w of wallets) {
                const authUser = authMap.get(w.user_id);
                const worker = workersMap.get(w.user_id);
                const company = companiesMap.get(w.user_id);
                result.set(w.id, {
                    user_id: w.user_id,
                    email: authUser?.email || 'unknown',
                    user_type: w.user_type,
                    name: worker?.full_name || company?.company_name || company?.contact_name || authUser?.user_metadata?.full_name || '-',
                });
            }
            return result;
        }

        if (action === 'users') {
            const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 100 });
            if (error) throw error;

            const [workersRes, companiesRes, walletsRes] = await Promise.all([
                supabaseAdmin.from('workers').select('user_id, full_name, skills, city, state'),
                supabaseAdmin.from('companies').select('user_id, company_name, contact_name, sector'),
                supabaseAdmin.from('wallets').select('user_id, balance, user_type'),
            ]);

            const workersMap = new Map((workersRes.data || []).map(w => [w.user_id, w]));
            const companiesMap = new Map((companiesRes.data || []).map(c => [c.user_id, c]));
            const walletsMap = new Map((walletsRes.data || []).map(w => [w.user_id, w]));

            const enrichedUsers = users.map(u => ({
                id: u.id,
                email: u.email,
                user_type: u.user_metadata?.user_type || 'unknown',
                full_name: u.user_metadata?.full_name || '',
                created_at: u.created_at,
                email_confirmed_at: u.email_confirmed_at,
                last_sign_in_at: u.last_sign_in_at,
                profile: workersMap.get(u.id) || companiesMap.get(u.id) || null,
                balance: walletsMap.get(u.id)?.balance || 0,
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

            // Enrich with wallet owner info
            const walletMap = await buildWalletUserMap();

            const enriched = (data || []).map(e => ({
                ...e,
                company_info: walletMap.get(e.company_wallet_id) || null,
                worker_info: e.worker_wallet_id ? walletMap.get(e.worker_wallet_id) || null : null,
            }));

            return new Response(JSON.stringify({ escrows: enriched }), {
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
                supabaseAdmin.from('wallet_transactions')
                    .select('*, wallet:wallets(user_id, user_type)')
                    .order('created_at', { ascending: false })
                    .limit(50),
            ]);

            const reservedTotal = (escrowReserved.data || []).reduce((s: number, e: { amount: number }) => s + Number(e.amount), 0);
            const releasedTotal = (escrowReleased.data || []).reduce((s: number, e: { amount: number }) => s + Number(e.amount), 0);
            const platformBalance = (walletsRes.data || []).reduce((s: number, w: { balance: number }) => s + Number(w.balance), 0);

            // Enrich transactions with user email/name
            const walletMap = await buildWalletUserMap();

            const enrichedTx = (txRes.data || []).map(tx => ({
                ...tx,
                user_info: walletMap.get(tx.wallet_id) || null,
            }));

            return new Response(JSON.stringify({
                stats: {
                    totalWorkers: workersRes.count || 0,
                    totalCompanies: companiesRes.count || 0,
                    totalJobs: jobsRes.count || 0,
                    totalEscrowReserved: reservedTotal,
                    totalEscrowReleased: releasedTotal,
                    platformBalance,
                },
                transactions: enrichedTx,
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
