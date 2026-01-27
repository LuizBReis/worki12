
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
    Search, MapPin, Briefcase, Clock, DollarSign,
    Filter, ArrowRight, CheckCircle2, Loader2, XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Jobs() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState<any[]>([]);
    const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('Todos');
    const [applyingId, setApplyingId] = useState<string | null>(null);

    // Filters
    const roles = ['Todos', 'Garçom', 'Cozinheiro', 'Barman', 'Recepcionista', 'Limpeza', 'Segurança', 'Promotor', 'Entregador'];

    useEffect(() => {
        const fetchJobs = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return navigate('/login');

            // 1. Get user's existing applications to mark as applied
            const { data: userApps } = await supabase
                .from('applications')
                .select('job_id')
                .eq('worker_id', user.id);

            if (userApps) {
                setAppliedJobIds(userApps.map(app => app.job_id));
            }

            // 2. Fetch all open jobs
            let query = supabase
                .from('jobs')
                .select('*, company:companies(name, logo_url)')
                .eq('status', 'open')
                .order('created_at', { ascending: false });

            const { data, error } = await query;
            if (error) console.error('Error fetching jobs:', error);
            else setJobs(data || []);

            setLoading(false);
        };

        fetchJobs();
    }, [navigate]);

    const handleApply = async (jobId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setApplyingId(jobId);

        try {
            // Check if already applied (double check)
            if (appliedJobIds.includes(jobId)) return;

            const { error } = await supabase
                .from('applications')
                .insert({
                    job_id: jobId,
                    worker_id: user.id,
                    status: 'pending' // Default status
                });

            if (error) throw error;

            // Update local state
            setAppliedJobIds([...appliedJobIds, jobId]);

            // Optional: Show success feedback?
        } catch (err) {
            console.error('Error applying:', err);
            alert('Erro ao aplicar para a vaga.');
        } finally {
            setApplyingId(null);
        }
    };

    // Filter Logic
    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.company?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = selectedRole === 'Todos' || job.title.toLowerCase().includes(selectedRole.toLowerCase());

        return matchesSearch && matchesRole;
    });

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <Loader2 className="animate-spin" size={32} />
        </div>
    );

    return (
        <div className="flex flex-col gap-6 pb-24 font-sans text-accent max-w-5xl mx-auto">

            {/* Header */}
            <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Buscar Vagas</h2>
                <p className="text-gray-500 font-bold">Encontre a oportunidade perfeita para você.</p>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] flex flex-col md:flex-row gap-4 sticky top-4 z-20">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por cargo, empresa ou local..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 pl-10 font-bold outline-none transition-all"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    {roles.map(role => (
                        <button
                            key={role}
                            onClick={() => setSelectedRole(role)}
                            className={`
                                px-4 py-2 rounded-xl font-bold uppercase text-sm border-2 transition-all whitespace-nowrap
                                ${selectedRole === role
                                    ? 'bg-black text-white border-black'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-black'}
                            `}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
                {filteredJobs.length > 0 ? filteredJobs.map((job) => {
                    const isApplied = appliedJobIds.includes(job.id);

                    return (
                        <div key={job.id} className={`
                            bg-white border-2 p-6 rounded-2xl transition-all relative overflow-hidden
                            ${isApplied ? 'border-gray-200 opacity-80' : 'border-black hover:shadow-[6px_6px_0px_0px_rgba(0,166,81,1)] hover:-translate-y-1'}
                        `}>
                            {isApplied && (
                                <div className="absolute top-0 right-0 bg-green-100 text-green-700 px-4 py-2 rounded-bl-xl font-black uppercase text-xs flex items-center gap-2">
                                    <CheckCircle2 size={14} /> Já Aplicado
                                </div>
                            )}

                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                {/* Logo */}
                                <div className="w-16 h-16 bg-gray-100 rounded-xl border-2 border-black flex items-center justify-center shrink-0 overflow-hidden">
                                    {job.company?.logo_url ? <img src={job.company.logo_url} className="w-full h-full object-cover" /> : <Briefcase size={28} />}
                                </div>

                                {/* Content */}
                                <div className="flex-1 w-full">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-xl font-black uppercase">{job.title}</h3>
                                        {!isApplied && (
                                            <span className="bg-primary/10 text-primary px-2 py-1 rounded text-[10px] font-black uppercase border border-primary/20">
                                                Novo
                                            </span>
                                        )}
                                    </div>
                                    <p className="font-bold text-gray-500 text-sm mb-4">{job.company?.name} • {job.location}</p>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-3 mb-6">
                                        <span className="flex items-center gap-1.5 text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg uppercase">
                                            <Clock size={14} /> {new Date(job.start_date).toLocaleDateString()} • {job.work_start_time}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-xs font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-lg uppercase">
                                            <DollarSign size={14} /> R$ {job.budget}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg uppercase">
                                            <MapPin size={14} /> Presencial
                                        </span>
                                    </div>

                                    {/* Action - Only if not applied */}
                                    {!isApplied ? (
                                        <button
                                            onClick={() => handleApply(job.id)}
                                            disabled={applyingId === job.id}
                                            className="w-full md:w-auto bg-black text-white px-8 py-3 rounded-xl font-black uppercase hover:bg-primary hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {applyingId === job.id ? <Loader2 className="animate-spin" /> : 'Candidatar-se Agora'}
                                            {!applyingId && <ArrowRight size={18} />}
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full md:w-auto bg-gray-100 text-gray-400 px-8 py-3 rounded-xl font-black uppercase flex items-center justify-center gap-2 cursor-default"
                                        >
                                            Candidatura Enviada verification
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Search size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-500 mb-2">Nenhuma vaga encontrada.</h3>
                        <p className="text-sm text-gray-400">Tente ajustar seus filtros de busca.</p>
                        <button onClick={() => { setSearchTerm(''); setSelectedRole('Todos'); }} className="mt-4 text-primary underline font-bold">Limpar Filtros</button>
                    </div>
                )}
            </div>

        </div>
    );
}
