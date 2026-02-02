import { Briefcase, Clock, DollarSign, MapPin, ArrowRight, CheckCircle2, Loader2, Zap, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { AnalyticsService } from '../services/analytics';

interface Job {
    id: string;
    display_code?: number;
    title: string;
    description?: string; // Added
    company?: {
        name: string;
        logo_url?: string;
        rating_average?: number;
    };
    location: string;
    start_date: string;
    work_start_time?: string;
    budget: number;
    budget_period?: string; // 'por turno' etc.
    candidates_count?: number;
}

interface JobCardProps {
    job: Job;
    isApplied: boolean;
    onApply: (jobId: string) => void;
    isApplying?: boolean;
    variant?: 'feed' | 'search'; // 'feed' for Dashboard (95% Match), 'search' for Jobs (Novo)
    matchScore?: number;
}

export default function JobCard({
    job,
    isApplied,
    onApply,
    isApplying = false,
    variant = 'search',
    matchScore = 95
}: JobCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        if (!isExpanded) {
            // Track View only on expansion
            AnalyticsService.trackJobView(job.id);
        }
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={`
            bg-white border-2 p-6 rounded-2xl transition-all relative overflow-hidden group
            ${isApplied
                ? 'border-gray-200 opacity-80'
                : 'border-black hover:shadow-[6px_6px_0px_0px_rgba(0,166,81,1)] hover:-translate-y-1'
            }
        `}>
            {/* Status Badge: Applied or Match/New */}
            {isApplied ? (
                <div className="absolute top-0 right-0 bg-green-100 text-green-700 px-4 py-2 rounded-bl-xl font-black uppercase text-xs flex items-center gap-2 border-b-2 border-l-2 border-green-200">
                    <CheckCircle2 size={14} /> Já Aplicado
                </div>
            ) : (
                variant === 'feed' ? (
                    <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl border-b-2 border-l-2 border-white">
                        {matchScore}% Match
                    </div>
                ) : null
            )}

            <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Logo */}
                <div className="w-16 h-16 bg-gray-100 rounded-xl border-2 border-black flex items-center justify-center shrink-0 overflow-hidden">
                    {job.company?.logo_url ? (
                        <img src={job.company.logo_url} className="w-full h-full object-cover" alt={job.company.name} />
                    ) : (
                        <Briefcase size={28} />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 w-full">
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black uppercase">
                                {job.display_code && <span className="text-gray-400 mr-2 text-lg">#{job.display_code}</span>}
                                {job.title}
                            </h3>
                            {variant === 'search' && !isApplied && (
                                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-[10px] font-black uppercase border border-primary/20">
                                    Novo
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mb-4 text-sm font-bold text-gray-500">
                        <span>{job.company?.name || 'Empresa Confidencial'}</span>
                        {job.company?.rating_average ? (
                            <span className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded-md text-[10px] border border-yellow-100">
                                <Star size={10} fill="currentColor" /> {Number(job.company.rating_average).toFixed(1)}
                            </span>
                        ) : null}
                        <span>• {job.location}</span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        <span className="flex items-center gap-1.5 text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg uppercase">
                            <Clock size={14} /> {new Date(job.start_date).toLocaleDateString()}
                            {job.work_start_time ? ` • ${job.work_start_time}` : ''}
                        </span>

                        {variant === 'feed' ? (
                            <span className="flex items-center gap-1.5 text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-lg uppercase">
                                <Zap size={14} /> +XP
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg uppercase">
                                <MapPin size={14} /> Presencial
                            </span>
                        )}

                        <span className="flex items-center gap-1.5 text-xs font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-lg uppercase">
                            <DollarSign size={14} /> R$ {job.budget}
                        </span>
                    </div>

                    {/* Description (Collapsible) */}
                    {isExpanded && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-700 animate-in fade-in slide-in-from-top-2">
                            <h4 className="font-bold uppercase mb-2 text-xs text-gray-500">Descrição da Vaga</h4>
                            <p className="whitespace-pre-wrap">{job.description || 'Sem descrição detalhada.'}</p>
                        </div>
                    )}

                    {/* Action - Only if not applied */}
                    <div className="flex justify-between items-center gap-4">
                        <button
                            onClick={toggleExpand}
                            className="text-gray-500 font-bold uppercase text-xs flex items-center gap-1 hover:text-black"
                        >
                            {isExpanded ? (
                                <>Ver Menos <ChevronUp size={16} /></>
                            ) : (
                                <>Ver Detalhes <ChevronDown size={16} /></>
                            )}
                        </button>

                        {!isApplied ? (
                            <button
                                onClick={() => onApply(job.id)}
                                disabled={isApplying}
                                className={`
                                    bg-black text-white px-6 py-3 rounded-xl font-black uppercase 
                                    hover:bg-primary hover:scale-105 transition-all flex items-center justify-center gap-2 
                                    disabled:opacity-50 disabled:cursor-not-allowed text-sm
                                    ${variant === 'feed' ? 'bg-primary hover:bg-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none' : ''}
                                `}
                            >
                                {isApplying ? <Loader2 className="animate-spin" /> : (variant === 'feed' ? 'Aceitar' : 'Candidatar-se')}
                                {!isApplying && variant === 'search' && <ArrowRight size={16} />}
                            </button>
                        ) : (
                            <button
                                disabled
                                className="bg-gray-100 text-gray-400 px-6 py-3 rounded-xl font-black uppercase flex items-center justify-center gap-2 cursor-default text-sm"
                            >
                                Candidatura Enviada
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
