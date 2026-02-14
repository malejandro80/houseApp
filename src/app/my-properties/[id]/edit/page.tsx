import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EditWrapper from './EditWrapper';

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: property, error } = await supabase
    .from('properties')
    .select('*, property_owners(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !property) {
    redirect('/my-properties');
  }

  return (
      <EditWrapper user={user} property={property} />
  );
}
