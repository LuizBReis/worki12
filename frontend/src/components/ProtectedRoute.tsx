import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { logError } from '../lib/logger';

export default function ProtectedRoute() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ id: string; user_metadata?: { user_type?: string } } | null>(null);
    const [onboardingChecked, setOnboardingChecked] = useState(false);
    const [onboardingRedirect, setOnboardingRedirect] = useState<string | null>(null);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const currentUser = session?.user ?? null;
            setUser(currentUser as { id: string; user_metadata?: { user_type?: string } } | null);
            setLoading(false);

            if (currentUser) {
                await checkOnboarding(currentUser);
            }
        };

        const checkOnboarding = async (authUser: { id: string; user_metadata?: { user_type?: string } }) => {
            const pathname = location.pathname;

            if (pathname === '/worker/onboarding' || pathname === '/company/onboarding') {
                setOnboardingChecked(true);
                return;
            }

            const userType = authUser.user_metadata?.user_type;

            try {
                let data = null;
                if (userType === 'work') {
                    const result = await supabase
                        .from('workers')
                        .select('onboarding_completed')
                        .eq('id', authUser.id)
                        .single();
                    data = result.data;
                } else if (userType === 'hire') {
                    const result = await supabase
                        .from('companies')
                        .select('onboarding_completed')
                        .eq('id', authUser.id)
                        .single();
                    data = result.data;
                }

                if (data?.onboarding_completed !== true) {
                    setOnboardingRedirect(
                        userType === 'work' ? '/worker/onboarding' : '/company/onboarding'
                    );
                }
            } catch (error) {
                logError('Erro ao verificar onboarding', error);
                if (userType === 'work') {
                    setOnboardingRedirect('/worker/onboarding');
                } else if (userType === 'hire') {
                    setOnboardingRedirect('/company/onboarding');
                }
            }

            setOnboardingChecked(true);
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user as { id: string; user_metadata?: { user_type?: string } } | null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading || (user && !onboardingChecked)) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50">
                <div className="space-y-4 animate-pulse w-full max-w-md px-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-gray-200 rounded-xl h-16" />
                    ))}
                </div>
            </div>
        );
    }

    if (!user) return <Navigate to="/" replace />;
    if (onboardingRedirect) return <Navigate to={onboardingRedirect} replace />;

    return <Outlet />;
}
