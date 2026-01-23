import { useState } from 'react';
import { MapPin, CheckCircle2, Clock, XCircle } from 'lucide-react';
export default function MyJobs() {
    const [activeTab, setActiveTab] = useState<'applied' | 'scheduled' | 'history'>('scheduled');

    const jobs = {
        applied: [
            { title: 'Barman - Festa Privada', company: 'Agência Top', status: 'Aguardando', date: '25 Set', location: 'Leblon, RJ' },
            { title: 'Recepcionista', company: 'Hotel Plaza', status: 'Aguardando', date: '26 Set', location: 'Copacabana, RJ' },
        ],
        scheduled: [
            { title: 'Garçom - Casamento', company: 'Buffet Real', status: 'Confirmado', date: '22 Set, 18:00', location: 'Barra, RJ', pay: 200 },
        ],
        history: [
            { title: 'Auxiliar de Cozinha', company: 'Bistrô Paris', status: 'Concluído', date: '15 Set', location: 'Centro, RJ', pay: 150 },
            { title: 'Promotor', company: 'Samsung', status: 'Concluído', date: '10 Set', location: 'Barra, RJ', pay: 180 },
        ]
    };

    return (
        <div className="flex flex-col gap-6 pb-24 font-sans text-accent">

            <header>
                <h2 className="text-4xl font-black uppercase tracking-tighter">Meus Jobs</h2>
            </header>

            {/* Tabs */}
            <div className="flex gap-2 border-b-2 border-gray-200 pb-1 overflow-x-auto">
                {[
                    { id: 'applied', label: 'Candidaturas' },
                    { id: 'scheduled', label: 'Agendados' },
                    { id: 'history', label: 'Histórico' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            px-6 py-2 rounded-t-xl font-bold uppercase transition-all whitespace-nowrap
                            ${activeTab === tab.id
                                ? 'bg-black text-white translate-y-[2px]'
                                : 'text-gray-400 hover:text-black hover:bg-gray-100'}
                        `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="grid gap-4">
                {activeTab === 'applied' && jobs.applied.map((job, i) => (
                    <div key={i} className="bg-white border-2 border-gray-200 p-6 rounded-2xl flex justify-between items-center opacity-80 hover:opacity-100 transition-opacity">
                        <div>
                            <h3 className="font-black text-xl uppercase mb-1">{job.title}</h3>
                            <p className="text-sm font-bold text-gray-500">{job.company} • {job.location}</p>
                            <span className="inline-block mt-2 bg-yellow-100 text-yellow-700 text-xs font-black px-2 py-1 rounded-md uppercase">
                                {job.status}
                            </span>
                        </div>
                        <button className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors">
                            <XCircle size={24} />
                        </button>
                    </div>
                ))}

                {activeTab === 'scheduled' && jobs.scheduled.map((job, i) => (
                    <div key={i} className="bg-white border-2 border-black p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,166,81,1)] flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div className="flex gap-4 items-center">
                            <div className="bg-black text-white p-3 rounded-xl border-2 border-black min-w-[70px] text-center">
                                <span className="block text-xs font-bold uppercase">SET</span>
                                <span className="block text-2xl font-black">22</span>
                            </div>
                            <div>
                                <h3 className="font-black text-xl uppercase mb-1">{job.title}</h3>
                                <p className="text-sm font-bold text-gray-500 flex items-center gap-1">
                                    <Clock size={14} /> {job.date}
                                </p>
                                <p className="text-sm font-bold text-gray-500 flex items-center gap-1">
                                    <MapPin size={14} /> {job.location}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                            <div>
                                <span className="block text-sm font-bold text-gray-400 uppercase">Receber</span>
                                <span className="block text-2xl font-black text-primary">R$ {job.pay}</span>
                            </div>
                            <span className="bg-green-100 text-green-700 text-xs font-black uppercase px-3 py-1 rounded-full border border-green-200">Confirmado</span>
                        </div>
                    </div>
                ))}

                {activeTab === 'history' && jobs.history.map((job, i) => (
                    <div key={i} className="bg-gray-50 border-2 border-transparent hover:border-black p-6 rounded-2xl flex justify-between items-center transition-all cursor-pointer">
                        <div>
                            <h3 className="font-black text-lg uppercase mb-1 text-gray-700">{job.title}</h3>
                            <p className="text-sm font-bold text-gray-400">{job.date} • {job.company}</p>
                        </div>
                        <div className="text-right">
                            <span className="block font-black text-gray-600">R$ {job.pay}</span>
                            <span className="text-xs font-bold text-green-600 flex items-center gap-1 justify-end uppercase">
                                <CheckCircle2 size={12} /> Pago
                            </span>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}
