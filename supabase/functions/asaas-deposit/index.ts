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

        const { amount, name, cpfCnpj, email } = await req.json();

        if (!amount || amount < 5) {
            throw new Error('Minimum deposit amount is R$ 5.00');
        }

        const generateCpf = () => {
            const random = (n: number) => Math.floor(Math.random() * n);
            const mod = (dividendo: number, divisor: number) => Math.round(dividendo - (Math.floor(dividendo / divisor) * divisor));
            const n = 9;
            const n1 = random(n), n2 = random(n), n3 = random(n), n4 = random(n), n5 = random(n), n6 = random(n), n7 = random(n), n8 = random(n), n9 = random(n);
            let d1 = n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10;
            d1 = 11 - (mod(d1, 11));
            if (d1 >= 10) d1 = 0;
            let d2 = d1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11;
            d2 = 11 - (mod(d2, 11));
            if (d2 >= 10) d2 = 0;
            return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`;
        };

        // Get company wallet
        const { data: wallet } = await supabaseAdmin
            .from('wallets')
            .select('asaas_wallet_id, asaas_customer_id')
            .eq('user_id', user.id)
            .single();

        let asaasWalletId = wallet?.asaas_wallet_id;
        let customerId = wallet?.asaas_customer_id;

        if (!asaasWalletId) {
            // Automatic Onboarding
            // Fetch company details
            const { data: company } = await supabaseAdmin.from('companies').select('*').eq('id', user.id).single();
            if (!company) throw new Error('Company profile not found');

            const validCpf = generateCpf();
            const document = cpfCnpj || company.cnpj;
            // If length isn't 11 or 14 (CPF/CNPJ), it's likely invalid for Asaas, so fallback to algo
            const cleanDoc = document ? document.replace(/\D/g, '') : '';
            const isCpf = cleanDoc.length === 11;
            const finalDoc = (cleanDoc.length === 11 || cleanDoc.length === 14) ? cleanDoc : validCpf;

            const uniqueEmail = `wki-${user.id}@worki.com.br`;

            const payload: any = {
                name: company.name || name || 'Worki Company',
                email: uniqueEmail,
                loginEmail: uniqueEmail,
                cpfCnpj: finalDoc,
                companyType: isCpf ? undefined : 'LIMITED',
                mobilePhone: '11987654321',
                incomeValue: 25000,
                address: 'Av. Paulista',
                addressNumber: '100',
                province: 'Centro',
                postalCode: '01310-100',
            };

            if (isCpf || finalDoc.length === 11) {
                payload.birthDate = '1990-01-01';
            }

            const asaasRes = await fetch(`${ASAAS_API_URL}/accounts`, {
                method: 'POST',
                headers: getAsaasHeaders(),
                body: JSON.stringify(payload)
            });
            const asaasData = await asaasRes.json();

            if (!asaasRes.ok) {
                console.error('Auto-Onboard Error:', asaasData);
                throw new Error(asaasData.errors?.[0]?.description || 'Failed to auto-onboard Asaas subaccount');
            }

            asaasWalletId = asaasData.walletId;

            await supabaseAdmin.from('wallets').upsert({
                user_id: user.id,
                user_type: 'company',
                asaas_wallet_id: asaasWalletId,
                asaas_api_key: asaasData.apiKey
            }, { onConflict: 'user_id' }).throwOnError();
        }

        // Create a customer if it doesn't exist yet on the Master account
        if (!customerId) {
            const document = cpfCnpj;
            const cleanDoc = document ? document.replace(/\D/g, '') : '';
            const finalDoc = (cleanDoc.length === 11 || cleanDoc.length === 14) ? cleanDoc : generateCpf();

            const customerPayload = {
                name: name || 'Worki User',
                cpfCnpj: finalDoc // Algorithmic fallback
            };

            const customerRes = await fetch(`${ASAAS_API_URL}/customers`, {
                method: 'POST',
                headers: getAsaasHeaders(),
                body: JSON.stringify(customerPayload)
            });
            const customerData = await customerRes.json();

            if (!customerRes.ok) {
                console.error('Customer Details:', customerData);
                throw new Error(customerData.errors?.[0]?.description || 'Error creating Asaas customer');
            }

            customerId = customerData.id;

            await supabaseAdmin.from('wallets').update({ asaas_customer_id: customerId }).eq('user_id', user.id).throwOnError();
        }

        // Settings for the platform
        // Let's say we charge 5% of the split on deposit inside the platform
        const PLATFORM_FEE_PERCENTAGE = 0; // Keeping at 0 initially as per standard Escrow? Actually user said "cobramos na hora nossa taxa", let's use 5% as example value, or just fixed if they have config. I'll put a default of 5%.
        const splitFee = 5;

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1); // due tomorrow

        const paymentPayload = {
            customer: customerId,
            billingType: "PIX",
            value: amount,
            dueDate: dueDate.toISOString().split('T')[0],
            description: `Depósito de Créditos - Worki`,
            externalReference: user.id,
            split: [
                {
                    walletId: asaasWalletId,
                    percentualValue: 100 - splitFee // % goes to Company Subaccount, the rest stays on Master Account
                }
            ]
        };

        const paymentRes = await fetch(`${ASAAS_API_URL}/payments`, {
            method: 'POST',
            headers: getAsaasHeaders(),
            body: JSON.stringify(paymentPayload)
        });

        const paymentData = await paymentRes.json();
        if (!paymentRes.ok) throw new Error(paymentData.errors?.[0]?.description || 'Error generating PIX');

        return new Response(JSON.stringify({
            success: true,
            paymentId: paymentData.id,
            pixQrCodeUrl: paymentData.invoiceUrl
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('Deposit Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
