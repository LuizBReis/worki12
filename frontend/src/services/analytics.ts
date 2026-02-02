
import { supabase } from '../lib/supabase';

export const AnalyticsService = {
    /**
     * Tracks a view on a job posting.
     * Increments the 'views' counter on the job and logs an event.
     */
    async trackJobView(jobId: string) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return; // Only track authenticated users for now

            // 1. Increment Counter (RPC)
            // We use rpc to be atomic
            const { error: rpcError } = await supabase.rpc('increment_job_view', { job_id: jobId });

            if (rpcError) {
                console.warn('Analytics: increment_job_view RPC failed (may not exist yet):', rpcError.message);
            }

            // 2. Log Granular Event
            const { error: eventError } = await supabase
                .from('analytics_events')
                .insert({
                    user_id: user.id,
                    event_type: 'view_job',
                    target_id: jobId,
                    metadata: { timestamp: new Date().toISOString() }
                });

            if (eventError) {
                // Silently fail if table doesn't exist yet
                console.debug('Analytics: Event log failed:', eventError.message);
            }

        } catch (error) {
            console.error('Analytics Error:', error);
        }
    },

    /**
     * Tracks a view on a worker's public profile.
     * Increments the 'views' counter on the profile and logs an event.
     */
    async trackProfileView(workerId: string) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            if (user.id === workerId) return; // Don't track self-views

            // 1. Increment Counter (RPC)
            const { error: rpcError } = await supabase.rpc('increment_worker_view', { worker_id: workerId });

            if (rpcError) {
                console.warn('Analytics: increment_worker_view RPC failed:', rpcError.message);
            }

            // 2. Log Granular Event
            const { error: eventError } = await supabase
                .from('analytics_events')
                .insert({
                    user_id: user.id,
                    event_type: 'view_profile',
                    target_id: workerId,
                    metadata: { timestamp: new Date().toISOString() }
                });

            if (eventError) console.debug('Analytics: Event log failed:', eventError.message);

        } catch (error) {
            console.error('Analytics Error:', error);
        }
    },

    /**
     * Tracks a generic event.
     */
    async trackEvent(eventType: string, metadata: any = {}) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
                .from('analytics_events')
                .insert({
                    user_id: user.id,
                    event_type: eventType,
                    metadata
                });
        } catch (error) {
            console.error('Analytics Error:', error);
        }
    }
};
