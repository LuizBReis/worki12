import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AsaasStatus {
    general: 'NOT_CREATED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'AWAITING_APPROVAL';
    commercialInfo: 'NOT_CREATED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'AWAITING_APPROVAL';
    bankAccountInfo: 'NOT_CREATED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'AWAITING_APPROVAL';
    documentation: 'NOT_CREATED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'AWAITING_APPROVAL';
}

export interface PendingDocument {
    id: string;
    type: string;
    title: string;
    description: string;
    status: 'NOT_SENT' | 'PENDING' | 'APPROVED' | 'REJECTED';
    onboardingUrl: string;
}

const DEFAULT_STATUS: AsaasStatus = {
    general: 'NOT_CREATED',
    commercialInfo: 'NOT_CREATED',
    bankAccountInfo: 'NOT_CREATED',
    documentation: 'NOT_CREATED',
};

export function useAsaasStatus() {
    const [status, setStatus] = useState<AsaasStatus>(DEFAULT_STATUS);
    const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isApproved = status.general === 'APPROVED';
    const isPending = status.general === 'PENDING' || status.general === 'AWAITING_APPROVAL';
    const isRejected = status.general === 'REJECTED';
    const isNotCreated = status.general === 'NOT_CREATED';

    const fetchLocalStatus = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: wallet } = await supabase
                .from('wallets')
                .select('asaas_account_status, asaas_wallet_id')
                .eq('user_id', user.id)
                .single();

            if (wallet?.asaas_account_status) {
                setStatus(wallet.asaas_account_status as AsaasStatus);
            } else if (!wallet?.asaas_wallet_id) {
                setStatus(DEFAULT_STATUS);
            }
        } catch (e) {
            console.error('Error fetching local Asaas status:', e);
        }
    }, []);

    const refreshStatus = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Não autenticado');

            const { data, error: fnError } = await supabase.functions.invoke('asaas-account-status', {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });

            if (fnError) throw fnError;

            if (data?.status) {
                setStatus(data.status);
            }
            if (data?.pendingDocuments) {
                setPendingDocuments(data.pendingDocuments);
            }
        } catch (e: any) {
            console.error('Error refreshing Asaas status:', e);
            setError(e.message || 'Erro ao consultar status');
        } finally {
            setLoading(false);
        }
    }, []);

    // On mount, fetch local status first (fast), then refresh from Asaas
    useEffect(() => {
        let mounted = true;
        const init = async () => {
            await fetchLocalStatus();
            if (mounted) setLoading(false);
            // Background refresh from Asaas API
            refreshStatus();
        };
        init();
        return () => { mounted = false; };
    }, [fetchLocalStatus, refreshStatus]);

    return {
        status,
        pendingDocuments,
        loading,
        error,
        isApproved,
        isPending,
        isRejected,
        isNotCreated,
        refreshStatus,
    };
}
