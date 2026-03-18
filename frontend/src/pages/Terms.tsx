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
        <div className="bg-white rounded-xl border-2 border-black p-8 space-y-4 text-sm leading-relaxed">
          <p className="text-gray-600">Ultima atualizacao: Marco de 2026</p>

          <h2 className="text-xl font-bold mt-6">1. Aceitacao dos Termos</h2>
          <p>Ao acessar e usar a plataforma Worki ("Plataforma"), voce concorda integralmente com estes Termos de Uso. Se nao concordar com qualquer clausula, nao utilize a Plataforma. A Worki reserva-se o direito de atualizar estes Termos a qualquer momento, notificando os usuarios por email ou pela propria Plataforma.</p>

          <h2 className="text-xl font-bold mt-6">2. Descricao do Servico</h2>
          <p>Worki e uma plataforma digital que conecta empresas ("Contratantes") a trabalhadores freelancers ("Workers") para prestacao de servicos temporarios. A Worki atua exclusivamente como intermediaria tecnologica, facilitando a conexao, gestao de vagas e processamento de pagamentos entre as partes.</p>

          <h2 className="text-xl font-bold mt-6">3. Cadastro e Conta</h2>
          <p>Para utilizar a Plataforma, e necessario criar uma conta com informacoes verdadeiras, completas e atualizadas. O usuario e responsavel por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta. A Worki pode suspender ou encerrar contas que violem estes Termos ou forneçam informacoes falsas.</p>

          <h2 className="text-xl font-bold mt-6">4. Sistema de Pagamento e Escrow</h2>
          <p>Os pagamentos sao processados exclusivamente pela Plataforma, utilizando o sistema de escrow (custodia):</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Deposito:</strong> A Contratante deposita o valor do servico na carteira da Plataforma via PIX antes de publicar a vaga ou contratar o Worker.</li>
            <li><strong>Reserva (Escrow):</strong> Ao contratar um Worker, o valor e reservado em custodia e nao pode ser utilizado pela Contratante para outros fins.</li>
            <li><strong>Liberacao:</strong> Apos a confirmacao da conclusao do servico (check-out do Worker e confirmacao da Contratante), o valor e liberado para a carteira do Worker.</li>
            <li><strong>Saque:</strong> O Worker pode sacar o saldo disponivel via PIX a qualquer momento.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6">5. Taxas</h2>
          <p>A Worki cobra as seguintes taxas para manter a plataforma segura e funcional:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Para Empresas (ao contratar):</strong> Taxa de servico de <strong>8% (oito por cento)</strong> sobre o valor do servico, mais uma taxa fixa de processamento de <strong>R$ 4,00</strong>. As taxas sao cobradas no momento da reserva do escrow.</li>
            <li><strong>Para Workers (ao sacar):</strong> Taxa de servico de <strong>5% (cinco por cento)</strong> sobre o valor do saque, mais uma taxa fixa de processamento PIX de <strong>R$ 3,00</strong>.</li>
            <li><strong>Depositos:</strong> Nao ha taxa para depositos realizados pelas Contratantes.</li>
          </ul>
          <p className="mt-2">A Worki reserva-se o direito de alterar as taxas, notificando os usuarios com antecedencia minima de 30 dias.</p>

          <h2 className="text-xl font-bold mt-6">6. Cancelamentos e Reembolsos</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Antes da contratacao:</strong> Vagas podem ser canceladas livremente. Se houver valor reservado em escrow, sera integralmente devolvido a carteira da Contratante.</li>
            <li><strong>Apos a contratacao:</strong> Cancelamentos serao analisados caso a caso. Se o Worker nao compareceu ou nao realizou o servico, o escrow pode ser reembolsado a Contratante.</li>
            <li><strong>No-show do Worker:</strong> Se o Worker nao realizar check-in, a Contratante pode solicitar cancelamento com reembolso integral do escrow.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6">7. Disputas</h2>
          <p>Em caso de disputas entre Contratante e Worker quanto a conclusao ou qualidade do servico, a Worki atuara como mediadora. As partes devem apresentar evidencias relevantes. A decisao da Worki sobre a liberacao ou reembolso do escrow sera final e vinculante para ambas as partes dentro da Plataforma. Nenhuma parte abre mao do direito de buscar reparacao judicial.</p>

          <h2 className="text-xl font-bold mt-6">8. Responsabilidades e Limitacoes</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>A Worki <strong>nao e parte</strong> na relacao de trabalho entre Contratantes e Workers. Nao ha vinculo empregaticio entre as partes ou com a Plataforma.</li>
            <li>Cada parte e responsavel pelo cumprimento de suas obrigacoes legais, tributarias e previdenciarias.</li>
            <li>A Worki nao garante a qualidade, pontualidade ou resultado dos servicos prestados.</li>
            <li>A Worki nao se responsabiliza por danos indiretos, lucros cessantes ou perdas decorrentes do uso da Plataforma.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6">9. Propriedade Intelectual</h2>
          <p>Todo o conteudo da Plataforma (marca, logotipo, interface, codigo-fonte) e propriedade da Worki. O uso nao autorizado constitui violacao de direitos autorais e de propriedade intelectual.</p>

          <h2 className="text-xl font-bold mt-6">10. Protecao de Dados (LGPD)</h2>
          <p>O tratamento de dados pessoais pela Worki esta em conformidade com a Lei Geral de Protecao de Dados (Lei 13.709/2018). Consulte nossa <a href="/privacidade" className="text-green-600 font-bold underline">Politica de Privacidade</a> para detalhes sobre coleta, uso, compartilhamento e seus direitos como titular dos dados.</p>

          <h2 className="text-xl font-bold mt-6">11. Suspensao e Encerramento</h2>
          <p>A Worki pode suspender ou encerrar o acesso de usuarios que: violem estes Termos, realizem atividades fraudulentas, apresentem comportamento abusivo, ou utilizem a Plataforma para fins ilegais. Em caso de encerramento, saldos em carteira serao devolvidos conforme aplicavel.</p>

          <h2 className="text-xl font-bold mt-6">12. Foro e Legislacao</h2>
          <p>Estes Termos sao regidos pelas leis da Republica Federativa do Brasil. Fica eleito o foro da comarca de Sao Paulo/SP para dirimir quaisquer controversias.</p>

          <h2 className="text-xl font-bold mt-6">13. Contato</h2>
          <p>Para duvidas sobre estes Termos: <a href="mailto:contato@worki.com.br" className="text-green-600 font-bold">contato@worki.com.br</a></p>
        </div>
      </div>
    </div>
  );
}
