
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';

export default function MainLayout() {
    return (
        <div className="min-h-screen flex flex-col md:flex-row max-w-7xl mx-auto">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Mobile Header (Optional, for Logo) */}
            <header className="md:hidden flex items-center justify-center h-14 sticky top-0 bg-glass-surface/90 backdrop-blur-md z-40 border-b border-glass-border">
                <h1 className="text-xl font-black text-primary tracking-tighter">Worki.</h1>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto">
                <Outlet />
            </main>

            {/* Mobile Navigation */}
            <BottomNav />
        </div>
    );
}
