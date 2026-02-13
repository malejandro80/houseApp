import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EditWrapper from './EditWrapper';

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch Property
  const { data: property, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error || !property) {
    redirect('/my-properties');
  }

  return (
      <EditWrapper user={user} property={property} />
  );
}
