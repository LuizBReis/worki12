import { supabase } from '../lib/supabase';

export interface Wallet {
    id: string;
    user_id: string;
    balance: number;
    user_type: 'company' | 'worker';
    asaas_wallet_id?: string;
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
}

export const WalletService = {
    /**
     * Get or create wallet for a user
     */
    async getOrCreateWallet(userId: string, userType: 'company' | 'worker'): Promise<Wallet | null> {
        // Try to get existing wallet
        const { data: existing } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (existing) return existing as Wallet;

        // Create new wallet
        const initialBalance = 0.00;

        const { data: newWallet, error } = await supabase
            .from('wallets')
            .insert({
                user_id: userId,
                balance: initialBalance,
                user_type: userType
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating wallet:', error);
            return null;
        }

        return newWallet as Wallet;
    },

    /**
     * Onboard user to Asaas Subaccount
     */
    async onboardAsaas(payload: { name: string, email: string, cpfCnpj: string, type: 'company' | 'worker', phone?: string, companyType?: string }): Promise<{ success: boolean; walletId?: string; error?: string }> {
        try {
            const { data, error } = await supabase.functions.invoke('asaas-onboard', {
                body: payload
            });

            if (error) {
                let msg = error.message;
                if (error.context && typeof error.context.json === 'function') {
                    try {
                        const errData = await error.context.json();
                        msg = errData.error || msg;
                    } catch (e) { }
                }
                throw new Error(msg);
            }

            if (data?.error) throw new Error(data.error);

            return { success: true, walletId: data.walletId };
        } catch (error: any) {
            console.error('Error onboarding to Asaas:', error);
            return { success: false, error: error.message || 'Erro ao criar conta de pagamento' };
        }
    },

    /**
     * Withdraw funds from Worki Wallet to Bank Account via Asaas PIX
     */
    async withdrawFunds(amount: number, pixKey: string, pixKeyType: string = 'CPF'): Promise<{ success: boolean; error?: string }> {
        try {
            const { data, error } = await supabase.functions.invoke('asaas-withdraw', {
                body: { amount, pixKey, pixKeyType }
            });

            if (error) {
                let msg = error.message;
                if (error.context && typeof error.context.json === 'function') {
                    try {
                        const errData = await error.context.json();
                        msg = errData.error || msg;
                    } catch (e) { }
                }
                throw new Error(msg);
            }

            if (data?.error) throw new Error(data.error);

            return { success: true };
        } catch (error: any) {
            console.error('Error withdrawing funds:', error);
            return { success: false, error: error.message || 'Erro ao realizar saque' };
        }
    },

    /**
     * Get wallet balance
     */
    async getBalance(userId: string): Promise<number> {
        const { data } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', userId)
            .single();

        return data?.balance || 0;
    },

    /**
     * Get wallet transactions
     */
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

    /**
     * Reserve amount in escrow when creating a job
     */
    async reserveEscrow(jobId: string, amount: number, companyUserId: string): Promise<{ success: boolean; error?: string }> {
        try {
            // 1. Get company wallet
            const { data: wallet } = await supabase
                .from('wallets')
                .select('id, balance')
                .eq('user_id', companyUserId)
                .single();

            if (!wallet) {
                return { success: false, error: 'Carteira não encontrada' };
            }

            // 2. Check if company has enough balance
            if (wallet.balance < amount) {
                return { success: false, error: `Saldo insuficiente. Você tem R$ ${wallet.balance.toFixed(2)} mas precisa de R$ ${amount.toFixed(2)}` };
            }

            // 3. Deduct from wallet balance
            const { error: updateError } = await supabase
                .from('wallets')
                .update({
                    balance: wallet.balance - amount,
                    updated_at: new Date().toISOString()
                })
                .eq('id', wallet.id);

            if (updateError) throw updateError;

            // 4. Create escrow transaction
            const { error: escrowError } = await supabase
                .from('escrow_transactions')
                .insert({
                    job_id: jobId,
                    amount: amount,
                    company_wallet_id: wallet.id,
                    status: 'reserved'
                });

            if (escrowError) throw escrowError;

            // 5. Log wallet transaction
            await supabase.from('wallet_transactions').insert({
                wallet_id: wallet.id,
                amount: -amount,
                type: 'escrow_reserve',
                description: 'Valor reservado para vaga',
                reference_id: jobId
            });

            return { success: true };
        } catch (error) {
            console.error('Error reserving escrow:', error);
            return { success: false, error: 'Erro ao reservar pagamento' };
        }
    },


    /**
     * Create Asaas Deposit (Pix Charge)
     */
    async createDeposit(payload: { amount: number, name?: string, cpfCnpj?: string }): Promise<{ paymentId?: string; pixQrCodeUrl?: string; error?: string }> {
        try {
            const { data, error } = await supabase.functions.invoke('asaas-deposit', {
                body: payload
            });

            if (error) {
                let msg = error.message;
                if (error.context && typeof error.context.json === 'function') {
                    try {
                        const errData = await error.context.json();
                        msg = errData.error || msg;
                    } catch (e) { }
                }
                throw new Error(msg);
            }

            if (data?.error) throw new Error(data.error);

            return data;
        } catch (error: any) {
            console.error('Error creating deposit:', error);
            return { error: error.message || 'Erro ao criar depósito via Asaas' };
        }
    },

    /**
     * Sync missing deposits/payments directly from Asaas Master API
     */
    async syncBalance(): Promise<{ success: boolean; hasUpdates?: boolean; totalSynced?: number; message?: string; error?: string }> {
        try {
            const { data, error } = await supabase.functions.invoke('asaas-sync', {
                body: {}
            });

            if (error) {
                let msg = error.message;
                if (error.context && typeof error.context.json === 'function') {
                    try {
                        const errData = await error.context.json();
                        msg = errData.error || msg;
                    } catch (e) { }
                }
                throw new Error(msg);
            }

            if (data?.error) throw new Error(data.error);

            return data;
        } catch (error: any) {
            console.error('Error syncing balance:', error);
            return { success: false, error: error.message || 'Erro ao sincronizar saldo' };
        }
    },

    /**
     * Release escrow when job is completed (via Asaas Subaccount Transfer)
     */
    async releaseEscrow(jobId: string, applicationId: string, workerUserId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { data, error } = await supabase.functions.invoke('asaas-checkout', {
                body: { jobId, applicationId, workerId: workerUserId }
            });

            if (error) {
                let msg = error.message;
                if (error.context && typeof error.context.json === 'function') {
                    try {
                        const errData = await error.context.json();
                        msg = errData.error || msg;
                    } catch (e) { }
                }
                throw new Error(msg);
            }

            if (data?.error) throw new Error(data.error);

            return { success: true };
        } catch (error: any) {
            console.error('Error releasing escrow:', error);
            return { success: false, error: error.message || 'Erro ao liberar pagamento' };
        }
    },

    /**
     * Refund escrow (if job is cancelled)
     */
    async refundEscrow(jobId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
        try {
            // 1. Get escrow transaction
            const { data: escrow } = await supabase
                .from('escrow_transactions')
                .select('*, company_wallet:wallets!company_wallet_id(*)')
                .eq('job_id', jobId)
                .in('status', ['reserved']) // ensure it's reserved
                .single();

            if (!escrow) {
                return { success: false, error: 'Escrow não encontrado' };
            }

            // 2. Refund to company wallet
            const { error: walletUpdateError } = await supabase
                .from('wallets')
                .update({
                    balance: escrow.company_wallet.balance + escrow.amount,
                    updated_at: new Date().toISOString()
                })
                .eq('id', escrow.company_wallet_id);

            if (walletUpdateError) throw walletUpdateError;

            // 3. Update escrow status
            await supabase
                .from('escrow_transactions')
                .update({ status: 'refunded' })
                .eq('id', escrow.id);

            // 4. Log refund transaction
            await supabase.from('wallet_transactions').insert({
                wallet_id: escrow.company_wallet_id,
                amount: escrow.amount,
                type: 'credit',
                description: reason || 'Reembolso de vaga cancelada',
                reference_id: `refund-${jobId}`
            });

            return { success: true };
        } catch (error) {
            console.error('Error refunding escrow:', error);
            return { success: false, error: 'Erro ao reembolsar' };
        }
    },

    /**
     * Get escrow amount for a job
     */
    async getJobEscrow(jobId: string): Promise<EscrowTransaction | null> {
        const { data } = await supabase
            .from('escrow_transactions')
            .select('*')
            .eq('job_id', jobId)
            .single();

        return data as EscrowTransaction | null;
    },

    /**
     * Get all escrow transactions for a company
     */
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
