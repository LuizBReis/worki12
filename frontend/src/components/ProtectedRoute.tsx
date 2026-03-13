import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';
import TosGateModal from './TosGateModal';

export default function ProtectedRoute() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ id: string } | null>(null);
    const [tosAccepted, setTosAccepted] = useState<boolean | null>(null);
    const [detectedRole, setDetectedRole] = useState<'worker' | 'company'>('worker');

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const sessionUser = session?.user ?? null;
            setUser(sessionUser);

            if (sessionUser) {
                // Tenta workers primeiro
                const { data: workerData } = await supabase
                    .from('workers')
                    .select('accepted_tos')
                    .eq('id', sessionUser.id)
                    .single();

                if (workerData) {
                    setTosAccepted(workerData.accepted_tos === true);
                    setDetectedRole('worker');
                } else {
                    // Tenta companies
                    const { data: companyData } = await supabase
                        .from('companies')
                        .select('accepted_tos')
                        .eq('id', sessionUser.id)
                        .single();

                    if (companyData) {
                        setTosAccepted(companyData.accepted_tos === true);
                        setDetectedRole('company');
                    } else {
                        // Usuário sem perfil ainda (em onboarding) — não exibir gate de TOS
                        setTosAccepted(true);
                    }
                }
            }

            setLoading(false);
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (!session?.user) {
                setTosAccepted(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading || (user && tosAccepted === null)) return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50">
            <Loader2 className="animate-spin text-primary" size={48} />
        </div>
    );

    if (!user) return <Navigate to="/" replace />;

    if (tosAccepted === false) return (
        <>
            <TosGateModal userRole={detectedRole} onAccepted={() => setTosAccepted(true)} />
            <Outlet />
        </>
    );

    return <Outlet />;
}
