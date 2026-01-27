import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, ArrowRight, Building2, TrendingUp, Briefcase } from 'lucide-react';

export default function CompanyOnboarding() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [userId, setUserId] = useState<string | null>(null);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        cnpj: '',
        address: '',
        industry: '',
        hiringGoal: '', // Intelligence: What are they looking for?
        hiringVolume: '', // Intelligence: How many?
    });

    const [categories, setCategories] = useState<{ name: string, slug: string }[]>([]);

    useEffect(() => {
        // Fetch Categories
        async function loadCategories() {
            const { data } = await supabase.from('job_categories').select('name, slug');
            if (data && data.length > 0) {
                setCategories(data);
            } else {
                // Fallback to defaults if table is empty or doesn't exist yet
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
                // Check if already has profile? (Optional optimization)
            } else {
                navigate('/login');
            }
        });
    }, [navigate]);

    const handleNext = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step === 1) {
            setStep(2);
        } else {
            // Submit
            await handleSubmit();
        }
    };

    const handleSubmit = async () => {
        if (!userId) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('companies')
                .upsert({
                    id: userId,
                    name: formData.name,
                    cnpj: formData.cnpj,
                    address: formData.address,
                    industry: formData.industry,
                    // Store intelligence in a JSONB column or separate table if structured, 
                    // for now assuming we might just log it or store in metadata if schema permits.
                    // Or ideally update the schema to have these columns.
                    // Since I proposed a schema without them explicitly in the 'companies' table definition earlier,
                    // I'll assume they map to 'industry' or 'size' or generic fields, 
                    // OR I will just save the core fields and maybe log the rest for now until schema update.
                    // Actually, let's just save what we have defined in the schema plan + mapped fields.
                    // Schema Plan: id, name, cnpj, address, phone, website, industry, size, onboarding_completed
                    size: formData.hiringVolume, // Mapping volume to size for now
                    onboarding_completed: true
                });

            if (error) throw error;

            navigate('/company/dashboard');
        } catch (err) {
            console.error('Error saving company profile:', err);
            alert('Erro ao salvar perfil. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

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
                    <div className={`flex items-center gap-2 ${step >= 1 ? 'text-black' : 'text-gray-300'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black border-2 ${step >= 1 ? 'bg-black text-white border-black' : 'bg-transparent border-gray-300'}`}>1</div>
                        <span className="font-bold uppercase text-sm">Dados</span>
                    </div>
                    <div className={`h-1 w-16 ${step >= 2 ? 'bg-black' : 'bg-gray-300'}`} />
                    <div className={`flex items-center gap-2 ${step >= 2 ? 'text-black' : 'text-gray-300'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black border-2 ${step >= 2 ? 'bg-black text-white border-black' : 'bg-transparent border-gray-300'}`}>2</div>
                        <span className="font-bold uppercase text-sm">Objetivos</span>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white border-2 border-black rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">

                    <form onSubmit={handleNext} className="space-y-6 relative z-10">

                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-500">
                                <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                                    <Building2 className="text-blue-600" /> Sobre a Empresa
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1">Nome da Empresa</label>
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
                                            <label className="block text-xs font-bold uppercase mb-1">CNPJ (Opcional)</label>
                                            <input
                                                type="text"
                                                value={formData.cnpj}
                                                onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 font-bold outline-none transition-all"
                                                placeholder="00.000.000/0001-00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1">Setor</label>
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
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1">Endereço Principal</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 font-bold outline-none transition-all"
                                            placeholder="Rua, Número, Bairro, Cidade - UF"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-500">
                                <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                                    <TrendingUp className="text-green-600" /> Seus Objetivos
                                </h2>
                                <p className="text-gray-500 font-medium text-sm">Isso nos ajuda a encontrar os melhores candidatos para você.</p>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-3">O que você busca?</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {['Contratação Fixa (CLT)', 'Freelancers Pontuais', 'Temporários', 'Estágio'].map(opt => (
                                                <label key={opt} className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex items-center gap-3 font-bold ${formData.hiringGoal === opt ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 hover:border-black'}`}>
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
                                                    <input
                                                        type="radio"
                                                        name="volume"
                                                        value={opt}
                                                        checked={formData.hiringVolume === opt}
                                                        onChange={e => setFormData({ ...formData, hiringVolume: e.target.value })}
                                                        className="hidden"
                                                    />
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
                                    className="font-bold underline decoration-2 hover:text-gray-600"
                                >
                                    Voltar
                                </button>
                            ) : (
                                <div /> /* Spacer */
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase flex items-center gap-2 hover:bg-primary hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <>
                                        {step === 2 ? 'Finalizar' : 'Próximo'} <ArrowRight size={20} />
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
