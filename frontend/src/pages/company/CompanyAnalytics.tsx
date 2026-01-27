import { BarChart2, Eye, Users, CheckCircle, TrendingUp, Download, Calendar, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CompanyAnalytics() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalViews: 0,
        totalCandidates: 0,
        hires: 0,
        conversionRate: 0
    });
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch Jobs for Views
            const { data: jobs } = await supabase
                .from('jobs')
                .select('id, views, created_at')
                .eq('company_id', user.id);

            // 2. Fetch Applications for Candidates & Chart
            // We need applications for jobs owned by this company.
            const { data: applications } = await supabase
                .from('applications')
                .select('id, created_at, status, jobs!inner(company_id)')
                .eq('jobs.company_id', user.id);

            if (jobs && applications) {
                // KPIs
                const totalViews = jobs.reduce((acc, job) => acc + (job.views || 0), 0);
                const totalCandidates = applications.length;
                const hires = applications.filter(app => app.status === 'hired').length;
                const conversionRate = totalViews > 0 ? ((totalCandidates / totalViews) * 100).toFixed(1) : 0;

                setStats({
                    totalViews,
                    totalCandidates,
                    hires,
                    conversionRate: Number(conversionRate)
                });

                // Chart Data (Last 12 Days)
                const today = new Date();
                const last12Days = eachDayOfInterval({
                    start: subDays(today, 11),
                    end: today
                });

                const chart = last12Days.map(day => {
                    const count = applications.filter(app => isSameDay(new Date(app.created_at), day)).length;
                    return {
                        date: day,
                        label: format(day, 'dd/MM'),
                        value: count
                    };
                });

                setChartData(chart);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center p-20">
                <Loader2 className="animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Performance de Contratação</h1>
                    <p className="text-gray-500 font-medium">Analise a eficiência das suas vagas e o alcance da sua marca.</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 bg-white border-2 border-black px-4 py-2 rounded-xl font-bold uppercase text-xs hover:bg-gray-50 transition-colors">
                        <Calendar size={16} /> Últimos 12 dias
                    </button>
                    <button className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl font-bold uppercase text-xs hover:bg-gray-800 transition-colors">
                        <Download size={16} /> Exportar
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-6 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg border-2 border-black text-blue-600">
                            <Eye size={24} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div className="text-4xl font-black tracking-tight mb-1">{stats.totalViews}</div>
                    <div className="text-xs font-bold uppercase text-gray-400">Visualizações Totais</div>
                </div>

                <div className="p-6 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg border-2 border-black text-purple-600">
                            <Users size={24} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div className="text-4xl font-black tracking-tight mb-1">{stats.totalCandidates}</div>
                    <div className="text-xs font-bold uppercase text-gray-400">Total Candidatos</div>
                </div>

                <div className="p-6 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-green-100 rounded-lg border-2 border-black text-green-600">
                            <CheckCircle size={24} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div className="text-4xl font-black tracking-tight mb-1">{stats.hires}</div>
                    <div className="text-xs font-bold uppercase text-gray-400">Contratações</div>
                </div>

                <div className="p-6 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-orange-100 rounded-lg border-2 border-black text-orange-600">
                            <TrendingUp size={24} strokeWidth={2.5} />
                        </div>
                    </div>
                    <div className="text-4xl font-black tracking-tight mb-1">{stats.conversionRate}%</div>
                    <div className="text-xs font-bold uppercase text-gray-400">Taxa de Conversão</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Chart Area */}
                <div className="lg:col-span-2 bg-white border-2 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                    <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                        <BarChart2 size={24} /> Crescimento de Candidatos
                    </h2>

                    {/* CSS-only Bar Chart */}
                    <div className="h-64 flex items-end justify-between gap-2 md:gap-4 px-4 pb-2 border-b-2 border-gray-100">
                        {chartData.map((data, i) => (
                            <div key={i} className="flex-1 flex flex-col justify-end items-center group relative cursor-pointer">
                                <div
                                    className="w-full bg-black/10 group-hover:bg-blue-600 transition-all rounded-t-lg relative"
                                    style={{ height: `${Math.max(data.value * 10, 5)}%` }} // Scaling for visibility
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {data.value}
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 mt-2">{data.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end gap-6 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                            <span className="text-xs font-bold uppercase text-gray-500">Candidaturas</span>
                        </div>
                    </div>
                </div>

                {/* Engagement / Hooked Component (MOCKED as requested) */}
                <div className="bg-gradient-to-br from-indigo-900 to-black text-white border-2 border-black rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-lg font-black uppercase opacity-80">Rank de Mercado</h2>
                            <div className="bg-yellow-400 text-black text-xs font-black px-2 py-1 rounded border-2 border-black">
                                TOP 15%
                            </div>
                        </div>

                        <div className="mb-2 flex justify-between items-end">
                            <span className="text-4xl font-black">92<span className="text-xl">.0</span></span>
                            <span className="text-xs font-bold uppercase opacity-60 mb-2">Score de Eficiência</span>
                        </div>

                        <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden border border-white/20 mb-6">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 w-[92%] relative">
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white animate-pulse"></div>
                            </div>
                        </div>

                        <p className="text-sm font-medium opacity-80 leading-relaxed mb-6">
                            Você é mais rápido que 85% das empresas do seu setor. Continue respondendo rápido para alcançar o selo <span className="text-yellow-400 font-bold">Top Employer</span>.
                        </p>

                        <button className="w-full bg-white text-black font-black uppercase py-4 rounded-xl hover:bg-yellow-400 transition-colors border-2 border-transparent hover:border-black">
                            Ver Comparativo Completo
                        </button>
                    </div>

                    {/* Decorative */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/30 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-600/30 rounded-full blur-3xl"></div>
                </div>

            </div>
        </div>
    );
}
