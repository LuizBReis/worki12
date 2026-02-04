
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, CheckCircle2, Clock, XCircle, Loader2, DollarSign, Star, Play, Square, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, isToday, parseISO, isWithinInterval, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import RateModal from '../components/RateModal';

export default function MyJobs() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'applied' | 'in_progress' | 'scheduled' | 'history'>('scheduled');
    const [jobs, setJobs] = useState<{
        applied: any[],
        in_progress: any[],
        scheduled: any[],
        history: any[]
    }>({ applied: [], in_progress: [], scheduled: [], history: [] });

    // Rating State
    const [rateModalOpen, setRateModalOpen] = useState(false);
    const [selectedJobToRate, setSelectedJobToRate] = useState<any>(null);
    const [reviewedJobIds, setReviewedJobIds] = useState<Set<string>>(new Set());
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchJobs = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return navigate('/login');

        // Fetch my reviews to know what I've rated
        const { data: myReviews } = await supabase
            .from('reviews')
            .select('job_id')
            .eq('reviewer_id', user.id);

        const reviewedSet = new Set(myReviews?.map(r => r.job_id) || []);
        setReviewedJobIds(reviewedSet);

        // Fetch applications with job details and company details
        const { data, error } = await supabase
            .from('applications')
            .select(`
                id,
                status,
                created_at,
                worker_checkin_at,
                worker_checkout_at,
                company_checkin_confirmed_at,
                company_checkout_confirmed_at,
                job:jobs (
                    id,
                    title,
                    budget,
                    start_date,
                    work_start_time,
                    work_end_time,
                    location,
                    company:companies (
                        id,
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
            const in_progress: any[] = [];
            const scheduled: any[] = [];
            const history: any[] = [];

            const now = new Date();

            data.forEach((app: any) => {
                // Normalize app object for easier consumption
                const application = {
                    id: app.id,
                    job_id: app.job?.id,
                    status: app.status,
                    title: app.job?.title || 'Job Desconhecido',
                    company_id: app.job?.company?.id,
                    company_name: app.job?.company?.name || 'Empresa Confidencial',
                    company_logo: app.job?.company?.logo_url,
                    pay: app.job?.budget || 0,
                    date: app.job?.start_date ? new Date(app.job.start_date).toLocaleDateString('pt-BR') : 'Data a definir',
                    raw_date: app.job?.start_date,
                    time: app.job?.work_start_time || 'Horário a definir',
                    end_time: app.job?.work_end_time || null,
                    location: app.job?.location || 'Local a definir',
                    month: app.job?.start_date ? new Date(app.job.start_date).toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '') : 'MES',
                    day: app.job?.start_date ? new Date(app.job.start_date).getDate() : '00',
                    worker_checkin_at: app.worker_checkin_at,
                    worker_checkout_at: app.worker_checkout_at,
                    company_checkin_confirmed_at: app.company_checkin_confirmed_at,
                    company_checkout_confirmed_at: app.company_checkout_confirmed_at
                };

                // Check if job is happening now (same day + within work hours)
                const isJobToday = application.raw_date && isToday(parseISO(application.raw_date));
                let isWithinWorkHours = false;

                if (isJobToday && application.time && application.end_time) {
                    try {
                        const [startH, startM] = application.time.split(':').map(Number);
                        const [endH, endM] = application.end_time.split(':').map(Number);

                        const todayDate = new Date();
                        const startTime = setMinutes(setHours(todayDate, startH), startM);
                        const endTime = setMinutes(setHours(todayDate, endH), endM);

                        // Add 30 min buffer before start and 1 hour after end
                        const startBuffer = new Date(startTime.getTime() - 30 * 60 * 1000);
                        const endBuffer = new Date(endTime.getTime() + 60 * 60 * 1000);

                        isWithinWorkHours = isWithinInterval(now, { start: startBuffer, end: endBuffer });
                    } catch (e) {
                        console.error('Error parsing work hours:', e);
                    }
                }

                const isInProgress = (app.status === 'approved' || app.status === 'scheduled' || app.status === 'in_progress' || app.status === 'hired') && isJobToday && isWithinWorkHours;

                if (app.status === 'pending' || app.status === 'reviewing') {
                    applied.push(application);
                } else if (isInProgress) {
                    in_progress.push(application);
                } else if (app.status === 'approved' || app.status === 'scheduled' || app.status === 'hired') {
                    scheduled.push(application);
                } else if (app.status === 'completed' || app.status === 'rejected' || app.status === 'cancelled') {
                    history.push(application);
                }
            });

            setJobs({ applied, in_progress, scheduled, history });
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchJobs();
    }, [navigate]);

    const handleCheckin = async (appId: string) => {
        setActionLoading(appId);
        try {
            const { error } = await supabase
                .from('applications')
                .update({
                    worker_checkin_at: new Date().toISOString(),
                    status: 'in_progress'
                })
                .eq('id', appId);

            if (error) throw error;
            await fetchJobs();
        } catch (err) {
            console.error('Error checking in:', err);
            alert('Erro ao fazer check-in. Tente novamente.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCheckout = async (appId: string) => {
        setActionLoading(appId);
        try {
            const { error } = await supabase
                .from('applications')
                .update({ worker_checkout_at: new Date().toISOString() })
                .eq('id', appId);

            if (error) throw error;
            await fetchJobs();
        } catch (err) {
            console.error('Error checking out:', err);
            alert('Erro ao fazer check-out. Tente novamente.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleOpenRateModal = (job: any) => {
        setSelectedJobToRate(job);
        setRateModalOpen(true);
    };

    const handleSubmitRate = async (rating: number, comment: string) => {
        if (!selectedJobToRate) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase.from('reviews').insert({
                job_id: selectedJobToRate.job_id,
                reviewer_id: user.id,
                reviewed_id: selectedJobToRate.company_id, // Rate the company
                rating: rating,
                comment: comment
            });

            if (error) throw error;

            setReviewedJobIds(prev => new Set(prev).add(selectedJobToRate.job_id));
            alert('Avaliação enviada com sucesso!');
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Erro ao enviar avaliação.');
            throw error;
        }
    };

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
                    { id: 'applied', label: 'Candidaturas', count: jobs.applied.length },
                    { id: 'in_progress', label: 'Em Andamento', count: jobs.in_progress.length },
                    { id: 'scheduled', label: 'Agendados', count: jobs.scheduled.length },
                    { id: 'history', label: 'Histórico', count: jobs.history.length }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            px-6 py-2 rounded-t-xl font-bold uppercase transition-all whitespace-nowrap flex items-center gap-2
                            ${activeTab === tab.id
                                ? 'bg-black text-white translate-y-[2px]'
                                : 'text-gray-400 hover:text-black hover:bg-gray-100'}
                        `}
                    >
                        {tab.label}
                        {tab.count > 0 && tab.id === 'in_progress' && (
                            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
                                {tab.count}
                            </span>
                        )}
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
                {activeTab === 'in_progress' && jobs.in_progress.length === 0 && (
                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <AlertCircle size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="font-bold">Nenhum trabalho em andamento.</p>
                        <p className="text-sm mt-2">Trabalhos agendados para hoje aparecerão aqui durante o horário de trabalho.</p>
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

                {/* Applied Tab */}
                {activeTab === 'applied' && jobs.applied.map((job, i) => (
                    <div key={i} className="bg-white border-2 border-gray-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center opacity-80 hover:opacity-100 transition-opacity gap-4">
                        <div>
                            <h3 className="font-black text-xl uppercase mb-1">{job.title}</h3>
                            <p className="text-sm font-bold text-gray-500">{job.company_name} • {job.location}</p>
                            <span className="inline-block mt-2 bg-yellow-100 text-yellow-700 text-xs font-black px-2 py-1 rounded-md uppercase">
                                {job.status === 'pending' ? 'Aguardando' : 'Em Análise'}
                            </span>
                        </div>
                        <button className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors self-end md:self-center" title="Cancelar Candidatura">
                            <XCircle size={24} />
                        </button>
                    </div>
                ))}

                {/* In Progress Tab */}
                {activeTab === 'in_progress' && jobs.in_progress.map((job, i) => (
                    <div key={i} className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 p-6 rounded-2xl shadow-lg">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex gap-4 items-start">
                                <div className="bg-green-600 text-white p-3 rounded-xl min-w-[70px] text-center animate-pulse">
                                    <Play size={24} className="mx-auto" />
                                    <span className="block text-xs font-bold uppercase mt-1">AO VIVO</span>
                                </div>
                                <div>
                                    <h3 className="font-black text-xl uppercase mb-1">{job.title}</h3>
                                    <p className="text-sm font-bold text-gray-600">{job.company_name}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="flex items-center gap-1.5 text-xs font-bold bg-white text-gray-600 px-3 py-1.5 rounded-lg border">
                                            <Clock size={14} /> {job.time} - {job.end_time}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-xs font-bold bg-white text-green-700 px-3 py-1.5 rounded-lg border">
                                            <DollarSign size={14} /> R$ {job.pay}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-xs font-bold bg-white text-gray-600 px-3 py-1.5 rounded-lg border">
                                            <MapPin size={14} /> {job.location}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Check-in/Check-out Section */}
                            <div className="flex flex-col gap-3 min-w-[200px]">
                                {/* Worker Check-in */}
                                {!job.worker_checkin_at ? (
                                    <button
                                        onClick={() => handleCheckin(job.id)}
                                        disabled={actionLoading === job.id}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-black uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        {actionLoading === job.id ? (
                                            <Loader2 className="animate-spin" size={20} />
                                        ) : (
                                            <>
                                                <Play size={20} /> Check-in
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                                        <CheckCircle2 size={16} />
                                        Check-in: {formatDistanceToNow(new Date(job.worker_checkin_at), { addSuffix: true, locale: ptBR })}
                                    </div>
                                )}

                                {/* Company Confirmation */}
                                {job.worker_checkin_at && (
                                    <div className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 ${job.company_checkin_confirmed_at ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {job.company_checkin_confirmed_at ? (
                                            <>
                                                <CheckCircle2 size={16} /> Empresa confirmou chegada
                                            </>
                                        ) : (
                                            <>
                                                <Clock size={16} /> Aguardando confirmação da empresa
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Worker Check-out */}
                                {job.worker_checkin_at && !job.worker_checkout_at && (
                                    <button
                                        onClick={() => handleCheckout(job.id)}
                                        disabled={actionLoading === job.id}
                                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl font-black uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        {actionLoading === job.id ? (
                                            <Loader2 className="animate-spin" size={20} />
                                        ) : (
                                            <>
                                                <Square size={20} /> Check-out
                                            </>
                                        )}
                                    </button>
                                )}

                                {job.worker_checkout_at && (
                                    <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                                        <CheckCircle2 size={16} />
                                        Check-out: {formatDistanceToNow(new Date(job.worker_checkout_at), { addSuffix: true, locale: ptBR })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Scheduled Tab */}
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
                                    <Clock size={14} /> {job.date} • {job.time}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-lg uppercase ml-2">
                                    <DollarSign size={14} /> R$ {job.pay}
                                </span>
                                <p className="text-sm font-bold text-gray-500 flex items-center gap-1 mt-1">
                                    <MapPin size={14} /> {job.location}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                            <div>
                                <span className="block text-sm font-bold text-gray-400 uppercase">Receber</span>
                                <span className="block text-2xl font-black text-primary">R$ {job.pay}</span>
                            </div>
                            <span className="bg-green-100 text-green-700 text-xs font-black uppercase px-3 py-1 rounded-full border border-green-200">Confirmado</span>
                        </div>
                    </div>
                ))}

                {/* History Tab */}
                {activeTab === 'history' && jobs.history.map((job, i) => (
                    <div key={i} className="bg-gray-50 border-2 border-transparent hover:border-black p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center transition-all cursor-pointer gap-2">
                        <div>
                            <h3 className="font-black text-lg uppercase mb-1 text-gray-700">{job.title}</h3>
                            <p className="text-sm font-bold text-gray-400">{job.date} • {job.company_name}</p>
                        </div>
                        <div className="flex items-center justify-between w-full md:w-auto gap-4">
                            <span className="block font-black text-gray-600">R$ {job.pay}</span>
                            {job.status === 'completed' ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-green-600 flex items-center gap-1 uppercase bg-green-100 px-2 py-1 rounded-md">
                                        <CheckCircle2 size={12} /> Pago
                                    </span>
                                    {!reviewedJobIds.has(job.job_id) ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleOpenRateModal(job); }}
                                            className="text-xs font-black text-white bg-black hover:bg-yellow-500 hover:text-black flex items-center gap-1 uppercase px-3 py-1.5 rounded-md transition-colors"
                                        >
                                            <Star size={12} /> Avaliar
                                        </button>
                                    ) : (
                                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1 uppercase">
                                            <Star size={12} fill="currentColor" /> Avaliado
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className="text-xs font-black text-red-500 flex items-center gap-1 uppercase bg-red-100 px-2 py-1 rounded-md">
                                    <XCircle size={12} /> {job.status === 'rejected' ? 'Não Selecionado' : 'Cancelado'}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <RateModal
                isOpen={rateModalOpen}
                onClose={() => setRateModalOpen(false)}
                onSubmit={handleSubmitRate}
                targetName={selectedJobToRate?.company_name || 'Empresa'}
                targetPhotoUrl={selectedJobToRate?.company_logo}
                title="Avaliar Empresa"
                subtitle={selectedJobToRate?.title}
            />

        </div>
    );
}
