
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Briefcase, Clock, Star, TrendingUp, Award, Zap,
    ChevronRight, CheckCircle2, AlertCircle, Search, Filter,
    Loader2, MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [worker, setWorker] = useState<any>(null);

    // Real Data States
    const [nextJob, setNextJob] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [openJobs, setOpenJobs] = useState<any[]>([]);
    const [quests, setQuests] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return navigate('/login');
            setUser(user);

            // 1. Fetch Worker Profile &Stats
            const { data: workerData, error } = await supabase
                .from('workers')
                .select('*')
                .eq('id', user.id)
                .single();

            if (workerData) {
                setWorker(workerData);

                // Calculate Quests Progress based on real profile data
                const newQuests = [
                    { id: 1, title: 'Adicionar Foto de Perfil', xp: 50, done: !!workerData.avatar_url, action: '/profile' },
                    { id: 2, title: 'Confirmar Email', xp: 100, done: !!user.email_confirmed_at, action: '/profile' },
                    { id: 3, title: 'Adicionar Especialidades', xp: 75, done: (workerData.roles && workerData.roles.length > 0) || !!workerData.primary_role, action: '/profile' },
                ];
                setQuests(newQuests);
            }

            // 2. Fetch Next Scheduled Job
            const { data: nextJobData } = await supabase
                .from('applications')
                .select('status, job:jobs(*, company:companies(name))')
                .eq('worker_id', user.id)
                .in('status', ['approved', 'scheduled'])
                .order('job(date)', { ascending: true })
                .limit(1)
                .single();

            if (nextJobData) setNextJob(nextJobData);

            // 3. Fetch Recent History
            const { data: historyData } = await supabase
                .from('applications')
                .select('status, created_at, job:jobs(title)')
                .eq('worker_id', user.id)
                .in('status', ['completed', 'rejected', 'cancelled'])
                .order('created_at', { ascending: false })
                .limit(3);

            if (historyData) setHistory(historyData);

            // 4. Fetch Open Jobs for Feed (excluding applied ones)
            // First get applied job IDs to exclude
            const { data: appliedApps } = await supabase
                .from('applications')
                .select('job_id')
                .eq('worker_id', user.id);

            const appliedJobIds = appliedApps?.map(a => a.job_id) || [];

            let query = supabase
                .from('jobs')
                .select('*, company:companies(name, logo_url)')
                .eq('status', 'open')
                .order('created_at', { ascending: false })
                .limit(5);

            if (appliedJobIds.length > 0) {
                query = query.not('id', 'in', `(${appliedJobIds.join(',')})`);
            }

            const { data: jobsData } = await query;
            if (jobsData) setOpenJobs(jobsData);

            setLoading(false);
        };

        fetchDashboardData();
    }, [navigate]);

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <Loader2 className="animate-spin" size={32} />
        </div>
    );

    if (!worker) return <div>Erro ao carregar dados.</div>;

    // Helper for Quest Progress
    const completedQuests = quests.filter(q => q.done).length;
    const totalQuests = quests.length;
    const progressPercent = (completedQuests / totalQuests) * 100;

    return (
        <div className="flex flex-col gap-8 pb-12 font-sans text-accent">

            {/* --- WELCOME HEADER (Restored) --- */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-black text-white p-6 rounded-3xl shadow-[4px_4px_0px_0px_rgba(34,197,94,1)] border-2 border-black relative overflow-hidden">
                <div className="z-10 mb-4 md:mb-0">
                    <h1 className="text-3xl font-black uppercase tracking-tight mb-1 flex items-center gap-2">
                        Fala, <span className="text-primary">{worker.full_name?.split(' ')[0]}</span>! <Zap className="text-yellow-400 fill-current" size={24} />
                    </h1>
                    <p className="text-gray-400 font-bold text-sm">Pronto para faturar hoje?</p>
                </div>

                {/* Level Progress in Header */}
                <div className="z-10 w-full md:w-1/2 flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                        <span className="text-xs font-bold uppercase text-gray-400">Próximo Nível</span>
                        <div className="bg-white/10 px-2 py-1 rounded text-[10px] font-bold text-primary uppercase">
                            Faltam {100 - ((worker.xp || 0) % 100)} XP
                        </div>
                    </div>
                    <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden border border-gray-700">
                        <div
                            className="bg-primary h-full relative"
                            style={{ width: `${(worker.xp || 0) % 100}%` }}
                        >
                            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 animate-pulse"></div>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold">Complete mais 1 job para subir de nível e desbloquear novas vagas!</p>
                </div>

                {/* Decorative BG */}
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                    <Award size={120} className="transform translate-x-10 translate-y-10 rotate-12" />
                </div>

                {/* Level Badge Absolute */}
                <div className="absolute top-4 right-4 md:static">
                    <div className="w-12 h-12 rounded-full border-2 border-primary bg-white/10 flex items-center justify-center font-black text-xl italic text-primary relative">
                        {worker.level || 1}
                        <div className="absolute -bottom-2 text-[10px] bg-primary text-black px-1 rounded uppercase font-bold">Lvl</div>
                    </div>
                </div>
            </div>

            {/* --- HERO SECTION: STATS (Hooked: Variable Reward) --- */}
            <header className="grid grid-cols-1 md:grid-cols-4 gap-6">

                {/* 1. Level & XP Card (Simplified since header has it, but keeping as stats) */}
                <div className="bg-black text-white p-6 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,166,81,1)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-30 transition-opacity">
                        <Zap size={100} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-xs font-bold uppercase text-primary tracking-widest">Seu Nível</span>
                                <h2 className="text-5xl font-black italic">LVL {worker.level || 1}</h2>
                            </div>
                            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                                <Award className="text-primary" size={24} />
                            </div>
                        </div>

                        {/* XP Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold uppercase text-gray-400">
                                <span>XP Atual</span>
                                <span>{(worker.xp || 0) % 100}/100 para LVL {(worker.level || 1) + 1}</span>
                            </div>
                            <div className="h-4 bg-white/20 rounded-full overflow-hidden border border-white/10">
                                <div
                                    className="h-full bg-primary transition-all duration-1000 ease-out"
                                    style={{ width: `${(worker.xp || 0) % 100}%` }}
                                >
                                    <div className="w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[progress_1s_linear_infinite]" />
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-500 font-medium mt-1">*Complete jobs para subir de nível e desbloquear vagas VIP.</p>
                        </div>
                    </div>
                </div>

                {/* 2. Earnings Stats */}
                <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg border-2 border-green-500 text-green-700">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-sm font-black uppercase text-gray-400">Ganhos Totais</span>
                    </div>
                    <h3 className="text-4xl font-black text-accent mb-1 truncate" title={`R$ ${worker.earnings_total}`}>R$ {worker.earnings_total || 0}</h3>
                    <p className="text-xs font-bold text-gray-400 flex items-center gap-1">
                        <span className="text-green-600 bg-green-100 px-1 rounded flex items-center">Acumulado</span>
                    </p>
                </div>

                {/* 3. Reputation / Compliments */}
                <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-yellow-100 rounded-lg border-2 border-yellow-500 text-yellow-700">
                            <Star size={20} />
                        </div>
                        <span className="text-sm font-black uppercase text-gray-400">Sua Nota</span>
                    </div>

                    <h3 className="text-4xl font-black text-accent mb-1">{worker.rating_average || 5}</h3>
                    <div className="flex gap-2 mb-3">
                        {/* Mock tags for now until we have reviews tags */}
                        {['Pontual', 'Ágil'].map((tag, i) => (
                            <span key={i} className="text-[10px] uppercase font-black px-2 py-1 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                                {tag}
                            </span>
                        ))}
                    </div>

                    <p className="text-sm font-bold text-gray-500 line-clamp-1">
                        Baseado em {worker.completed_jobs_count || 0} jobs realizados.
                    </p>
                </div>
            </header>


            {/* --- ONBOARDING / INVESTMENT (Hooked: Investment) --- */}
            {completedQuests < totalQuests && (
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
                            {quests.filter(q => !q.done).slice(0, 2).map(quest => (
                                <button key={quest.id} onClick={() => navigate('/profile')} className="flex items-center justify-between w-full md:w-80 bg-white p-3 rounded-xl border-2 border-gray-200 hover:border-black hover:shadow-md transition-all group text-left">
                                    <span className="text-sm font-bold text-gray-700">{quest.title}</span>
                                    <span className="text-xs font-black bg-primary text-white px-2 py-1 rounded-md group-hover:scale-110 transition-transform">
                                        +{quest.xp} XP
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
                        {openJobs.length > 0 ? openJobs.map((job, i) => (
                            <div key={i} className="group bg-white border-2 border-black p-6 rounded-2xl hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,166,81,1)] transition-all cursor-pointer relative overflow-hidden">

                                {/* Match Badge (Mocked logic for now) */}
                                <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl border-b-2 border-l-2 border-white">
                                    95% Match
                                </div>

                                <div className="flex gap-4 items-start">
                                    <div className="w-14 h-14 bg-gray-100 rounded-xl border-2 border-black flex items-center justify-center shrink-0 overflow-hidden">
                                        {job.company?.logo_url ? <img src={job.company.logo_url} className="w-full h-full object-cover" /> : <Briefcase size={24} />}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-black uppercase text-accent mb-1">{job.title}</h3>
                                        <p className="text-sm font-bold text-gray-400 mb-3">{job.company?.name || 'Empresa Confidencial'} • {job.location}</p>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <span className="flex items-center gap-1 text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-md uppercase">
                                                <Clock size={12} /> {new Date(job.start_date).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md uppercase">
                                                <Zap size={12} /> +XP
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end justify-between self-stretch">
                                        <div className="text-right">
                                            <span className="block text-2xl font-black text-accnent">R$ {job.budget}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">por turno</span>
                                        </div>
                                        <button className="bg-primary hover:bg-black text-white px-6 py-2 rounded-xl font-black uppercase text-sm transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-0 active:translate-y-1">
                                            Aceitar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <Search size={48} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-bold text-gray-500 mb-2">Nenhuma vaga aberta encontrada.</h3>
                                <p className="text-sm text-gray-400">Verifique novamente em breve.</p>
                            </div>
                        )}
                    </div>
                </main>


                {/* --- SIDEBAR: HISTORY & RE-ENGAGEMENT (Hooked: Internal Trigger) --- */}
                <aside className="space-y-6">

                    {/* Next Shift */}
                    <div className="bg-black text-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]">
                        <h3 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
                            <Clock size={18} className="text-primary" /> Próximo Job
                        </h3>
                        {nextJob ? (
                            <>
                                <div className="bg-white/10 p-4 rounded-xl border border-white/10 mb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-2xl font-black">{new Date(nextJob.job.date).getDate()} {new Date(nextJob.job.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                                        <span className="bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{nextJob.status}</span>
                                    </div>
                                    <p className="font-bold text-lg leading-tight">{nextJob.job.title}</p>
                                    <p className="text-sm text-gray-400">{nextJob.job.start_time || 'Horário indefinido'}</p>
                                </div>
                                <button onClick={() => navigate('/jobs')} className="w-full bg-white text-black font-black uppercase py-3 rounded-xl hover:bg-primary hover:text-white transition-colors">
                                    Ver Detalhes
                                </button>
                            </>
                        ) : (
                            <div className="text-center py-6 text-gray-500 font-bold bg-white/5 rounded-xl border border-white/5">
                                Nenhum job agendado.
                            </div>
                        )}
                    </div>

                    {/* Recent History */}
                    <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-sm">
                        <h3 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
                            <CheckCircle2 size={18} /> Histórico Recente
                        </h3>
                        <div className="space-y-3">
                            {history.length > 0 ? history.map((h, i) => (
                                <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer border-b border-gray-100 last:border-0">
                                    <div>
                                        <p className="font-bold text-sm truncate max-w-[120px]" title={h.job.title}>{h.job.title}</p>
                                        <p className="text-xs text-gray-400">{new Date(h.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${h.status === 'completed' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                                        {h.status === 'completed' ? 'Sucesso' : 'Cancelado'}
                                    </span>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-400 text-center py-4">Sem histórico recente.</p>
                            )}
                        </div>
                        <button onClick={() => navigate('/jobs')} className="w-full mt-4 text-xs font-black uppercase text-gray-500 hover:text-black flex items-center justify-center gap-1">
                            Ver tudo <ChevronRight size={12} />
                        </button>
                    </div>

                </aside>
            </div>
        </div>
    );
}
