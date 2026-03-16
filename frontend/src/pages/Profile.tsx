
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, MapPin, Briefcase, Star, ShieldCheck, Phone, Edit2, Award, Save, X, Camera, CreditCard, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';

interface WorkerProfile {
    id: string;
    full_name: string;
    city: string;
    phone: string;
    bio: string;
    pix_key: string;
    primary_role: string;
    roles: string[];
    cover_url: string | null;
    avatar_url: string | null;
    verified_identity: boolean;
    level: number | null;
    xp: number | null;
    rating_average: number | null;
    completed_jobs_count: number | null;
    earnings_total: number | null;
    experience_years: string | null;
    availability: string | string[] | null;
    updated_at?: Date;
}

interface FormData {
    full_name: string;
    city: string;
    phone: string;
    bio: string;
    pix_key: string;
    primary_role: string;
    roles: string;
}

export default function Profile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<WorkerProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    const { addToast } = useToast();

    // Editing State
    const [formData, setFormData] = useState<FormData>({
        full_name: '',
        city: '',
        phone: '',
        bio: '',
        pix_key: '',
        primary_role: '',
        roles: '' // comma separated string for editing
    });

    // Track initial form data for dirty detection
    const initialFormDataRef = useRef<FormData>({
        full_name: '',
        city: '',
        phone: '',
        bio: '',
        pix_key: '',
        primary_role: '',
        roles: ''
    });

    const isDirty = isEditing && (
        formData.full_name !== initialFormDataRef.current.full_name ||
        formData.city !== initialFormDataRef.current.city ||
        formData.phone !== initialFormDataRef.current.phone ||
        formData.bio !== initialFormDataRef.current.bio ||
        formData.pix_key !== initialFormDataRef.current.pix_key ||
        formData.primary_role !== initialFormDataRef.current.primary_role ||
        formData.roles !== initialFormDataRef.current.roles
    );

    // Warn user about unsaved changes before leaving
    const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
        e.preventDefault();
    }, []);

    useEffect(() => {
        if (isDirty) {
            window.addEventListener('beforeunload', handleBeforeUnload);
        }
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isDirty, handleBeforeUnload]);

    const [stats, setStats] = useState({
        completedJobs: 0,
        totalEarnings: 0,
        hoursWorked: 0
    });

    // Password change state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const handlePasswordChange = async () => {
        setPasswordError(null);

        if (newPassword.length < 8) {
            setPasswordError('A senha deve ter pelo menos 8 caracteres.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('As senhas nao coincidem.');
            return;
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
            setPasswordError('Erro ao alterar senha.');
            return;
        }

        addToast('Senha alterada com sucesso.', 'success');
        setNewPassword('');
        setConfirmPassword('');
    };

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return navigate('/login');

            const { data, error } = await supabase
                .from('workers')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            } else {
                setProfile(data);
                const loadedFormData: FormData = {
                    full_name: data.full_name || '',
                    city: data.city || '',
                    phone: data.phone || '',
                    bio: data.bio || '',
                    pix_key: data.pix_key || '',
                    primary_role: data.primary_role || '',
                    roles: data.roles ? data.roles.join(', ') : ''
                };
                setFormData(loadedFormData);
                initialFormDataRef.current = loadedFormData;
                setStats({
                    completedJobs: data.completed_jobs_count || 0,
                    totalEarnings: data.earnings_total || 0,
                    hoursWorked: Math.floor((data.completed_jobs_count || 0) * 6)
                });
            }
            setLoading(false);
        };

        fetchProfile();
    }, [navigate]);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
        if (!profile) return;
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                return;
            }

            const file = event.target.files[0];
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                addToast('Formato não suportado. Use JPG, PNG, WebP ou GIF.', 'error');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                addToast('Arquivo muito grande. Máximo 5MB.', 'error');
                return;
            }
            const fileExt = file.name.split('.').pop();
            const fileName = `${profile.id}/${type}_${Date.now()}.${fileExt}`;

            // Upload to 'avatars' bucket (used for both for now, or use 'covers' if exists)
            // Using 'avatars' for simplicity as confirmed it exists
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

            const updates: Partial<Pick<WorkerProfile, 'avatar_url' | 'cover_url'>> = {};
            if (type === 'avatar') updates.avatar_url = publicUrl;
            else updates.cover_url = publicUrl;

            const { error: updateError } = await supabase
                .from('workers')
                .update(updates)
                .eq('id', profile.id);

            if (updateError) throw updateError;

            setProfile({ ...profile, ...updates } as WorkerProfile);
            addToast(`${type === 'avatar' ? 'Foto de perfil' : 'Capa'} atualizada!`, 'success');
        } catch (error) {
            addToast('Erro ao fazer upload!', 'error');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!profile) return;
        try {
            setLoading(true);
            const rolesArray = formData.roles.split(',').map(r => r.trim()).filter(r => r.length > 0);

            const updates = {
                full_name: formData.full_name,
                city: formData.city,
                phone: formData.phone,
                bio: formData.bio,
                pix_key: formData.pix_key,
                primary_role: formData.primary_role,
                roles: rolesArray,
                updated_at: new Date()
            };

            const { error } = await supabase
                .from('workers')
                .update(updates)
                .eq('id', profile.id);

            if (error) throw error;

            setProfile({ ...profile, ...updates });
            initialFormDataRef.current = { ...formData };
            setIsEditing(false);
            addToast('Perfil atualizado com sucesso!', 'success');
        } catch (error) {
            addToast('Erro ao atualizar perfil!', 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col gap-8 pb-12 max-w-4xl mx-auto animate-pulse">
            <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-3">
                    <div className="h-8 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
            </div>
            <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-14 bg-gray-200 rounded-xl" />
                ))}
            </div>
        </div>
    );

    if (!profile) return <div className="text-center p-8">Erro ao carregar perfil.</div>;

    return (
        <div className="flex flex-col gap-8 pb-12 font-sans text-accent max-w-4xl mx-auto">

            {/* Header / Cover */}
            {/* Header / Cover */}
            <div className="relative mb-12 group">
                <div className="h-48 bg-gray-900 rounded-3xl border-2 border-black overflow-hidden relative">
                    {profile.cover_url ? (
                        <img src={profile.cover_url} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-gray-900 to-black"></div>
                    )}

                    {/* Cover Upload Button */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => coverInputRef.current?.click()} className="bg-black/50 text-white p-2 rounded-lg backdrop-blur-sm hover:bg-black transition-colors">
                            <Camera size={20} />
                        </button>
                    </div>
                </div>
                <input
                    type="file"
                    ref={coverInputRef}
                    className="hidden"
                    accept="image/*"
                    aria-label="Upload foto de capa"
                    onChange={(e) => handleUpload(e, 'cover')}
                    disabled={uploading}
                />

                {/* Profile Card Overlay */}
                <div className="absolute -bottom-12 left-6 right-6 flex flex-col md:flex-row items-end md:items-center justify-between gap-4">
                    <div className="flex items-end gap-4">
                        <div className="w-32 h-32 bg-white rounded-full border-4 border-black p-1 relative shadow-[4px_4px_0px_0px_rgba(0,166,81,1)] group">
                            {/* Avatar Placeholder or Image */}
                            <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center overflow-hidden relative">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={64} className="text-gray-400" />
                                )}

                                {/* Camera Overlay for Upload */}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <Camera className="text-white" size={24} />
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    aria-label="Upload foto de perfil"
                                    onChange={(e) => handleUpload(e, 'avatar')}
                                    disabled={uploading}
                                />
                            </div>
                            {profile.verified_identity && (
                                <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full border-2 border-white" title="Identidade Verificada">
                                    <ShieldCheck size={16} strokeWidth={3} />
                                </div>
                            )}
                        </div>
                        <div className="mb-2">
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    aria-label="Nome completo"
                                    className="text-3xl font-black uppercase tracking-tight text-white drop-shadow-md bg-transparent border-b border-white mb-2 w-full outline-none"
                                />
                            ) : (
                                <h1 className="text-3xl font-black uppercase tracking-tight text-white drop-shadow-md">{profile.full_name}</h1>
                            )}

                            <div className="flex items-center gap-2 text-white/80 font-bold text-sm bg-black/50 px-2 py-1 rounded-lg backdrop-blur-sm w-fit">
                                <MapPin size={14} />
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        aria-label="Cidade"
                                        className="bg-transparent border-b border-white/50 text-white w-24 outline-none"
                                    />
                                ) : (
                                    profile.city
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 mb-2">
                        {isEditing ? (
                            <>
                                <button onClick={() => setIsEditing(false)} className="bg-white text-black px-4 py-2 rounded-xl font-bold uppercase text-sm border-2 border-black hover:bg-gray-100 transition-all">
                                    <X size={16} className="inline mr-1" /> Cancelar
                                </button>
                                <button onClick={handleSave} className="bg-primary text-white px-6 py-2 rounded-xl font-black uppercase text-sm border-2 border-black hover:bg-green-600 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <Save size={16} className="inline mr-1" /> Salvar
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="bg-white text-black px-6 py-2 rounded-xl font-black uppercase text-sm border-2 border-black hover:bg-primary hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <Edit2 size={16} className="inline mr-2" /> Editar Perfil
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">

                {/* Left Column: Stats & Skills */}
                <div className="space-y-6">

                    {/* Level Card */}
                    <div className="bg-black text-white p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-xs font-bold uppercase text-primary tracking-widest">Nível</span>
                                <h2 className="text-5xl font-black italic">LVL {profile.level || 1}</h2>
                            </div>
                            <Award className="text-primary" size={32} />
                        </div>
                        <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                            {/* Mock progress based on XP - assuming 100XP per level */}
                            <div className="bg-primary h-full" style={{ width: `${(profile.xp || 0) % 100}%` }}></div>
                        </div>
                        <p className="text-xs font-bold text-gray-400 mt-2">{profile.xp || 0} XP Total</p>
                    </div>

                    {/* Stats */}
                    <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-sm">
                        <h3 className="text-lg font-black uppercase mb-4">Estatísticas</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <span className="text-sm font-bold text-gray-500">Jobs Realizados</span>
                                <span className="text-lg font-black">{stats.completedJobs}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <span className="text-sm font-bold text-gray-500">Horas Totais</span>
                                <span className="text-lg font-black">{stats.hoursWorked}h</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-500">Avaliação</span>
                                <span className="flex items-center gap-1 text-lg font-black text-yellow-500">
                                    <Star size={18} fill="currentColor" /> {profile.rating_average || '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Payments */}
                    <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-black uppercase flex items-center gap-2">
                                <CreditCard size={20} /> Recebimento
                            </h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Gerencie seus ganhos e saques na sua carteira.</p>

                        <button
                            onClick={() => navigate('/wallet')}
                            className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-all flex justify-center items-center gap-2"
                        >
                            Ir para Carteira
                        </button>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-white p-6 rounded-2xl border-2 border-black shadow-sm">
                        <h3 className="text-lg font-black uppercase mb-4">Contato</h3>
                        <div className="space-y-4 text-sm font-bold text-gray-600">
                            <div className="flex items-center gap-2">
                                <Phone size={16} />
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        aria-label="Telefone"
                                        className="border-b border-gray-300 w-full outline-none focus:border-black"
                                        placeholder="(00) 00000-0000"
                                    />
                                ) : (
                                    profile.phone || "Não informado"
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: Roles, Bio, Reviews */}
                <div className="md:col-span-2 space-y-8">

                    {/* Roles & Bio */}
                    <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)]">
                        <div className="mb-6">
                            <h3 className="text-xl font-black uppercase mb-3 flex items-center gap-2">
                                <Briefcase size={20} /> Especialidades
                            </h3>

                            {isEditing ? (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={formData.primary_role}
                                        onChange={(e) => setFormData({ ...formData, primary_role: e.target.value })}
                                        placeholder="Função Principal (ex: Bartender)"
                                        aria-label="Funcao principal"
                                        className="w-full border p-2 rounded-lg"
                                    />
                                    <textarea
                                        value={formData.roles}
                                        onChange={(e) => setFormData({ ...formData, roles: e.target.value })}
                                        placeholder="Outras habilidades (separe por vírgula)"
                                        aria-label="Especialidades"
                                        className="w-full border p-2 rounded-lg h-20"
                                    />
                                    <p className="text-xs text-gray-400">Separe as especialidades por vírgula.</p>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {profile.roles && (Array.isArray(profile.roles) ? profile.roles : [profile.primary_role]).map((role: string, i: number) => (
                                        <span key={i} className="bg-black text-white px-4 py-2 rounded-lg font-bold uppercase text-sm border-2 border-black hover:bg-white hover:text-black transition-colors">
                                            {role}
                                        </span>
                                    ))}
                                    {(!profile.roles || profile.roles.length === 0) && !profile.primary_role && (
                                        <span className="text-gray-400 italic font-medium">Nenhuma especialidade listada.</span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mb-6">
                            <h3 className="text-xl font-black uppercase mb-3">Sobre</h3>
                            {isEditing ? (
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    aria-label="Sobre voce"
                                    className="w-full border p-2 rounded-lg h-32"
                                    placeholder="Conte um pouco sobre sua experiência..."
                                />
                            ) : (
                                <p className="text-gray-600 font-medium leading-relaxed">
                                    {profile.bio || "Este profissional ainda não adicionou uma biografia."}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <span className="block text-xs font-bold uppercase text-gray-400 mb-1">Experiência</span>
                                <span className="block text-lg font-black">{profile.experience_years || "Iniciante"}</span>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <span className="block text-xs font-bold uppercase text-gray-400 mb-1">Disponibilidade</span>
                                <span className="block text-lg font-black truncate" title={Array.isArray(profile.availability) ? profile.availability.join(', ') : profile.availability || undefined}>
                                    {Array.isArray(profile.availability) && profile.availability.length > 0 ? profile.availability[0] + (profile.availability.length > 1 ? ` +${profile.availability.length - 1}` : '') : (profile.availability || "N/A")}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-sm">
                        <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                            <Lock size={20} /> Seguranca
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Nova Senha</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    aria-label="Nova senha"
                                    placeholder="Minimo 8 caracteres"
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 font-bold focus:border-black outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Confirmar Senha</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    aria-label="Confirmar senha"
                                    placeholder="Repita a nova senha"
                                    className="w-full border-2 border-gray-200 rounded-xl p-3 font-bold focus:border-black outline-none"
                                />
                            </div>
                            {passwordError && (
                                <p className="text-red-600 text-sm font-bold">{passwordError}</p>
                            )}
                            <button
                                onClick={handlePasswordChange}
                                disabled={!newPassword || !confirmPassword}
                                className="bg-black text-white px-6 py-3 rounded-xl font-black uppercase text-sm hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Alterar Senha
                            </button>
                        </div>
                    </div>

                    {/* Reviews Section - Placeholder for now until we have reviews table populated */}
                    <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-sm">
                        <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                            <Star size={20} /> Avaliações Recentes
                        </h3>

                        <div className="text-center py-8 text-gray-400 font-medium">
                            <p>Nenhuma avaliação recebida ainda.</p>
                            <p className="text-sm mt-2">Complete jobs para receber avaliações de empresas.</p>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
