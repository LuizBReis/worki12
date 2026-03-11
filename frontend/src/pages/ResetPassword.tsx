import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;

    if (score <= 1) return { label: 'Fraca', color: 'bg-red-500', width: 'w-1/4' };
    if (score <= 2) return { label: 'Razoavel', color: 'bg-yellow-500', width: 'w-1/2' };
    if (score <= 3) return { label: 'Media', color: 'bg-blue-500', width: 'w-3/4' };
    return { label: 'Forte', color: 'bg-green-500', width: 'w-full' };
}

export default function ResetPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const strength = getPasswordStrength(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('A senha deve ter pelo menos 8 caracteres.');
            return;
        }
        if (password !== confirm) {
            setError('As senhas nao coincidem.');
            return;
        }

        setLoading(true);
        const { error: updateError } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (updateError) {
            const msg = updateError.message || '';
            if (msg.includes('expired') || msg.includes('Token has expired')) {
                setError('Link expirado. Solicite um novo link de recuperacao.');
            } else if (msg.includes('invalid') || msg.includes('Invalid token') || msg.includes('not found')) {
                setError('Link invalido. Solicite um novo link de recuperacao.');
            } else if (msg.includes('weak') || msg.includes('too short') || msg.includes('at least')) {
                setError('Senha muito fraca. Use no minimo 8 caracteres com letras e numeros.');
            } else {
                setError('Erro ao redefinir senha. Tente novamente ou solicite um novo link.');
            }
            return;
        }

        setSuccess(true);
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#F4F4F0] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border-2 border-black p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <h1 className="text-2xl font-black uppercase mb-2">Senha Redefinida</h1>
                    <p className="text-gray-600 mb-6">Sua senha foi alterada com sucesso.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-black text-white py-3 rounded-xl font-bold uppercase hover:bg-gray-800 transition-colors"
                    >
                        Ir para Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F4F4F0] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border-2 border-black p-8 max-w-md w-full">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Lock size={24} className="text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase">Nova Senha</h1>
                        <p className="text-sm text-gray-500">Escolha uma senha segura</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase block mb-1">Nova Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            aria-label="Nova senha"
                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-black outline-none"
                            placeholder="Minimo 8 caracteres"
                            autoFocus
                        />
                        {password.length > 0 && (
                            <div className="mt-2">
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300 rounded-full`} />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Forca: {strength.label}</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase block mb-1">Confirmar Senha</label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            aria-label="Confirmar senha"
                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-black outline-none"
                            placeholder="Repita a senha"
                        />
                    </div>

                    {error && (
                        <p className="text-red-600 text-sm font-bold">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !password || !confirm}
                        className="w-full bg-black text-white py-3 rounded-xl font-bold uppercase hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Redefinir Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
}
