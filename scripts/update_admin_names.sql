-- ============================================================
-- Update admin user display names to "Admin"
-- ============================================================

-- Update admin users to have "Admin" as display name
UPDATE public.users 
SET display_name = 'Admin' 
WHERE role = 'admin';

-- Verify the update
SELECT id, sdt, display_name, role 
FROM public.users 
WHERE role = 'admin';

-- ============================================================
-- Result: Admin users will now show "Admin" in the navbar
-- ============================================================
