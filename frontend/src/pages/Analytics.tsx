import { TrendingUp, Award, Clock, Star, Activity, BarChart2 } from 'lucide-react';

export default function Analytics() {
    return (
        <div className="flex flex-col gap-8 pb-12 font-sans text-accent">

            {/* Header */}
            <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Seus Dados</h2>
                <p className="text-gray-500 font-bold">Acompanhe seu desempenho e valor de mercado.</p>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(0,166,81,1)] transition-all">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg border-2 border-green-500 text-green-700">
                            <Star size={20} />
                        </div>
                        <span className="text-sm font-black uppercase text-gray-400">Nota Média</span>
                    </div>
                    <h3 className="text-4xl font-black">4.9<span className="text-lg text-gray-400">/5</span></h3>
                    <p className="text-xs font-bold text-green-600 mt-2">Top 5% da região</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(0,166,81,1)] transition-all">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg border-2 border-blue-500 text-blue-700">
                            <Clock size={20} />
                        </div>
                        <span className="text-sm font-black uppercase text-gray-400">Confiabilidade</span>
                    </div>
                    <h3 className="text-4xl font-black">100%</h3>
                    <p className="text-xs font-bold text-gray-400 mt-2">Nenhuma falta nos últimos 30 dias</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(0,166,81,1)] transition-all">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 rounded-lg border-2 border-purple-500 text-purple-700">
                            <Activity size={20} />
                        </div>
                        <span className="text-sm font-black uppercase text-gray-400">Total de Jobs</span>
                    </div>
                    <h3 className="text-4xl font-black">42</h3>
                    <p className="text-xs font-bold text-gray-400 mt-2">124h trabalhadas</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* 1. Market Value Graph (Pseudo-Chart) */}
                <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black uppercase flex items-center gap-2">
                            <TrendingUp size={20} /> Valor de Mercado (Hora)
                        </h3>
                        <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded-md">Últimos 6 meses</span>
                    </div>

                    <div className="h-64 flex items-end justify-between gap-2">
                        {[40, 45, 42, 50, 55, 60].map((val, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">R${val}</div>
                                <div
                                    className="w-full bg-primary/20 border-2 border-primary rounded-t-lg transition-all hover:bg-primary hover:scale-y-110 origin-bottom relative group-hover:shadow-[0_0_10px_rgba(0,166,81,0.5)]"
                                    style={{ height: `${(val / 60) * 100}%` }}
                                ></div>
                                <span className="text-xs font-bold text-gray-400 uppercase">{['Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set'][i]}</span>
                            </div>
                        ))}
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
                        {[
                            { label: 'Garçom', val: 45, color: 'bg-green-500' },
                            { label: 'Auxiliar de Cozinha', val: 30, color: 'bg-blue-500' },
                            { label: 'Barman', val: 15, color: 'bg-purple-500' },
                            { label: 'Evento', val: 10, color: 'bg-orange-500' },
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm font-bold mb-1">
                                    <span>{item.label}</span>
                                    <span>{item.val}%</span>
                                </div>
                                <div className="h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                    <div className={`h-full ${item.color}`} style={{ width: `${item.val}%` }}></div>
                                </div>
                            </div>
                        ))}
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
                    <button className="bg-white text-black px-6 py-3 rounded-xl font-black uppercase hover:scale-105 transition-transform">
                        Ver Cursos
                    </button>
                </div>
                <Award size={200} className="absolute -bottom-10 -right-10 text-white/5 rotate-12" />
            </div>

        </div>
    );
}
