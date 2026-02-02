import { useState, useEffect } from 'react';
import { Building2, MapPin, Globe, Mail, Save, Camera, Loader2, Star, LayoutDashboard, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface Company {
    name: string;
    industry: string;
    description: string;
    website: string;
    email: string;
    address: string;
    logo_url?: string;
    cover_url?: string;
    rating_average?: number;
    reviews_count?: number;
    [key: string]: string | number | null | undefined;
}

export default function CompanyProfile() {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [company, setCompany] = useState<Company>({
        name: '',
        industry: '',
        description: '',
        website: '',
        email: '',
        address: '',
    });

    useEffect(() => {
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
                addToast('Erro ao carregar perfil.', 'error');
            } finally {
                setLoading(false);
            }
        };

        getProfile();
    }, [addToast]);

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
            addToast('Perfil atualizado com sucesso!', 'success');
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            addToast('Erro ao atualizar perfil.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const [uploading, setUploading] = useState<'logo' | 'cover' | null>(null);

    // ... existing status state ...

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
        if (!e.target.files || !e.target.files[0] || !userId) return;

        const file = e.target.files[0];
        setUploading(type);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/${type}_${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload directly to 'avatars' bucket (assuming it's public)
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Update local state temporarily
            const field = type === 'logo' ? 'logo_url' : 'cover_url';
            setCompany(prev => ({ ...prev, [field]: publicUrl }));

            // Save to DB immediately to persist
            const { error: dbError } = await supabase
                .from('companies')
                .update({ [field]: publicUrl })
                .eq('id', userId);

            if (dbError) throw dbError;

            addToast(`${type === 'logo' ? 'Logo' : 'Capa'} atualizada com sucesso!`, 'success');

        } catch (error) {
            console.error('Error uploading image:', error);
            addToast('Erro ao fazer upload da imagem.', 'error');
        } finally {
            setUploading(null);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCompany({ ...company, [e.target.name]: e.target.value });
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Page Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3 text-gray-900">
                        <LayoutDashboard className="w-8 h-8" />
                        Perfil da Empresa
                    </h1>
                    <p className="text-gray-500 font-medium mt-2">Gerencie as informações públicas da sua organização.</p>
                </div>

                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-black text-white px-6 py-2.5 rounded-xl font-bold uppercase flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg active:scale-95 duration-200"
                    >
                        <Pencil size={18} />
                        Editar Perfil
                    </button>
                )}
            </div>

            <div className="bg-white border-2 border-gray-100 rounded-3xl overflow-hidden shadow-xl">
                {/* Cover Image */}
                <div className="h-48 md:h-64 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 relative group">
                    {/* Add overlay to ensure text contrast if we had text here, but mostly for premium feel */}
                    <div className="absolute inset-0 bg-black/5 transition-opacity" />

                    {company.cover_url && (
                        <img src={company.cover_url} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                    )}

                    {isEditing && (
                        <>
                            <input
                                type="file"
                                accept="image/*"
                                id="cover-upload"
                                className="hidden"
                                onChange={(e) => handleImageUpload(e, 'cover')}
                            />
                            <label
                                htmlFor="cover-upload"
                                className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 hover:bg-white hover:scale-105 transition-all shadow-sm cursor-pointer"
                            >
                                <Camera size={14} /> {uploading === 'cover' ? 'Enviando...' : 'Alterar Capa'}
                            </label>
                        </>
                    )}
                </div>

                <div className="px-6 md:px-12 pb-12 relative">
                    {/* Header Section with Logo and Actions logic */}
                    <div className="flex flex-col md:flex-row gap-6 relative -top-12 mb-8 items-start">
                        {/* Logo Container */}
                        <div className="relative">
                            <div className="w-32 h-32 bg-white rounded-2xl border-4 border-white shadow-xl flex items-center justify-center relative group overflow-hidden z-10">
                                {company.logo_url ? (
                                    <img src={company.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <Building2 size={48} className="text-gray-300" />
                                )}
                                {isEditing && (
                                    <>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            id="logo-upload"
                                            className="hidden"
                                            onChange={(e) => handleImageUpload(e, 'logo')}
                                        />
                                        <label
                                            htmlFor="logo-upload"
                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                                        >
                                            {uploading === 'logo' ? (
                                                <Loader2 className="animate-spin text-white" size={24} />
                                            ) : (
                                                <Camera className="text-white" size={24} />
                                            )}
                                        </label>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Title & Stats */}
                        <div className="flex-1 pt-14 md:pt-16 md:pl-2">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900 leading-none mb-2">
                                        {company.name || 'Nome da Empresa'}
                                    </h2>
                                    <p className="text-lg font-medium text-gray-500 flex items-center gap-2">
                                        {company.industry || 'Setor não definido'}
                                    </p>
                                </div>

                                {/* Review Stats Badge */}
                                <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-100 shadow-sm">
                                    <div className="flex items-center gap-1">
                                        <Star size={18} className="text-yellow-500 fill-yellow-500" />
                                        <span className="font-black text-yellow-700 text-lg">{Number(company.rating_average || 5.0).toFixed(1)}</span>
                                    </div>
                                    <div className="w-px h-6 bg-yellow-200 mx-1"></div>
                                    <span className="text-xs font-bold uppercase text-yellow-800/70 tracking-wide">{company.reviews_count || 0} avaliações</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Edit Actions Bar (Sticky or prominent when editing) */}
                    {isEditing && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 animate-in fade-in slide-in-from-top-2">
                            <div className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Pencil size={16} /> Mode de Edição Ativo
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        // Ideally revert changes here by refetching or keeping previous state
                                    }}
                                    className="flex-1 md:flex-none px-6 py-2.5 rounded-xl font-bold uppercase text-xs border-2 border-transparent hover:bg-gray-200 transition-colors text-gray-600"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 md:flex-none bg-black text-white px-8 py-2.5 rounded-xl font-bold uppercase text-xs flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Left Column */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3 border-b-2 border-gray-100 pb-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                                    <Building2 size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase tracking-wider text-gray-900 text-sm">Sobre a Empresa</h3>
                                    <p className="text-xs text-gray-400 font-medium mt-0.5">Informações principais</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Name Field */}
                                <div className="group">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Razão Social / Fantasia</label>
                                    {isEditing ? (
                                        <input
                                            name="name"
                                            value={company.name || ''}
                                            onChange={handleChange}
                                            className="w-full font-bold text-gray-900 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-black focus:ring-0 outline-none transition-all"
                                            placeholder="Nome da Empresa"
                                        />
                                    ) : (
                                        <p className="text-xl font-bold text-gray-900">{company.name || '—'}</p>
                                    )}
                                </div>

                                {/* Industry Field */}
                                <div className="group">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Setor</label>
                                    {isEditing ? (
                                        <input
                                            name="industry"
                                            value={company.industry || ''}
                                            onChange={handleChange}
                                            className="w-full font-bold text-gray-900 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-black focus:ring-0 outline-none transition-all"
                                            placeholder="Ex: Tecnologia"
                                        />
                                    ) : (
                                        <p className="text-lg font-medium text-gray-700">{company.industry || '—'}</p>
                                    )}
                                </div>

                                {/* Description Field */}
                                <div className="group">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Descrição</label>
                                    {isEditing ? (
                                        <textarea
                                            name="description"
                                            value={company.description || ''}
                                            onChange={handleChange}
                                            className="w-full font-medium text-gray-700 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-black focus:ring-0 outline-none transition-all min-h-[140px] resize-none"
                                            placeholder="Conte sobre sua empresa..."
                                        />
                                    ) : (
                                        <p className="text-base leading-relaxed text-gray-600 whitespace-pre-wrap">{company.description || 'Nenhuma descrição informada.'}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3 border-b-2 border-gray-100 pb-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase tracking-wider text-gray-900 text-sm">Contato & Endereço</h3>
                                    <p className="text-xs text-gray-400 font-medium mt-0.5">Canais de comunicação</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Website */}
                                <div className="group">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Website</label>
                                    {isEditing ? (
                                        <div className="relative">
                                            <Globe size={18} className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" />
                                            <input
                                                name="website"
                                                value={company.website || ''}
                                                onChange={handleChange}
                                                className="w-full font-bold text-gray-900 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:border-black focus:ring-0 outline-none transition-all"
                                                placeholder="https://..."
                                            />
                                        </div>
                                    ) : (
                                        company.website ? (
                                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline">
                                                <Globe size={16} /> {company.website.replace(/^https?:\/\//, '')}
                                            </a>
                                        ) : <p className="text-gray-400 font-medium">—</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="group">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Email Corporativo</label>
                                    {isEditing ? (
                                        <div className="relative">
                                            <Mail size={18} className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" />
                                            <input
                                                name="email"
                                                value={company.email || ''}
                                                onChange={handleChange}
                                                className="w-full font-bold text-gray-900 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:border-black focus:ring-0 outline-none transition-all"
                                                placeholder="email@empresa.com"
                                            />
                                        </div>
                                    ) : (
                                        company.email ? (
                                            <a href={`mailto:${company.email}`} className="inline-flex items-center gap-2 text-gray-900 font-bold hover:text-blue-600 transition-colors">
                                                <Mail size={16} className="text-gray-400" /> {company.email}
                                            </a>
                                        ) : <p className="text-gray-400 font-medium">—</p>
                                    )}
                                </div>

                                {/* Address */}
                                <div className="group">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Localização</label>
                                    {isEditing ? (
                                        <div className="relative">
                                            <MapPin size={18} className="absolute top-1/2 -translate-y-1/2 left-4 text-gray-400" />
                                            <input
                                                name="address"
                                                value={company.address || ''}
                                                onChange={handleChange}
                                                className="w-full font-bold text-gray-900 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:border-black focus:ring-0 outline-none transition-all"
                                                placeholder="Endereço completo"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-2">
                                            <MapPin size={18} className="text-gray-400 mt-1 shrink-0" />
                                            <p className="font-medium text-gray-700">{company.address || '—'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enterprise Banner Footer */}
            {!isEditing && (
                <div className="mt-8 bg-black text-white p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/10 transition-colors"></div>

                    <div className="relative z-10 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                            <Star className="fill-white text-white" size={20} />
                            <h3 className="font-black uppercase text-2xl">Plano Enterprise</h3>
                        </div>
                        <p className="text-gray-400 max-w-lg font-medium">Sua conta tem acesso total aos recursos da plataforma.</p>
                    </div>
                    <button className="relative z-10 bg-white text-black px-6 py-3 rounded-xl font-black uppercase text-xs hover:bg-gray-200 transition-colors shadow-lg hover:scale-105 transform duration-200">
                        Gerenciar Assinatura
                    </button>
                </div>
            )}
        </div>
    );
}
