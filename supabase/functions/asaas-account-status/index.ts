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
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
        if (userError || !user) throw new Error('Invalid Token');

        // Get user wallet with Asaas credentials
        const { data: wallet, error: walletError } = await supabaseAdmin
            .from('wallets')
            .select('id, asaas_api_key, asaas_wallet_id, asaas_account_status')
            .eq('user_id', user.id)
            .single();

        if (walletError || !wallet) {
            return new Response(JSON.stringify({
                status: { general: 'NOT_CREATED', commercialInfo: 'NOT_CREATED', bankAccountInfo: 'NOT_CREATED', documentation: 'NOT_CREATED' },
                pendingDocuments: [],
                message: 'Conta Asaas ainda não foi criada.'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            });
        }

        if (!wallet.asaas_api_key) {
            return new Response(JSON.stringify({
                status: { general: 'NOT_CREATED', commercialInfo: 'NOT_CREATED', bankAccountInfo: 'NOT_CREATED', documentation: 'NOT_CREATED' },
                pendingDocuments: [],
                message: 'Chave API do Asaas não encontrada. Complete o onboarding primeiro.'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            });
        }

        // 1. Fetch account status from Asaas
        const statusRes = await fetch(`${ASAAS_API_URL}/myAccount/status/`, {
            headers: getAsaasHeaders(wallet.asaas_api_key)
        });

        if (!statusRes.ok) {
            const errData = await statusRes.text();
            console.error('Asaas status check failed:', errData);
            throw new Error('Falha ao consultar status da conta no Asaas.');
        }

        const statusData = await statusRes.json();
        const accountStatus = {
            general: statusData.general || 'PENDING',
            commercialInfo: statusData.commercialInfo || 'PENDING',
            bankAccountInfo: statusData.bankAccountInfo || 'PENDING',
            documentation: statusData.documentation || 'PENDING',
        };

        // 2. Fetch pending documents from Asaas
        let pendingDocuments: any[] = [];
        try {
            const docsRes = await fetch(`${ASAAS_API_URL}/myAccount/documents`, {
                headers: getAsaasHeaders(wallet.asaas_api_key)
            });

            if (docsRes.ok) {
                const docsData = await docsRes.json();
                pendingDocuments = (docsData.data || []).map((doc: any) => ({
                    id: doc.id,
                    type: doc.type,
                    title: doc.title,
                    description: doc.description,
                    status: doc.status,
                    onboardingUrl: doc.onboardingUrl,
                }));
            }
        } catch (e) {
            console.warn('Could not fetch documents:', e);
        }

        // 3. Update status in our database
        await supabaseAdmin
            .from('wallets')
            .update({ asaas_account_status: accountStatus })
            .eq('id', wallet.id);

        return new Response(JSON.stringify({
            status: accountStatus,
            pendingDocuments,
            message: accountStatus.general === 'APPROVED'
                ? 'Conta aprovada! Você pode usar todas as funcionalidades.'
                : 'Conta em análise. Complete os documentos pendentes para aprovação.'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('Account Status Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
