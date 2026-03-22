-- ============================================================
-- Fix is_visible for all existing refund requests
-- Run this to ensure all records show full info to users
-- ============================================================

-- Update all existing refund requests to be visible
UPDATE public.refund_requests 
SET is_visible = TRUE 
WHERE is_visible IS NULL OR is_visible = FALSE;

-- Verify the update
SELECT 
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE is_visible = TRUE) as visible_count,
    COUNT(*) FILTER (WHERE is_visible = FALSE OR is_visible IS NULL) as hidden_count
FROM public.refund_requests;

-- ============================================================
-- Result: All records should now be visible to users
-- ============================================================
