
import { Home, Briefcase, PlusCircle, MessageSquare, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
    const navItems = [
        { icon: Home, label: 'Início', path: '/' },
        { icon: Briefcase, label: 'Vagas', path: '/jobs' },
        { icon: PlusCircle, label: 'Publicar', path: '/create' },
        { icon: MessageSquare, label: 'Mensagens', path: '/messages' },
        { icon: User, label: 'Perfil', path: '/profile' },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 h-[calc(100vh-32px)] m-4 sticky top-4 
                      bg-glass-surface backdrop-blur-md border border-glass-border 
                      rounded-2xl shadow-glass overflow-hidden z-50">

            {/* Logo */}
            <div className="p-6 border-b border-border/10">
                <h1 className="text-2xl font-black text-primary tracking-tighter">Worki.</h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium
              ${isActive
                                ? 'bg-primary/10 text-primary-dark font-bold shadow-sm'
                                : 'text-gray-600 hover:bg-white/50 hover:text-accent'}
            `}
                    >
                        <item.icon size={22} strokeWidth={2} />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* User Summary */}
            <div className="p-4 mt-auto">
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 cursor-pointer transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm" />
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-accent">Usuário</span>
                        <span className="text-xs text-gray-500">Freelancer</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
