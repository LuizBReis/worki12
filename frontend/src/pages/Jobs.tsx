
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import JobCard from '../components/JobCard';
import { useJobApplication } from '../hooks/useJobApplication';

export default function Jobs() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState<any[]>([]);
    const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('Todos');

    // Custom Hook
    const { applyingId, applyForJob } = useJobApplication();

    // Filters
    const roles = ['Todos', 'Garçom', 'Cozinheiro', 'Barman', 'Recepcionista', 'Limpeza', 'Segurança', 'Promotor', 'Entregador'];

    useEffect(() => {
        const fetchJobs = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return navigate('/login');

            // 1. Get user's existing applications to mark as applied
            const { data: userApps, error: appsError } = await supabase
                .from('applications')
                .select('job_id')
                .eq('worker_id', user.id);

            if (appsError) {
                // Silently ignore RLS errors or just warn in debug
                console.debug('Could not fetch existing applications (RLS?):', appsError.message);
            }

            if (userApps) {
                setAppliedJobIds(userApps.map(app => app.job_id));
            }

            // 2. Fetch all open jobs
            let query = supabase
                .from('jobs')
                .select('*, company:companies(name, logo_url, rating_average, reviews_count)')
                .eq('status', 'open')
                .order('created_at', { ascending: false });

            const { data, error } = await query;
            if (error) console.error('Error fetching jobs:', error);
            else setJobs(data || []);

            setLoading(false);
        };

        fetchJobs();
    }, [navigate]);

    const handleApplySuccess = (jobId: string) => {
        setAppliedJobIds(prev => [...prev, jobId]);
        setJobs(prevJobs => prevJobs.map(j =>
            j.id === jobId ? { ...j, candidates_count: (j.candidates_count || 0) + 1 } : j
        ));
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
                {filteredJobs.length > 0 ? filteredJobs.map((job) => (
                    <JobCard
                        key={job.id}
                        job={job}
                        isApplied={appliedJobIds.includes(job.id)}
                        onApply={(id) => applyForJob(id, () => handleApplySuccess(id))}
                        isApplying={applyingId === job.id}
                        variant="search"
                    />
                )) : (
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
