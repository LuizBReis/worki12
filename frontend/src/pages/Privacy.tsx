import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 mb-6 hover:text-gray-900">
          <ArrowLeft size={20} /> Voltar
        </button>
        <h1 className="text-3xl font-bold mb-6">Politica de Privacidade</h1>
        <div className="bg-white rounded-xl border-2 border-black p-8 space-y-4">
          <p className="text-gray-600">Ultima atualizacao: Março de 2026</p>

          <h2 className="text-xl font-bold mt-6">1. Dados Coletados</h2>
          <p>Coletamos nome, email, telefone, CPF/CNPJ, e informações profissionais necessárias para o funcionamento da plataforma.</p>

          <h2 className="text-xl font-bold mt-6">2. Uso dos Dados</h2>
          <p>Seus dados são utilizados para: autenticação, processamento de pagamentos, comunicação entre partes, e melhoria da plataforma.</p>

          <h2 className="text-xl font-bold mt-6">3. Compartilhamento</h2>
          <p>Compartilhamos dados com: Asaas (processamento de pagamentos), Supabase (infraestrutura), e conforme exigido por lei.</p>

          <h2 className="text-xl font-bold mt-6">4. Segurança</h2>
          <p>Utilizamos criptografia, políticas de acesso por linha (RLS), e autenticação segura para proteger seus dados.</p>

          <h2 className="text-xl font-bold mt-6">5. Seus Direitos (LGPD)</h2>
          <p>Você tem direito a acessar, corrigir, excluir seus dados pessoais, e revogar consentimento a qualquer momento, conforme a Lei Geral de Proteção de Dados.</p>

          <h2 className="text-xl font-bold mt-6">6. Cookies</h2>
          <p>Utilizamos cookies essenciais para autenticação e funcionamento da plataforma. Não utilizamos cookies de rastreamento de terceiros.</p>

          <h2 className="text-xl font-bold mt-6">7. Contato</h2>
          <p>Para exercer seus direitos ou esclarecer dúvidas: contato@worki.com.br</p>
        </div>
      </div>
    </div>
  );
}
