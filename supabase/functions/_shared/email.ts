// Shared email utility using Resend API
// Set RESEND_API_KEY in Supabase secrets

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_EMAIL = 'Worki <noreply@worki.com.br>';

interface EmailPayload {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
        console.warn('RESEND_API_KEY not set, skipping email send');
        return false;
    }

    try {
        const res = await fetch(RESEND_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: payload.to,
                subject: payload.subject,
                html: payload.html,
            }),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error('Email send failed:', err);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
}

// Email templates

export function hiredEmail(workerName: string, jobTitle: string, companyName: string): EmailPayload {
    return {
        to: '', // filled by caller
        subject: `Voce foi contratado! - ${jobTitle}`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
                <h1 style="color:#00A651">Parabens, ${workerName}!</h1>
                <p>Voce foi contratado para a vaga <strong>${jobTitle}</strong> pela empresa <strong>${companyName}</strong>.</p>
                <p>Acesse a plataforma para ver os detalhes e iniciar o check-in no dia do trabalho.</p>
                <a href="https://worki.com.br/my-jobs" style="display:inline-block;background:#00A651;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px">Ver Meus Jobs</a>
                <p style="color:#999;margin-top:24px;font-size:12px">Worki - Marketplace de Freelancers</p>
            </div>
        `,
    };
}

export function paymentReceivedEmail(workerName: string, amount: string, jobTitle: string): EmailPayload {
    return {
        to: '',
        subject: `Pagamento recebido: R$ ${amount}`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
                <h1 style="color:#00A651">Pagamento Recebido!</h1>
                <p>Ola ${workerName}, voce recebeu <strong>R$ ${amount}</strong> pelo trabalho <strong>${jobTitle}</strong>.</p>
                <p>O valor ja esta disponivel na sua carteira. Voce pode sacar via PIX a qualquer momento.</p>
                <a href="https://worki.com.br/wallet" style="display:inline-block;background:#00A651;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px">Ver Carteira</a>
                <p style="color:#999;margin-top:24px;font-size:12px">Worki - Marketplace de Freelancers</p>
            </div>
        `,
    };
}

export function depositConfirmedEmail(companyName: string, amount: string): EmailPayload {
    return {
        to: '',
        subject: `Deposito confirmado: R$ ${amount}`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
                <h1 style="color:#2563EB">Deposito Confirmado!</h1>
                <p>Ola ${companyName}, seu deposito de <strong>R$ ${amount}</strong> foi confirmado e ja esta disponivel na sua carteira.</p>
                <a href="https://worki.com.br/company/wallet" style="display:inline-block;background:#2563EB;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px">Ver Carteira</a>
                <p style="color:#999;margin-top:24px;font-size:12px">Worki - Marketplace de Freelancers</p>
            </div>
        `,
    };
}

export function newApplicationEmail(companyName: string, workerName: string, jobTitle: string): EmailPayload {
    return {
        to: '',
        subject: `Nova candidatura: ${workerName} para ${jobTitle}`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
                <h1 style="color:#2563EB">Nova Candidatura!</h1>
                <p>Ola ${companyName}, <strong>${workerName}</strong> se candidatou para a vaga <strong>${jobTitle}</strong>.</p>
                <p>Acesse a plataforma para ver o perfil do candidato.</p>
                <a href="https://worki.com.br/company/jobs" style="display:inline-block;background:#2563EB;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:16px">Ver Candidaturas</a>
                <p style="color:#999;margin-top:24px;font-size:12px">Worki - Marketplace de Freelancers</p>
            </div>
        `,
    };
}
