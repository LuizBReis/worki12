
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User, MapPin, Briefcase, Star, ShieldCheck, Phone, Edit2, Loader2, Award, Save, X, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    // Editing State
    const [formData, setFormData] = useState({
        full_name: '',
        city: '',
        phone: '',
        bio: '',
        pix_key: '',
        primary_role: '',
        roles: '' // comma separated string for editing
    });

    const [stats, setStats] = useState({
        completedJobs: 0,
        totalEarnings: 0,
        hoursWorked: 0
    });

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
                setFormData({
                    full_name: data.full_name || '',
                    city: data.city || '',
                    phone: data.phone || '',
                    bio: data.bio || '',
                    pix_key: data.pix_key || '',
                    primary_role: data.primary_role || '',
                    roles: data.roles ? data.roles.join(', ') : ''
                });
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
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                return;
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${profile.id}/${type}_${Date.now()}.${fileExt}`;

            // Upload to 'avatars' bucket (used for both for now, or use 'covers' if exists)
            // Using 'avatars' for simplicity as confirmed it exists
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

            const updates: any = {};
            if (type === 'avatar') updates.avatar_url = publicUrl;
            else updates.cover_url = publicUrl; // Ensure this column exists or add it to workers table

            const { error: updateError } = await supabase
                .from('workers')
                .update(updates)
                .eq('id', profile.id);

            if (updateError) throw updateError;

            setProfile({ ...profile, ...updates });
            alert(`${type === 'avatar' ? 'Foto de perfil' : 'Capa'} atualizada!`);
        } catch (error) {
            alert('Erro ao fazer upload!');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
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
            setIsEditing(false);
            alert('Perfil atualizado com sucesso!');
        } catch (error) {
            alert('Erro ao atualizar perfil!');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <Loader2 className="animate-spin" size={32} />
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
                                        className="w-full border p-2 rounded-lg"
                                    />
                                    <textarea
                                        value={formData.roles}
                                        onChange={(e) => setFormData({ ...formData, roles: e.target.value })}
                                        placeholder="Outras habilidades (separe por vírgula)"
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
                                <span className="block text-lg font-black truncate" title={Array.isArray(profile.availability) ? profile.availability.join(', ') : profile.availability}>
                                    {Array.isArray(profile.availability) && profile.availability.length > 0 ? profile.availability[0] + (profile.availability.length > 1 ? ` +${profile.availability.length - 1}` : '') : (profile.availability || "N/A")}
                                </span>
                            </div>
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
