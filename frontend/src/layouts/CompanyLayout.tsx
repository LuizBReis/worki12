import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav'; // We might want to make BottomNav props-aware too later

export default function CompanyLayout() {
    return (
        <div className="min-h-screen flex flex-col md:flex-row max-w-7xl mx-auto bg-[#F4F4F0]">
            {/* Desktop Sidebar - Company Mode */}
            <Sidebar type="company" />

            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-center h-14 sticky top-0 bg-white/90 backdrop-blur-md z-40 border-b border-gray-200">
                <h1 className="text-xl font-black text-black tracking-tighter">Worki. <span className="text-xs text-blue-600 bg-blue-100 px-1 rounded ml-1">Business</span></h1>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto">
                <Outlet />
            </main>

            {/* Mobile Navigation - To be updated for company later if needed, for now just hiding or standard? 
                Let's reuse standard for now but we might want to hide it or create a CompanyBottomNav
            */}
            <BottomNav />
        </div>
    );
}
