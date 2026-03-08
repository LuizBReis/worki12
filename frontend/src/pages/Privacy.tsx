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
        <div className="bg-white rounded-xl border-2 border-black p-8 space-y-4 text-sm leading-relaxed">
          <p className="text-gray-600">Ultima atualizacao: Marco de 2026</p>

          <p>Esta Politica de Privacidade descreve como a Worki ("nos", "nossa Plataforma") coleta, utiliza, compartilha e protege seus dados pessoais, em conformidade com a Lei Geral de Protecao de Dados (LGPD - Lei 13.709/2018).</p>

          <h2 className="text-xl font-bold mt-6">1. Dados Coletados</h2>
          <p>Coletamos os seguintes dados pessoais:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Dados de cadastro:</strong> nome completo, email, telefone, CPF ou CNPJ</li>
            <li><strong>Dados profissionais (Workers):</strong> habilidades, experiencia, foto, localizacao</li>
            <li><strong>Dados empresariais (Contratantes):</strong> razao social, CNPJ, setor de atuacao</li>
            <li><strong>Dados financeiros:</strong> chave PIX para saques, historico de transacoes na Plataforma</li>
            <li><strong>Dados de uso:</strong> paginas acessadas, acoes realizadas, data/hora de acesso, dispositivo e navegador</li>
          </ul>

          <h2 className="text-xl font-bold mt-6">2. Finalidade do Tratamento</h2>
          <p>Utilizamos seus dados para:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Criacao e gerenciamento de conta</li>
            <li>Autenticacao e seguranca de acesso</li>
            <li>Conexao entre Contratantes e Workers (exibicao de perfis e candidaturas)</li>
            <li>Processamento de pagamentos, escrow e saques via PIX</li>
            <li>Comunicacao de atualizacoes, notificacoes e suporte</li>
            <li>Melhoria da Plataforma e analise de uso agregado</li>
            <li>Cumprimento de obrigacoes legais e regulatorias</li>
          </ul>

          <h2 className="text-xl font-bold mt-6">3. Base Legal (LGPD Art. 7)</h2>
          <p>O tratamento de dados e fundamentado nas seguintes bases legais:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Execucao de contrato:</strong> para prestacao dos servicos da Plataforma</li>
            <li><strong>Consentimento:</strong> para comunicacoes de marketing e cookies nao essenciais</li>
            <li><strong>Cumprimento de obrigacao legal:</strong> para obrigacoes fiscais e regulatorias</li>
            <li><strong>Interesse legitimo:</strong> para prevencao de fraudes e melhoria da Plataforma</li>
          </ul>

          <h2 className="text-xl font-bold mt-6">4. Compartilhamento de Dados</h2>
          <p>Compartilhamos seus dados apenas com:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Asaas:</strong> processamento de pagamentos PIX (apenas dados necessarios para a transacao)</li>
            <li><strong>Supabase:</strong> infraestrutura de banco de dados e autenticacao (dados criptografados)</li>
            <li><strong>Resend:</strong> envio de emails transacionais (apenas email e nome)</li>
            <li><strong>Sentry:</strong> monitoramento de erros (dados anonimizados, sem dados pessoais)</li>
            <li><strong>Autoridades competentes:</strong> quando exigido por lei ou ordem judicial</li>
          </ul>
          <p>Nao vendemos, alugamos ou compartilhamos seus dados com terceiros para fins de marketing.</p>

          <h2 className="text-xl font-bold mt-6">5. Retencao de Dados</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Dados de conta:</strong> mantidos enquanto a conta estiver ativa. Apos exclusao, removidos em ate 30 dias.</li>
            <li><strong>Dados financeiros:</strong> mantidos por 5 anos apos a ultima transacao, conforme legislacao fiscal brasileira.</li>
            <li><strong>Dados de uso/logs:</strong> mantidos por ate 6 meses para fins de seguranca e melhoria.</li>
            <li><strong>Dados de disputa:</strong> mantidos por 2 anos apos a resolucao.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6">6. Seguranca</h2>
          <p>Adotamos as seguintes medidas de seguranca:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Criptografia em transito (HTTPS/TLS) e em repouso</li>
            <li>Politicas de acesso por linha (RLS) no banco de dados - cada usuario acessa apenas seus proprios dados</li>
            <li>Autenticacao segura com tokens JWT e refresh tokens</li>
            <li>Rate limiting nas APIs criticas para prevenir abusos</li>
            <li>Monitoramento continuo de erros e acessos suspeitos</li>
          </ul>

          <h2 className="text-xl font-bold mt-6">7. Seus Direitos (LGPD Art. 18)</h2>
          <p>Como titular dos dados, voce tem direito a:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Confirmacao e acesso:</strong> saber se tratamos seus dados e acessar uma copia</li>
            <li><strong>Correcao:</strong> solicitar a correcao de dados incompletos, inexatos ou desatualizados</li>
            <li><strong>Anonimizacao ou eliminacao:</strong> solicitar anonimizacao ou exclusao de dados desnecessarios</li>
            <li><strong>Portabilidade:</strong> solicitar a transferencia de seus dados para outro fornecedor</li>
            <li><strong>Revogacao de consentimento:</strong> revogar consentimento a qualquer momento</li>
            <li><strong>Informacao sobre compartilhamento:</strong> saber com quais entidades seus dados sao compartilhados</li>
            <li><strong>Oposicao:</strong> opor-se ao tratamento quando nao baseado em consentimento</li>
          </ul>
          <p className="mt-2">Para exercer seus direitos, envie um email para <a href="mailto:privacidade@worki.com.br" className="text-green-600 font-bold">privacidade@worki.com.br</a> com o assunto "Direitos LGPD". Responderemos em ate 15 dias uteis.</p>

          <h2 className="text-xl font-bold mt-6">8. Cookies</h2>
          <p>Utilizamos apenas cookies essenciais para autenticacao e funcionamento da Plataforma (tokens de sessao). Nao utilizamos cookies de rastreamento, publicidade ou analiticos de terceiros.</p>

          <h2 className="text-xl font-bold mt-6">9. Transferencia Internacional</h2>
          <p>Seus dados podem ser processados em servidores localizados fora do Brasil (infraestrutura em nuvem). Nestes casos, garantimos que os provedores adotam niveis adequados de protecao de dados conforme a LGPD.</p>

          <h2 className="text-xl font-bold mt-6">10. Alteracoes nesta Politica</h2>
          <p>Podemos atualizar esta Politica periodicamente. Alteracoes significativas serao comunicadas por email ou pela Plataforma. O uso continuado apos as alteracoes constitui aceitacao da nova Politica.</p>

          <h2 className="text-xl font-bold mt-6">11. Contato e Encarregado (DPO)</h2>
          <p>Para questoes de privacidade e protecao de dados:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Email:</strong> <a href="mailto:privacidade@worki.com.br" className="text-green-600 font-bold">privacidade@worki.com.br</a></li>
            <li><strong>Email geral:</strong> <a href="mailto:contato@worki.com.br" className="text-green-600 font-bold">contato@worki.com.br</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
