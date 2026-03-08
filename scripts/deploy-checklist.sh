#!/bin/bash
# Worki - Deploy Checklist
# Run before deploying to production

echo "=== Worki Production Deploy Checklist ==="
echo ""

# 1. Check frontend build
echo "1. Frontend build..."
cd frontend && npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then echo "   [OK] Build passes"; else echo "   [FAIL] Build has errors"; exit 1; fi

# 2. Check lint
echo "2. Frontend lint..."
npm run lint > /dev/null 2>&1
if [ $? -eq 0 ]; then echo "   [OK] Lint clean"; else echo "   [FAIL] Lint errors"; fi

# 3. Check tests
echo "3. Frontend tests..."
npx vitest run > /dev/null 2>&1
if [ $? -eq 0 ]; then echo "   [OK] Tests pass"; else echo "   [FAIL] Tests failing"; fi
cd ..

echo ""
echo "=== Environment Variables Check ==="
echo ""
echo "Frontend (.env):"
echo "  [ ] VITE_SUPABASE_URL        = https://vrklakcbkcsonarmhqhp.supabase.co"
echo "  [ ] VITE_SUPABASE_ANON_KEY   = (from Supabase dashboard)"
echo "  [ ] VITE_SENTRY_DSN          = (from Sentry dashboard)"
echo ""
echo "Supabase Edge Functions (Secrets):"
echo "  [ ] SUPABASE_URL             = https://vrklakcbkcsonarmhqhp.supabase.co"
echo "  [ ] SUPABASE_SERVICE_ROLE_KEY = (from Supabase dashboard)"
echo "  [ ] ASAAS_API_KEY            = (production key from Asaas)"
echo "  [ ] ASAAS_ENVIRONMENT        = production"
echo "  [ ] ASAAS_WEBHOOK_TOKEN      = (strong random string, 32+ chars)"
echo "  [ ] CORS_ORIGIN              = https://worki.com.br (your domain)"
echo "  [ ] RESEND_API_KEY           = (from Resend dashboard)"
echo ""
echo "=== External Services ==="
echo ""
echo "  [ ] Supabase: Project linked, migrations pushed"
echo "  [ ] Supabase: Email confirmation enabled in Auth settings"
echo "  [ ] Supabase: Edge functions deployed (npx supabase functions deploy)"
echo "  [ ] Asaas: Production account approved"
echo "  [ ] Asaas: Webhook URL configured (https://vrklakcbkcsonarmhqhp.supabase.co/functions/v1/asaas-webhook)"
echo "  [ ] Asaas: Webhook token matches ASAAS_WEBHOOK_TOKEN"
echo "  [ ] Vercel: Domain configured with SSL"
echo "  [ ] Vercel: Environment variables set"
echo "  [ ] Sentry: Project created, DSN obtained"
echo "  [ ] Resend: Account created, API key obtained, domain verified"
echo ""
echo "=== Final Test (after deploy) ==="
echo ""
echo "  [ ] Register as worker - complete onboarding"
echo "  [ ] Register as company - complete onboarding"
echo "  [ ] Company: deposit R\$10 via PIX"
echo "  [ ] Company: create job (escrow reserved)"
echo "  [ ] Worker: apply for job"
echo "  [ ] Company: hire worker"
echo "  [ ] Worker: check-in"
echo "  [ ] Company: confirm check-in"
echo "  [ ] Worker: check-out"
echo "  [ ] Company: confirm check-out + rate + finalize"
echo "  [ ] Worker: verify payment received in wallet"
echo "  [ ] Worker: withdraw R\$5 via PIX"
echo "  [ ] Verify Sentry captures errors"
echo "  [ ] Verify email notifications arrive"
echo ""
echo "=== Done ==="
