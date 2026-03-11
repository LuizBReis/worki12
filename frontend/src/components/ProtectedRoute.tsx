import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ProtectedRoute() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ id: string } | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) return (
        <div className="h-screen w-full bg-[#F4F4F0]">
            <div className="flex flex-col md:flex-row max-w-7xl mx-auto min-h-screen animate-pulse">
                <div className="hidden md:block w-64 p-6 space-y-4">
                    <div className="h-8 w-24 bg-gray-200 rounded-lg" />
                    <div className="space-y-3 mt-8">
                        {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-200 rounded-xl" />)}
                    </div>
                </div>
                <main className="flex-1 p-4 md:p-8 space-y-6">
                    <div className="h-10 w-48 bg-gray-200 rounded-xl" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
                    </div>
                </main>
            </div>
        </div>
    );

    return user ? <Outlet /> : <Navigate to="/login?reason=session_expired" replace />;
}
