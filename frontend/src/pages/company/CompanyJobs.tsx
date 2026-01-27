import { Search, PlusCircle, MoreHorizontal, Eye, Users, Loader2, Edit2, Trash2, PauseCircle, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CompanyJobs() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
    const [search, setSearch] = useState('');
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('jobs')
                .select('*')
                .eq('company_id', user.id)
                .neq('status', 'deleted') // Filter out deleted jobs
                .order('created_at', { ascending: false });

            if (data) setJobs(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        setOpenMenu(null);
        const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', id);
        if (!error) fetchJobs();
    };

    const handleDelete = async (id: string) => {
        setOpenMenu(null);
        const { error } = await supabase.from('jobs').update({ status: 'deleted' }).eq('id', id);
        if (!error) fetchJobs();
    };

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all'
            ? true
            : filter === 'open'
                ? job.status === 'open'
                : job.status !== 'open';
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Minhas Vagas</h1>
                    <p className="text-gray-500 font-medium">Gerencie suas oportunidades ativas.</p>
                </div>
                <button
                    onClick={() => navigate('/company/create')}
                    className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-bold uppercase text-sm hover:bg-blue-600 transition-colors"
                >
                    <PlusCircle size={18} strokeWidth={3} /> Nova Vaga
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar vagas..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border-2 border-transparent focus:border-black rounded-xl py-2.5 pl-10 pr-4 font-medium outline-none transition-all placeholder:font-medium text-sm"
                    />
                </div>
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 border-2 rounded-xl font-bold uppercase text-xs transition-all ${filter === 'all' ? 'bg-black text-white border-black' : 'bg-white border-transparent hover:border-black'}`}
                >
                    Todas
                </button>
                <button
                    onClick={() => setFilter('open')}
                    className={`px-4 py-2 border-2 rounded-xl font-bold uppercase text-xs transition-all ${filter === 'open' ? 'bg-black text-white border-black' : 'bg-white border-transparent hover:border-black'}`}
                >
                    Ativas
                </button>
                <button
                    onClick={() => setFilter('closed')}
                    className={`px-4 py-2 border-2 rounded-xl font-bold uppercase text-xs transition-all ${filter === 'closed' ? 'bg-black text-white border-black' : 'bg-white border-transparent hover:border-black'}`}
                >
                    Finalizadas
                </button>
            </div>

            {/* Jobs List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10 font-bold text-gray-400 flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin" /> Carregando...
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="text-center py-10 font-bold text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                        Nenhuma vaga encontrada.
                    </div>
                ) : (
                    filteredJobs.map((job) => (
                        <div key={job.id} className="bg-white border-2 border-gray-100 hover:border-black rounded-xl p-6 transition-all group shadow-sm hover:shadow-md">
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">

                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-bold text-lg">{job.title}</h3>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {job.status === 'open' ? 'Ativa' : 'Fechada'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                                        <span className="bg-gray-50 px-2 py-1 rounded uppercase font-bold">{job.type === 'freelance' ? 'Freelance' : 'Fixo'}</span>
                                        <span>Publicado {formatDistanceToNow(new Date(job.created_at), { addSuffix: true, locale: ptBR })}</span>
                                        {job.location && <span>• {job.location}</span>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                                    <div className="flex items-center gap-8">
                                        <div
                                            className="flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
                                            onClick={() => navigate(`/company/jobs/${job.id}/candidates`)}
                                        >
                                            <div className="flex items-center gap-1 font-bold text-lg">
                                                <Users size={16} className="text-blue-600" /> {job.candidates_count || 0}
                                            </div>
                                            <span className="text-[10px] font-bold uppercase text-gray-400">Candidatos</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center gap-1 font-bold text-lg">
                                                <Eye size={16} className="text-purple-500" /> {job.views || 0}
                                            </div>
                                            <span className="text-[10px] font-bold uppercase text-gray-400">Visitas</span>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenu(openMenu === job.id ? null : job.id);
                                            }}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <MoreHorizontal size={20} className="text-gray-400" />
                                        </button>

                                        {openMenu === job.id && (
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10 overflow-hidden">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/company/jobs/${job.id}/candidates`); }}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 font-bold text-sm flex items-center gap-2 border-b border-gray-100"
                                                >
                                                    <Users size={16} /> Ver Candidatos
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/company/jobs/${job.id}`); }}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 font-bold text-sm flex items-center gap-2"
                                                >
                                                    <Eye size={16} /> Ver Detalhes
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/company/jobs/${job.id}/edit`); }}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 font-bold text-sm flex items-center gap-2 border-t border-gray-100"
                                                >
                                                    <Edit2 size={16} /> Editar
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStatusChange(job.id, job.status === 'open' ? 'paused' : 'open');
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 font-bold text-sm flex items-center gap-2 border-t border-gray-100"
                                                >
                                                    {job.status === 'open' ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
                                                    {job.status === 'open' ? 'Pausar' : 'Reativar'}
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm('Tem certeza que deseja excluir esta vaga?')) handleDelete(job.id);
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 font-bold text-sm flex items-center gap-2 border-t border-gray-100"
                                                >
                                                    <Trash2 size={16} /> Excluir
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
