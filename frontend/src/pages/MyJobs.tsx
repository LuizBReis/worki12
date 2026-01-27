
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, CheckCircle2, Clock, XCircle, Loader2, Calendar, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MyJobs() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'applied' | 'scheduled' | 'history'>('scheduled');
    const [jobs, setJobs] = useState<{
        applied: any[],
        scheduled: any[],
        history: any[]
    }>({ applied: [], scheduled: [], history: [] });

    useEffect(() => {
        const fetchJobs = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return navigate('/login');

            // Fetch applications with job details and company details
            const { data, error } = await supabase
                .from('applications')
                .select(`
                    id,
                    status,
                    created_at,
                    job:jobs (
                        id,
                        title,
                        budget,
                        start_date,
                        work_start_time,
                        location,
                        company:companies (
                            name,
                            logo_url
                        )
                    )
                `)
                .eq('worker_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching applications:', error);
            } else {
                const applied: any[] = [];
                const scheduled: any[] = [];
                const history: any[] = [];

                data.forEach((app: any) => {
                    // Normalize app object for easier consumption
                    const application = {
                        id: app.id,
                        status: app.status, // pending, approved, rejected, completed
                        title: app.job?.title || 'Job Desconhecido',
                        company: app.job?.company?.name || 'Empresa Confidencial',
                        pay: app.job?.budget || 0,
                        date: app.job?.start_date ? new Date(app.job.start_date).toLocaleDateString('pt-BR') : 'Data a definir',
                        time: app.job?.work_start_time || 'Horário a definir',
                        location: app.job?.location || 'Local a definir',
                        month: app.job?.start_date ? new Date(app.job.start_date).toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '') : 'MES',
                        day: app.job?.start_date ? new Date(app.job.start_date).getDate() : '00'
                    };

                    if (app.status === 'pending' || app.status === 'reviewing') {
                        applied.push(application);
                    } else if (app.status === 'approved' || app.status === 'scheduled') {
                        scheduled.push(application);
                    } else if (app.status === 'completed' || app.status === 'rejected' || app.status === 'cancelled') {
                        history.push(application);
                    }
                });

                setJobs({ applied, scheduled, history });
            }
            setLoading(false);
        };

        fetchJobs();
    }, [navigate]);

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <Loader2 className="animate-spin" size={32} />
        </div>
    );

    return (
        <div className="flex flex-col gap-6 pb-24 font-sans text-accent max-w-4xl mx-auto">

            <header>
                <h2 className="text-4xl font-black uppercase tracking-tighter">Meus Jobs</h2>
            </header>

            {/* Tabs */}
            <div className="flex gap-2 border-b-2 border-gray-200 pb-1 overflow-x-auto scrollbar-hide">
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

                {/* Empty States */}
                {activeTab === 'applied' && jobs.applied.length === 0 && (
                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <p className="font-bold">Você não tem candidaturas pendentes.</p>
                        <button onClick={() => navigate('/dashboard')} className="mt-4 text-primary underline font-bold">Buscar Vagas</button>
                    </div>
                )}
                {activeTab === 'scheduled' && jobs.scheduled.length === 0 && (
                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <p className="font-bold">Nenhum job agendado no momento.</p>
                    </div>
                )}
                {activeTab === 'history' && jobs.history.length === 0 && (
                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <p className="font-bold">Seu histórico está vazio.</p>
                    </div>
                )}


                {activeTab === 'applied' && jobs.applied.map((job, i) => (
                    <div key={i} className="bg-white border-2 border-gray-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center opacity-80 hover:opacity-100 transition-opacity gap-4">
                        <div>
                            <h3 className="font-black text-xl uppercase mb-1">{job.title}</h3>
                            <p className="text-sm font-bold text-gray-500">{job.company} • {job.location}</p>
                            <span className="inline-block mt-2 bg-yellow-100 text-yellow-700 text-xs font-black px-2 py-1 rounded-md uppercase">
                                {job.status === 'pending' ? 'Aguardando' : 'Em Análise'}
                            </span>
                        </div>
                        <button className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors self-end md:self-center" title="Cancelar Candidatura">
                            <XCircle size={24} />
                        </button>
                    </div>
                ))}

                {activeTab === 'scheduled' && jobs.scheduled.map((job, i) => (
                    <div key={i} className="bg-white border-2 border-black p-6 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,166,81,1)] flex flex-col md:flex-row justify-between md:items-center gap-4 group hover:-translate-y-1 transition-transform">
                        <div className="flex gap-4 items-center">
                            <div className="bg-black text-white p-3 rounded-xl border-2 border-black min-w-[70px] text-center group-hover:bg-primary group-hover:border-primary transition-colors">
                                <span className="block text-xs font-bold uppercase">{job.month}</span>
                                <span className="block text-2xl font-black">{job.day}</span>
                            </div>
                            <div>
                                <h3 className="font-black text-xl uppercase mb-1">{job.title}</h3>
                                <span className="flex items-center gap-1.5 text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg uppercase">
                                    <Clock size={14} /> {new Date(job.start_date).toLocaleDateString()} • {job.work_start_time}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-lg uppercase">
                                    <DollarSign size={14} /> R$ {job.budget}
                                </span>
                                <p className="text-sm font-bold text-gray-500 flex items-center gap-1">
                                    <MapPin size={14} /> {job.location}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                            <div>
                                <span className="block text-sm font-bold text-gray-400 uppercase">Receber</span>
                                <span className="block text-2xl font-black text-primary">R$ {job.budget}</span>
                            </div>
                            <span className="bg-green-100 text-green-700 text-xs font-black uppercase px-3 py-1 rounded-full border border-green-200">Confirmado</span>
                        </div>
                    </div>
                ))}

                {activeTab === 'history' && jobs.history.map((job, i) => (
                    <div key={i} className="bg-gray-50 border-2 border-transparent hover:border-black p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center transition-all cursor-pointer gap-2">
                        <div>
                            <h3 className="font-black text-lg uppercase mb-1 text-gray-700">{job.title}</h3>
                            <p className="text-sm font-bold text-gray-400">{job.date} • {job.company}</p>
                        </div>
                        <div className="flex items-center justify-between w-full md:w-auto gap-4">
                            <span className="block font-black text-gray-600">R$ {job.pay}</span>
                            {job.status === 'completed' ? (
                                <span className="text-xs font-black text-green-600 flex items-center gap-1 uppercase bg-green-100 px-2 py-1 rounded-md">
                                    <CheckCircle2 size={12} /> Pago
                                </span>
                            ) : (
                                <span className="text-xs font-black text-red-500 flex items-center gap-1 uppercase bg-red-100 px-2 py-1 rounded-md">
                                    <XCircle size={12} /> {job.status === 'rejected' ? 'Não Selecionado' : 'Cancelado'}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}
