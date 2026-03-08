import { describe, it, expect } from 'vitest'
import type { Wallet, WalletTransaction, EscrowTransaction } from './walletService'

describe('Wallet types', () => {
  it('Wallet interface tem campos esperados', () => {
    const wallet: Wallet = {
      id: 'uuid-1',
      user_id: 'user-1',
      balance: 100.50,
      user_type: 'company',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    expect(wallet.balance).toBe(100.50)
    expect(wallet.user_type).toBe('company')
  })

  it('Wallet aceita worker e company', () => {
    const workerWallet: Wallet = {
      id: 'uuid-2',
      user_id: 'user-2',
      balance: 0,
      user_type: 'worker',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    expect(workerWallet.user_type).toBe('worker')
  })

  it('WalletTransaction aceita todos os tipos', () => {
    const types: WalletTransaction['type'][] = [
      'credit', 'debit', 'escrow_reserve', 'escrow_release', 'initial_balance'
    ]

    types.forEach(type => {
      const tx: WalletTransaction = {
        id: 'tx-1',
        wallet_id: 'wallet-1',
        amount: 50,
        type,
        description: 'Test',
        reference_id: null,
        created_at: '2024-01-01T00:00:00Z',
      }
      expect(tx.type).toBe(type)
    })
  })

  it('EscrowTransaction aceita todos os status', () => {
    const statuses: EscrowTransaction['status'][] = ['reserved', 'released', 'refunded']

    statuses.forEach(status => {
      const escrow: EscrowTransaction = {
        id: 'escrow-1',
        job_id: 'job-1',
        application_id: null,
        amount: 200,
        company_wallet_id: 'wallet-1',
        worker_wallet_id: null,
        status,
        created_at: '2024-01-01T00:00:00Z',
        released_at: null,
      }
      expect(escrow.status).toBe(status)
    })
  })

  it('EscrowTransaction pode ter job join', () => {
    const escrow: EscrowTransaction = {
      id: 'escrow-1',
      job_id: 'job-1',
      application_id: 'app-1',
      amount: 300,
      company_wallet_id: 'wallet-1',
      worker_wallet_id: 'wallet-2',
      status: 'released',
      created_at: '2024-01-01T00:00:00Z',
      released_at: '2024-01-02T00:00:00Z',
      job: { title: 'Garcom para evento' },
    }

    expect(escrow.job?.title).toBe('Garcom para evento')
    expect(escrow.released_at).not.toBeNull()
  })
})
