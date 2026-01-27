import { Home, Briefcase, User, BarChart2, Wallet, FileText, Zap, PlusCircle, Building2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

interface SidebarProps {
    type?: 'worker' | 'company';
}

export default function Sidebar({ type = 'worker' }: SidebarProps) {
    const [name, setName] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [workerData, setWorkerData] = useState<any>(null); // Store full worker data

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            if (type === 'company') {
                const { data } = await supabase.from('companies').select('name').eq('id', user.id).single();
                if (data) setName(data.name);
                setIsVerified(!!user.email_confirmed_at);
            } else {
                const { data } = await supabase.from('workers').select('full_name, level, xp, avatar_url, verified_identity').eq('id', user.id).single();
                if (data) {
                    const first = data.full_name?.split(' ')[0] || '';
                    const last = data.full_name?.split(' ').length > 1 ? data.full_name?.split(' ').pop()?.[0] + '.' : '';
                    setName(`${first} ${last}`);
                    setWorkerData(data);
                }
            }
        };
        fetchData();
    }, [type]);

    const workerNavItems = [
        { icon: Home, label: 'Início', path: '/dashboard' },
        { icon: Briefcase, label: 'Buscar Vagas', path: '/jobs' },
        { icon: FileText, label: 'Meus Jobs', path: '/my-jobs' },
        { icon: BarChart2, label: 'Analytics', path: '/analytics' },
        { icon: Wallet, label: 'Carteira', path: '/wallet' },
        { icon: User, label: 'Meu Perfil', path: '/profile' },
    ];

    const companyNavItems = [
        { icon: Home, label: 'Dashboard', path: '/company/dashboard' },
        { icon: PlusCircle, label: 'Criar Vaga', path: '/company/create' },
        { icon: Briefcase, label: 'Minhas Vagas', path: '/company/jobs' },
        { icon: BarChart2, label: 'Analytics', path: '/company/analytics' },
        // { icon: Users, label: 'Candidatos', path: '/company/candidates' }, // Future
        { icon: User, label: 'Perfil Empresa', path: '/company/profile' },
    ];

    const navItems = type === 'company' ? companyNavItems : workerNavItems;
    const isCompany = type === 'company';

    return (
        <aside className="hidden md:flex flex-col w-72 h-[calc(100vh-32px)] m-4 sticky top-4 
                      bg-white border-2 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] 
                      overflow-hidden z-50 transition-all hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,166,81,1)]">

            {/* Logo */}
            <div className={`p-8 border-b-2 border-black ${isCompany ? 'bg-white' : 'bg-black'} ${isCompany ? 'text-black' : 'text-white'}`}>
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center ${isCompany ? 'bg-black text-white' : 'bg-primary text-black border-white'}`}>
                        <span className="font-black text-sm">W.</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter">Worki.</h1>
                    {isCompany && <span className="text-[10px] font-bold uppercase bg-gray-200 px-1.5 py-0.5 rounded border border-black ml-auto">Empresa</span>}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-8 flex flex-col gap-3 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
              flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-200 font-bold uppercase text-sm border-2
              ${isActive
                                ? (isCompany ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,166,81,1)] translate-x-1' : 'bg-primary text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-1')
                                : 'bg-transparent text-gray-500 border-transparent hover:bg-gray-100 hover:border-black hover:text-black'}
            `}
                    >
                        <item.icon size={20} strokeWidth={3} />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* User Details (Hooked Investment) */}
            <div className="p-6 border-t-2 border-black bg-gray-50">
                <div className={`flex items-center gap-4 p-4 rounded-xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] cursor-pointer transition-all ${isCompany ? 'hover:shadow-[4px_4px_0px_0px_rgba(33,150,243,1)]' : 'hover:shadow-[4px_4px_0px_0px_rgba(0,166,81,1)]'}`}>
                    <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-gray-200 border-2 border-black flex items-center justify-center overflow-hidden">
                            {isCompany ? (
                                <Building2 size={24} />
                            ) : (
                                workerData?.avatar_url ? <img src={workerData.avatar_url} className="w-full h-full object-cover" /> : <User size={24} />
                            )}
                        </div>
                        <div className={`absolute -top-2 -right-2 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border border-black ${isCompany ? 'bg-blue-500' : 'bg-primary'}`}>
                            {isCompany ? 'PRO' : `LVL ${workerData?.level || 1}`}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-black uppercase text-accent truncate max-w-[100px]">{name || (isCompany ? 'Carregando...' : '...')}</span>
                        <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
                            <Zap size={10} className={`${isCompany ? (isVerified ? 'text-blue-500 fill-blue-500' : 'text-gray-300 fill-gray-300') : 'text-primary fill-primary'}`} />
                            {isCompany ? (isVerified ? 'Verificado' : 'Não Verificado') : `${workerData?.xp || 0} XP`}
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
