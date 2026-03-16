import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../lib/supabase', () => ({
    supabase: {
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({
                        data: { id: 'u1', full_name: 'Test User', city: 'SP', phone: '', bio: '', pix_key: '', primary_role: '', roles: [], cover_url: null, avatar_url: null, verified_identity: false, level: 1, xp: 0, rating_average: null, completed_jobs_count: 0, earnings_total: 0, experience_years: null, availability: null },
                        error: null,
                    }),
                })),
            })),
        })),
        storage: { from: vi.fn(() => ({ upload: vi.fn(), getPublicUrl: vi.fn(() => ({ data: { publicUrl: '' } })) })) },
    },
}))
vi.mock('../contexts/ToastContext', () => ({ useToast: () => ({ addToast: vi.fn() }) }))
vi.mock('../lib/logger', () => ({ logError: vi.fn() }))

import Profile from './Profile'

describe('Profile - Renderizacao', () => {
    beforeEach(() => { vi.clearAllMocks() })

    it('exibe nome do usuario apos carregar', async () => {
        render(<MemoryRouter><Profile /></MemoryRouter>)
        await waitFor(() => { expect(screen.getByText('Test User')).toBeInTheDocument() })
    })
})
