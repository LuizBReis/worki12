import { BarChart2, Eye, Users, CheckCircle, TrendingUp, Download, Calendar, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns';

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

                {/* Rank de Mercado - Real Data Required */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white border-2 border-black rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-lg font-black uppercase opacity-80">Rank de Mercado</h2>
                            <div className="bg-gray-600 text-white text-xs font-black px-2 py-1 rounded border-2 border-gray-500">
                                EM BREVE
                            </div>
                        </div>

                        <div className="mb-6 flex flex-col items-center justify-center py-8">
                            <TrendingUp size={48} className="text-gray-500 mb-4" />
                            <span className="text-xl font-bold text-gray-400 text-center">Dados insuficientes</span>
                        </div>

                        <p className="text-sm font-medium opacity-60 leading-relaxed mb-6 text-center">
                            Continue publicando vagas e contratando para desbloquear seu rank de mercado e comparativo com outras empresas.
                        </p>

                        <div className="w-full bg-gray-700 text-gray-400 font-bold uppercase py-4 rounded-xl text-center text-sm border-2 border-gray-600">
                            Mínimo de 5 contratações necessárias
                        </div>
                    </div>

                    {/* Decorative */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-gray-600/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gray-600/20 rounded-full blur-3xl"></div>
                </div>

            </div>
        </div>
    );
}
