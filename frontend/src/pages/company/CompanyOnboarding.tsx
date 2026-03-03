import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, ArrowRight, ArrowLeft, Building2, Briefcase, Home, DollarSign } from 'lucide-react';

export default function CompanyOnboarding() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [userId, setUserId] = useState<string | null>(null);
    const [cepLoading, setCepLoading] = useState(false);

    const TOTAL_STEPS = 3;

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        cnpj: '',
        companyType: '',
        industry: '',
        postalCode: '',
        address: '',
        addressNumber: '',
        province: '',
        complement: '',
        city: '',
        incomeValue: '',
        hiringGoal: '',
        hiringVolume: '',
    });

    const [categories, setCategories] = useState<{ name: string, slug: string }[]>([]);

    const companyTypes = [
        { label: 'MEI (Microempreendedor Individual)', value: 'MEI' },
        { label: 'Limitada (LTDA)', value: 'LIMITED' },
        { label: 'Individual (EI)', value: 'INDIVIDUAL' },
        { label: 'Associação', value: 'ASSOCIATION' },
    ];

    const incomeOptions = [
        { label: 'Até R$ 10.000/mês', value: '10000' },
        { label: 'R$ 10.000 - R$ 50.000/mês', value: '50000' },
        { label: 'R$ 50.000 - R$ 200.000/mês', value: '200000' },
        { label: 'Acima de R$ 200.000/mês', value: '500000' },
    ];

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

        // Get current user
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                setUserId(data.user.id);
            } else {
                navigate('/login');
            }
        });
    }, [navigate]);

    // CNPJ mask
    const formatCnpj = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 14);
        return digits
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    };

    // CEP mask
    const formatCep = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 8);
        return digits.replace(/(\d{5})(\d)/, '$1-$2');
    };

    // CEP auto-fill
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

    const canProceed = () => {
        switch (step) {
            case 1: return formData.name && formData.cnpj.replace(/\D/g, '').length === 14 && formData.companyType && formData.industry;
            case 2: return formData.postalCode.replace(/\D/g, '').length === 8 && formData.address && formData.addressNumber && formData.province;
            case 3: return !!formData.incomeValue;
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
            // 1. Save company profile to Supabase
            const { error } = await supabase
                .from('companies')
                .upsert({
                    id: userId,
                    name: formData.name,
                    cnpj: formData.cnpj.replace(/\D/g, ''),
                    company_type: formData.companyType,
                    industry: formData.industry,
                    address: formData.address,
                    postal_code: formData.postalCode.replace(/\D/g, ''),
                    address_number: formData.addressNumber,
                    province: formData.province,
                    income_value: parseFloat(formData.incomeValue),
                    size: formData.hiringVolume,
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
                            name: formData.name,
                            cpfCnpj: formData.cnpj.replace(/\D/g, ''),
                            phone: '11999999999', // Companies may not have phone in this form; use placeholder
                            type: 'company',
                            companyType: formData.companyType,
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
                }
            }

            // 3. Navigate to Asaas status page
            navigate('/company/asaas-status');
        } catch (err) {
            console.error('Error saving company profile:', err);
            alert('Erro ao salvar perfil. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const stepLabels = ['Dados', 'Endereço', 'Financeiro'];

    return (
        <div className="min-h-screen bg-[#F4F4F0] flex flex-col items-center justify-center p-6 font-sans">

            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Primeiro Acesso</h1>
                    <p className="text-gray-500 font-medium">Vamos configurar sua empresa para começar a contratar.</p>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center justify-center mb-12 gap-4">
                    {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black border-2 ${step >= s ? 'bg-black text-white border-black' : 'bg-transparent border-gray-300'}`}>{s}</div>
                            <span className={`font-bold uppercase text-sm ${step >= s ? 'text-black' : 'text-gray-300'}`}>{stepLabels[s - 1]}</span>
                            {s < TOTAL_STEPS && <div className={`h-1 w-16 ${step > s ? 'bg-black' : 'bg-gray-300'}`} />}
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <div className="bg-white border-2 border-black rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">

                    <form onSubmit={handleNext} className="space-y-6 relative z-10">

                        {/* Step 1: Company Data */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-500">
                                <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                                    <Building2 className="text-blue-600" /> Sobre a Empresa
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1">Nome da Empresa *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 font-bold outline-none transition-all"
                                            placeholder="Ex: Tech Solutions Ltda"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1">CNPJ *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.cnpj}
                                                onChange={e => setFormData({ ...formData, cnpj: formatCnpj(e.target.value) })}
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 font-bold outline-none transition-all"
                                                placeholder="00.000.000/0001-00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1">Tipo de Empresa *</label>
                                            <select
                                                required
                                                value={formData.companyType}
                                                onChange={e => setFormData({ ...formData, companyType: e.target.value })}
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 font-bold outline-none transition-all"
                                            >
                                                <option value="">Selecione...</option>
                                                {companyTypes.map(ct => (
                                                    <option key={ct.value} value={ct.value}>{ct.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1">Setor *</label>
                                        <select
                                            required
                                            value={formData.industry}
                                            onChange={e => setFormData({ ...formData, industry: e.target.value })}
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 font-bold outline-none transition-all"
                                        >
                                            <option value="">Selecione...</option>
                                            {categories.map(cat => (
                                                <option key={cat.slug} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Address */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-500">
                                <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                                    <Home className="text-orange-500" /> Endereço Comercial
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
                                            placeholder="Ex: Av. Paulista"
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
                                                placeholder="100"
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
                                            placeholder="Sala, Andar..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Financial + Goals */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-500">
                                <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                                    <DollarSign className="text-green-600" /> Faturamento e Objetivos
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-3">Faturamento Mensal *</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-3">O que você busca?</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {['Contratação Fixa (CLT)', 'Freelancers Pontuais', 'Temporários', 'Estágio'].map(opt => (
                                                <label key={opt} className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex items-center gap-3 font-bold ${formData.hiringGoal === opt ? 'border-black bg-black/5' : 'border-gray-200 hover:border-black'}`}>
                                                    <input
                                                        type="radio"
                                                        name="goal"
                                                        value={opt}
                                                        checked={formData.hiringGoal === opt}
                                                        onChange={e => setFormData({ ...formData, hiringGoal: e.target.value })}
                                                        className="accent-black w-5 h-5"
                                                    />
                                                    {opt}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-3">Volume de Contratação Mensal</label>
                                        <div className="flex gap-4">
                                            {['1-5', '6-20', '20+'].map(opt => (
                                                <label key={opt} className={`flex-1 border-2 rounded-xl p-4 cursor-pointer transition-all flex flex-col items-center justify-center font-bold text-center ${formData.hiringVolume === opt ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-black'}`}>
                                                    <input type="radio" name="volume" value={opt} checked={formData.hiringVolume === opt} onChange={e => setFormData({ ...formData, hiringVolume: e.target.value })} className="hidden" />
                                                    <span className="text-lg">{opt}</span>
                                                    <span className="text-[10px] uppercase font-normal opacity-70">Vagas</span>
                                                </label>
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
                                <div />
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
                    <Briefcase className="absolute -bottom-10 -right-10 text-gray-50 opacity-50 rotate-[-15deg]" size={200} />
                </div>
            </div>
        </div>
    );
}
