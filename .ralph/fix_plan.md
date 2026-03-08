# Worki - Ralph Fix Plan

## Critical Priority (Security & Stability)

- [x] **SEC-01**: Audit all Supabase Edge Functions for proper auth token validation and CORS handling
- [x] **SEC-02**: Verify RLS policies cover all tables (wallets, escrow_transactions, wallet_transactions, messages, notifications)
- [x] **SEC-03**: Ensure no service_role key is exposed in frontend code (only anon key allowed)
- [x] **SEC-04**: Validate webhook endpoints have proper token/IP verification (asaas-webhook, stripe-webhook)
- [x] **SEC-05**: Review escrow transaction atomicity - ensure no race conditions on balance updates

## High Priority (Build & Code Quality)

- [x] **BUILD-01**: Fix all TypeScript errors - ensure `cd frontend && npm run build` passes cleanly
- [x] **BUILD-02**: Fix all ESLint warnings/errors - ensure `cd frontend && npm run lint` passes
- [x] **BUILD-03**: Remove unused imports, dead code, and unused variables across all files
- [x] **CLEAN-01**: Remove deprecated `backend_legacy/` references from active code
- [x] **CLEAN-02**: Remove deprecated `frontend-angular-backup/` references
- [x] **CLEAN-03**: Clean up any remaining references to deleted files (AsaasApprovalBanner, AsaasStatus, useAsaasStatus)

## High Priority (Testing)

- [x] **TEST-01**: Set up Vitest for frontend unit testing (configure vitest.config.ts)
- [x] **TEST-02**: Write unit tests for `walletService.ts` (deposit, withdraw, escrow flows)
- [x] **TEST-03**: Write unit tests for `gamification.ts` (XP calculation, level progression)
- [x] **TEST-04**: Write component tests for `ProtectedRoute.tsx` and `ErrorBoundary.tsx`
- [x] **TEST-05**: Write integration test templates for edge functions

## Medium Priority (Code Organization)

- [x] **ORG-01**: Create a shared types file (`frontend/src/types/index.ts`) for all TypeScript interfaces
- [x] **ORG-02**: Extract common API call patterns into a base service/utility
- [x] **ORG-03**: Ensure consistent error handling across all pages (use ErrorBoundary properly)
- [x] **ORG-04**: Review and consolidate duplicate logic between worker and company pages
- [x] **ORG-05**: Ensure all forms have proper input validation and user feedback

## Medium Priority (Feature Completeness)

- [x] **FEAT-01**: Verify complete Asaas payment flow (onboard -> deposit -> escrow -> withdraw)
- [x] **FEAT-02**: Verify Stripe payment flow works end-to-end
- [x] **FEAT-03**: Test messaging system (real-time updates via Supabase Realtime)
- [x] **FEAT-04**: Validate notification system works across all relevant events
- [x] **FEAT-05**: Ensure gamification (XP, levels, badges) is integrated in worker flows

## Low Priority (Performance & Polish)

- [x] **PERF-01**: Add React.lazy() and Suspense for route-level code splitting
- [x] **PERF-02**: Optimize React Query cache settings for frequently accessed data
- [x] **PERF-03**: Add loading states and skeleton screens for all data-fetching pages
- [x] **POLISH-01**: Ensure mobile responsiveness across all pages (BottomNav on mobile, Sidebar on desktop)
- [x] **POLISH-02**: Add proper 404 page and error states
- [x] **POLISH-03**: Review accessibility (a11y) basics - alt texts, aria labels, keyboard nav

## Documentation

- [ ] **DOC-01**: Update README.md with current architecture and setup instructions
- [ ] **DOC-02**: Document all edge function endpoints (method, params, response format)
- [ ] **DOC-03**: Document database schema and relationships

## Completed
- [x] Project enabled for Ralph
- [x] Ralph configuration customized for Worki
- [x] Project structure documented
- [x] Environment examples created (.env.example files)
- [x] **CRITICAL BUG FIX**: Fixed `supabaseAdminAdmin` typo in `stripe-payout/index.ts` (line 21) - was crashing all payout requests
- [x] **CRITICAL BUG FIX**: Fixed `supabaseAdminAdmin` typo in `stripe-transfer/index.ts` (line 21) - was crashing all transfer requests
- [x] Fixed `EscrowTransaction` type in `walletService.ts` - added missing `job` property from join query
- [x] Fixed `as any` cast in `MyJobs.tsx` line 262 - replaced with proper `typeof activeTab`
- [x] SEC-01: Audited all edge functions - CORS and auth handling verified correct
- [x] SEC-03: Verified no service_role keys in frontend code
- [x] CLEAN-03: Verified no references to deleted files (AsaasApprovalBanner, AsaasStatus, useAsaasStatus)

## Notes
- Always verify `npm run build` passes after each change
- Commits should be in Portuguese
- Focus on security and stability first, then tests, then features
- Each loop should tackle ONE task completely before moving to the next
