import { useState, useEffect } from 'react';
import { Building2, MapPin, Globe, Mail, Save, Camera, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function CompanyProfile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [company, setCompany] = useState<any>({
        name: '',
        industry: '',
        description: '',
        website: '',
        email: '',
        address: '',
    });

    useEffect(() => {
        getProfile();
    }, []);

    const getProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            const { data } = await supabase
                .from('companies')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setCompany(data);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!userId) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('companies')
                .update({
                    name: company.name,
                    industry: company.industry,
                    description: company.description,
                    website: company.website,
                    email: company.email,
                    address: company.address,
                })
                .eq('id', userId);

            if (error) throw error;
            alert('Perfil atualizado com sucesso!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Erro ao atualizar perfil.');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCompany({ ...company, [e.target.name]: e.target.value });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-black uppercase tracking-tighter mb-8">Perfil da Empresa</h1>

            <div className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                {/* Cover Image */}
                <div className="h-48 bg-gradient-to-r from-blue-600 to-cyan-400 relative">
                    <button className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-2 hover:bg-white transition-all">
                        <Camera size={14} /> Alterar Capa
                    </button>
                </div>

                <div className="px-8 pb-8">
                    {/* Logo & Header */}
                    <div className="flex justify-between items-end -mt-12 mb-8">
                        <div className="flex items-end gap-6">
                            <div className="w-24 h-24 bg-white rounded-xl border-4 border-white shadow-lg flex items-center justify-center relative group cursor-pointer">
                                {company.logo_url ? (
                                    <img src={company.logo_url} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <Building2 size={40} className="text-gray-400" />
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                                    <Camera className="text-white" size={24} />
                                </div>
                            </div>
                            <div className="mb-1">
                                <h2 className="text-2xl font-black uppercase">{company.name || 'Nova Empresa'}</h2>
                                <p className="text-gray-500 font-medium">{company.industry || 'Setor não definido'}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-black text-white px-6 py-2.5 rounded-xl font-bold uppercase flex items-center gap-2 hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {saving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="text-sm font-black uppercase border-b-2 border-gray-100 pb-2">Informações Gerais</h3>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-gray-400">Nome da Empresa</label>
                                <input
                                    name="name"
                                    type="text"
                                    value={company.name || ''}
                                    onChange={handleChange}
                                    className="w-full font-bold border-b-2 border-gray-200 focus:border-black outline-none py-2 transition-colors bg-transparent"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-gray-400">Setor</label>
                                <input
                                    name="industry"
                                    type="text"
                                    value={company.industry || ''}
                                    onChange={handleChange}
                                    className="w-full font-bold border-b-2 border-gray-200 focus:border-black outline-none py-2 transition-colors bg-transparent"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-gray-400">Descrição Curta</label>
                                <textarea
                                    name="description"
                                    value={company.description || ''}
                                    onChange={handleChange}
                                    className="w-full font-medium border-2 border-gray-100 focus:border-black outline-none p-3 rounded-xl h-24 resize-none transition-colors bg-gray-50"
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-sm font-black uppercase border-b-2 border-gray-100 pb-2">Contato & Local</h3>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-gray-400">Website</label>
                                <div className="flex items-center gap-2 border-b-2 border-gray-200 focus-within:border-black transition-colors py-2">
                                    <Globe size={16} className="text-gray-400" />
                                    <input
                                        name="website"
                                        type="text"
                                        value={company.website || ''}
                                        onChange={handleChange}
                                        className="w-full font-bold outline-none bg-transparent"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-gray-400">Email Corporativo</label>
                                <div className="flex items-center gap-2 border-b-2 border-gray-200 focus-within:border-black transition-colors py-2">
                                    <Mail size={16} className="text-gray-400" />
                                    <input
                                        name="email"
                                        type="email"
                                        value={company.email || ''}
                                        onChange={handleChange}
                                        className="w-full font-bold outline-none bg-transparent"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-gray-400">Endereço Principal</label>
                                <div className="flex items-center gap-2 border-b-2 border-gray-200 focus-within:border-black transition-colors py-2">
                                    <MapPin size={16} className="text-gray-400" />
                                    <input
                                        name="address"
                                        type="text"
                                        value={company.address || ''}
                                        onChange={handleChange}
                                        className="w-full font-bold outline-none bg-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-black text-white p-6 rounded-2xl flex justify-between items-center shadow-lg">
                <div>
                    <h3 className="font-black uppercase text-lg">Plano Enterprise</h3>
                    <p className="text-sm opacity-80">Você tem acesso ilimitado a talentos.</p>
                </div>
                <button className="bg-white text-black px-4 py-2 rounded-lg font-bold uppercase text-xs hover:bg-gray-200 transition-colors">
                    Gerenciar Assinatura
                </button>
            </div>
        </div>
    );
}
