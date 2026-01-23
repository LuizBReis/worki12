import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, ArrowRight, Mail, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

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
                    // Redirect based on type (this is valid for now, ideally check user metadata in real app)
                    if (isHire) {
                        navigate('/company/dashboard');
                    } else {
                        navigate('/dashboard');
                    }
                }
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro. Tente novamente.');
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
                            <label className="text-xs font-bold uppercase tracking-wide">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 text-black" size={20} strokeWidth={2.5} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-gray-100 border-2 border-transparent focus:border-black focus:bg-white outline-none rounded-xl py-3 pl-10 pr-4 font-bold transition-all placeholder:font-medium"
                                    placeholder="nome@exemplo.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-wide">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 text-black" size={20} strokeWidth={2.5} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full bg-gray-100 border-2 border-transparent focus:border-black focus:bg-white outline-none rounded-xl py-3 pl-10 pr-4 font-bold transition-all placeholder:font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
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
