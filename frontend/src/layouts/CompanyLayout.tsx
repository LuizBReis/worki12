import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import NotificationBell from '../components/NotificationBell';
import { supabase } from '../lib/supabase';
import { useEffect, useState, useCallback } from 'react';
import { logError } from '../lib/logger'

export default function CompanyLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);

    const checkCompanyStatus = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // Let the protected route logic handling login redirection elsewhere, 
                // or redirect here.
                navigate('/login');
                return;
            }

            // Block workers from accessing company routes
            if (user.user_metadata?.user_type !== 'hire') {
                navigate('/dashboard');
                return;
            }

            // Check if user has a company profile
            const { data: company, error } = await supabase
                .from('companies')
                .select('onboarding_completed')
                .eq('id', user.id)
                .single();

            // If no company record OR onboarding not completed
            if (error || !company || !company.onboarding_completed) {
                navigate('/company/onboarding');
            }
        } catch (err) {
            logError('Error checking company status:', err);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        checkCompanyStatus();
    }, [location.pathname, checkCompanyStatus]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col md:flex-row max-w-7xl mx-auto bg-[#F4F4F0]">
                <div className="hidden md:block w-64 p-6 space-y-4">
                    <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="space-y-3 mt-8">
                        {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-200 rounded-xl animate-pulse" />)}
                    </div>
                </div>
                <main className="flex-1 p-4 md:p-8 space-y-6">
                    <div className="h-10 w-48 bg-gray-200 rounded-xl animate-pulse" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />)}
                    </div>
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />)}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row max-w-7xl mx-auto bg-[#F4F4F0]">
            {/* Desktop Sidebar - Company Mode */}
            <Sidebar type="company" />

            {/* Mobile Header */}
            <header className="md:hidden flex items-center justify-between px-4 h-14 sticky top-0 bg-white/90 backdrop-blur-md z-40 border-b border-gray-200">
                <h1 className="text-xl font-black text-black tracking-tighter">Worki. <span className="text-xs text-blue-600 bg-blue-100 px-1 rounded ml-1">Business</span></h1>
                <NotificationBell />
            </header>

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto">
                <Outlet />
            </main>

            <BottomNav type="company" />
        </div>
    );
}
