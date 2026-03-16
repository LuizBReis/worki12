import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, ASAAS_API_URL, getAsaasHeaders } from '../_shared/asaas.ts';
import { isRateLimited } from '../_shared/rate-limit.ts';

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
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) throw new Error('Invalid Token');

        if (isRateLimited(user.id, 'deposit', 5, 60_000)) {
            return new Response(JSON.stringify({ error: 'Muitas tentativas. Aguarde 1 minuto.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429
            });
        }

        const { amount, name, cpfCnpj } = await req.json();

        if (!amount || typeof amount !== 'number' || amount < 5) {
            throw new Error('Minimum deposit amount is R$ 5.00');
        }
        if (amount > 50000) {
            throw new Error('Maximum deposit amount is R$ 50,000.00');
        }
        // Ensure 2 decimal places precision
        const sanitizedAmount = Math.round(amount * 100) / 100;

        // Ensure wallet exists
        const { data: wallet } = await supabaseAdmin
            .from('wallets')
            .select('id, asaas_customer_id')
            .eq('user_id', user.id)
            .single();

        if (!wallet) {
            throw new Error('Wallet not found. Please complete onboarding first.');
        }

        let customerId = wallet.asaas_customer_id;

        // Create a customer on the master account if not exists
        if (!customerId) {
            const cleanDoc = cpfCnpj ? cpfCnpj.replace(/\D/g, '') : '';
            if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
                throw new Error('CPF (11 digitos) ou CNPJ (14 digitos) é obrigatório para criar conta de pagamento.');
            }

            // Validate CPF/CNPJ checksum
            if (cleanDoc.length === 11) {
                // CPF validation
                if (/^(\d)\1{10}$/.test(cleanDoc)) {
                    throw new Error('CPF invalido: todos os digitos sao iguais.');
                }
                let sum = 0;
                for (let i = 0; i < 9; i++) sum += parseInt(cleanDoc[i]) * (10 - i);
                let check = 11 - (sum % 11);
                if (check >= 10) check = 0;
                if (check !== parseInt(cleanDoc[9])) {
                    throw new Error('CPF invalido: digito verificador incorreto.');
                }
                sum = 0;
                for (let i = 0; i < 10; i++) sum += parseInt(cleanDoc[i]) * (11 - i);
                check = 11 - (sum % 11);
                if (check >= 10) check = 0;
                if (check !== parseInt(cleanDoc[10])) {
                    throw new Error('CPF invalido: digito verificador incorreto.');
                }
            } else {
                // CNPJ validation
                if (/^(\d)\1{13}$/.test(cleanDoc)) {
                    throw new Error('CNPJ invalido: todos os digitos sao iguais.');
                }
                const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
                let sum = 0;
                for (let i = 0; i < 12; i++) sum += parseInt(cleanDoc[i]) * weights1[i];
                let check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
                if (check !== parseInt(cleanDoc[12])) {
                    throw new Error('CNPJ invalido: digito verificador incorreto.');
                }
                const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
                sum = 0;
                for (let i = 0; i < 13; i++) sum += parseInt(cleanDoc[i]) * weights2[i];
                check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
                if (check !== parseInt(cleanDoc[13])) {
                    throw new Error('CNPJ invalido: digito verificador incorreto.');
                }
            }

            const finalDoc = cleanDoc;

            const customerPayload = {
                name: name || 'Worki User',
                cpfCnpj: finalDoc
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

        // Create PIX charge on master account - NO split, all money stays in master wallet
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1);

        const paymentPayload = {
            customer: customerId,
            billingType: "PIX",
            value: sanitizedAmount,
            dueDate: dueDate.toISOString().split('T')[0],
            description: `Deposito de Creditos - Worki`,
            externalReference: user.id,
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
