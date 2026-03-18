import { useNavigate } from 'react-router-dom'
import { Briefcase, Shield, Zap, Users, CreditCard, Clock } from 'lucide-react'
import PageMeta from '../components/PageMeta'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#F4F4F0]">
      <PageMeta
        title="Sobre a Worki - Marketplace de Freelancers"
        description="Worki conecta empresas a trabalhadores freelancers. Encontre talentos ou oportunidades de trabalho na sua região. Pagamento seguro via PIX."
      />

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-[#F4F4F0]/95 backdrop-blur-sm border-b-2 border-black/10 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-2xl font-black uppercase tracking-tighter hover:text-primary transition-colors">
            Worki
          </button>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login?type=work')} className="px-4 py-2 font-bold text-sm uppercase hover:text-primary transition-colors">
              Quero Trabalhar
            </button>
            <button onClick={() => navigate('/login?type=hire')} className="px-4 py-2 bg-blue-600 text-white font-bold text-sm uppercase rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
              Quero Contratar
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 md:py-32">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6">
            Encontre o profissional ideal ou o trabalho perfeito
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 font-medium">
            O Worki é o marketplace que conecta empresas a freelancers qualificados.
            Contrate talentos avaliados ou encontre oportunidades de trabalho na sua região,
            com pagamento seguro via PIX e garantia de entrega.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login?type=work')}
              className="px-8 py-4 bg-primary text-white font-black uppercase text-lg rounded-xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
            >
              Cadastrar como Profissional
            </button>
            <button
              onClick={() => navigate('/login?type=hire')}
              className="px-8 py-4 bg-blue-600 text-white font-black uppercase text-lg rounded-xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
            >
              Cadastrar como Empresa
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-center mb-16">
            Por que escolher o Worki?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="w-10 h-10 text-primary" />,
                title: 'Pagamento Garantido',
                description: 'Sistema de escrow protege seu dinheiro. O pagamento só é liberado quando o trabalho é concluído e aprovado pela empresa. Sem risco de calote.'
              },
              {
                icon: <Zap className="w-10 h-10 text-blue-600" />,
                title: 'PIX Instantâneo',
                description: 'Receba seus pagamentos via PIX diretamente na sua conta. Sem espera de dias úteis, sem intermediários bancários. Seu dinheiro na hora.'
              },
              {
                icon: <Users className="w-10 h-10 text-primary" />,
                title: 'Profissionais Avaliados',
                description: 'Sistema de avaliação com estrelas e reviews detalhados. Empresas contratam com confiança, profissionais constroem reputação comprovada.'
              },
              {
                icon: <Briefcase className="w-10 h-10 text-blue-600" />,
                title: 'Vagas na Sua Região',
                description: 'Encontre oportunidades de trabalho freelancer perto de você. Filtre por cidade, modalidade e faixa de orçamento para achar a vaga ideal.'
              },
              {
                icon: <CreditCard className="w-10 h-10 text-primary" />,
                title: 'Taxa Justa',
                description: 'Apenas 5% de taxa sobre saques. Sem mensalidades, sem taxas escondidas, sem cobrança para se cadastrar. Você só paga quando recebe.'
              },
              {
                icon: <Clock className="w-10 h-10 text-blue-600" />,
                title: 'Controle Total',
                description: 'Check-in e check-out digital para controle de horas. Dashboard completo com histórico de trabalhos, ganhos e analytics em tempo real.'
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 bg-white border-2 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-2">{feature.title}</h3>
                <p className="text-gray-600 font-medium">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-center mb-16">
            Como funciona
          </h2>

          {/* Para Profissionais */}
          <div className="mb-16">
            <h3 className="text-2xl font-black uppercase tracking-tight text-primary mb-8 text-center">
              Para Profissionais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: '1', title: 'Cadastre-se', desc: 'Crie seu perfil gratuito em minutos. Adicione suas habilidades, experiência e região de atuação para ser encontrado por empresas.' },
                { step: '2', title: 'Candidate-se', desc: 'Navegue pelas vagas disponíveis e candidate-se às que combinam com seu perfil. Receba notificações quando for selecionado.' },
                { step: '3', title: 'Receba via PIX', desc: 'Complete o trabalho, receba a avaliação da empresa e saque seus ganhos instantaneamente via PIX. Simples assim.' },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary text-white rounded-full border-2 border-black flex items-center justify-center text-2xl font-black mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {item.step}
                  </div>
                  <h4 className="text-lg font-black uppercase tracking-tight mb-2">{item.title}</h4>
                  <p className="text-gray-600 font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Para Empresas */}
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-blue-600 mb-8 text-center">
              Para Empresas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: '1', title: 'Publique a Vaga', desc: 'Descreva o trabalho que precisa, defina o orçamento e a localização. Em minutos sua vaga estará visível para milhares de profissionais.' },
                { step: '2', title: 'Escolha o Melhor', desc: 'Receba candidaturas, avalie perfis com ratings e reviews, e contrate o profissional ideal. O pagamento fica em escrow seguro.' },
                { step: '3', title: 'Aprove e Pague', desc: 'Quando o trabalho estiver concluído, aprove a entrega e o pagamento é liberado automaticamente ao profissional via PIX.' },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full border-2 border-black flex items-center justify-center text-2xl font-black mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    {item.step}
                  </div>
                  <h4 className="text-lg font-black uppercase tracking-tight mb-2">{item.title}</h4>
                  <p className="text-gray-600 font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="px-4 py-16 md:py-24 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6">
            Comece agora. É grátis.
          </h2>
          <p className="text-xl text-gray-300 mb-12 font-medium">
            Junte-se a milhares de profissionais e empresas que já usam o Worki
            para conectar talentos a oportunidades. Cadastro gratuito, sem compromisso.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login?type=work')}
              className="px-8 py-4 bg-primary text-white font-black uppercase text-lg rounded-xl border-2 border-primary shadow-[8px_8px_0px_0px_rgba(0,166,81,0.3)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
            >
              Quero Trabalhar
            </button>
            <button
              onClick={() => navigate('/login?type=hire')}
              className="px-8 py-4 bg-blue-600 text-white font-black uppercase text-lg rounded-xl border-2 border-blue-600 shadow-[8px_8px_0px_0px_rgba(37,99,235,0.3)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
            >
              Quero Contratar
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 bg-gray-100 text-center text-sm text-gray-500 font-medium">
        <p>&copy; {new Date().getFullYear()} Worki — Marketplace de Freelancers. Todos os direitos reservados.</p>
        <div className="flex gap-4 justify-center mt-4">
          <button onClick={() => navigate('/termos')} className="hover:text-black transition-colors">Termos de Uso</button>
          <button onClick={() => navigate('/privacidade')} className="hover:text-black transition-colors">Política de Privacidade</button>
          <button onClick={() => navigate('/ajuda')} className="hover:text-black transition-colors">Ajuda</button>
        </div>
      </footer>
    </div>
  )
}
