import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/asaas.ts';

// DEPRECATED: Sub-accounts are no longer used.
// All payments flow through the master wallet.
// This function is kept as a no-op stub for backwards compatibility.
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    return new Response(JSON.stringify({
        success: true,
        message: 'Sub-account onboarding is no longer required. All payments use the master wallet.'
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
    });
});
