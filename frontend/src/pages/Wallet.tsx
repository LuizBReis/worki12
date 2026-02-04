import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { WalletService } from '../services/walletService';
import type { WalletTransaction } from '../services/walletService';
import { DollarSign, CreditCard, ArrowDownLeft, ArrowUpRight, History, Loader2, Wallet as WalletIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Wallet() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [stats, setStats] = useState({ income: 0, pending: 0 });

    useEffect(() => {
        const fetchWalletData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return navigate('/login');

            // 1. Get or create worker wallet
            const wallet = await WalletService.getOrCreateWallet(user.id, 'worker');
            if (wallet) {
                setBalance(wallet.balance);
            }

            // 2. Fetch Transactions
            const txs = await WalletService.getTransactions(user.id);
            setTransactions(txs);

            // 3. Calculate Stats
            const income = txs
                .filter(t => t.type === 'escrow_release' || t.amount > 0)
                .reduce((acc, t) => acc + Math.abs(t.amount), 0);

            // Fetch pending escrows (jobs that are hired but not completed)
            const { data: pendingApps } = await supabase
                .from('applications')
                .select('job:jobs(budget)')
                .eq('worker_id', user.id)
                .eq('status', 'hired');

            const pending = (pendingApps || []).reduce((acc: number, app: any) =>
                acc + (app.job?.budget || 0), 0);

            setStats({ income, pending });

            setLoading(false);
        };

        fetchWalletData();
    }, [navigate]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'escrow_release': return <ArrowDownLeft size={20} />;
            case 'debit': return <ArrowUpRight size={20} />;
            default: return <DollarSign size={20} />;
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <Loader2 className="animate-spin" size={32} />
        </div>
    );

    return (
        <div className="flex flex-col gap-8 pb-12 font-sans text-accent max-w-4xl mx-auto">

            <header>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Carteira</h2>
                <p className="text-gray-500">Seus ganhos e pagamentos</p>
            </header>

            {/* Main Balance Card */}
            <div className="bg-black text-white p-8 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,166,81,1)] relative overflow-hidden">
                <div className="relative z-10">
                    <span className="text-sm font-bold uppercase text-gray-400 tracking-wider">Saldo Disponível</span>
                    <h2 className="text-6xl font-black tracking-tighter text-white mt-2 mb-6">R$ {balance.toFixed(2).replace('.', ',')}</h2>

                    <div className="flex gap-4">
                        <button
                            className="flex-1 bg-primary text-white py-4 rounded-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-y-1 transition-all flex items-center justify-center gap-2"
                            onClick={() => alert('Funcionalidade de saque em breve!')}
                        >
                            <ArrowDownLeft size={20} /> Sacar (Pix)
                        </button>
                        <button
                            className="flex-1 bg-white/10 text-white py-4 rounded-xl font-bold uppercase hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                            onClick={() => alert('Em breve!')}
                        >
                            <CreditCard size={20} /> Adicionar Conta
                        </button>
                    </div>
                </div>
                {/* Background Element */}
                <WalletIcon size={200} className="absolute -top-10 -right-10 text-white/5 rotate-12" />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border-2 border-black">
                    <div className="flex items-center gap-2 mb-2 text-green-600">
                        <ArrowDownLeft size={20} /> <span className="text-xs font-black uppercase">Total Recebido</span>
                    </div>
                    <h3 className="text-2xl font-black">R$ {stats.income.toFixed(2).replace('.', ',')}</h3>
                    <p className="text-xs text-gray-400 mt-1">Pagamentos por trabalhos</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border-2 border-black">
                    <div className="flex items-center gap-2 mb-2 text-orange-600">
                        <DollarSign size={20} /> <span className="text-xs font-black uppercase">A Receber</span>
                    </div>
                    <h3 className="text-2xl font-black">R$ {stats.pending.toFixed(2).replace('.', ',')}</h3>
                    <p className="text-xs text-gray-400 mt-1">Jobs em andamento</p>
                </div>
            </div>

            {/* Transactions List */}
            <section className="bg-white border-2 border-black rounded-2xl p-6">
                <h3 className="text-lg font-black uppercase mb-6 flex items-center gap-2">
                    <History size={20} /> Histórico de Transações
                </h3>

                <div className="space-y-4">
                    {transactions.length > 0 ? transactions.map((t) => (
                        <div key={t.id} className="flex justify-between items-center border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${t.amount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {getTransactionIcon(t.type)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">{t.description || 'Transação'}</h4>
                                    <p className="text-xs text-gray-400">{formatDate(t.created_at)}</p>
                                </div>
                            </div>
                            <span className={`text-lg font-black ${t.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                {t.amount > 0 ? '+' : ''} R$ {Math.abs(t.amount).toFixed(2).replace('.', ',')}
                            </span>
                        </div>
                    )) : (
                        <div className="text-center py-8 text-gray-400">
                            <WalletIcon size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="font-bold text-sm">Nenhuma transação ainda.</p>
                            <p className="text-xs mt-1">Complete jobs para começar a ganhar!</p>
                        </div>
                    )}
                </div>
            </section>

        </div>
    );
}
