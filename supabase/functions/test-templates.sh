#!/bin/bash
# Edge Function Integration Test Templates
# Usage: Edit ANON_KEY and USER_JWT, then run individual tests
# Requires: supabase functions serve running locally

BASE_URL="http://localhost:54321/functions/v1"
ANON_KEY="YOUR_ANON_KEY_HERE"
USER_JWT="YOUR_USER_JWT_HERE"

echo "=== Edge Function Integration Tests ==="

# Test 1: CORS Preflight (should work on all functions)
echo -e "\n--- Test: CORS Preflight ---"
curl -s -o /dev/null -w "Status: %{http_code}" -X OPTIONS "$BASE_URL/asaas-deposit" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST"
echo ""

# Test 2: Asaas Deposit - Missing auth (should return 401)
echo -e "\n--- Test: asaas-deposit without auth (expect 401) ---"
curl -s -w "\nStatus: %{http_code}" -X POST "$BASE_URL/asaas-deposit" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10}'
echo ""

# Test 3: Asaas Deposit - With auth
echo -e "\n--- Test: asaas-deposit with auth ---"
curl -s -w "\nStatus: %{http_code}" -X POST "$BASE_URL/asaas-deposit" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10, "name": "Test User", "cpfCnpj": "12345678900"}'
echo ""

# Test 4: Asaas Withdraw - With auth
echo -e "\n--- Test: asaas-withdraw with auth ---"
curl -s -w "\nStatus: %{http_code}" -X POST "$BASE_URL/asaas-withdraw" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"amount": 5, "pixKey": "12345678900", "pixKeyType": "CPF"}'
echo ""

# Test 5: Asaas Sync - With auth
echo -e "\n--- Test: asaas-sync with auth ---"
curl -s -w "\nStatus: %{http_code}" -X POST "$BASE_URL/asaas-sync" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{}'
echo ""

# Test 6: Asaas Webhook - Without token (should return 401/403)
echo -e "\n--- Test: asaas-webhook without token (expect 401/403) ---"
curl -s -w "\nStatus: %{http_code}" -X POST "$BASE_URL/asaas-webhook" \
  -H "Content-Type: application/json" \
  -d '{"event": "PAYMENT_RECEIVED", "payment": {"id": "test"}}'
echo ""

# Test 7: Stripe Webhook - Without signature (should return 400)
echo -e "\n--- Test: stripe-webhook without signature (expect 400) ---"
curl -s -w "\nStatus: %{http_code}" -X POST "$BASE_URL/stripe-webhook" \
  -H "Content-Type: application/json" \
  -d '{"type": "payment_intent.succeeded"}'
echo ""

# Test 8: Asaas Account Status
echo -e "\n--- Test: asaas-account-status with auth ---"
curl -s -w "\nStatus: %{http_code}" -X POST "$BASE_URL/asaas-account-status" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{}'
echo ""

echo -e "\n=== Tests Complete ==="
