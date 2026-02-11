import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PropertyDetailClient from '@/app/components/PropertyDetailClient';

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: property, error } = await supabase
    .from('datahouse')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !property) {
    notFound();
  }

  // Transform data if necessary or pass directly if it matches the shape
  // The DB shape matches the PropertyDetail interface in the client component
  return <PropertyDetailClient property={property as any} />;
}
