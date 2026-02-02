import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

export function useJobApplication() {
    const [applyingId, setApplyingId] = useState<string | null>(null);
    const { addToast } = useToast();

    const applyForJob = async (jobId: string, onSuccess?: () => void) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            addToast('Você precisa estar logado para se candidatar.', 'error');
            return;
        }

        // 0. Check if profile exists (to give better error message than RLS/Foreign Key)
        const { data: profile } = await supabase
            .from('workers')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

        if (!profile) {
            addToast('Complete seu perfil antes de se candidatar.', 'error');
            // Optionally redirect to onboarding?
            return;
        }

        setApplyingId(jobId);

        try {
            // 1. Check if already applied (Double safety, though UI should handle this)
            const { data: existing, error: checkError } = await supabase
                .from('applications')
                .select('id')
                .eq('job_id', jobId)
                .eq('worker_id', user.id)
                .maybeSingle();

            if (checkError) {
                // If 403, it might mean RLS blocks reading.
                // We proceed to try insert, as insert policy might allow different things than select policy
                // depending on configuration. But usually if select fails, we shouldn't block blindly.
                // However, let's assume if it errors, we just try to apply.
                console.warn('Check application error (RLS?):', checkError.message);
            }

            if (existing) {
                addToast('Você já se candidatou a esta vaga!', 'info');
                if (onSuccess) onSuccess();
                return;
            }

            // 2. Insert Application
            const { data, error } = await supabase
                .from('applications')
                .insert({
                    job_id: jobId,
                    worker_id: user.id,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) {
                // Handle Specific RLS or Constraint errors
                if (error.code === '42501') { // Postgres RLS Policy Violation
                    throw new Error('Permissão negada. Verifique se seu perfil está completo.');
                }
                if (error.code === '23505') { // Unique Violation
                    addToast('Você já se candidatou a esta vaga.', 'info');
                    if (onSuccess) onSuccess();
                    return;
                }
                throw error;
            }

            // 3. Create Conversation for this application
            if (data) {
                const { error: convError } = await supabase
                    .from('Conversation')
                    .insert({
                        id: crypto.randomUUID(),
                        application_uuid: data.id,
                        createdat: new Date().toISOString(),
                        islocked: false
                    });

                if (convError) {
                    console.error('Error creating conversation:', convError);
                    // We don't block the application success if conversation creation fails, 
                    // but we should probably alert or retry. For now, just logging.
                }
            }

            addToast('Candidatura enviada com sucesso! Boa sorte!', 'success');
            if (onSuccess) onSuccess();

        } catch (err: any) {
            console.error('Error applying:', err);

            const message = err.message || 'Ocorreu um erro ao aplicar. Tente novamente.';

            // Avoid "Object" or generic messages if possible
            if (message.includes('JSON')) {
                addToast('Erro de conexão. Tente novamente.', 'error');
            } else {
                addToast(message, 'error');
            }

        } finally {
            setApplyingId(null);
        }
    };

    return {
        applyingId,
        applyForJob
    };
}
