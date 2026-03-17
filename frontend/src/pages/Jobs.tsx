
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Search } from 'lucide-react';
import PageMeta from '../components/PageMeta';
import { useNavigate, useSearchParams } from 'react-router-dom';
import JobCard from '../components/JobCard';
import { useJobApplication } from '../hooks/useJobApplication';
import { logError } from '../lib/logger'

interface JobWithCompany {
    id: string;
    display_code?: number;
    title: string;
    description?: string;
    location: string;
    start_date: string;
    created_at?: string;
    work_start_time?: string;
    work_end_time?: string;
    estimated_hours?: number;
    has_lunch?: boolean;
    budget: number;
    budget_period?: string;
    candidates_count?: number;
    status: string;
    company?: {
        name: string;
        logo_url?: string;
        rating_average?: number;
        reviews_count?: number;
    };
}

export default function Jobs() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [jobs, setJobs] = useState<JobWithCompany[]>([]);
    const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);

    // URL-synced filters via useSearchParams
    const [searchParams, setSearchParams] = useSearchParams();

    const searchTerm = searchParams.get('search') || '';
    const selectedRole = searchParams.get('role') || 'Todos';
    const minBudget = Number(searchParams.get('minBudget') || '0');
    const city = searchParams.get('city') || '';
    const modality = (searchParams.get('modality') || 'all') as 'all' | 'presencial' | 'remoto';

    // Debounce search term
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // City input with local debounce
    const [cityInput, setCityInput] = useState(city);
    useEffect(() => {
        const timer = setTimeout(() => updateFilter('city', cityInput), 300);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cityInput]);

    // Helper to update a single filter preserving others
    const updateFilter = (key: string, value: string) => {
        const next = new URLSearchParams(searchParams);
        if (value === '' || value === '0' || value === 'Todos' || value === 'all') {
            next.delete(key);
        } else {
            next.set(key, value);
        }
        setSearchParams(next);
    };

    // Custom Hook
    const { applyingId, applyForJob } = useJobApplication();

    // Role filter options
    const roles = ['Todos', 'Garcom', 'Cozinheiro', 'Barman', 'Recepcionista', 'Limpeza', 'Seguranca', 'Promotor', 'Entregador'];

    useEffect(() => {
        const fetchJobs = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return navigate('/login');

            const { data: userApps, error: appsError } = await supabase
                .from('applications')
                .select('job_id')
                .eq('worker_id', user.id);

            if (appsError) {
                console.debug('Could not fetch existing applications (RLS?):', appsError.message);
            }

            if (userApps) {
                setAppliedJobIds(userApps.map(app => app.job_id));
            }

            const query = supabase
                .from('jobs')
                .select('*, company:companies(name, logo_url, rating_average, reviews_count)')
                .eq('status', 'open')
                .gte('start_date', new Date().toISOString())
                .order('created_at', { ascending: false });

            const { data, error } = await query;
            if (error) logError('Error fetching jobs:', error);
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

    // Filter logic with useMemo - 5 filters in AND
    const filteredJobs = useMemo(() => {
        return jobs.filter(job => {
            const matchesSearch = !debouncedSearch ||
                job.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                (job.company?.name || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                (job.location || '').toLowerCase().includes(debouncedSearch.toLowerCase());
            const matchesRole = selectedRole === 'Todos' || job.title.toLowerCase().includes(selectedRole.toLowerCase());
            const matchesMinBudget = minBudget === 0 || (job.budget || 0) >= minBudget;
            const matchesCity = city === '' || (job.location || '').toLowerCase().includes(city.toLowerCase());
            const matchesModality = modality === 'all' ||
                (modality === 'remoto'
                    ? (job.location || '').toLowerCase().includes('remoto')
                    : !(job.location || '').toLowerCase().includes('remoto'));
            return matchesSearch && matchesRole && matchesMinBudget && matchesCity && matchesModality;
        });
    }, [jobs, debouncedSearch, selectedRole, minBudget, city, modality]);

    const hasActiveFilters = selectedRole !== 'Todos' || minBudget > 0 || city !== '' || modality !== 'all';

    if (loading) return (
        <div className="flex flex-col gap-6 pb-24 max-w-5xl mx-auto animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/3" />
            <div className="h-12 bg-gray-200 rounded-xl" />
            <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-gray-200 rounded-2xl" />
                ))}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 pb-24 font-sans text-accent max-w-5xl mx-auto">
            <PageMeta title="Buscar Vagas" description="Encontre oportunidades de trabalho freelance na Worki." />

            {/* Header */}
            <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Buscar Vagas</h2>
                <p className="text-gray-500 font-bold">Encontre a oportunidade perfeita para voce.</p>
            </div>

            {/* Search & Role Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] flex flex-col md:flex-row gap-4 sticky top-4 z-20">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por cargo, empresa ou local..."
                        value={searchTerm}
                        onChange={(e) => updateFilter('search', e.target.value)}
                        className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 pl-10 font-bold outline-none transition-all"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    {roles.map(role => (
                        <button
                            key={role}
                            onClick={() => updateFilter('role', role)}
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

            {/* Advanced Filters */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-end">
                <div>
                    <label className="block text-xs font-bold uppercase mb-1">Valor Min.</label>
                    <input
                        type="number"
                        min="0"
                        placeholder="R$ 0"
                        value={minBudget || ''}
                        onChange={e => updateFilter('minBudget', e.target.value)}
                        className="border-2 border-gray-200 rounded-xl p-3 w-32 font-bold focus:border-black outline-none"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold uppercase mb-1">Cidade</label>
                    <input
                        type="text"
                        placeholder="Ex: Sao Paulo"
                        value={cityInput}
                        onChange={e => setCityInput(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl p-3 font-bold focus:border-black outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase mb-1">Modalidade</label>
                    <div className="flex gap-2">
                        {(['Todas', 'Presencial', 'Remoto'] as const).map(m => (
                            <button
                                key={m}
                                onClick={() => updateFilter('modality', m === 'Todas' ? 'all' : m.toLowerCase())}
                                className={`px-4 py-2 rounded-xl font-bold text-sm border-2 transition-colors whitespace-nowrap ${
                                    (m === 'Todas' && modality === 'all') || modality === m.toLowerCase()
                                        ? 'bg-black text-white border-black'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-black'
                                }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results counter and clear button */}
            <div className="flex items-center gap-4">
                <p className="text-sm font-bold text-gray-500">
                    {filteredJobs.length} {filteredJobs.length === 1 ? 'vaga encontrada' : 'vagas encontradas'}
                </p>
                {hasActiveFilters && (
                    <button
                        onClick={() => setSearchParams({})}
                        className="text-sm font-bold text-primary underline cursor-pointer"
                    >
                        Limpar filtros
                    </button>
                )}
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
                )) : hasActiveFilters ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Search size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-500 mb-2">Nenhuma vaga encontrada com esses filtros.</h3>
                        <p className="text-sm text-gray-400">Tente ajustar seus filtros de busca.</p>
                        <button onClick={() => setSearchParams({})} className="mt-4 text-primary underline font-bold">Limpar filtros</button>
                    </div>
                ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Search size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-500 mb-2">Nenhuma vaga disponivel no momento.</h3>
                        <p className="text-sm text-gray-400">Verifique novamente em breve!</p>
                    </div>
                )}
            </div>

        </div>
    );
}
