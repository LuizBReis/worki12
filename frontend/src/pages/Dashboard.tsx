import { useState } from 'react';
import {
    Briefcase, Clock, Star,
    TrendingUp, Award, Zap, ChevronRight,
    CheckCircle2, AlertCircle, Search, Filter
} from 'lucide-react';

export default function Dashboard() {
    // Mock User State - imitating a "Hooked" user journey
    const [xp] = useState(75); // 75% to next level
    const [level] = useState(3);
    const [earnings] = useState(850);

    // "Quests" - Onboarding & Investment mechanics
    const onboardingSteps = [
        { id: 1, title: 'Adicionar Foto de Perfil', xp: 50, done: true },
        { id: 2, title: 'Verificar Identidade', xp: 100, done: true },
        { id: 3, title: 'Adicionar Experiência Anterior', xp: 75, done: false },
        { id: 4, title: 'Completar Cadastro Pix', xp: 50, done: false },
    ];

    return (
        <div className="flex flex-col gap-8 pb-12">

            {/* --- HERO SECTION: REWARD & STATUS (Hooked: Variable Reward) --- */}
            <header className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* 1. Level & XP Card */}
                <div className="bg-black text-white p-6 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,166,81,1)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-30 transition-opacity">
                        <Zap size={100} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-xs font-bold uppercase text-primary tracking-widest">Seu Nível</span>
                                <h2 className="text-5xl font-black italic">LVL {level}</h2>
                            </div>
                            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                                <Award className="text-primary" size={24} />
                            </div>
                        </div>

                        {/* XP Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold uppercase text-gray-400">
                                <span>XP Atual</span>
                                <span>{xp}% para LVL {level + 1}</span>
                            </div>
                            <div className="h-4 bg-white/20 rounded-full overflow-hidden border border-white/10">
                                <div
                                    className="h-full bg-primary transition-all duration-1000 ease-out"
                                    style={{ width: `${xp}%` }}
                                >
                                    <div className="w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[progress_1s_linear_infinite]" />
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-500 font-medium mt-1">*Complete missões para subir de nível e desbloquear vagas VIP.</p>
                        </div>
                    </div>
                </div>

                {/* 2. Earnings Stats */}
                <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg border-2 border-green-500 text-green-700">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-sm font-black uppercase text-gray-400">Ganhos da Semana</span>
                    </div>
                    <h3 className="text-4xl font-black text-accent mb-1">R$ {earnings},00</h3>
                    <p className="text-xs font-bold text-gray-400 flex items-center gap-1">
                        <span className="text-green-600 bg-green-100 px-1 rounded flex items-center">+12%</span> vs semana passada
                    </p>
                </div>

                {/* 3. Reputation / Compliments */}
                <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-yellow-100 rounded-lg border-2 border-yellow-500 text-yellow-700">
                            <Star size={20} />
                        </div>
                        <span className="text-sm font-black uppercase text-gray-400">Reputação</span>
                    </div>

                    <div className="flex gap-2 mb-3">
                        {['Pontual', 'Ágil', 'Proativo'].map((tag, i) => (
                            <span key={i} className="text-[10px] uppercase font-black px-2 py-1 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                                {tag}
                            </span>
                        ))}
                        <span className="text-[10px] uppercase font-black px-2 py-1 bg-black text-white rounded-md">+2</span>
                    </div>

                    <p className="text-sm font-bold text-gray-500 line-clamp-2">
                        "O Pedro é excelente! Chegou no horário e salvou o serviço de hoje."
                    </p>
                </div>
            </header>


            {/* --- ONBOARDING / INVESTMENT (Hooked: Investment) --- */}
            {onboardingSteps.some(s => !s.done) && (
                <section className="bg-[#F4F4F0] border-2 border-black rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                        <div>
                            <h3 className="text-xl font-black uppercase mb-1 flex items-center gap-2">
                                <AlertCircle size={20} className="text-primary" /> Complete seu Perfil
                            </h3>
                            <p className="text-sm font-bold text-gray-500">
                                Complete essas tarefas para ganhar <span className="text-black bg-white px-1">XP</span> e aparecer para mais empresas.
                            </p>
                        </div>

                        <div className="w-full md:w-auto flex flex-col gap-3">
                            {onboardingSteps.filter(s => !s.done).slice(0, 2).map(step => (
                                <button key={step.id} className="flex items-center justify-between w-full md:w-80 bg-white p-3 rounded-xl border-2 border-gray-200 hover:border-black hover:shadow-md transition-all group text-left">
                                    <span className="text-sm font-bold text-gray-700">{step.title}</span>
                                    <span className="text-xs font-black bg-primary text-white px-2 py-1 rounded-md group-hover:scale-110 transition-transform">
                                        +{step.xp} XP
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
            )}


            <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8">

                {/* --- FEED: TRIGGER & ACTION (Hooked: External Trigger) --- */}
                <main className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border-2 border-black shadow-sm">
                        <h2 className="text-xl font-black uppercase flex items-center gap-2">
                            <Briefcase size={20} /> Vagas para Você
                        </h2>
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-gray-100 rounded-lg"><Search size={20} /></button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg"><Filter size={20} /></button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {[
                            { title: 'Garçom - Evento VIP', company: 'Hotel Grand Hyatt', location: 'Barra, RJ', pay: 180, time: 'Hoje, 19:00', xp: 50, match: 98 },
                            { title: 'Auxiliar de Cozinha', company: 'Restaurante Fasano', location: 'Leblon, RJ', pay: 150, time: 'Amanhã, 08:00', xp: 40, match: 85 },
                            { title: 'Promotor de Vendas', company: 'Ambev', location: 'Centro, RJ', pay: 200, time: 'Sexta, 14:00', xp: 60, match: 70 },
                        ].map((job, i) => (
                            <div key={i} className="group bg-white border-2 border-black p-6 rounded-2xl hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,166,81,1)] transition-all cursor-pointer relative overflow-hidden">

                                {/* Match Badge */}
                                <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl border-b-2 border-l-2 border-white">
                                    {job.match}% Match
                                </div>

                                <div className="flex gap-4 items-start">
                                    <div className="w-14 h-14 bg-gray-100 rounded-xl border-2 border-black flex items-center justify-center shrink-0">
                                        <Briefcase size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-black uppercase text-accent mb-1">{job.title}</h3>
                                        <p className="text-sm font-bold text-gray-400 mb-3">{job.company} • {job.location}</p>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <span className="flex items-center gap-1 text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-md uppercase">
                                                <Clock size={12} /> {job.time}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md uppercase">
                                                <Zap size={12} /> +{job.xp} XP
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end justify-between self-stretch">
                                        <div className="text-right">
                                            <span className="block text-2xl font-black text-accnent">R$ {job.pay}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">por turno</span>
                                        </div>
                                        <button className="bg-primary hover:bg-black text-white px-6 py-2 rounded-xl font-black uppercase text-sm transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-0 active:translate-y-1">
                                            Aceitar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>


                {/* --- SIDEBAR: HISTORY & RE-ENGAGEMENT (Hooked: Internal Trigger) --- */}
                <aside className="space-y-6">

                    {/* Next Shift */}
                    <div className="bg-black text-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
                        <h3 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
                            <Clock size={18} className="text-primary" /> Próximo Job
                        </h3>
                        <div className="bg-white/10 p-4 rounded-xl border border-white/10 mb-4">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-2xl font-black">22 SET</span>
                                <span className="bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded-full">CONFIRMADO</span>
                            </div>
                            <p className="font-bold text-lg leading-tight">Garçom - Casamento</p>
                            <p className="text-sm text-gray-400">18:00 - 02:00</p>
                        </div>
                        <button className="w-full bg-white text-black font-black uppercase py-3 rounded-xl hover:bg-primary hover:text-white transition-colors">
                            Ver Detalhes
                        </button>
                    </div>

                    {/* Recent History */}
                    <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-sm">
                        <h3 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
                            <CheckCircle2 size={18} /> Histórico
                        </h3>
                        <div className="space-y-3">
                            {[
                                { title: 'Auxiliar Extra', date: 'Há 2 dias', result: 'Sucesso' },
                                { title: 'Barman', date: 'Há 1 sem', result: 'Sucesso' },
                            ].map((h, i) => (
                                <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer border-b border-gray-100 last:border-0">
                                    <div>
                                        <p className="font-bold text-sm">{h.title}</p>
                                        <p className="text-xs text-gray-400">{h.date}</p>
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-green-600 bg-green-100 px-2 py-1 rounded-md">
                                        {h.result}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-4 text-xs font-black uppercase text-gray-500 hover:text-black flex items-center justify-center gap-1">
                            Ver tudo <ChevronRight size={12} />
                        </button>
                    </div>

                </aside>
            </div>
        </div>
    );
}
