-- Fix reviews RLS policy - reviewer_id is likely TEXT type, auth.uid() is UUID
-- Need explicit type cast for comparison

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;

CREATE POLICY "Authenticated users can create reviews" ON reviews
    FOR INSERT TO authenticated
    WITH CHECK (reviewer_id::text = auth.uid()::text);
