import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/asaas.ts';

// DEPRECATED: Sub-accounts are no longer used.
// This function is kept as a no-op stub for backwards compatibility.
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    return new Response(JSON.stringify({
        status: { general: 'APPROVED', commercialInfo: 'APPROVED', bankAccountInfo: 'APPROVED', documentation: 'APPROVED' },
        pendingDocuments: [],
        message: 'Sub-account status check is no longer required. All users are automatically approved.'
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
    });
});
