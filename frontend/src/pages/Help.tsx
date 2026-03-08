import { ArrowLeft, Mail, MessageCircle, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const faqs = [
    {
        q: 'Como funciona o pagamento?',
        a: 'A empresa deposita o valor na carteira, que fica em escrow ate o trabalho ser concluido. Apos a confirmacao, o valor e liberado para o worker.',
    },
    {
        q: 'Qual a taxa cobrada?',
        a: 'Cobramos 5% sobre o valor do saque feito pelo worker via PIX. Nao ha taxa para empresas depositarem.',
    },
    {
        q: 'Como faco para sacar meu saldo?',
        a: 'Acesse sua carteira, clique em "Sacar via PIX", informe sua chave PIX e o valor. O saque e processado em ate 24h.',
    },
    {
        q: 'Como funciona o check-in e check-out?',
        a: 'No dia do trabalho, o worker faz check-in ao chegar e check-out ao sair. A empresa confirma e o pagamento e liberado automaticamente.',
    },
    {
        q: 'Posso cancelar uma candidatura?',
        a: 'Sim, voce pode cancelar uma candidatura a qualquer momento antes de ser contratado acessando "Meus Jobs".',
    },
    {
        q: 'O que acontece se a empresa nao confirmar o trabalho?',
        a: 'Se a empresa nao confirmar em ate 48h apos o check-out, o sistema libera o pagamento automaticamente.',
    },
];

export default function Help() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 rounded-lg">
                        <ArrowLeft size={20} />
                    </button>
                    <HelpCircle size={28} className="text-green-600" />
                    <h1 className="text-3xl font-black uppercase">Ajuda</h1>
                </div>

                {/* FAQ */}
                <div className="bg-white border-2 border-black rounded-2xl p-6 mb-8">
                    <h2 className="text-xl font-black uppercase mb-6">Perguntas Frequentes</h2>
                    <div className="space-y-6">
                        {faqs.map((faq, i) => (
                            <div key={i}>
                                <h3 className="font-bold text-sm uppercase mb-1">{faq.q}</h3>
                                <p className="text-gray-600 text-sm">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact */}
                <div className="bg-white border-2 border-black rounded-2xl p-6">
                    <h2 className="text-xl font-black uppercase mb-4">Contato</h2>
                    <p className="text-gray-600 text-sm mb-4">
                        Nao encontrou o que procurava? Entre em contato com nosso suporte.
                    </p>
                    <div className="space-y-3">
                        <a
                            href="mailto:suporte@worki.com.br"
                            className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-black transition-colors"
                        >
                            <Mail size={20} className="text-green-600" />
                            <div>
                                <p className="font-bold text-sm">Email</p>
                                <p className="text-gray-500 text-xs">suporte@worki.com.br</p>
                            </div>
                        </a>
                        <a
                            href="https://wa.me/5511999999999"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-black transition-colors"
                        >
                            <MessageCircle size={20} className="text-green-600" />
                            <div>
                                <p className="font-bold text-sm">WhatsApp</p>
                                <p className="text-gray-500 text-xs">Atendimento de seg a sex, 9h as 18h</p>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
