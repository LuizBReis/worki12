import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { WalletService } from '../../services/walletService';
import { ArrowLeft, Check, ChevronRight, Wand2, MapPin, DollarSign, Briefcase, Zap, Calendar, Clock, Globe, Wallet, AlertTriangle } from 'lucide-react';

export default function CompanyCreateJob() {
    const navigate = useNavigate();
    const { id } = useParams(); // Add useParams
    const isEditing = !!id;

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<{ name: string, slug: string }[]>([]);
    const [companyBalance, setCompanyBalance] = useState<number>(0);
    const [balanceLoading, setBalanceLoading] = useState(true);

    const [formData, setFormData] = useState({
        title: '',
        category: '',
        type: 'freelance', // freelance, full-time
        description: '',
        requirements: '',
        location: '',
        budget: '',
        budget_type: 'hourly', // hourly, daily, project
        start_date: '',
        scope: 'on-site', // on-site, remote, hybrid
        work_start_time: '',
        work_end_time: '',
        has_lunch: false
    });

    const [predictedCandidates, setPredictedCandidates] = useState(12);

    useEffect(() => {
        // Fetch Categories
        async function loadCategories() {
            const { data } = await supabase.from('job_categories').select('name, slug');
            if (data && data.length > 0) {
                setCategories(data);
            } else {
                setCategories([
                    { name: 'Tecnologia', slug: 'tech' },
                    { name: 'Varejo', slug: 'retail' },
                    { name: 'Bares e Restaurantes', slug: 'hospitality' },
                    { name: 'Eventos', slug: 'events' },
                    { name: 'Construção Civil', slug: 'construction' },
                    { name: 'Logística', slug: 'logistics' },
                    { name: 'Saúde', slug: 'health' },
                    { name: 'Outro', slug: 'other' }
                ]);
            }
        }
        loadCategories();
        loadCompanyBalance();
    }, []);

    // Fetch company balance
    const loadCompanyBalance = async () => {
        setBalanceLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const wallet = await WalletService.getOrCreateWallet(user.id, 'company');
                setCompanyBalance(wallet?.balance || 0);
            }
        } catch (error) {
            console.error('Error loading balance:', error);
        } finally {
            setBalanceLoading(false);
        }
    };

    // Fetch Job Data if Editing
    useEffect(() => {
        if (isEditing) {
            fetchJobData();
        }
    }, [id]);

    const fetchJobData = async () => {
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    title: data.title,
                    category: data.category,
                    type: data.type,
                    description: data.description,
                    requirements: data.requirements,
                    location: data.location || '',
                    budget: data.budget?.toString() || '',
                    budget_type: data.budget_type,
                    start_date: data.start_date ? data.start_date.split('T')[0] : '',
                    scope: data.scope,
                    work_start_time: data.work_start_time || '',
                    work_end_time: data.work_end_time || '',
                    has_lunch: data.has_lunch || false
                });
            }
        } catch (error) {
            console.error('Error fetching job:', error);
            navigate('/company/jobs');
        }
    };

    const calculateHours = (start: string, end: string, lunch: boolean = false) => {
        if (!start || !end) return { total: 0, work: 0 };
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);

        let total = (endH + endM / 60) - (startH + startM / 60);
        if (total < 0) total += 24; // Handle overnight

        const work = lunch ? Math.max(0, total - 1) : total;
        return {
            total: total.toFixed(1).replace('.0', ''),
            work: work.toFixed(1).replace('.0', '')
        };
    };

    const updatePrediction = () => {
        setPredictedCandidates(prev => prev + Math.floor(Math.random() * 3));
    };

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const budgetAmount = parseFloat(formData.budget) || 0;

            // For new jobs, verify balance and reserve escrow
            if (!isEditing) {
                if (budgetAmount <= 0) {
                    alert('Por favor, defina um valor para a vaga.');
                    setLoading(false);
                    return;
                }

                if (companyBalance < budgetAmount) {
                    alert(`Saldo insuficiente. Você tem R$ ${companyBalance.toFixed(2)} mas precisa de R$ ${budgetAmount.toFixed(2)}.`);
                    setLoading(false);
                    return;
                }
            }

            const payload = {
                company_id: user.id,
                title: formData.title,
                category: formData.category,
                type: formData.type,
                description: formData.description,
                requirements: formData.requirements,
                location: formData.location,
                budget: budgetAmount,
                budget_type: formData.budget_type,
                start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
                scope: formData.scope,
                work_start_time: formData.work_start_time,
                work_end_time: formData.work_end_time,
                has_lunch: formData.has_lunch,
                status: 'open'
            };

            if (isEditing) {
                const { error } = await supabase.from('jobs').update(payload).eq('id', id);
                if (error) throw error;
            } else {
                // Create job first
                const { data: newJob, error } = await supabase.from('jobs').insert(payload).select().single();
                if (error) throw error;

                // Reserve escrow for the job
                const escrowResult = await WalletService.reserveEscrow(newJob.id, budgetAmount, user.id);
                if (!escrowResult.success) {
                    // Rollback: delete the job if escrow fails
                    await supabase.from('jobs').delete().eq('id', newJob.id);
                    throw new Error(escrowResult.error || 'Erro ao reservar pagamento');
                }

                // Update local balance
                setCompanyBalance(prev => prev - budgetAmount);
            }

            navigate('/company/dashboard');
        } catch (error: any) {
            console.error('Error saving job:', error);
            alert(error.message || 'Erro ao salvar vaga. Verifique os dados.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500 pb-20">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 font-bold hover:text-black transition-colors mb-2">
                        <ArrowLeft size={16} strokeWidth={3} /> Voltar
                    </button>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">{isEditing ? 'Editar Vaga' : 'Criar Nova Vaga'}</h1>
                </div>
                {/* Progress Indicator */}
                <div className="flex items-center gap-2">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`w-3 h-3 rounded-full border border-black transition-all ${step >= s ? 'bg-black' : 'bg-transparent'}`} />
                    ))}
                </div>
            </div>

            <div className="flex gap-8">
                {/* Form Area */}
                <div className="flex-1 bg-white border-2 border-black rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">

                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <h2 className="text-xl font-black uppercase flex items-center gap-2">
                                <Briefcase size={20} /> Informações Básicas
                            </h2>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wide">Título da Vaga</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-black outline-none rounded-xl p-3 font-bold text-lg placeholder:text-gray-300 transition-all"
                                    placeholder="Ex: Designer UI Senior"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wide">Categoria</label>
                                    <select
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-black outline-none rounded-xl p-3 font-bold appearance-none"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {categories.map(cat => (
                                            <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wide">Modelo</label>
                                    <div className="flex bg-gray-50 rounded-xl p-1 border-2 border-transparent">
                                        <button
                                            onClick={() => setFormData({ ...formData, type: 'freelance' })}
                                            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${formData.type === 'freelance' ? 'bg-black text-white shadow-sm' : 'text-gray-400 hover:text-black'}`}
                                        >
                                            Freelance
                                        </button>
                                        <button
                                            onClick={() => setFormData({ ...formData, type: 'full-time' })}
                                            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${formData.type === 'full-time' ? 'bg-black text-white shadow-sm' : 'text-gray-400 hover:text-black'}`}
                                        >
                                            Fixo
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wide">Formato de Trabalho</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'on-site', label: 'Presencial', icon: MapPin },
                                        { id: 'remote', label: 'Remoto', icon: Globe },
                                        { id: 'hybrid', label: 'Híbrido', icon: Briefcase }
                                    ].map(sc => (
                                        <button
                                            key={sc.id}
                                            onClick={() => setFormData({ ...formData, scope: sc.id })}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${formData.scope === sc.id ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-400 hover:border-black'}`}
                                        >
                                            <sc.icon size={20} />
                                            <span className="text-[10px] font-black uppercase mt-1">{sc.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Details */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <h2 className="text-xl font-black uppercase flex items-center gap-2">
                                <Wand2 size={20} /> Detalhes & Requisitos
                            </h2>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wide">Descrição Completa</label>
                                <textarea
                                    className="w-full h-32 bg-gray-50 border-2 border-transparent focus:border-black outline-none rounded-xl p-3 font-medium text-sm placeholder:text-gray-300 transition-all resize-none"
                                    placeholder="Descreva o projeto, responsabilidades e objetivos..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wide">Requisitos</label>
                                <textarea
                                    className="w-full h-24 bg-gray-50 border-2 border-transparent focus:border-black outline-none rounded-xl p-3 font-medium text-sm placeholder:text-gray-300 transition-all resize-none"
                                    placeholder="- React Native&#10;- TypeScript&#10;- Figma"
                                    value={formData.requirements}
                                    onChange={(e) => {
                                        setFormData({ ...formData, requirements: e.target.value });
                                        if (e.target.value.length % 10 === 0) updatePrediction();
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Logistics */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <h2 className="text-xl font-black uppercase flex items-center gap-2">
                                <DollarSign size={20} /> Orçamento & Cronograma
                            </h2>

                            {/* Balance Card */}
                            {!isEditing && (
                                <div className={`p-4 rounded-xl border-2 flex items-center justify-between ${parseFloat(formData.budget || '0') > companyBalance
                                        ? 'bg-red-50 border-red-300'
                                        : 'bg-green-50 border-green-300'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <Wallet size={24} className={parseFloat(formData.budget || '0') > companyBalance ? 'text-red-500' : 'text-green-600'} />
                                        <div>
                                            <span className="text-xs font-bold uppercase text-gray-500 block">Seu Saldo Disponível</span>
                                            <span className={`text-2xl font-black ${parseFloat(formData.budget || '0') > companyBalance ? 'text-red-600' : 'text-green-700'}`}>
                                                {balanceLoading ? '...' : `R$ ${companyBalance.toFixed(2).replace('.', ',')}`}
                                            </span>
                                        </div>
                                    </div>
                                    {parseFloat(formData.budget || '0') > companyBalance && (
                                        <div className="flex items-center gap-2 text-red-600 text-xs font-bold">
                                            <AlertTriangle size={16} />
                                            <span>Saldo insuficiente</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wide">Tipo de Pagamento</label>
                                    <select
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-black outline-none rounded-xl p-3 font-bold appearance-none"
                                        value={formData.budget_type}
                                        onChange={(e) => setFormData({ ...formData, budget_type: e.target.value })}
                                    >
                                        <option value="hourly">Por Hora</option>
                                        <option value="daily">Por Dia</option>
                                        <option value="project">Projeto Fixo</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wide">Valor ({formData.budget_type === 'hourly' ? '/h' : formData.budget_type === 'daily' ? '/dia' : 'Total'})</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3.5 font-black text-gray-400">R$</span>
                                        <input
                                            type="number"
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-black outline-none rounded-xl py-3 pl-10 pr-4 font-bold text-lg placeholder:text-gray-300 transition-all"
                                            placeholder="0,00"
                                            value={formData.budget}
                                            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wide">Início</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3.5 text-gray-400" size={20} />
                                        <input
                                            type="date"
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-black outline-none rounded-xl py-3 pl-10 pr-4 font-bold transition-all"
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Schedule */}
                            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 space-y-4">
                                <h3 className="text-sm font-black uppercase flex items-center gap-2 text-gray-500">
                                    <Clock size={16} /> Horário de Trabalho
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wide">Entrada</label>
                                        <input
                                            type="time"
                                            className="w-full bg-white border-2 border-transparent focus:border-black outline-none rounded-xl p-3 font-bold transition-all"
                                            value={formData.work_start_time}
                                            onChange={(e) => setFormData({ ...formData, work_start_time: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wide">Saída</label>
                                        <input
                                            type="time"
                                            className="w-full bg-white border-2 border-transparent focus:border-black outline-none rounded-xl p-3 font-bold transition-all"
                                            value={formData.work_end_time}
                                            onChange={(e) => setFormData({ ...formData, work_end_time: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="lunch"
                                        className="w-5 h-5 accent-black rounded"
                                        checked={formData.has_lunch}
                                        onChange={(e) => setFormData({ ...formData, has_lunch: e.target.checked })}
                                    />
                                    <label htmlFor="lunch" className="text-sm font-bold cursor-pointer select-none">
                                        Intervalo de Almoço (1h)
                                    </label>
                                </div>

                                {/* Calculation Display */}
                                {(formData.work_start_time && formData.work_end_time) && (
                                    <div className="bg-gray-200 rounded-lg p-3 text-xs font-bold uppercase text-gray-600 flex justify-between">
                                        <span>Total: {calculateHours(formData.work_start_time, formData.work_end_time).total}h</span>
                                        <span>Trabalho: {calculateHours(formData.work_start_time, formData.work_end_time, formData.has_lunch).work}h</span>
                                        <span className={formData.has_lunch ? 'text-black' : 'text-gray-400'}>Almoço: {formData.has_lunch ? '1h' : '0h'}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wide">Localização Específica</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3.5 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-black outline-none rounded-xl py-3 pl-10 pr-4 font-bold placeholder:text-gray-300 transition-all"
                                        placeholder="Ex: São Paulo, SP (ou deixe vazio se remoto)"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="mt-8 flex justify-between pt-6 border-t border-gray-100">
                        {step > 1 ? (
                            <button
                                onClick={handleBack}
                                className="px-6 py-3 rounded-xl border-2 border-black font-black uppercase hover:bg-gray-50 transition-colors"
                            >
                                Voltar
                            </button>
                        ) : <div></div>}

                        <button
                            onClick={step === 3 ? handleSubmit : handleNext}
                            disabled={loading}
                            className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase flex items-center gap-2 hover:bg-green-600 hover:scale-[1.02] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] disabled:opacity-50"
                        >
                            {loading ? 'Salvando...' : step === 3 ? (isEditing ? 'Salvar Alterações' : 'Publicar Vaga') : 'Próximo'}
                            {!loading && step < 3 && <ChevronRight size={20} />}
                            {!loading && step === 3 && <Check size={20} />}
                        </button>
                    </div>

                </div>

                {/* Side Panel: Prediction */}
                <div className="hidden lg:block w-72 space-y-4">
                    <div className="bg-blue-600 text-white p-6 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sticky top-8">
                        <div className="flex items-start justify-between mb-4">
                            <Zap className="fill-yellow-400 text-yellow-400" size={32} />
                            <span className="bg-black/20 text-xs font-bold px-2 py-1 rounded">PREVISÃO</span>
                        </div>
                        <h3 className="text-4xl font-black mb-1 leading-none">{predictedCandidates + (formData.title.length > 5 ? 5 : 0)}</h3>
                        <p className="text-blue-100 font-bold uppercase text-sm leading-tight mb-4">Candidatos Potenciais</p>
                        <p className="text-xs opacity-80 border-t border-white/20 pt-4">
                            Com base na sua descrição atual, prevemos um alto interesse.
                        </p>
                    </div>

                    <div className="text-xs text-gray-400 text-center px-4">
                        Dica: Detalhar os requisitos aumenta a qualidade dos candidatos em <span className="font-bold text-black">40%</span>.
                    </div>
                </div>
            </div>
        </div>
    );
}
