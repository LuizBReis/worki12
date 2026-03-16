import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, ArrowRight, Mail, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

function translateAuthError(msg: string): string {
    if (msg.includes('Invalid login credentials')) return 'Email ou senha incorretos. Verifique suas credenciais.';
    if (msg.includes('Email not confirmed')) return 'Email nao confirmado. Verifique sua caixa de entrada.';
    if (msg.includes('User already registered')) return 'Este email ja esta cadastrado. Tente fazer login.';
    if (msg.includes('Password should be at least')) return 'A senha deve ter pelo menos 8 caracteres.';
    if (msg.includes('rate')) return 'Muitas tentativas. Aguarde alguns minutos.';
    return 'Ocorreu um erro. Tente novamente.';
}

export default function Login() {
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'work'; // 'work' or 'hire'
    const navigate = useNavigate();

    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const isHire = type === 'hire';
    const strength = useMemo(() => getPasswordStrength(password), [password]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        if (isSignUp && password.length < 8) {
            setError('A senha deve ter pelo menos 8 caracteres.');
            setLoading(false);
            return;
        }

        try {
            if (isSignUp) {
                // Sign Up
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            user_type: type, // 'work' or 'hire'
                        },
                    },
                });

                if (signUpError) throw signUpError;

                if (data.user) {
                    setSuccessMessage('Conta criada! Verifique seu email para confirmar.');
                }
            } else {
                // Sign In
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;

                if (data.user) {
                    // Check user metadata for correct redirection
                    const userType = data.user.user_metadata?.user_type;

                    if (userType === 'hire') {
                        navigate('/company/dashboard');
                    } else {
                        navigate('/dashboard');
                    }
                }
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : '';
            setError(translateAuthError(msg));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500
                    ${isHire ? 'bg-accent' : 'bg-[#F4F4F0]'}`}>

            {/* Back Button */}
            <button
                onClick={() => navigate('/')}
                className={`absolute top-6 left-6 flex items-center gap-2 font-bold px-4 py-2 rounded-full border-2 transition-all
                   ${isHire ? 'text-white border-white hover:bg-white hover:text-black' : 'text-black border-black hover:bg-black hover:text-white'}`}
            >
                <ArrowLeft size={18} strokeWidth={3} />
                VOLTAR
            </button>

            {/* Main Card */}
            <div className="w-full max-w-md relative">
                {/* Brutalist Shadow Box */}
                <div className={`absolute inset-0 translate-x-3 translate-y-3 rounded-2xl border-2 border-black
                        ${isHire ? 'bg-primary' : 'bg-black'}`} />

                <div className="relative bg-white border-2 border-black rounded-2xl p-8 md:p-10 shadow-xl">

                    <div className="text-center mb-8">
                        <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">
                            {isSignUp
                                ? 'Criar Conta'
                                : (isHire ? 'Contratar Talentos' : 'Começar a Trabalhar')}
                        </h2>
                        <p className="font-medium text-gray-500">
                            {isSignUp
                                ? 'Preencha os dados para se cadastrar.'
                                : (isHire ? 'Acesse 10k+ profissionais avaliados.' : 'Ganhe dinheiro no seu próprio horário.')}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-xl text-sm font-medium">
                            {successMessage}
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-1">
                            <label htmlFor="login-email" className="text-xs font-bold uppercase tracking-wide">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 text-black" size={20} strokeWidth={2.5} />
                                <input
                                    id="login-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    aria-label="Endereco de email"
                                    className="w-full bg-gray-100 border-2 border-transparent focus:border-black focus:bg-white outline-none rounded-xl py-3 pl-10 pr-4 font-bold transition-all placeholder:font-medium"
                                    placeholder="nome@exemplo.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="login-password" className="text-xs font-bold uppercase tracking-wide">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 text-black" size={20} strokeWidth={2.5} />
                                <input
                                    id="login-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    aria-label="Senha"
                                    aria-describedby={isSignUp && password.length > 0 ? 'login-pw-strength' : undefined}
                                    className="w-full bg-gray-100 border-2 border-transparent focus:border-black focus:bg-white outline-none rounded-xl py-3 pl-10 pr-4 font-bold transition-all placeholder:font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                            {isSignUp && password.length > 0 && (
                                <div className="mt-1" id="login-pw-strength">
                                    <div className="flex gap-1 mb-1">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-gray-200'}`} />
                                        ))}
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400">Forca: {strength.label} {password.length < 8 && '- Minimo 8 caracteres'}</p>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white font-black uppercase text-lg py-4 rounded-xl hover:bg-primary hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    {isSignUp ? 'Criar Conta' : 'Entrar'} <ArrowRight size={20} strokeWidth={3} />
                                </>
                            )}
                        </button>

                        {!isSignUp && (
                            <div className="text-center mt-3">
                                <a href="/esqueci-senha" className="text-sm font-bold text-gray-500 hover:text-black transition-colors">
                                    Esqueci minha senha
                                </a>
                            </div>
                        )}
                    </form>

                    <div className="mt-8 text-center text-sm font-medium">
                        {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
                        <button
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError(null);
                                setSuccessMessage(null);
                            }}
                            className="underline decoration-2 hover:text-primary transition-colors font-bold"
                        >
                            {isSignUp ? 'Fazer Login' : 'Cadastre-se'}
                        </button>
                    </div>

                </div>
            </div>

        </div>
    );
}
