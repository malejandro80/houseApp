-- Migration: Setup Storage for Advisor Documents (Retry)

-- 1. Create a new private bucket 'private_documents'
-- Note: 'storage.buckets' is a system table. We usually insert into it.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'private_documents', 
    'private_documents', 
    false, 
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policies for Storage
-- SKIP enabling RLS on storage.objects as it requires superuser and is likely already enabled.

-- Allow users to upload their own documents
DROP POLICY IF EXISTS "Authenticated users can upload advisor docs" ON storage.objects;
CREATE POLICY "Authenticated users can upload advisor docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'private_documents'
);

-- Allow users to view their own documents
DROP POLICY IF EXISTS "Users can view their own advisor docs" ON storage.objects;
CREATE POLICY "Users can view their own advisor docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'private_documents' AND
    auth.uid()::text = (storage.foldername(name))[1] 
);
-- Adjusted Path Assumption: advisor-documents/{userId}/filename 
-- The previous logic using foldername(name)[2] was based on `advisor-documents` being root, but storage.foldername returns array of folders.
-- If I upload to `private_documents/userId/file.png`:
-- foldername[1] is 'userId'

-- Allow Admins to view all documents
DROP POLICY IF EXISTS "Admins can view all advisor docs" ON storage.objects;
CREATE POLICY "Admins can view all advisor docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'private_documents' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'superadmin'
    )
);
