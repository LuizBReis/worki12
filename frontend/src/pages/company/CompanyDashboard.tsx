import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, TrendingUp, Search, Filter, Loader2, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CompanyDashboard() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<any[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeJobs: 0,
        totalCandidates: 0,
        views: 0
    });
    const [companyName, setCompanyName] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch Company Details (Name)
            const { data: companyData } = await supabase
                .from('companies')
                .select('name')
                .eq('id', user.id)
                .single();

            // Fetch Jobs
            const { data: jobsData } = await supabase
                .from('jobs')
                .select('*, views') // Ensure 'views' is selected
                .eq('company_id', user.id)
                .order('created_at', { ascending: false });

            // Fetch Recent Applications (Activities)
            // Note: This relies on the new 'applications' table. If empty, it won't crash.
            const { data: appsData } = await supabase
                .from('applications')
                .select('*, jobs!inner(title, company_id)')
                .eq('jobs.company_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (jobsData) {
                setJobs(jobsData);

                // Calculate Stats
                const active = jobsData.filter(j => j.status === 'open').length;
                const candidates = jobsData.reduce((acc, job) => acc + (job.candidates_count || 0), 0); // Logic: job.candidates_count should be updated by a trigger or manually when app comes in
                // For now we trust the column. If we switch to counting 'applications' table, we can do that too.
                // Stick to candidates_count column for now, assuming another process updates it or we implement it later.

                const views = jobsData.reduce((acc, job) => acc + (job.views || 0), 0);

                setStats({
                    activeJobs: active,
                    totalCandidates: candidates,
                    views: views
                });

                // Blend Activities (New Jobs + New Applications)
                const jobActivities = jobsData.slice(0, 5).map(job => ({
                    type: 'job_created',
                    text: `Vaga criada: "${job.title}"`,
                    time: job.created_at,
                    id: job.id
                }));

                const appActivities = (appsData || []).map(app => ({
                    type: 'application',
                    text: `Novo candidato para "${app.jobs.title}"`,
                    time: app.created_at,
                    id: app.id
                }));

                const blended = [...jobActivities, ...appActivities]
                    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                    .slice(0, 5);

                setActivities(blended);
            }

            if (companyData) {
                setCompanyName(companyData.name);
            }
        } catch (error) {
            console.error('Error fetching dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Dashboard</h1>
                    <p className="text-gray-500 font-medium">Bem-vindo de volta, {companyName || 'Empresa'}</p>
                </div>
                {/* Button Removed as requested */}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {[
                    { title: 'Vagas Ativas', value: stats.activeJobs, icon: Briefcase, color: 'bg-blue-100 text-blue-600' },
                    { title: 'Total Candidatos', value: stats.totalCandidates, icon: Users, color: 'bg-green-100 text-green-600' },
                    { title: 'Visualizações', value: stats.views, icon: TrendingUp, color: 'bg-purple-100 text-purple-600' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white border-2 border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.15)] transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg ${stat.color} border-2 border-black`}>
                                <stat.icon size={24} />
                            </div>
                            <span className="text-xs font-black uppercase bg-gray-100 px-2 py-1 rounded">Hoje</span>
                        </div>
                        <h3 className="text-4xl font-black mb-1">{stat.value}</h3>
                        <p className="text-gray-500 font-bold uppercase text-xs">{stat.title}</p>
                    </div>
                ))}
            </div>

            {/* Recent Jobs Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Job List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black uppercase flex items-center gap-2">
                            <Briefcase size={20} /> Vagas Recentes
                        </h2>
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors border-2 border-transparent hover:border-black">
                                <Search size={18} />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors border-2 border-transparent hover:border-black">
                                <Filter size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-10 font-bold text-gray-400 animate-pulse flex flex-col items-center gap-2">
                                <Loader2 className="animate-spin" />
                                Carregando dados...
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-xl">
                                <p className="font-bold text-gray-500">Nenhuma vaga encontrada.</p>
                                <button onClick={() => navigate('/company/create')} className="text-blue-600 font-black text-sm uppercase mt-2 hover:underline">Criar primeira vaga</button>
                            </div>
                        ) : (
                            jobs.slice(0, 5).map((job) => (
                                <div key={job.id} onClick={() => navigate('/company/jobs')} className="bg-white border-2 border-black rounded-xl p-5 hover:translate-x-1 hover:-translate-y-1 transition-transform cursor-pointer group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-black text-lg uppercase group-hover:text-blue-600 transition-colors">{job.title}</h3>
                                            <p className="text-xs font-bold text-gray-400 uppercase">{job.location || 'Remoto'} • {job.type === 'freelance' ? 'Freelance' : 'Fixo'}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border border-black ${job.status === 'open' ? 'bg-green-400' : 'bg-gray-200'}`}>
                                            {job.status === 'open' ? 'Ativa' : 'Fechada'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm font-bold border-t-2 border-gray-50 pt-3 mt-3">
                                        <div className="flex items-center gap-1.5">
                                            <Users size={16} className="text-gray-400" />
                                            <span>{job.candidates_count || 0} Candidatos</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <TrendingUp size={16} />
                                            <span>{job.views || 0} Visualizações</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="space-y-6">
                    <h2 className="text-xl font-black uppercase flex items-center gap-2">
                        <Bell size={20} /> Atividade Recente
                    </h2>
                    <div className="bg-gray-50 border-2 border-black rounded-xl p-6 space-y-6">
                        {loading ? (
                            <div className="text-center py-4 text-gray-400"><Loader2 className="animate-spin inline" /></div>
                        ) : activities.length === 0 ? (
                            <p className="text-sm text-gray-400 font-bold text-center">Nenhuma atividade recente.</p>
                        ) : (
                            activities.map((activity, i) => (
                                <div key={i} className="flex gap-3 items-start animate-in fade-in slide-in-from-right-4" style={{ animationDelay: `${i * 100}ms` }}>
                                    <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${activity.type === 'job_created' ? 'bg-blue-500' : 'bg-green-500'}`} />
                                    <div>
                                        <p className="text-sm font-bold leading-tight">{activity.text}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                                            {formatDistanceToNow(new Date(activity.time), { addSuffix: true, locale: ptBR })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="bg-blue-600 text-white border-2 border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                        <h3 className="font-black uppercase text-lg mb-2">Dica Pro</h3>
                        <p className="text-sm opacity-90 mb-4">Empresas com perfis completos recebem 3x mais candidatos qualificados.</p>
                        <button onClick={() => navigate('/company/profile')} className="bg-white text-black w-full py-2 rounded-lg font-bold uppercase text-xs hover:bg-gray-100 transition-colors">
                            Completar Perfil
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
