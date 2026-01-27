import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, MapPin, Calendar, Star, Briefcase, Award, Zap, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function WorkerPublicProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchProfile();
    }, [id]);

    const fetchProfile = async () => {
        try {
            // Fetch Profile
            const { data: profileData, error: profileError } = await supabase
                .from('worker_profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (profileError) throw profileError;
            setProfile(profileData);

            // Fetch Reviews
            const { data: reviewsData } = await supabase
                .from('reviews')
                .select('*, reviewer:reviewer_id(name)') // Assuming companies have name in users or linked
                .eq('reviewed_id', id)
                .order('created_at', { ascending: false });
            setReviews(reviewsData || []);

            // Fetch History (Completed Jobs) via Applications for now
            // Ideally we query jobs table but simplified:
            const { data: historyData } = await supabase
                .from('applications')
                .select('*, job:jobs(title, company:companies(name))')
                .eq('worker_id', id)
                .eq('status', 'hired') // Assuming hired means worked. Ideally 'completed'
                .limit(5);
            setHistory(historyData || []);

        } catch (error) {
            console.error('Error fetching worker profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400 font-bold">Carregando perfil...</div>;
    if (!profile) return <div className="p-8 text-center text-gray-400 font-bold">Perfil não encontrado.</div>;

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header / Nav */}
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 font-bold hover:text-black transition-colors mb-6">
                <ArrowLeft size={16} strokeWidth={3} /> Voltar
            </button>

            {/* Profile Card */}
            <div className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] mb-8">
                {/* Banner */}
                <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600"></div>

                <div className="px-8 pb-8 relative">
                    {/* Avatar */}
                    <div className="absolute -top-16 left-8">
                        <div className="w-32 h-32 rounded-full border-4 border-white bg-black shadow-lg overflow-hidden flex items-center justify-center">
                            {profile.photo_url ? (
                                <img src={profile.photo_url} alt={profile.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl text-white font-black">{profile.full_name?.[0]}</span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-4 gap-4">
                        <button className="px-6 py-2 border-2 border-black rounded-xl font-bold uppercase hover:bg-gray-50 transition-colors flex items-center gap-2">
                            <MessageSquare size={18} /> Mensagem
                        </button>
                        <button className="px-6 py-2 bg-black text-white rounded-xl font-bold uppercase hover:bg-green-600 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                            Contratar
                        </button>
                    </div>

                    {/* Basic Info */}
                    <div className="mt-4">
                        <h1 className="text-4xl font-black uppercase tracking-tight">{profile.full_name}</h1>
                        <p className="text-xl font-medium text-gray-500 mt-1">{profile.bio || 'Profissional Worki'}</p>

                        <div className="flex items-center gap-6 mt-4 text-sm font-bold text-gray-600">
                            <span className="flex items-center gap-2"><MapPin size={18} /> {profile.location || 'Localização não definida'}</span>
                            <span className="flex items-center gap-2"><Calendar size={18} /> Desde {format(new Date(profile.joined_at), 'MMMM yyyy', { locale: ptBR })}</span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                        <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-100">
                            <div className="flex items-center gap-2 text-gray-400 font-bold mb-1 text-xs uppercase"><Zap size={14} /> Nível</div>
                            <div className="text-2xl font-black">{profile.level}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-100">
                            <div className="flex items-center gap-2 text-gray-400 font-bold mb-1 text-xs uppercase"><Briefcase size={14} /> Jobs</div>
                            <div className="text-2xl font-black">{profile.completed_jobs} <span className="text-xs text-gray-400">concluídos</span></div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-100">
                            <div className="flex items-center gap-2 text-gray-400 font-bold mb-1 text-xs uppercase"><Star size={14} /> Avaliação</div>
                            <div className="text-2xl font-black text-yellow-500">{profile.recommendation_score > 0 ? (profile.recommendation_score / 20).toFixed(1) : 'N/A'}</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-100">
                            <div className="flex items-center gap-2 text-gray-400 font-bold mb-1 text-xs uppercase"><Award size={14} /> XP Total</div>
                            <div className="text-2xl font-black">{profile.xp}</div>
                        </div>
                    </div>

                    {/* Tags */}
                    {profile.tags && (
                        <div className="mt-8">
                            <h3 className="font-bold uppercase text-gray-400 text-sm mb-3">Especialidades</h3>
                            <div className="flex gap-2 flex-wrap">
                                {profile.tags.map((tag: string) => (
                                    <span key={tag} className="px-3 py-1 bg-black text-white rounded-lg text-xs font-bold uppercase">{tag}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* History */}
                <div>
                    <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2"><Briefcase size={20} /> Histórico Recente</h3>
                    <div className="space-y-4">
                        {history.length > 0 ? history.map((h: any) => (
                            <div key={h.id} className="bg-white p-4 rounded-xl border-2 border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h4 className="font-bold">{h.job?.title}</h4>
                                    <p className="text-xs text-gray-500 font-bold uppercase">{h.job?.company?.name || 'Empresa Confidencial'}</p>
                                </div>
                                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded uppercase">Concluído</span>
                            </div>
                        )) : (
                            <p className="text-gray-400 italic font-medium">Nenhum histórico visível.</p>
                        )}
                    </div>
                </div>

                {/* Reviews */}
                <div>
                    <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2"><MessageSquare size={20} /> Comentários</h3>
                    <div className="space-y-4">
                        {reviews.length > 0 ? reviews.map((r: any) => (
                            <div key={r.id} className="bg-white p-4 rounded-xl border-2 border-gray-100">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-sm">Empresa Parceira</span>
                                    <div className="flex text-yellow-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={12} fill={i < r.rating ? "currentColor" : "none"} strokeWidth={3} className={i < r.rating ? "" : "text-gray-300"} />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 font-medium">"{r.comment}"</p>
                            </div>
                        )) : (
                            <p className="text-gray-400 italic font-medium">Nenhuma avaliação ainda.</p>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
