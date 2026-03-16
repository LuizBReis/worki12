import { useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;

    if (score <= 1) return { score, label: 'Fraca', color: 'bg-red-500' };
    if (score <= 2) return { score, label: 'Razoavel', color: 'bg-orange-500' };
    if (score <= 3) return { score, label: 'Boa', color: 'bg-yellow-500' };
    return { score, label: 'Forte', color: 'bg-green-500' };
}

export default function ResetPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const strength = useMemo(() => getPasswordStrength(password), [password]);

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
            if (updateError.message.includes('expired') || updateError.message.includes('invalid')) {
                setError('O link de redefinicao expirou. Solicite um novo link.');
            } else if (updateError.message.includes('same')) {
                setError('A nova senha nao pode ser igual a senha anterior.');
            } else {
                setError('Erro ao redefinir senha. Tente solicitar um novo link de recuperacao.');
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
                        <label htmlFor="reset-password" className="text-xs font-bold uppercase block mb-1">Nova Senha</label>
                        <input
                            id="reset-password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-black outline-none"
                            placeholder="Minimo 8 caracteres"
                            aria-label="Nova senha"
                            aria-describedby="password-strength"
                            autoFocus
                        />
                        {password.length > 0 && (
                            <div className="mt-2" id="password-strength">
                                <div className="flex gap-1 mb-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-gray-200'}`} />
                                    ))}
                                </div>
                                <p className="text-xs font-bold text-gray-500">Forca: {strength.label}</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="reset-confirm" className="text-xs font-bold uppercase block mb-1">Confirmar Senha</label>
                        <input
                            id="reset-confirm"
                            type="password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-black outline-none"
                            placeholder="Repita a senha"
                            aria-label="Confirmar nova senha"
                        />
                    </div>

                    {error && (
                        <p className="text-red-600 text-sm font-bold" role="alert">{error}</p>
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
