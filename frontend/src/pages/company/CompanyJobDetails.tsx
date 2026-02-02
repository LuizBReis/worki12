import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, MapPin, Clock, Users, Briefcase, Eye, MoreHorizontal, Edit2, PauseCircle, PlayCircle, Trash2, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CompanyJobDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [openMenu, setOpenMenu] = useState(false);

    useEffect(() => {
        if (id) fetchJobDetails();
    }, [id]);

    const fetchJobDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            // Fetch candidate count manually
            const { count } = await supabase
                .from('applications')
                .select('id', { count: 'exact', head: true })
                .eq('job_id', id);

            setJob({ ...data, candidates_count: count || 0 });
        } catch (error) {
            console.error('Error fetching job:', error);
            navigate('/company/jobs');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', id);
        if (!error) fetchJobDetails();
        setOpenMenu(false);
    };

    const handleDelete = async () => {
        const { error } = await supabase.from('jobs').update({ status: 'deleted' }).eq('id', id);
        if (!error) navigate('/company/jobs');
    };

    if (loading) return <div className="p-8 text-center"><div className="animate-spin inline-block w-6 h-6 border-2 border-black border-t-transparent rounded-full"></div></div>;
    if (!job) return null;

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => navigate('/company/jobs')} className="flex items-center gap-2 text-gray-400 font-bold hover:text-black transition-colors">
                    <ArrowLeft size={20} /> Voltar
                </button>

                <div className="relative">
                    <button
                        onClick={() => setOpenMenu(!openMenu)}
                        className="p-2 border-2 border-transparent hover:border-black rounded-xl transition-all"
                    >
                        <MoreHorizontal size={20} />
                    </button>
                    {openMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10 overflow-hidden">
                            <button
                                onClick={() => navigate(`/company/jobs/${id}/edit`)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 font-bold text-sm flex items-center gap-2"
                            >
                                <Edit2 size={16} /> Editar
                            </button>
                            <button
                                onClick={() => handleStatusChange(job.status === 'open' ? 'paused' : 'open')}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 font-bold text-sm flex items-center gap-2 border-t border-gray-100"
                            >
                                {job.status === 'open' ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
                                {job.status === 'open' ? 'Pausar' : 'Reativar'}
                            </button>
                            <button
                                onClick={() => { if (confirm('Excluir vaga?')) handleDelete(); }}
                                className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 font-bold text-sm flex items-center gap-2 border-t border-gray-100"
                            >
                                <Trash2 size={16} /> Excluir
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                {/* Banner / Status */}
                <div className={`h-2 w-full ${job.status === 'open' ? 'bg-green-500' : 'bg-gray-300'}`} />

                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase mb-3 border border-black ${job.status === 'open' ? 'bg-green-400' : 'bg-gray-200'}`}>
                                {job.status === 'open' ? 'Vaga Ativa' : job.status === 'paused' ? 'Pausada' : 'Fechada'}
                            </span>
                            <h1 className="text-3xl font-black uppercase tracking-tight mb-2">{job.title}</h1>
                            <div className="flex items-center gap-4 text-sm font-bold text-gray-500">
                                <span className="flex items-center gap-1"><MapPin size={16} /> {job.location || 'Remoto'}</span>
                                <span className="flex items-center gap-1"><Briefcase size={16} /> {job.type === 'freelance' ? 'Freelance' : 'Fixo'}</span>
                                <span className="flex items-center gap-1"><Clock size={16} /> {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: ptBR })}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-black">R$ {job.budget}</div>
                            <div className="text-xs font-bold uppercase text-gray-400">{job.budget_type === 'hourly' ? '/ hora' : job.budget_type === 'daily' ? '/ dia' : 'total'}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-t-2 border-gray-100">
                        <div className="md:col-span-2 space-y-8">
                            <section>
                                <h3 className="text-lg font-black uppercase mb-3 flex items-center gap-2"><Briefcase size={20} /> Descrição</h3>
                                <p className="whitespace-pre-wrap text-gray-600 font-medium leading-relaxed">{job.description}</p>
                            </section>

                            <section>
                                <h3 className="text-lg font-black uppercase mb-3 flex items-center gap-2"><Check size={20} /> Requisitos</h3>
                                <p className="whitespace-pre-wrap text-gray-600 font-medium leading-relaxed">{job.requirements}</p>
                            </section>

                            {(job.work_start_time || job.work_end_time) && (
                                <section>
                                    <h3 className="text-lg font-black uppercase mb-3 flex items-center gap-2"><Clock size={20} /> Horário</h3>
                                    <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-100 inline-block">
                                        <p className="font-bold">
                                            {job.work_start_time} - {job.work_end_time}
                                            {job.has_lunch && <span className="text-gray-400 ml-2">(1h almoço)</span>}
                                        </p>
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Stats Sidebar */}
                        <div className="space-y-4">
                            <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-6">
                                <h3 className="font-black uppercase text-blue-800 mb-4">Performance</h3>
                                <div className="space-y-4">
                                    <button
                                        onClick={() => navigate(`/company/jobs/${id}/candidates`)}
                                        className="w-full flex items-center justify-between hover:bg-white p-2 rounded-lg transition-all cursor-pointer group"
                                    >
                                        <span className="text-sm font-bold text-blue-600 flex items-center gap-2"><Users size={16} /> Candidatos</span>
                                        <span className="text-2xl font-black text-blue-900 group-hover:scale-110 transition-transform">{job.candidates_count || 0}</span>
                                    </button>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-blue-600 flex items-center gap-2"><Eye size={16} /> Visualizações</span>
                                        <span className="text-2xl font-black text-blue-900">{job.views || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
