
import { DollarSign, Calendar, MapPin, Search, Bell, Clock, ChefHat, Truck } from 'lucide-react';

export default function WorkerDashboard() {
    return (
        <div className="min-h-screen bg-[#F4F4F0] p-6 pb-24 md:pl-28 md:pt-8 text-accent font-sans">

            {/* Header */}
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter">Olá, Pedro!</h1>
                    <p className="font-bold text-gray-500">Pronto para o próximo job?</p>
                </div>
                <button className="bg-white border-2 border-black p-3 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all active:bg-gray-100">
                    <Bell size={24} />
                </button>
            </header>

            {/* Main Stats / Earnings */}
            <div className="bg-black text-white p-8 rounded-2xl mb-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,166,81,1)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <DollarSign size={120} />
                </div>

                <div className="relative z-10 flex justify-between items-start mb-4">
                    <div>
                        <span className="text-sm font-bold uppercase text-gray-400 tracking-wider">Seus Ganhos (Semana)</span>
                        <h2 className="text-6xl font-black tracking-tighter text-primary mt-2">R$ 850,00</h2>
                    </div>
                </div>

                <div className="relative z-10 flex gap-3 text-sm font-bold text-gray-400">
                    <span className="bg-white/20 text-white px-3 py-1 rounded-lg flex items-center gap-1">
                        <DollarSign size={14} /> + R$ 120,00 hoje
                    </span>
                    <span className="bg-white/20 text-white px-3 py-1 rounded-lg flex items-center gap-1">
                        <Clock size={14} /> 2 jobs finalizados
                    </span>
                </div>
            </div>

            {/* Primary Action - "Find Shifts" */}
            <div className="mb-12">
                <button className="w-full bg-primary text-white p-8 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-between group">
                    <div>
                        <h3 className="text-3xl font-black uppercase mb-1">Buscar Novos Jobs</h3>
                        <p className="font-medium text-white/90 text-lg">Existem <strong className="text-black bg-white px-1">15 vagas</strong> perto de você agora.</p>
                    </div>
                    <div className="bg-black p-4 rounded-full group-hover:scale-110 transition-transform border-2 border-white">
                        <Search size={32} className="text-primary" />
                    </div>
                </button>
            </div>

            {/* Recommended for You (Horizontal Scroll) */}
            <section className="mb-10">
                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                        <MapPin size={24} /> Perto de Você
                    </h2>
                    <button className="text-sm font-bold underline decoration-2 hover:text-primary">Ver todos</button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-6 snap-x">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="min-w-[280px] bg-white border-2 border-black p-5 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all snap-center cursor-pointer">
                            <div className="flex justify-between mb-4">
                                <span className="bg-gray-100 p-2 rounded-xl border border-black"><ChefHat size={20} /></span>
                                <span className="font-black text-lg">R$ 150</span>
                            </div>
                            <h3 className="text-xl font-black uppercase mb-1 leading-tight">Auxiliar de Cozinha</h3>
                            <p className="text-sm font-bold text-gray-500 mb-4">Restaurante Fasano • 2.5km</p>

                            <div className="flex gap-2 text-xs font-bold uppercase text-gray-400">
                                <span className="bg-[#F4F4F0] px-2 py-1 rounded-md">Hoje, 19:00</span>
                                <span className="bg-[#F4F4F0] px-2 py-1 rounded-md">6h Duração</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Upcoming Shifts - List */}
            <section>
                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                        <Calendar size={24} /> Sua Agenda
                    </h2>
                </div>

                <div className="space-y-4">
                    {/* Confirmed Shift */}
                    <div className="bg-white border-2 border-black p-6 rounded-2xl shadow-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex gap-4 items-center">
                        <div className="flex flex-col items-center bg-black text-white p-3 rounded-xl border-2 border-black min-w-[70px]">
                            <span className="text-xs font-bold uppercase">SET</span>
                            <span className="text-2xl font-black">22</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-black uppercase mb-1">Garçom - Casamento</h3>
                            <p className="text-sm font-bold text-gray-500 flex items-center gap-1"><Clock size={14} /> 18:00 - 02:00</p>
                        </div>
                        <div className="text-right">
                            <span className="block text-xl font-black text-primary">R$ 200</span>
                            <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase px-2 py-1 rounded-full">Confirmado</span>
                        </div>
                    </div>

                    {/* Pending Shift */}
                    <div className="bg-white border-2 border-black p-6 rounded-2xl shadow-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex gap-4 items-center opacity-70">
                        <div className="flex flex-col items-center bg-gray-200 text-gray-500 p-3 rounded-xl border-2 border-gray-400 min-w-[70px]">
                            <span className="text-xs font-bold uppercase">SET</span>
                            <span className="text-2xl font-black">24</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-black uppercase mb-1">Estoquista Extra</h3>
                            <p className="text-sm font-bold text-gray-500 flex items-center gap-1"><Truck size={14} /> 08:00 - 17:00</p>
                        </div>
                        <div className="text-right">
                            <span className="block text-xl font-black text-gray-400">R$ 120</span>
                            <span className="bg-gray-200 text-gray-600 text-[10px] font-black uppercase px-2 py-1 rounded-full">Pendente</span>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}
