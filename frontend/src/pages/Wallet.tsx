
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, CreditCard, ArrowDownLeft, ArrowUpRight, History, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Wallet() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [stats, setStats] = useState({ income: 0, expense: 0 });

    useEffect(() => {
        const fetchWalletData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return navigate('/login');

            // 1. Fetch Worker Balance (Earnings Total)
            const { data: worker } = await supabase
                .from('workers')
                .select('earnings_total')
                .eq('id', user.id)
                .single();

            if (worker) {
                setBalance(worker.earnings_total || 0);
            }

            // 2. Fetch Completed Jobs as Income (Transactions)
            const { data: apps } = await supabase
                .from('applications')
                .select('created_at, status, job:jobs(title, budget, start_date)')
                .eq('worker_id', user.id)
                .eq('status', 'completed')
                .order('created_at', { ascending: false });

            if (apps) {
                const txs = apps.map((app: any) => ({
                    id: app.created_at, // using date as ID for now
                    title: app.job?.title || 'Job Realizado',
                    date: app.job?.start_date ? new Date(app.job.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Data N/D',
                    val: app.job?.budget || 0,
                    type: 'in'
                }));
                setTransactions(txs);

                // Calculate Income Stats (This month? Or Total?)
                // For simplicity, showing Total Income from fetched txs
                const totalIncome = txs.reduce((acc: number, curr: any) => acc + curr.val, 0);
                setStats({ income: totalIncome, expense: 0 }); // Expense mocked as 0 for now as no withdrawal system
            }

            setLoading(false);
        };

        fetchWalletData();
    }, [navigate]);

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <Loader2 className="animate-spin" size={32} />
        </div>
    );

    return (
        <div className="flex flex-col gap-8 pb-12 font-sans text-accent max-w-4xl mx-auto">

            <header>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Carteira</h2>
            </header>

            {/* Main Balance Card */}
            <div className="bg-black text-white p-8 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,166,81,1)] relative overflow-hidden">
                <div className="relative z-10">
                    <span className="text-sm font-bold uppercase text-gray-400 tracking-wider">Saldo Disponível</span>
                    <h2 className="text-6xl font-black tracking-tighter text-white mt-2 mb-6">R$ {balance.toFixed(2).replace('.', ',')}</h2>

                    <div className="flex gap-4">
                        <button className="flex-1 bg-primary text-white py-4 rounded-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-y-1 transition-all flex items-center justify-center gap-2" onClick={() => alert('Funcionalidade de saque em breve!')}>
                            <ArrowDownLeft size={20} /> Sacar (Pix)
                        </button>
                        <button className="flex-1 bg-white/10 text-white py-4 rounded-xl font-bold uppercase hover:bg-white/20 transition-colors flex items-center justify-center gap-2" onClick={() => alert('Em breve!')}>
                            Adicionar Conta
                        </button>
                    </div>
                </div>
                {/* Background Element */}
                <DollarSign size={200} className="absolute -top-10 -right-10 text-white/5 rotate-12" />
            </div>

            {/* Income/Expense Stats */}
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border-2 border-black">
                    <div className="flex items-center gap-2 mb-2 text-green-600">
                        <ArrowDownLeft size={20} /> <span className="text-xs font-black uppercase">Entradas (Total)</span>
                    </div>
                    <h3 className="text-2xl font-black">R$ {stats.income.toFixed(2).replace('.', ',')}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border-2 border-black opacity-50">
                    <div className="flex items-center gap-2 mb-2 text-gray-400">
                        <ArrowUpRight size={20} /> <span className="text-xs font-black uppercase">Saques (Total)</span>
                    </div>
                    <h3 className="text-2xl font-black">R$ 0,00</h3>
                </div>
            </div>

            {/* Transactions List */}
            <section className="bg-white border-2 border-black rounded-2xl p-6">
                <h3 className="text-lg font-black uppercase mb-6 flex items-center gap-2">
                    <History size={20} /> Histórico de Transações
                </h3>

                <div className="space-y-4">
                    {transactions.length > 0 ? transactions.map((t, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${t.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {t.type === 'in' ? <DollarSign size={20} /> : <CreditCard size={20} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">{t.title}</h4>
                                    <p className="text-xs text-gray-400">{t.date}</p>
                                </div>
                            </div>
                            <span className={`text-lg font-black ${t.type === 'in' ? 'text-green-600' : 'text-gray-900'}`}>
                                {t.type === 'in' ? '+' : '-'} R$ {t.val.toFixed(2).replace('.', ',')}
                            </span>
                        </div>
                    )) : (
                        <div className="text-center py-8 text-gray-400">
                            <p className="font-bold text-sm">Nenhuma transação registrada.</p>
                        </div>
                    )}
                </div>
            </section>

        </div>
    );
}
