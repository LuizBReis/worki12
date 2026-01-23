import { Search, PlusCircle, MoreHorizontal, Eye, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CompanyJobs() {
    const navigate = useNavigate();

    const jobs = [
        { id: 1, title: 'Senior UX Designer', type: 'Full-time', status: 'active', candidates: 12, views: 145, posted: '2 dias atrás' },
        { id: 2, title: 'React Frontend Developer', type: 'Freelance', status: 'active', candidates: 34, views: 520, posted: '5 dias atrás' },
        { id: 3, title: 'Product Manager', type: 'Full-time', status: 'review', candidates: 2, views: 89, posted: '1 semana atrás' },
        { id: 4, title: 'Marketing Copywriter', type: 'Freelance', status: 'closed', candidates: 0, views: 24, posted: '2 semanas atrás' },
    ];

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
                        className="w-full bg-white border-2 border-transparent focus:border-black rounded-xl py-2.5 pl-10 pr-4 font-medium outline-none transition-all placeholder:font-medium text-sm"
                    />
                </div>
                <button className="px-4 py-2 bg-white border-2 border-transparent hover:border-black rounded-xl font-bold uppercase text-xs transition-all">
                    Ativas
                </button>
                <button className="px-4 py-2 bg-white border-2 border-transparent hover:border-black rounded-xl font-bold uppercase text-xs transition-all">
                    Finalizadas
                </button>
            </div>

            {/* Jobs List */}
            <div className="space-y-4">
                {jobs.map((job) => (
                    <div key={job.id} className="bg-white border-2 border-gray-100 hover:border-black rounded-xl p-6 transition-all group shadow-sm hover:shadow-md">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">

                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-bold text-lg">{job.title}</h3>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${job.status === 'active' ? 'bg-green-100 text-green-700' :
                                            job.status === 'review' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {job.status === 'active' ? 'Ativa' : job.status === 'review' ? 'Em Revisão' : 'Encerrada'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                                    <span className="bg-gray-50 px-2 py-1 rounded uppercase font-bold">{job.type}</span>
                                    <span>Publicado {job.posted}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                                <div className="flex items-center gap-8">
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1 font-bold text-lg">
                                            <Users size={16} className="text-blue-600" /> {job.candidates}
                                        </div>
                                        <span className="text-[10px] font-bold uppercase text-gray-400">Candidatos</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1 font-bold text-lg">
                                            <Eye size={16} className="text-purple-500" /> {job.views}
                                        </div>
                                        <span className="text-[10px] font-bold uppercase text-gray-400">Visitas</span>
                                    </div>
                                </div>

                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                    <MoreHorizontal size={20} className="text-gray-400" />
                                </button>
                            </div>

                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
