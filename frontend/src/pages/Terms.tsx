import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 mb-6 hover:text-gray-900">
          <ArrowLeft size={20} /> Voltar
        </button>
        <h1 className="text-3xl font-bold mb-6">Termos de Uso</h1>
        <div className="bg-white rounded-xl border-2 border-black p-8 space-y-4">
          <p className="text-gray-600">Ultima atualizacao: Março de 2026</p>

          <h2 className="text-xl font-bold mt-6">1. Aceitação dos Termos</h2>
          <p>Ao acessar e usar a plataforma Worki, você concorda com estes Termos de Uso. Se não concordar, não utilize a plataforma.</p>

          <h2 className="text-xl font-bold mt-6">2. Descrição do Serviço</h2>
          <p>Worki é uma plataforma que conecta empresas a trabalhadores freelancers para prestação de serviços. A Worki atua como intermediária, facilitando a conexão e o pagamento entre as partes.</p>

          <h2 className="text-xl font-bold mt-6">3. Cadastro</h2>
          <p>Para utilizar a plataforma, é necessário criar uma conta com informações verdadeiras e atualizadas. Você é responsável pela segurança de sua conta e senha.</p>

          <h2 className="text-xl font-bold mt-6">4. Pagamentos e Taxas</h2>
          <p>Os pagamentos são processados através da plataforma via Pix. A Worki cobra uma taxa de 5% sobre saques realizados pelos trabalhadores. Os valores ficam em custódia (escrow) até a conclusão do serviço.</p>

          <h2 className="text-xl font-bold mt-6">5. Responsabilidades</h2>
          <p>A Worki não é parte na relação de trabalho entre empresas e trabalhadores. Cada parte é responsável pelo cumprimento de suas obrigações legais e tributárias.</p>

          <h2 className="text-xl font-bold mt-6">6. Cancelamento</h2>
          <p>Vagas podem ser canceladas antes da contratação, com reembolso integral do escrow. Após a contratação, disputas serão analisadas caso a caso.</p>

          <h2 className="text-xl font-bold mt-6">7. Contato</h2>
          <p>Para dúvidas sobre estes termos, entre em contato pelo email: contato@worki.com.br</p>
        </div>
      </div>
    </div>
  );
}
