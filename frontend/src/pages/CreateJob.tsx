
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Briefcase, DollarSign, MapPin, Calendar, Loader2 } from 'lucide-react';

export default function CreateJob() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requirements: '', // text area, split by newlines
        pay: '',
        date: '',
        params: { // using 'params' object to match potential flexible schema or flattening it
            start_time: '',
            end_time: ''
        },
        location: '',
        type: 'freelance' // or 'fixo'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'start_time' || name === 'end_time') {
            setFormData(prev => ({ ...prev, params: { ...prev.params, [name]: value } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            // Format requirements array
            const reqArray = formData.requirements.split('\n').filter(line => line.trim() !== '');

            // Insert into jobs table
            const { error } = await supabase
                .from('jobs')
                .insert({
                    company_id: user.id,
                    title: formData.title,
                    description: formData.description,
                    requirements: reqArray,
                    budget: parseFloat(formData.pay), // mapped to budget
                    start_date: new Date(formData.date).toISOString(), // mapped to start_date
                    work_start_time: formData.params.start_time, // mapped to work_start_time
                    work_end_time: formData.params.end_time, // mapped to work_end_time
                    location: formData.location,
                    status: 'open',
                    type: formData.type
                });

            if (error) throw error;

            navigate('/company/dashboard');
        } catch (error) {
            console.error('Error creating job:', error);
            alert('Erro ao criar vaga. Verifique os dados.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-8 font-sans text-accent">
            <div className="mb-8">
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Publicar Nova Vaga</h1>
                <p className="text-gray-500 font-bold">Preencha os detalhes para encontrar os melhores profissionais.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">

                {/* Title */}
                <div>
                    <label className="block text-sm font-black uppercase mb-1">Título da Vaga</label>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-3.5 text-gray-400" size={20} />
                        <input
                            type="text"
                            name="title"
                            required
                            placeholder="Ex: Garçom para Evento, Recepcionista..."
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full bg-gray-50 border-2 border-gray-200 focus:border-black rounded-xl p-3 pl-10 font-bold outline-none transition-colors"
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-black uppercase mb-1">Descrição</label>
                    <textarea
                        name="description"
                        required
                        rows={4}
                        placeholder="Descreva as atividades e responsabilidades..."
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border-2 border-gray-200 focus:border-black rounded-xl p-3 font-medium outline-none transition-colors resize-none"
                    />
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pay */}
                    <div>
                        <label className="block text-sm font-black uppercase mb-1">Valor (R$)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3.5 text-green-600" size={20} />
                            <input
                                type="number"
                                name="pay"
                                required
                                min="0"
                                step="0.01"
                                placeholder="0,00"
                                value={formData.pay}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border-2 border-gray-200 focus:border-black rounded-xl p-3 pl-10 font-bold outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-black uppercase mb-1">Localização</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3.5 text-gray-400" size={20} />
                            <input
                                type="text"
                                name="location"
                                required
                                placeholder="Bairro, Cidade ou Endereço"
                                value={formData.location}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border-2 border-gray-200 focus:border-black rounded-xl p-3 pl-10 font-bold outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-black uppercase mb-1">Data</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3.5 text-gray-400" size={20} />
                            <input
                                type="date"
                                name="date"
                                required
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border-2 border-gray-200 focus:border-black rounded-xl p-3 pl-10 font-bold outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Time Range */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-sm font-black uppercase mb-1">Início</label>
                            <input
                                type="time"
                                name="start_time"
                                required
                                value={formData.params.start_time}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border-2 border-gray-200 focus:border-black rounded-xl p-3 font-bold outline-none transition-colors"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-black uppercase mb-1">Fim</label>
                            <input
                                type="time"
                                name="end_time"
                                required
                                value={formData.params.end_time}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border-2 border-gray-200 focus:border-black rounded-xl p-3 font-bold outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-gray-100 flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/company/dashboard')}
                        className="px-6 py-3 rounded-xl font-bold uppercase text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-black text-white px-8 py-3 rounded-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,166,81,1)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading && <Loader2 className="animate-spin" size={20} />}
                        Publicar Vaga
                    </button>
                </div>

            </form>
        </div>
    );
}
