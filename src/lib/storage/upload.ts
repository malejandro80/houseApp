import { createClient } from '@/lib/supabase/client';

export async function uploadDocument(file: File, userId: string, type: 'id' | 'certification'): Promise<string | null> {
  const supabase = createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${type}_${Date.now()}.${fileExt}`;
  const filePath = `advisor-documents/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('private_documents') // Ensure this bucket exists in Supabase
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    return null;
  }

  return filePath;
}
