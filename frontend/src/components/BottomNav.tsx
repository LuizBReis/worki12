
import { Home, Briefcase, PlusCircle, MessageSquare, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function BottomNav() {
    const navItems = [
        { icon: Home, label: 'Início', path: '/' },
        { icon: Briefcase, label: 'Vagas', path: '/jobs' },
        { icon: PlusCircle, label: 'Publicar', path: '/create', isFab: true },
        { icon: MessageSquare, label: 'Mensagens', path: '/messages' },
        { icon: User, label: 'Perfil', path: '/profile' },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-glass-surface/95 backdrop-blur-xl 
                    border-t border-glass-border pb-safe z-50">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    if (item.isFab) {
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className="flex flex-col items-center justify-center -mt-6"
                            >
                                <div className="bg-primary text-white p-3 rounded-full shadow-float border-4 border-[#F5F7F5]">
                                    <item.icon size={24} strokeWidth={2.5} />
                                </div>
                            </NavLink>
                        );
                    }
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                 flex flex-col items-center justify-center w-full h-full gap-1
                 ${isActive ? 'text-primary' : 'text-gray-400'}
               `}
                        >
                            {({ isActive }) => (
                                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            )}
                            {/* <span className="text-[10px] font-medium">{item.label}</span> */}
                        </NavLink>
                    )
                })}
            </div>
        </nav>
    );
}
