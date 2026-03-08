import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users, Briefcase, DollarSign, ShieldCheck, ArrowLeft } from 'lucide-react';

// Admin email whitelist - add production admin emails here
const ADMIN_EMAILS = ['luizguilhermebarretodosreis@yahoo.com.br'];

interface Stats {
    totalWorkers: number;
    totalCompanies: number;
    totalJobs: number;
    totalEscrowReserved: number;
    totalEscrowReleased: number;
    totalTransactions: number;
}

interface RecentTransaction {
    id: string;
    amount: number;
    type: string;
    description: string | null;
    created_at: string;
}

export default function Admin() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [stats, setStats] = useState<Stats | null>(null);
    const [transactions, setTransactions] = useState<RecentTransaction[]>([]);

    const loadData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
            navigate('/');
            return;
        }
        setAuthorized(true);

        // Stats - use service_role via edge function or direct queries
        const [workersRes, companiesRes, jobsRes, escrowReserved, escrowReleased, txRes] = await Promise.all([
            supabase.from('workers').select('id', { count: 'exact', head: true }),
            supabase.from('companies').select('id', { count: 'exact', head: true }),
            supabase.from('jobs').select('id', { count: 'exact', head: true }),
            supabase.from('escrow_transactions').select('amount').eq('status', 'reserved'),
            supabase.from('escrow_transactions').select('amount').eq('status', 'released'),
            supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false }).limit(20),
        ]);

        const reservedTotal = (escrowReserved.data || []).reduce((s, e) => s + Number(e.amount), 0);
        const releasedTotal = (escrowReleased.data || []).reduce((s, e) => s + Number(e.amount), 0);

        setStats({
            totalWorkers: workersRes.count || 0,
            totalCompanies: companiesRes.count || 0,
            totalJobs: jobsRes.count || 0,
            totalEscrowReserved: reservedTotal,
            totalEscrowReleased: releasedTotal,
            totalTransactions: (txRes.data || []).length,
        });

        setTransactions((txRes.data || []) as RecentTransaction[]);
        setLoading(false);
    }, [navigate]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
    }, [loadData]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin" size={32} />
        </div>
    );

    if (!authorized) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-200 rounded-lg">
                        <ArrowLeft size={20} />
                    </button>
                    <ShieldCheck size={28} className="text-red-600" />
                    <h1 className="text-3xl font-black uppercase">Admin Panel</h1>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    <StatCard icon={<Users size={20} />} label="Workers" value={stats?.totalWorkers || 0} color="green" />
                    <StatCard icon={<Briefcase size={20} />} label="Empresas" value={stats?.totalCompanies || 0} color="blue" />
                    <StatCard icon={<Briefcase size={20} />} label="Vagas" value={stats?.totalJobs || 0} color="purple" />
                    <StatCard icon={<DollarSign size={20} />} label="Escrow Reservado" value={`R$ ${(stats?.totalEscrowReserved || 0).toFixed(2)}`} color="orange" />
                    <StatCard icon={<DollarSign size={20} />} label="Escrow Liberado" value={`R$ ${(stats?.totalEscrowReleased || 0).toFixed(2)}`} color="green" />
                    <StatCard icon={<DollarSign size={20} />} label="Transacoes" value={stats?.totalTransactions || 0} color="gray" />
                </div>

                {/* Recent Transactions */}
                <div className="bg-white border-2 border-black rounded-2xl p-6 mb-8">
                    <h2 className="text-xl font-black uppercase mb-4">Transacoes Recentes</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-black">
                                    <th className="text-left py-2 font-black uppercase">Tipo</th>
                                    <th className="text-left py-2 font-black uppercase">Valor</th>
                                    <th className="text-left py-2 font-black uppercase">Descricao</th>
                                    <th className="text-left py-2 font-black uppercase">Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(tx => (
                                    <tr key={tx.id} className="border-b border-gray-100">
                                        <td className="py-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                tx.type === 'credit' || tx.type === 'escrow_release' ? 'bg-green-100 text-green-700' :
                                                tx.type === 'debit' || tx.type === 'escrow_reserve' ? 'bg-red-100 text-red-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className={`py-2 font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            R$ {Math.abs(tx.amount).toFixed(2)}
                                        </td>
                                        <td className="py-2 text-gray-600">{tx.description || '-'}</td>
                                        <td className="py-2 text-gray-400">
                                            {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
    const colors: Record<string, string> = {
        green: 'bg-green-50 text-green-700 border-green-200',
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
        orange: 'bg-orange-50 text-orange-700 border-orange-200',
        gray: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return (
        <div className={`p-4 rounded-xl border-2 ${colors[color] || colors.gray}`}>
            <div className="flex items-center gap-2 mb-1">{icon} <span className="text-xs font-bold uppercase">{label}</span></div>
            <p className="text-2xl font-black">{value}</p>
        </div>
    );
}
