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

        const {
            name,
            cpfCnpj,
            phone,
            type,
            companyType,
            // NEW: Real data fields from onboarding form
            birthDate,
            postalCode,
            address,
            addressNumber,
            province,
            incomeValue,
        } = await req.json();

        if (!name || !cpfCnpj) {
            throw new Error('Name and cpfCnpj are required to create an Asaas subaccount.');
        }

        // Check if wallet already has asaas_wallet_id
        const { data: existingWallet } = await supabaseAdmin
            .from('wallets')
            .select('asaas_wallet_id, asaas_api_key')
            .eq('user_id', user.id)
            .single();

        if (existingWallet?.asaas_wallet_id) {
            return new Response(JSON.stringify({
                message: 'Subaccount already exists',
                walletId: existingWallet.asaas_wallet_id
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            });
        }

        const cleanCnpj = cpfCnpj.replace(/\D/g, '');
        const isCpf = cleanCnpj.length === 11;

        // Use unique loginEmail for Asaas uniqueness, real email as account email
        const uniqueLoginEmail = `wki-${user.id.substring(0, 8)}@worki.com.br`;
        const realEmail = user.email || uniqueLoginEmail;

        // Build Asaas payload with REAL data from onboarding form
        const payload: Record<string, unknown> = {
            name,
            email: realEmail,
            loginEmail: uniqueLoginEmail,
            cpfCnpj: cleanCnpj,
            mobilePhone: phone ? phone.replace(/\D/g, '') : undefined,
            incomeValue: incomeValue || 1000,
            address: address || 'Não informado',
            addressNumber: addressNumber || 'S/N',
            province: province || 'Centro',
            postalCode: postalCode ? postalCode.replace(/\D/g, '') : undefined,
        };

        // CPF requires birthDate, CNPJ requires companyType
        if (isCpf) {
            payload.birthDate = birthDate || undefined;
        } else if (cleanCnpj.length === 14) {
            payload.companyType = companyType || 'LIMITED';
        }

        // Validate required fields
        const requiredFields = ['name', 'email', 'cpfCnpj', 'mobilePhone', 'incomeValue', 'address', 'addressNumber', 'province', 'postalCode'];
        for (const field of requiredFields) {
            if (!payload[field]) {
                throw new Error(`Campo obrigatório ausente: ${field}`);
            }
        }
        if (isCpf && !payload.birthDate) {
            throw new Error('Data de nascimento é obrigatória para pessoa física.');
        }

        // Configure webhook for this subaccount to receive ACCOUNT_STATUS events
        const webhookUrl = Deno.env.get('ASAAS_WEBHOOK_URL');
        if (webhookUrl) {
            payload.webhooks = [{
                url: webhookUrl,
                email: realEmail,
                enabled: true,
                interrupted: false,
                apiVersion: 3,
                authToken: Deno.env.get('ASAAS_WEBHOOK_TOKEN') || 'workiasaas',
                sendType: 'NON_SEQUENTIALLY',
                events: [
                    'PAYMENT_RECEIVED',
                    'PAYMENT_CONFIRMED',
                    'TRANSFER_CREATED',
                    'TRANSFER_DONE',
                    'TRANSFER_FAILED',
                    'ACCOUNT_STATUS_COMMERCIAL_INFO_APPROVED',
                    'ACCOUNT_STATUS_COMMERCIAL_INFO_REJECTED',
                    'ACCOUNT_STATUS_COMMERCIAL_INFO_PENDING',
                    'ACCOUNT_STATUS_BANK_ACCOUNT_INFO_APPROVED',
                    'ACCOUNT_STATUS_BANK_ACCOUNT_INFO_REJECTED',
                    'ACCOUNT_STATUS_BANK_ACCOUNT_INFO_PENDING',
                    'ACCOUNT_STATUS_DOCUMENT_APPROVED',
                    'ACCOUNT_STATUS_DOCUMENT_REJECTED',
                    'ACCOUNT_STATUS_DOCUMENT_PENDING',
                    'ACCOUNT_STATUS_GENERAL_APPROVAL_APPROVED',
                    'ACCOUNT_STATUS_GENERAL_APPROVAL_REJECTED',
                    'ACCOUNT_STATUS_GENERAL_APPROVAL_PENDING',
                ]
            }];
        }

        console.log('Creating Asaas subaccount with payload:', JSON.stringify({ ...payload, webhooks: '[configured]' }));

        // Call Asaas API to create subaccount
        const asaasResponse = await fetch(`${ASAAS_API_URL}/accounts`, {
            method: 'POST',
            headers: getAsaasHeaders(),
            body: JSON.stringify(payload)
        });

        const asaasData = await asaasResponse.json();

        if (!asaasResponse.ok) {
            console.error('Asaas Subaccount Error:', asaasData);
            throw new Error(asaasData.errors?.[0]?.description || 'Failed to create Asaas subaccount');
        }

        // After creating subaccount, check its initial status
        let accountStatus = { general: 'PENDING', commercialInfo: 'PENDING', bankAccountInfo: 'PENDING', documentation: 'PENDING' };
        try {
            const statusRes = await fetch(`${ASAAS_API_URL}/myAccount/status/`, {
                headers: getAsaasHeaders(asaasData.apiKey)
            });
            if (statusRes.ok) {
                const statusData = await statusRes.json();
                accountStatus = {
                    general: statusData.general || 'PENDING',
                    commercialInfo: statusData.commercialInfo || 'PENDING',
                    bankAccountInfo: statusData.bankAccountInfo || 'PENDING',
                    documentation: statusData.documentation || 'PENDING',
                };
            }
        } catch (e) {
            console.warn('Could not fetch initial account status:', e);
        }

        // Save to database
        const { error: updateError } = await supabaseAdmin
            .from('wallets')
            .upsert({
                user_id: user.id,
                user_type: type || 'worker',
                asaas_wallet_id: asaasData.walletId,
                asaas_api_key: asaasData.apiKey,
                asaas_account_status: accountStatus,
            }, { onConflict: 'user_id' });

        if (updateError) {
            throw updateError;
        }

        return new Response(JSON.stringify({
            success: true,
            walletId: asaasData.walletId,
            accountStatus,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('Onboard Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
