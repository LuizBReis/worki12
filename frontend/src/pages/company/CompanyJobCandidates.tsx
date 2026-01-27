import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Star, MapPin, Clock, MessageSquare, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CompanyJobCandidates() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState<any[]>([]);
    const [jobTitle, setJobTitle] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchCandidates();
    }, [id]);

    const fetchCandidates = async () => {
        try {
            // Fetch Job Title
            const { data: job } = await supabase.from('jobs').select('title').eq('id', id).single();
            if (job) setJobTitle(job.title);

            // Fetch Applications with Worker Profile
            const { data, error } = await supabase
                .from('applications')
                .select(`
                    *,
                    worker:worker_profiles(*)
                `)
                .eq('job_id', id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCandidates(data || []);
        } catch (error) {
            console.error('Error fetching candidates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (appId: string, newStatus: string) => {
        const { error } = await supabase.from('applications').update({ status: newStatus }).eq('id', appId);
        if (!error) fetchCandidates();
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <button onClick={() => navigate('/company/jobs')} className="flex items-center gap-2 text-gray-400 font-bold hover:text-black transition-colors mb-2">
                        <ArrowLeft size={16} strokeWidth={3} /> Voltar para Vagas
                    </button>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Candidatos</h1>
                    <p className="text-gray-500 font-bold">{jobTitle} • {candidates.length} aplicações</p>
                </div>
            </div>

            {/* Candidates List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10 font-bold text-gray-400">Carregando candidatos...</div>
                ) : candidates.length === 0 ? (
                    <div className="text-center py-10 font-bold text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                        Ainda não há candidatos para esta vaga.
                    </div>
                ) : (
                    candidates.map((app) => (
                        <div key={app.id} className="bg-white border-2 border-gray-100 hover:border-black rounded-xl p-6 transition-all group shadow-sm hover:shadow-md cursor-pointer" onClick={() => navigate(`/company/worker/${app.worker_id}`)}>
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                    <div className="w-16 h-16 rounded-full bg-gray-200 border-2 border-black overflow-hidden relative">
                                        {app.worker?.photo_url ? (
                                            <img src={app.worker.photo_url} alt={app.worker.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-black text-white font-black text-xl">
                                                {app.worker?.full_name?.[0] || '?'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-black text-xl flex items-center gap-2">
                                                {app.worker?.full_name || 'Usuário Worki'}
                                                <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full uppercase">Lvl {app.worker?.level || 1}</span>
                                            </h3>
                                            <div className="flex items-center gap-4 text-xs font-bold text-gray-500 mt-1">
                                                <span className="flex items-center gap-1"><MapPin size={12} /> {app.worker?.location || 'Não informado'}</span>
                                                <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500 fill-yellow-500" /> {app.worker?.recommendation_score || 0}% Recomendado</span>
                                                <span className="flex items-center gap-1"><Clock size={12} /> Aplicou {formatDistanceToNow(new Date(app.created_at), { addSuffix: true, locale: ptBR })}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {app.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleUpdateStatus(app.id, 'rejected'); }}
                                                        className="p-2 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-lg transition-colors" title="Descartar"
                                                    >
                                                        <XCircle size={24} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleUpdateStatus(app.id, 'interview'); }}
                                                        className="p-2 hover:bg-green-50 text-gray-300 hover:text-green-600 rounded-lg transition-colors" title="Aprovar para Entrevista"
                                                    >
                                                        <CheckCircle size={24} />
                                                    </button>
                                                </>
                                            )}
                                            {app.status !== 'pending' && (
                                                <span className={`text-xs font-black uppercase px-3 py-1 rounded-lg border-2 ${app.status === 'hired' ? 'bg-green-100 border-green-200 text-green-700' :
                                                        app.status === 'rejected' ? 'bg-red-50 border-red-100 text-red-500' :
                                                            'bg-blue-50 border-blue-100 text-blue-600'
                                                    }`}>
                                                    {app.status === 'interview' ? 'Em Entrevista' : app.status === 'hired' ? 'Contratado' : 'Descartado'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Cover Letter Snippet */}
                                    <div className="mt-4 bg-gray-50 p-3 rounded-xl border-l-4 border-gray-300">
                                        <p className="text-sm font-medium text-gray-600 italic line-clamp-2">
                                            "{app.cover_letter || 'Sem carta de apresentação...'}"
                                        </p>
                                    </div>

                                    {/* Tags */}
                                    {app.worker?.tags && (
                                        <div className="flex gap-2 mt-4 flex-wrap">
                                            {app.worker.tags.map((tag: string) => (
                                                <span key={tag} className="text-[10px] font-bold uppercase bg-gray-100 px-2 py-1 rounded text-gray-600">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight size={24} className="text-gray-400" />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
