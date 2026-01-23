# 🚀 Worki - Plataforma de Freelancers de Alto Nível

> O futuro do trabalho flexível, construído com design arrojado e tecnologia de ponta.

![Worki Banner](https://via.placeholder.com/1200x400.png?text=WORKI+HIGH+LEVEL)

## 📋 Sobre o Projeto

O **Worki** é uma plataforma inovadora que conecta talentos freelance a empresas modernas. O Worki utiliza princípios de **Gamificação (Hooked Model)** e um design system único para criar uma experiência viciante, produtiva e esteticamente impressionante.

### 🌟 Funcionalidades Principais

#### 🧑‍💻 Para Profissionais (Workers)
- **Gamificação**: Sistema de Níveis (XP), Conquistas e Badges.
- **Match Inteligente**: Vagas recomendadas baseadas em skills e comportamento.
- **Carteira Digital**: Gestão de ganhos simples e direta.
- **Onboarding Interativo**: Fluxo de entrada engajador e gamificado.

#### 🏢 Para Empresas (Companies)
- **Dashboard Institucional**: Visão clara de KPIs, vagas ativas e candidatos.
- **Criação de Vagas Inteligente**: Wizard com predição de candidatos em tempo real.
- **Analytics Avançado**: Métricas de conversão e eficiência de contratação.
- **Gestão de Talentos**: Ferramentas para filtrar, entrevistar e contratar.

## 🛠️ Tecnologias Utilizadas

O projeto foi construído com uma stack moderna focada em performance e DX (Developer Experience).

- **Frontend**: React (Vite ⚡), TypeScript
- **Estilização**: TailwindCSS (com configuração customizada Neo-brutalista)
- **Ícones**: Lucide React
- **Roteamento**: React Router DOM
- **Backend (Integração)**: Supabase (Auth, Database, Realtime)
- **Design Pattern**: Hooked Model (Gatilho -> Ação -> Recompensa -> Investimento)

## 🎨 Design System: "Worki High-Level Design"

Nosso design é focado em clareza, impacto e profissionalismo.
- **Contraste Alto & Clareza**: Interface nítida para tomada de decisão rápida.
- **Tipografia Forte**: Hierarquia visual clara e moderna.
- **Cores de Destaque**: Verde (#00A651) para sucesso/worker, Azul (#2563EB) para institucional/company.
- **Interface Tátil**: Elementos com feedback visual e responsividade total.

## 🚀 Como Executar o Projeto

Siga os passos abaixo para rodar o Worki localmente:

### Pré-requisitos
- Node.js (v18+)
- NPM ou Yarn

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/worki.git

# 2. Acesse a pasta do frontend
cd worki/frontend

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
# Crie um arquivo .env na raiz do frontend com suas chaves do Supabase
# VITE_SUPABASE_URL=sua_url
# VITE_SUPABASE_ANON_KEY=sua_chave

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

O projeto estará rodando em `http://localhost:5173`.

## 📂 Estrutura do Projeto

```
src/
├── components/     # Componentes Reutilizáveis (Botões, Cards, Inputs)
├── layouts/        # Layouts de Página (MainLayout, CompanyLayout)
├── lib/            # Configurações de bibliotecas (Supabase, Utils)
├── pages/          # Páginas da Aplicação
│   ├── company/    # Páginas exclusivas para Empresas
│   ├── worker/     # Páginas exclusivas para Profissionais
│   └── ...         # Páginas comuns (Login, Home)
└── styles/         # Estilos globais e configurações do Tailwind
```

## 🤝 Contribuição

Contribuições são bem-vindas! Se você tiver uma ideia para melhorar o Worki:

1. Faça um Fork do projeto.
2. Crie uma Branch para sua Feature (`git checkout -b feature/IncrivelFeature`).
3. Faça o Commit (`git commit -m 'Add: Incrivel Feature'`).
4. Faça o Push (`git push origin feature/IncrivelFeature`).
5. Abra um Pull Request.

## 📄 Licença

Este projeto é proprietário e confidencial.

---

Desenvolvido com 🖤 pela Equipe Worki.
