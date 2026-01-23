import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, Wand2, MapPin, DollarSign, Briefcase, Zap } from 'lucide-react';

export default function CompanyCreateJob() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        type: 'freelance', // freelance, full-time
        description: '',
        requirements: '',
        location: '',
        budget: '',
    });

    const [predictedCandidates, setPredictedCandidates] = useState(12); // Hooked: Variable Reward (Mock)

    // Mock effect to simulate dynamic prediction updates
    const updatePrediction = () => {
        setPredictedCandidates(prev => prev + Math.floor(Math.random() * 3));
    };

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 font-bold hover:text-black transition-colors mb-2">
                        <ArrowLeft size={16} strokeWidth={3} /> Voltar
                    </button>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Criar Nova Vaga</h1>
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
                                        <option value="design">Design</option>
                                        <option value="dev">Desenvolvimento</option>
                                        <option value="marketing">Marketing</option>
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
                                <div className="flex justify-end">
                                    <button className="text-[10px] font-bold uppercase text-blue-600 flex items-center gap-1 hover:underline">
                                        <Wand2 size={10} /> Melhorar com IA
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wide">Requisitos (Lista)</label>
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
                                <DollarSign size={20} /> Orçamento & Local
                            </h2>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wide">Orçamento / Salário</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 font-black text-gray-400">R$</span>
                                    <input
                                        type="number"
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-black outline-none rounded-xl py-3 pl-10 pr-4 font-bold text-lg placeholder:text-gray-300 transition-all"
                                        placeholder="5.000,00"
                                        value={formData.budget}
                                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wide">Localização</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3.5 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-black outline-none rounded-xl py-3 pl-10 pr-4 font-bold placeholder:text-gray-300 transition-all"
                                        placeholder="Remoto, São Paulo..."
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
                            onClick={step === 3 ? () => navigate('/company/jobs') : handleNext}
                            className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase flex items-center gap-2 hover:bg-green-600 hover:scale-[1.02] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
                        >
                            {step === 3 ? 'Publicar Vaga' : 'Próximo'}
                            {step < 3 && <ChevronRight size={20} />}
                            {step === 3 && <Check size={20} />}
                        </button>
                    </div>

                </div>

                {/* Side Panel: Prediction (Hooked Model - Variable Reward) */}
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
