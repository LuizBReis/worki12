import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { Loader2 } from 'lucide-react';

export default function MainLayout() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                navigate('/login');
                return;
            }

            // Check if user is a worker and has completed onboarding
            // We optimize by checking if they are 'hire' type in metadata first to avoid unnecessary DB calls if they are company trying to access worker routes (which shouldn't happen but good to be safe)
            if (user.user_metadata?.user_type === 'hire') {
                // ideally redirect to company dashboard
                navigate('/company/dashboard');
                return;
            }

            // Check worker profile
            const { data: worker } = await supabase
                .from('workers')
                .select('onboarding_completed')
                .eq('id', user.id)
                .single();

            if (!worker || !worker.onboarding_completed) {
                navigate('/worker/onboarding');
            }

            setLoading(false);
        };

        checkUser();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F4F4F0]">
                <Loader2 className="animate-spin" size={48} />
            </div>
        );
    }

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
