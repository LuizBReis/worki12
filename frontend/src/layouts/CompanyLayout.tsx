import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

export default function CompanyLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkCompanyStatus();
    }, [location.pathname]);

    const checkCompanyStatus = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // Let the protected route logic handling login redirection elsewhere, 
                // or redirect here.
                navigate('/login');
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
                // If we are NOT already on the onboarding page, redirect.
                // Note: Onboarding route is distinct in App.tsx, so hitting /company/* should trigger this.
                navigate('/company/onboarding');
            }
        } catch (err) {
            console.error('Error checking company status:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#F4F4F0]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        );
    }

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

            <BottomNav />
        </div>
    );
}
