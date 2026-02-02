
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, Award, Clock, Star, Activity, BarChart2, Loader2, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Analytics() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        rating: null as number | null,
        reliability: null as number | null,
        totalJobs: 0,
        totalEarnings: 0,
        hoursWorked: 0,
        categoryDistribution: [] as any[],
        marketValueHistory: [] as any[]
    });

    useEffect(() => {
        const fetchAnalytics = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return navigate('/login');

            // Fetch worker stats
            const { data: worker } = await supabase
                .from('workers')
                .select('rating_average, completed_jobs_count, earnings_total, roles')
                .eq('id', user.id)
                .single();

            // Fetch applications for detailed analysis
            const { data: apps } = await supabase
                .from('applications')
                .select('status, job:jobs(title, budget, work_start_time, work_end_time, start_date)')
                .eq('worker_id', user.id);

            if (worker) {
                let reliability: number | null = null;
                let hours = 0;
                const categories: Record<string, number> = {};
                const valueHistory: number[] = [];

                if (apps && apps.length > 0) {
                    // Reliability: 100 - (Cancelled / Total * 100)
                    // Assuming 'cancelled' status counts against reliability if worker cancelled (need logic for who cancelled, but for now simplistic)
                    const totalApps = apps.filter(a => ['completed', 'cancelled', 'no_show'].includes(a.status)).length;
                    const failedApps = apps.filter(a => ['cancelled', 'no_show'].includes(a.status)).length;

                    if (totalApps > 0) {
                        reliability = Math.round(((totalApps - failedApps) / totalApps) * 100);
                    }

                    apps.forEach((app: any) => {
                        if (app.status === 'completed') {
                            // Hours Estimate (Default 6h if null)
                            let duration = 6;
                            if (app.job?.work_start_time && app.job?.work_end_time) {
                                const start = parseInt(app.job.work_start_time.split(':')[0]);
                                const end = parseInt(app.job.work_end_time.split(':')[0]);
                                duration = (end < start ? end + 24 : end) - start;
                            }
                            hours += duration;

                            // Categories
                            if (app.job?.title) {
                                const title = app.job.title.split(' ')[0];
                                categories[title] = (categories[title] || 0) + 1;
                            }

                            // Market Value History (Hourly Rate)
                            if (app.job?.budget && duration > 0) {
                                valueHistory.push(Math.round(app.job.budget / duration));
                            }
                        }
                    });
                }

                // Format category distribution
                const totalCats = Object.values(categories).reduce((a, b) => a + b, 0) || 1;
                const dist = Object.keys(categories).map(cat => ({
                    label: cat,
                    val: Math.round((categories[cat] / totalCats) * 100),
                    color: 'bg-primary'
                })).sort((a, b) => b.val - a.val).slice(0, 4);

                // Use real history or empty
                // If history is empty, chart will show empty state
                const history = valueHistory.length >= 2 ? valueHistory.slice(-6) : [];

                setStats({
                    rating: worker.rating_average || null,
                    reliability: reliability,
                    totalJobs: worker.completed_jobs_count || 0,
                    totalEarnings: worker.earnings_total || 0,
                    hoursWorked: hours,
                    categoryDistribution: dist,
                    marketValueHistory: history
                });
            }

            setLoading(false);
        };

        fetchAnalytics();
    }, [navigate]);

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <Loader2 className="animate-spin" size={32} />
        </div>
    );

    return (
        <div className="flex flex-col gap-8 pb-12 font-sans text-accent max-w-5xl mx-auto">

            {/* Header */}
            <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Seus Dados</h2>
                <p className="text-gray-500 font-bold">Acompanhe seu desempenho e valor de mercado.</p>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(0,166,81,1)] transition-all">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg border-2 border-green-500 text-green-700">
                            <Star size={20} />
                        </div>
                        <span className="text-sm font-black uppercase text-gray-400">Nota Média</span>
                    </div>
                    <h3 className="text-4xl font-black">{stats.rating !== null ? stats.rating : '-'}<span className="text-lg text-gray-400">/5</span></h3>
                    <p className="text-xs font-bold text-green-600 mt-2">{stats.rating !== null ? 'Baseado em avaliações' : 'Sem avaliações'}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(0,166,81,1)] transition-all">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg border-2 border-blue-500 text-blue-700">
                            <Clock size={20} />
                        </div>
                        <span className="text-sm font-black uppercase text-gray-400">Confiabilidade</span>
                    </div>
                    <h3 className="text-4xl font-black">{stats.reliability !== null ? `${stats.reliability}%` : '-'}</h3>
                    <p className="text-xs font-bold text-gray-400 mt-2">{stats.reliability !== null ? 'Assiduidade' : 'Sem dados suficientes'}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(0,166,81,1)] transition-all">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 rounded-lg border-2 border-purple-500 text-purple-700">
                            <Activity size={20} />
                        </div>
                        <span className="text-sm font-black uppercase text-gray-400">Job Realizados</span>
                    </div>
                    <h3 className="text-4xl font-black">{stats.totalJobs}</h3>
                    <p className="text-xs font-bold text-gray-400 mt-2">{stats.hoursWorked}h trabalhadas</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(0,166,81,1)] transition-all">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-100 rounded-lg border-2 border-yellow-500 text-yellow-700">
                            <DollarSign size={20} />
                        </div>
                        <span className="text-sm font-black uppercase text-gray-400">Ganhos Totais</span>
                    </div>
                    <h3 className="text-3xl font-black truncate" title={`R$ ${stats.totalEarnings}`}>R$ {stats.totalEarnings}</h3>
                    <p className="text-xs font-bold text-green-600 mt-2">Acumulado</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* 1. Market Value Graph (Dynamic) */}
                <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black uppercase flex items-center gap-2">
                            <TrendingUp size={20} /> Valor de Mercado (Hora)
                        </h3>
                    </div>

                    <div className="h-64 flex items-end justify-between gap-2">
                        {stats.marketValueHistory.length > 0 ? stats.marketValueHistory.map((val, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">R${val}</div>
                                <div
                                    className="w-full bg-primary/20 border-2 border-primary rounded-t-lg transition-all hover:bg-primary hover:scale-y-110 origin-bottom relative group-hover:shadow-[0_0_10px_rgba(0,166,81,0.5)]"
                                    style={{ height: `${(val / 60) * 100}%` }}
                                ></div>
                            </div>
                        )) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold border-2 border-dashed border-gray-100 rounded-xl">
                                Realize jobs para ver seu histórico de valor/hora.
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Job Distribution */}
                <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black uppercase flex items-center gap-2">
                            <BarChart2 size={20} /> Categorias
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {stats.categoryDistribution.length > 0 ? stats.categoryDistribution.map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm font-bold mb-1">
                                    <span>{item.label}</span>
                                    <span>{item.val}%</span>
                                </div>
                                <div className="h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                    <div className={`h-full ${item.color}`} style={{ width: `${item.val}%` }}></div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                                <p className="font-bold text-sm">Nenhum job realizado ainda.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Recommendations */}
            <div className="bg-black text-white p-8 rounded-2xl border-2 border-black overflow-hidden relative">
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black uppercase text-primary mb-2">Dica do Worki</h3>
                        <p className="font-medium max-w-xl">Trabalhadores com cursos de <span className="text-primary underline">Mixologia</span> ganham em média 30% a mais por hora. Que tal se especializar?</p>
                    </div>
                    <button className="bg-white text-black px-6 py-3 rounded-xl font-black uppercase hover:scale-105 transition-transform" onClick={() => alert('Feature em breve!')}>
                        Ver Cursos
                    </button>
                </div>
                <Award size={200} className="absolute -bottom-10 -right-10 text-white/5 rotate-12" />
            </div>

        </div>
    );
}
