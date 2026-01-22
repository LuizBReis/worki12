
import { Briefcase, MapPin, Clock, Filter, Plus } from 'lucide-react';

export default function Dashboard() {
    return (
        <div className="flex flex-col gap-8">

            {/* Header */}
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter text-accent">Vagas Recentes</h2>
                    <p className="text-gray-500 font-medium mt-1">Encontre sua próxima oportunidade.</p>
                </div>
                <button className="hidden md:flex items-center gap-2 bg-primary hover:bg-black text-white px-6 py-3 rounded-xl font-bold uppercase transition-all border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <Plus size={20} strokeWidth={3} /> Publicar Vaga
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">

                {/* Filters Sidebar (Brutalist Card) */}
                <aside className="hidden md:block h-fit sticky top-24">
                    <div className="bg-white border-2 border-black p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                        <h3 className="font-black text-lg uppercase flex items-center gap-2 mb-6">
                            <Filter size={20} /> Filtros
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Categoria</label>
                                <select className="w-full bg-gray-100 border-2 border-transparent focus:border-black rounded-xl p-3 font-bold outline-none transition-all">
                                    <option>Todas</option>
                                    <option>Garçom</option>
                                    <option>Cozinha</option>
                                    <option>Logística</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Localização</label>
                                <input type="text" placeholder="São Paulo, SP" className="w-full bg-gray-100 border-2 border-transparent focus:border-black rounded-xl p-3 font-bold outline-none transition-all" />
                            </div>
                            <button className="w-full bg-black text-white font-bold uppercase py-3 rounded-xl hover:bg-primary transition-colors">
                                Aplicar Filtros
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Job Feed */}
                <div className="flex flex-col gap-4">
                    {[
                        { title: 'Garçom - Evento Corporativo', company: 'Hotel Grand Hyatt', location: 'Barra da Tijuca, RJ', salary: 'R$ 150,00', time: '2h atrás', tag: 'Presencial' },
                        { title: 'Auxiliar de Cozinha', company: 'Restaurante Fasano', location: 'Leblon, RJ', salary: 'R$ 120,00', time: '4h atrás', tag: 'Presencial' },
                        { title: 'Promotor de Vendas', company: 'Ambev', location: 'Centro, RJ', salary: 'R$ 180,00', time: '5h atrás', tag: 'Presencial' },
                        { title: 'Estoquista Extra', company: 'Magazine Luiza', location: 'Jacarepaguá, RJ', salary: 'R$ 100,00', time: '1d atrás', tag: 'Presencial' },
                    ].map((job, i) => (
                        <div key={i} className="group bg-white border-2 border-black p-6 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,166,81,1)] cursor-pointer">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-100 border-2 border-black rounded-xl flex items-center justify-center">
                                        <Briefcase size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase text-accent">{job.title}</h3>
                                        <p className="text-sm font-bold text-gray-500">{job.company}</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-gray-400 uppercase">{job.time}</span>
                            </div>

                            <div className="flex items-center gap-4 text-sm font-bold text-gray-500 mb-4">
                                <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                                <span className="flex items-center gap-1"><Clock size={14} /> 6h</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="bg-primary text-white px-3 py-1 rounded-lg text-sm font-black border border-black">
                                        {job.salary}
                                    </span>
                                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-sm font-bold border border-gray-200">
                                        {job.tag}
                                    </span>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 bg-black text-white px-4 py-2 rounded-lg font-bold text-sm uppercase transition-all hover:bg-primary">
                                    Ver Vaga
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
