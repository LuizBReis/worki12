
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, ArrowRight, ArrowLeft, User, Briefcase, Star, Clock, Target, DollarSign, Home } from 'lucide-react';

export default function WorkerOnboarding() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [userId, setUserId] = useState<string | null>(null);
    const [cepLoading, setCepLoading] = useState(false);

    const TOTAL_STEPS = 5;

    // Form Data
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        city: '',
        cpf: '',
        birthDate: '',
        roles: [] as string[],
        experienceYears: '',
        bio: '',
        postalCode: '',
        address: '',
        addressNumber: '',
        province: '',
        complement: '',
        incomeValue: '',
        availability: [] as string[],
        goal: '',
    });

    const rolesList = [
        'Garçom', 'Cozinheiro', 'Barman', 'Atendente',
        'Limpeza', 'Recepcionista', 'Promotor', 'Entregador', 'Segurança'
    ];

    const availabilityOptions = [
        'Manhã', 'Tarde', 'Noite', 'Madrugada', 'Fim de Semana'
    ];

    const incomeOptions = [
        { label: 'Até R$ 1.500', value: '1500' },
        { label: 'R$ 1.500 - R$ 3.000', value: '3000' },
        { label: 'R$ 3.000 - R$ 5.000', value: '5000' },
        { label: 'R$ 5.000 - R$ 10.000', value: '10000' },
        { label: 'Acima de R$ 10.000', value: '15000' },
    ];

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                setUserId(data.user.id);
                checkIfOnboardingComplete(data.user.id);
            } else {
                navigate('/login');
            }
        });
    }, [navigate]);

    const checkIfOnboardingComplete = async (uid: string) => {
        const { data } = await supabase
            .from('workers')
            .select('onboarding_completed')
            .eq('id', uid)
            .single();

        if (data?.onboarding_completed) {
            navigate('/dashboard');
        }
    };

    const handleRoleToggle = (role: string) => {
        setFormData(prev => {
            const current = prev.roles;
            if (current.includes(role)) {
                return { ...prev, roles: current.filter(item => item !== role) };
            } else {
                return { ...prev, roles: [...current, role] };
            }
        });
    };

    const handleAvailabilityToggle = (option: string) => {
        setFormData(prev => {
            const current = prev.availability;
            if (current.includes(option)) {
                return { ...prev, availability: current.filter(item => item !== option) };
            } else {
                return { ...prev, availability: [...current, option] };
            }
        });
    };

    // CEP auto-fill via ViaCEP
    const handleCepBlur = async () => {
        const cep = formData.postalCode.replace(/\D/g, '');
        if (cep.length !== 8) return;

        setCepLoading(true);
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await res.json();
            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    address: data.logradouro || prev.address,
                    province: data.bairro || prev.province,
                    city: data.localidade || prev.city,
                }));
            }
        } catch (e) {
            console.error('CEP lookup failed:', e);
        } finally {
            setCepLoading(false);
        }
    };

    // CPF mask
    const formatCpf = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 11);
        return digits
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    };

    // CEP mask
    const formatCep = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 8);
        return digits.replace(/(\d{5})(\d)/, '$1-$2');
    };

    // Phone mask
    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 11);
        if (digits.length <= 10) {
            return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        }
        return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    };

    const canProceed = () => {
        switch (step) {
            case 1: return formData.fullName && formData.phone && formData.cpf.replace(/\D/g, '').length === 11 && formData.birthDate;
            case 2: return formData.roles.length > 0 && formData.experienceYears;
            case 3: return formData.postalCode.replace(/\D/g, '').length === 8 && formData.address && formData.addressNumber && formData.province;
            case 4: return !!formData.incomeValue;
            case 5: return true;
            default: return true;
        }
    };

    const handleNext = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step < TOTAL_STEPS) {
            setStep(step + 1);
        } else {
            await handleSubmit();
        }
    };

    const handleSubmit = async () => {
        if (!userId) return;

        setLoading(true);
        try {
            // 1. Save worker profile to Supabase
            const { error } = await supabase
                .from('workers')
                .upsert({
                    id: userId,
                    full_name: formData.fullName,
                    phone: formData.phone,
                    city: formData.city,
                    cpf: formData.cpf.replace(/\D/g, ''),
                    birth_date: formData.birthDate,
                    postal_code: formData.postalCode.replace(/\D/g, ''),
                    address: formData.address,
                    address_number: formData.addressNumber,
                    province: formData.province,
                    income_value: parseFloat(formData.incomeValue),
                    roles: formData.roles,
                    experience_years: formData.experienceYears,
                    bio: formData.bio,
                    availability: formData.availability,
                    goal: formData.goal,
                    onboarding_completed: true
                });

            if (error) throw error;

            // 2. Create Asaas subaccount with REAL data
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                try {
                    const { data: asaasResult, error: asaasError } = await supabase.functions.invoke('asaas-onboard', {
                        headers: { Authorization: `Bearer ${session.access_token}` },
                        body: {
                            name: formData.fullName,
                            cpfCnpj: formData.cpf.replace(/\D/g, ''),
                            phone: formData.phone,
                            type: 'worker',
                            birthDate: formData.birthDate,
                            postalCode: formData.postalCode.replace(/\D/g, ''),
                            address: formData.address,
                            addressNumber: formData.addressNumber,
                            province: formData.province,
                            incomeValue: parseFloat(formData.incomeValue),
                        }
                    });

                    if (asaasError) {
                        console.error('Asaas onboard error:', asaasError);
                    } else {
                        console.log('Asaas onboard success:', asaasResult);
                    }
                } catch (asaasErr) {
                    console.error('Asaas onboard exception:', asaasErr);
                    // Don't block onboarding if Asaas fails
                }
            }

            // 3. Navigate to Asaas status page to handle documents
            navigate('/asaas-status');
        } catch (err) {
            console.error('Error saving worker profile:', err);
            alert('Erro ao salvar perfil. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const stepLabels = ['Dados', 'Profissão', 'Endereço', 'Financeiro', 'Objetivos'];

    return (
        <div className="min-h-screen bg-[#F4F4F0] flex flex-col items-center justify-center p-6 font-sans text-accent">

            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Bem-vindo ao Worki</h1>
                    <p className="text-gray-500 font-medium">Vamos criar seu perfil profissional para você começar a faturar.</p>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center justify-center mb-12 gap-2">
                    {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
                        <div key={s} className="flex items-center gap-1">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center font-black border-2 transition-colors text-sm
                                ${step >= s ? 'bg-black text-white border-black' : 'bg-transparent text-gray-300 border-gray-300'}
                            `}>
                                {s}
                            </div>
                            <span className={`font-bold uppercase text-[10px] hidden md:inline ${step >= s ? 'text-black' : 'text-gray-300'}`}>
                                {stepLabels[s - 1]}
                            </span>
                            {s < TOTAL_STEPS && <div className={`h-0.5 w-4 md:w-6 ${step > s ? 'bg-black' : 'bg-gray-300'}`} />}
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <div className="bg-white border-2 border-black rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(0,166,81,1)] relative overflow-hidden">

                    <form onSubmit={handleNext} className="space-y-6 relative z-10">

                        {/* Step 1: Personal Data */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-500">
                                <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                                    <User className="text-primary" /> Quem é você?
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1">Nome Completo *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.fullName}
                                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 font-bold outline-none transition-all"
                                            placeholder="Seu nome completo"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1">CPF *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.cpf}
                                                onChange={e => setFormData({ ...formData, cpf: formatCpf(e.target.value) })}
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 font-bold outline-none transition-all"
                                                placeholder="000.000.000-00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1">Data de Nascimento *</label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.birthDate}
                                                onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 font-bold outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1">Celular / WhatsApp *</label>
                                        <input
                                            type="tel"
                                            required
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 font-bold outline-none transition-all"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Professional */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-500">
                                <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                                    <Briefcase className="text-blue-500" /> Profissão
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-2">Quais suas especialidades? *</label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {rolesList.map(role => (
                                                <button
                                                    key={role}
                                                    type="button"
                                                    onClick={() => handleRoleToggle(role)}
                                                    className={`
                                                        p-3 rounded-xl border-2 font-bold text-sm text-center transition-all
                                                        ${formData.roles.includes(role)
                                                            ? 'bg-black text-white border-black'
                                                            : 'bg-white border-gray-200 hover:border-black text-gray-600'}
                                                    `}
                                                >
                                                    {role}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1">Tempo de Experiência *</label>
                                        <select
                                            required
                                            value={formData.experienceYears}
                                            onChange={e => setFormData({ ...formData, experienceYears: e.target.value })}
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 font-bold outline-none transition-all"
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="Sem experiência">Sem experiência (Estou começando)</option>
                                            <option value="1-2 anos">1 a 2 anos</option>
                                            <option value="3-5 anos">3 a 5 anos</option>
                                            <option value="+5 anos">+5 anos (Expert)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1">Bio Curta (Opcional)</label>
                                        <textarea
                                            value={formData.bio}
                                            onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 font-bold outline-none transition-all resize-none h-20"
                                            placeholder="Conte um pouco sobre você..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Address */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-500">
                                <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                                    <Home className="text-orange-500" /> Endereço
                                </h2>
                                <p className="text-gray-500 font-medium text-sm">Necessário para verificação da sua conta de pagamento.</p>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1">CEP *</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.postalCode}
                                                    onChange={e => setFormData({ ...formData, postalCode: formatCep(e.target.value) })}
                                                    onBlur={handleCepBlur}
                                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 font-bold outline-none transition-all"
                                                    placeholder="00000-000"
                                                />
                                                {cepLoading && <Loader2 className="absolute right-3 top-3 animate-spin text-gray-400" size={20} />}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1">Cidade</label>
                                            <input
                                                type="text"
                                                value={formData.city}
                                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 font-bold outline-none transition-all"
                                                placeholder="Preenchido pelo CEP"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1">Rua / Logradouro *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 font-bold outline-none transition-all"
                                            placeholder="Ex: Rua das Flores"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1">Número *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.addressNumber}
                                                onChange={e => setFormData({ ...formData, addressNumber: e.target.value })}
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 font-bold outline-none transition-all"
                                                placeholder="123"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1">Bairro *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.province}
                                                onChange={e => setFormData({ ...formData, province: e.target.value })}
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 font-bold outline-none transition-all"
                                                placeholder="Centro"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1">Complemento (Opcional)</label>
                                        <input
                                            type="text"
                                            value={formData.complement}
                                            onChange={e => setFormData({ ...formData, complement: e.target.value })}
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 font-bold outline-none transition-all"
                                            placeholder="Apto, Bloco..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Financial */}
                        {step === 4 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-500">
                                <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                                    <DollarSign className="text-green-600" /> Dados Financeiros
                                </h2>
                                <p className="text-gray-500 font-medium text-sm">Necessário para ativar seus pagamentos na plataforma.</p>

                                <div>
                                    <label className="block text-xs font-bold uppercase mb-3">Renda Mensal Estimada *</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {incomeOptions.map(opt => (
                                            <label key={opt.value} className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex items-center gap-3 font-bold ${formData.incomeValue === opt.value ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 hover:border-black'}`}>
                                                <input
                                                    type="radio"
                                                    name="income"
                                                    value={opt.value}
                                                    checked={formData.incomeValue === opt.value}
                                                    onChange={e => setFormData({ ...formData, incomeValue: e.target.value })}
                                                    className="accent-black w-5 h-5"
                                                />
                                                {opt.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 5: Goals */}
                        {step === 5 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-500">
                                <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                                    <Target className="text-red-500" /> Objetivos
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-3">O que você busca no Worki?</label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {['Renda Extra (Freelancer)', 'Emprego Fixo', 'Ganhar Experiência'].map(opt => (
                                                <label key={opt} className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex items-center gap-3 font-bold ${formData.goal === opt ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 hover:border-black'}`}>
                                                    <input
                                                        type="radio"
                                                        name="goal"
                                                        value={opt}
                                                        checked={formData.goal === opt}
                                                        onChange={e => setFormData({ ...formData, goal: e.target.value })}
                                                        className="accent-black w-5 h-5"
                                                    />
                                                    {opt}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-3 flex items-center gap-2">
                                            <Clock size={16} /> Disponibilidade
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {availabilityOptions.map(opt => (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    onClick={() => handleAvailabilityToggle(opt)}
                                                    className={`
                                                        px-4 py-2 rounded-full border-2 font-bold text-sm transition-all
                                                        ${formData.availability.includes(opt)
                                                            ? 'bg-black text-white border-black'
                                                            : 'bg-white border-gray-200 hover:border-black text-gray-500'}
                                                    `}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-6 flex justify-between items-center border-t-2 border-gray-100 mt-8">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={() => setStep(step - 1)}
                                    className="font-bold flex items-center gap-1 text-gray-600 hover:text-black transition-colors"
                                >
                                    <ArrowLeft size={18} /> Voltar
                                </button>
                            ) : (
                                <div /> /* Spacer */
                            )}

                            <button
                                type="submit"
                                disabled={loading || !canProceed()}
                                className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase flex items-center gap-2 hover:bg-primary hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <>
                                        {step === TOTAL_STEPS ? 'Finalizar' : 'Próximo'} <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </div>

                    </form>

                    {/* Decorative Watermark */}
                    <Star className="absolute -bottom-10 -right-10 text-gray-50 opacity-50 rotate-[-15deg]" size={200} />
                </div>
            </div>
        </div>
    );
}
