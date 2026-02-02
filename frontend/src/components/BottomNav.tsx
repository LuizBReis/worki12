import { Home, Briefcase, User, BarChart2, MessageSquare } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function BottomNav() {
    const navItems = [
        { icon: Home, label: 'Início', path: '/dashboard' },
        { icon: Briefcase, label: 'Vagas', path: '/jobs' },
        { icon: MessageSquare, label: 'Mensagens', path: '/messages' },
        { icon: BarChart2, label: 'Analytics', path: '/analytics' },
        { icon: User, label: 'Perfil', path: '/profile' },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t-2 border-black pb-safe z-50">
            <div className="flex justify-around items-center h-16 px-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                 flex flex-col items-center justify-center w-full h-full gap-1 p-2
                 ${isActive ? 'text-primary' : 'text-gray-400 hover:text-black'}
               `}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon size={22} strokeWidth={isActive ? 3 : 2} />
                                <span className={`text-[10px] font-black uppercase ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                                    {item.label}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
