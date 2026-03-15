import { supabase } from '../lib/supabase';
import { invokeFunction } from './api';
import { logError } from '../lib/logger';

export interface Wallet {
    id: string;
    user_id: string;
    balance: number;
    user_type: 'company' | 'worker';
    asaas_customer_id?: string;
    created_at: string;
    updated_at: string;
}

export interface WalletTransaction {
    id: string;
    wallet_id: string;
    amount: number;
    type: 'credit' | 'debit' | 'escrow_reserve' | 'escrow_release' | 'initial_balance';
    description: string | null;
    reference_id: string | null;
    created_at: string;
}

export interface EscrowTransaction {
    id: string;
    job_id: string;
    application_id: string | null;
    amount: number;
    company_wallet_id: string;
    worker_wallet_id: string | null;
    status: 'reserved' | 'released' | 'refunded';
    created_at: string;
    released_at: string | null;
    job?: { title: string };
}

export const WalletService = {
    async getOrCreateWallet(userId: string, userType: 'company' | 'worker'): Promise<Wallet | null> {
        const { data: existing } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (existing) return existing as Wallet;

        const { data: newWallet, error } = await supabase
            .from('wallets')
            .insert({ user_id: userId, balance: 0.00, user_type: userType })
            .select()
            .single();

        if (error) {
            logError('Error creating wallet', error);
            return null;
        }

        return newWallet as Wallet;
    },

    async withdrawFunds(amount: number, pixKey: string, pixKeyType: string = 'CPF'): Promise<{ success: boolean; error?: string }> {
        try {
            await invokeFunction('asaas-withdraw', { amount, pixKey, pixKeyType });
            return { success: true };
        } catch (error: unknown) {
            logError('Error withdrawing funds', error);
            return { success: false, error: error instanceof Error ? error.message : 'Erro ao realizar saque' };
        }
    },

    async getBalance(userId: string): Promise<number> {
        const { data } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', userId)
            .single();

        return data?.balance || 0;
    },

    async getTransactions(userId: string): Promise<WalletTransaction[]> {
        const { data: wallet } = await supabase
            .from('wallets')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (!wallet) return [];

        const { data } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('wallet_id', wallet.id)
            .order('created_at', { ascending: false });

        return (data || []) as WalletTransaction[];
    },

    async reserveEscrow(jobId: string, amount: number, companyUserId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { error: rpcError } = await supabase.rpc('reserve_escrow', {
                p_job_id: jobId,
                p_amount: amount,
                p_company_user_id: companyUserId
            });

            if (rpcError) {
                if (rpcError.message?.includes('Saldo insuficiente')) {
                    return { success: false, error: rpcError.message };
                }
                if (rpcError.message?.includes('Carteira nao encontrada')) {
                    return { success: false, error: 'Carteira nao encontrada' };
                }
                if (rpcError.code === '23505') {
                    return { success: false, error: 'Escrow ja existe para esta vaga' };
                }
                throw rpcError;
            }

            return { success: true };
        } catch (error) {
            logError('Error reserving escrow', error);
            return { success: false, error: 'Erro ao reservar pagamento' };
        }
    },

    async createDeposit(payload: { amount: number, name?: string, cpfCnpj?: string }): Promise<{ paymentId?: string; pixQrCodeUrl?: string; error?: string }> {
        try {
            return await invokeFunction('asaas-deposit', payload);
        } catch (error: unknown) {
            logError('Error creating deposit', error);
            return { error: error instanceof Error ? error.message : 'Erro ao criar deposito via Asaas' };
        }
    },

    async syncBalance(): Promise<{ success: boolean; hasUpdates?: boolean; totalSynced?: number; message?: string; error?: string }> {
        try {
            return await invokeFunction('asaas-sync', {});
        } catch (error: unknown) {
            logError('Error syncing balance', error);
            return { success: false, error: error instanceof Error ? error.message : 'Erro ao sincronizar saldo' };
        }
    },

    async releaseEscrow(jobId: string, applicationId: string, workerUserId: string): Promise<{ success: boolean; error?: string }> {
        try {
            await invokeFunction('asaas-checkout', { jobId, applicationId, workerId: workerUserId });
            return { success: true };
        } catch (error: unknown) {
            logError('Error releasing escrow', error);
            return { success: false, error: error instanceof Error ? error.message : 'Erro ao liberar pagamento' };
        }
    },

    async refundEscrow(jobId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { error: rpcError } = await supabase.rpc('refund_escrow', {
                p_job_id: jobId,
                p_reason: reason || 'Reembolso de vaga cancelada'
            });

            if (rpcError) {
                if (rpcError.message?.includes('No reserved escrow')) {
                    return { success: true };
                }
                throw rpcError;
            }

            return { success: true };
        } catch (error) {
            logError('Error refunding escrow', error);
            return { success: false, error: 'Erro ao reembolsar' };
        }
    },

    async getJobEscrow(jobId: string): Promise<EscrowTransaction | null> {
        const { data } = await supabase
            .from('escrow_transactions')
            .select('*')
            .eq('job_id', jobId)
            .single();

        return data as EscrowTransaction | null;
    },

    async getCompanyEscrows(companyUserId: string): Promise<EscrowTransaction[]> {
        const { data: wallet } = await supabase
            .from('wallets')
            .select('id')
            .eq('user_id', companyUserId)
            .single();

        if (!wallet) return [];

        const { data } = await supabase
            .from('escrow_transactions')
            .select('*, job:jobs(title)')
            .eq('company_wallet_id', wallet.id)
            .order('created_at', { ascending: false });

        return (data || []) as EscrowTransaction[];
    }
};
