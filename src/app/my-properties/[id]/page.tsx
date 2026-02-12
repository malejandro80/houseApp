import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PropertyDetailClient from '@/app/components/PropertyDetailClient';

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: rawProperty, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !rawProperty) {
    notFound();
  }

  // Transform data from new schema (metadata JSON) to legacy flat format expected by client component
  const property = {
    ...rawProperty,
    // Map mismatched fields
    m2: rawProperty.area_total || 0,
    // Extract from metadata
    rooms: (rawProperty.metadata as any)?.rooms || 0,
    bathrooms: (rawProperty.metadata as any)?.bathrooms || 0,
    has_garage: ((rawProperty.metadata as any)?.parking || 0) > 0,
    // Defaults
    contact_phone: null,
    images: rawProperty.images || []
  };

  return <PropertyDetailClient property={property as any} />;
}
