
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, ArrowRight, User, MapPin, Briefcase, Star, Clock, Target } from 'lucide-react';

export default function WorkerOnboarding() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [userId, setUserId] = useState<string | null>(null);

    // Form Data
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        city: '',
        roles: [] as string[],
        experienceYears: '',
        bio: '',
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

    useEffect(() => {
        // Get current user
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

    const handleNext = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step < 3) {
            setStep(step + 1);
        } else {
            await handleSubmit();
        }
    };

    const handleSubmit = async () => {
        if (!userId) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('workers')
                .upsert({
                    id: userId,
                    full_name: formData.fullName,
                    phone: formData.phone,
                    city: formData.city,
                    roles: formData.roles,
                    experience_years: formData.experienceYears,
                    bio: formData.bio,
                    availability: formData.availability,
                    goal: formData.goal,
                    onboarding_completed: true
                });

            if (error) throw error;

            navigate('/dashboard');
        } catch (err) {
            console.error('Error saving worker profile:', err);
            alert('Erro ao salvar perfil. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F4F0] flex flex-col items-center justify-center p-6 font-sans text-accent">

            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Bem-vindo ao Worki</h1>
                    <p className="text-gray-500 font-medium">Vamos criar seu perfil profissional para você começar a faturar.</p>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center justify-center mb-12 gap-4">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center font-black border-2 transition-colors
                                ${step >= s ? 'bg-black text-white border-black' : 'bg-transparent text-gray-300 border-gray-300'}
                            `}>
                                {s}
                            </div>
                            <span className={`font-bold uppercase text-xs ${step >= s ? 'text-black' : 'text-gray-300'}`}>
                                {s === 1 && 'Dados'}
                                {s === 2 && 'Experiência'}
                                {s === 3 && 'Objetivos'}
                            </span>
                            {s < 3 && <div className={`h-1 w-8 ${step > s ? 'bg-black' : 'bg-gray-300'}`} />}
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <div className="bg-white border-2 border-black rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(0,166,81,1)] relative overflow-hidden">

                    <form onSubmit={handleNext} className="space-y-6 relative z-10">

                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-500">
                                <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                                    <User className="text-primary" /> Quem é você?
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1">Nome Completo</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.fullName}
                                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 font-bold outline-none transition-all"
                                            placeholder="Seu nome"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1">Celular / WhatsApp</label>
                                            <input
                                                type="tel"
                                                required
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 font-bold outline-none transition-all"
                                                placeholder="(00) 00000-0000"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase mb-1">Cidade</label>
                                            <div className="relative">
                                                <MapPin size={18} className="absolute left-3 top-3.5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.city}
                                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-black rounded-xl p-3 pl-10 font-bold outline-none transition-all"
                                                    placeholder="Ex: Rio de Janeiro"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-500">
                                <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                                    <Briefcase className="text-blue-500" /> Profissão
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-2">Quais suas especialidades?</label>
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
                                        {formData.roles.length === 0 && (
                                            <p className="text-xs text-red-500 font-bold mt-1">Selecione pelo menos uma.</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1">Tempo de Experiência</label>
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

                        {step === 3 && (
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
                                    className="font-bold underline decoration-2 hover:text-gray-600"
                                >
                                    Voltar
                                </button>
                            ) : (
                                <div /> /* Spacer */
                            )}

                            <button
                                type="submit"
                                disabled={loading || (step === 2 && formData.roles.length === 0)}
                                className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase flex items-center gap-2 hover:bg-primary hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <>
                                        {step === 3 ? 'Finalizar' : 'Próximo'} <ArrowRight size={20} />
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
