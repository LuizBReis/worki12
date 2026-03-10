import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users, Briefcase, DollarSign, ShieldCheck, ArrowLeft, Lock } from 'lucide-react';
import { invokeFunction } from '../services/api';

const ADMIN_EMAILS = ['luizguilhermebarretodosreis@yahoo.com.br'];

interface Stats {
    totalWorkers: number;
    totalCompanies: number;
    totalJobs: number;
    totalEscrowReserved: number;
    totalEscrowReleased: number;
    platformBalance: number;
}

interface RecentTransaction {
    id: string;
    amount: number;
    type: string;
    description: string | null;
    created_at: string;
}

interface AdminUser {
    id: string;
    email: string;
    user_type: string;
    full_name: string;
    created_at: string;
    email_confirmed_at: string | null;
    last_sign_in_at: string | null;
    profile: Record<string, unknown> | null;
}

interface EscrowItem {
    id: string;
    job_id: string;
    amount: number;
    status: string;
    created_at: string;
    released_at: string | null;
    job?: { title: string; company_id: string } | null;
}

type Tab = 'dashboard' | 'users' | 'escrows';

export default function Admin() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [tab, setTab] = useState<Tab>('dashboard');
    const [stats, setStats] = useState<Stats | null>(null);
    const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [escrows, setEscrows] = useState<EscrowItem[]>([]);
    const [loadingTab, setLoadingTab] = useState(false);

    const loadDashboard = useCallback(async () => {
        try {
            const data = await invokeFunction<{ stats: Stats; transactions: RecentTransaction[] }>('admin-data', { action: 'stats' });
            setStats(data.stats);
            setTransactions(data.transactions);
        } catch (err) {
            console.error('Failed to load admin stats:', err);
        }
    }, []);

    const loadUsers = useCallback(async () => {
        setLoadingTab(true);
        try {
            const data = await invokeFunction<{ users: AdminUser[] }>('admin-data', { action: 'users' });
            setUsers(data.users);
        } catch (err) {
            console.error('Failed to load users:', err);
        }
        setLoadingTab(false);
    }, []);

    const loadEscrows = useCallback(async () => {
        setLoadingTab(true);
        try {
            const data = await invokeFunction<{ escrows: EscrowItem[] }>('admin-data', { action: 'escrows' });
            setEscrows(data.escrows);
        } catch (err) {
            console.error('Failed to load escrows:', err);
        }
        setLoadingTab(false);
    }, []);

    const checkAuth = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
            navigate('/');
            return;
        }
        setAuthorized(true);
        await loadDashboard();
        setLoading(false);
    }, [navigate, loadDashboard]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (!authorized) return;
        if (tab === 'users' && users.length === 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            loadUsers();
        }
        if (tab === 'escrows' && escrows.length === 0) {
            loadEscrows();
        }
    }, [tab, authorized, users.length, escrows.length, loadUsers, loadEscrows]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin" size={32} />
        </div>
    );

    if (!authorized) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-200 rounded-lg">
                        <ArrowLeft size={20} />
                    </button>
                    <ShieldCheck size={28} className="text-red-600" />
                    <h1 className="text-3xl font-black uppercase">Admin Panel</h1>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {(['dashboard', 'users', 'escrows'] as Tab[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold uppercase border-2 transition-colors ${
                                tab === t ? 'bg-black text-white border-black' : 'bg-white text-black border-gray-300 hover:border-black'
                            }`}
                        >
                            {t === 'dashboard' ? 'Dashboard' : t === 'users' ? 'Usuarios' : 'Escrows'}
                        </button>
                    ))}
                </div>

                {tab === 'dashboard' && <DashboardTab stats={stats} transactions={transactions} />}
                {tab === 'users' && (loadingTab ? <TabLoader /> : <UsersTab users={users} />)}
                {tab === 'escrows' && (loadingTab ? <TabLoader /> : <EscrowsTab escrows={escrows} />)}
            </div>
        </div>
    );
}

function TabLoader() {
    return (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin" size={24} />
        </div>
    );
}

function DashboardTab({ stats, transactions }: { stats: Stats | null; transactions: RecentTransaction[] }) {
    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                <StatCard icon={<Users size={20} />} label="Workers" value={stats?.totalWorkers || 0} color="green" />
                <StatCard icon={<Briefcase size={20} />} label="Empresas" value={stats?.totalCompanies || 0} color="blue" />
                <StatCard icon={<Briefcase size={20} />} label="Vagas" value={stats?.totalJobs || 0} color="purple" />
                <StatCard icon={<DollarSign size={20} />} label="Escrow Reservado" value={`R$ ${(stats?.totalEscrowReserved || 0).toFixed(2)}`} color="orange" />
                <StatCard icon={<DollarSign size={20} />} label="Escrow Liberado" value={`R$ ${(stats?.totalEscrowReleased || 0).toFixed(2)}`} color="green" />
                <StatCard icon={<DollarSign size={20} />} label="Saldo Total" value={`R$ ${(stats?.platformBalance || 0).toFixed(2)}`} color="gray" />
            </div>

            <div className="bg-white border-2 border-black rounded-2xl p-6">
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
                            {transactions.length === 0 && (
                                <tr><td colSpan={4} className="py-4 text-center text-gray-400">Nenhuma transacao</td></tr>
                            )}
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
        </>
    );
}

function UsersTab({ users }: { users: AdminUser[] }) {
    return (
        <div className="bg-white border-2 border-black rounded-2xl p-6">
            <h2 className="text-xl font-black uppercase mb-4">Usuarios ({users.length})</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="text-left py-2 font-black uppercase">Email</th>
                            <th className="text-left py-2 font-black uppercase">Tipo</th>
                            <th className="text-left py-2 font-black uppercase">Nome</th>
                            <th className="text-left py-2 font-black uppercase">Email Confirmado</th>
                            <th className="text-left py-2 font-black uppercase">Ultimo Login</th>
                            <th className="text-left py-2 font-black uppercase">Cadastro</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 && (
                            <tr><td colSpan={6} className="py-4 text-center text-gray-400">Nenhum usuario</td></tr>
                        )}
                        {users.map(u => (
                            <tr key={u.id} className="border-b border-gray-100">
                                <td className="py-2 font-mono text-xs">{u.email}</td>
                                <td className="py-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        u.user_type === 'worker' ? 'bg-green-100 text-green-700' :
                                        u.user_type === 'company' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {u.user_type}
                                    </span>
                                </td>
                                <td className="py-2">{u.full_name || '-'}</td>
                                <td className="py-2">
                                    {u.email_confirmed_at
                                        ? <span className="text-green-600 font-bold text-xs">Sim</span>
                                        : <span className="text-red-500 font-bold text-xs">Nao</span>
                                    }
                                </td>
                                <td className="py-2 text-gray-400 text-xs">
                                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('pt-BR') : '-'}
                                </td>
                                <td className="py-2 text-gray-400 text-xs">
                                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function EscrowsTab({ escrows }: { escrows: EscrowItem[] }) {
    const reserved = escrows.filter(e => e.status === 'reserved');
    const released = escrows.filter(e => e.status === 'released');
    const refunded = escrows.filter(e => e.status === 'refunded');

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <StatCard icon={<Lock size={20} />} label="Reservados" value={reserved.length} color="orange" />
                <StatCard icon={<DollarSign size={20} />} label="Liberados" value={released.length} color="green" />
                <StatCard icon={<ArrowLeft size={20} />} label="Reembolsados" value={refunded.length} color="gray" />
            </div>

            <div className="bg-white border-2 border-black rounded-2xl p-6">
                <h2 className="text-xl font-black uppercase mb-4">Escrows ({escrows.length})</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b-2 border-black">
                                <th className="text-left py-2 font-black uppercase">Vaga</th>
                                <th className="text-left py-2 font-black uppercase">Valor</th>
                                <th className="text-left py-2 font-black uppercase">Status</th>
                                <th className="text-left py-2 font-black uppercase">Criado</th>
                                <th className="text-left py-2 font-black uppercase">Liberado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {escrows.length === 0 && (
                                <tr><td colSpan={5} className="py-4 text-center text-gray-400">Nenhum escrow</td></tr>
                            )}
                            {escrows.map(e => (
                                <tr key={e.id} className="border-b border-gray-100">
                                    <td className="py-2">{e.job?.title || e.job_id.slice(0, 8)}</td>
                                    <td className="py-2 font-bold">R$ {Number(e.amount).toFixed(2)}</td>
                                    <td className="py-2">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            e.status === 'reserved' ? 'bg-orange-100 text-orange-700' :
                                            e.status === 'released' ? 'bg-green-100 text-green-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {e.status}
                                        </span>
                                    </td>
                                    <td className="py-2 text-gray-400 text-xs">
                                        {new Date(e.created_at).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="py-2 text-gray-400 text-xs">
                                        {e.released_at ? new Date(e.released_at).toLocaleDateString('pt-BR') : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
