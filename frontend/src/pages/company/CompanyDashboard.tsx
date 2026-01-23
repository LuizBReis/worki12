import { PlusCircle, Search, Users, Eye, Briefcase, TrendingUp, Bell, ChevronRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CompanyDashboard() {
    const navigate = useNavigate();

    const stats = [
        { label: 'Vagas Ativas', value: '3', icon: Briefcase, color: 'bg-blue-500' },
        { label: 'Candidaturas', value: '48', icon: Users, color: 'bg-green-500' },
        { label: 'Visualizações', value: '1.2k', icon: Eye, color: 'bg-purple-500' },
        { label: 'Taxa de Contratação', value: '85%', icon: TrendingUp, color: 'bg-orange-500' },
    ];

    const recentActivity = [
        {
            user: 'Maria Silva',
            action: 'aplicou para',
            target: 'UX Designer Senior',
            time: '2 min atrás',
            image: null
        },
        {
            user: 'João Pedro',
            action: 'aplicou para',
            target: 'Desenvolvedor Frontend',
            time: '15 min atrás',
            image: null
        },
        {
            user: 'Sistema',
            action: 'Vaga expirando:',
            target: 'Product Manager',
            time: '1 hora atrás',
            image: null
        }
    ];

    const activeJobs = [
        { title: 'Senior UX Designer', candidates: 12, status: 'Ativa', type: 'Full-time' },
        { title: 'Frontend Developer', candidates: 34, status: 'Ativa', type: 'Freela' },
        { title: 'Product Manager', candidates: 2, status: 'Revisão', type: 'Full-time' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter">
                        Olá, <span className="text-blue-600">Tech Corp.</span>
                    </h1>
                    <p className="text-gray-500 font-medium">Aqui está o resumo da sua operação hoje.</p>
                </div>

                <button
                    onClick={() => navigate('/company/create')}
                    className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-black uppercase hover:bg-blue-600 transition-all hover:scale-105 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                    <PlusCircle size={20} strokeWidth={3} />
                    Criar Nova Vaga
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white border-2 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[4px_4px_0px_0px_rgba(0,166,81,1)] transition-all cursor-default group">
                        <div className="flex justify-between items-start mb-2">
                            <stat.icon className={`text-black group-hover:scale-110 transition-transform duration-300`} size={24} strokeWidth={2.5} />
                            <span className={`w-3 h-3 rounded-full border border-black ${stat.color}`}></span>
                        </div>
                        <div className="text-3xl font-black tracking-tight">{stat.value}</div>
                        <div className="text-xs font-bold uppercase text-gray-400">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Content - Active Jobs */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border-2 border-black rounded-xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                        <div className="p-6 border-b-2 border-black flex justify-between items-center bg-gray-50">
                            <h2 className="text-xl font-black uppercase flex items-center gap-2">
                                <Search size={20} /> Vagas Recentes
                            </h2>
                            <button className="text-xs font-bold uppercase underline decoration-2 hover:text-blue-600">Ver Todas</button>
                        </div>
                        <div className="p-4 space-y-3">
                            {activeJobs.map((job, i) => (
                                <div key={i} className="flex items-center justify-between p-4 border-2 border-gray-100 hover:border-black rounded-xl transition-all group bg-white">
                                    <div>
                                        <h3 className="font-bold text-lg leading-none mb-1 group-hover:text-blue-600 transition-colors">{job.title}</h3>
                                        <div className="flex gap-2">
                                            <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-500 uppercase">{job.type}</span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded text-white uppercase ${job.status === 'Ativa' ? 'bg-green-500' : 'bg-orange-400'}`}>{job.status}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right hidden sm:block">
                                            <div className="text-xl font-black">{job.candidates}</div>
                                            <div className="text-[10px] font-bold uppercase text-gray-400">Candidatos</div>
                                        </div>
                                        <button className="p-2 border-2 border-transparent hover:border-black rounded-lg transition-all hover:bg-gray-50">
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Content - Activity Feed */}
                <div className="space-y-6">
                    {/* Activity Feed */}
                    <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black uppercase flex items-center gap-2">
                                <Bell size={18} /> Atividade
                            </h2>
                        </div>
                        <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-100">
                            {recentActivity.map((activity, i) => (
                                <div key={i} className="relative pl-10">
                                    <div className="absolute left-0 top-0 w-10 h-10 flex items-center justify-center">
                                        <div className="w-3 h-3 bg-black rounded-full border-2 border-white ring-2 ring-gray-100"></div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium leading-tight mb-1">
                                            <span className="font-bold">{activity.user}</span> {activity.action} <span className="font-bold text-blue-600">{activity.target}</span>
                                        </p>
                                        <span className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                                            <Clock size={10} /> {activity.time}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 py-3 border-2 border-black rounded-lg font-bold uppercase text-xs hover:bg-black hover:text-white transition-all">
                            Ver Histórico Completo
                        </button>
                    </div>

                    {/* Hooked Trigger - Upgrade/Boost */}
                    <div className="bg-blue-600 text-white border-2 border-black rounded-xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group cursor-pointer hover:translate-y-[-2px] transition-all">
                        <div className="relative z-10">
                            <h3 className="text-xl font-black uppercase italic mb-2">Boost Premium</h3>
                            <p className="text-sm font-medium mb-4 opacity-90">Destaque sua vaga e receba 3x mais candidatos qualificados.</p>
                            <div className="inline-flex items-center gap-2 font-black uppercase text-xs bg-white text-blue-600 px-3 py-2 rounded-lg border-2 border-black">
                                Ativar Agora <TrendingUp size={14} />
                            </div>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-20 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                            <TrendingUp size={100} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
