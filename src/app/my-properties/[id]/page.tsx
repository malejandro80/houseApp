import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PropertyDetailClient from '@/app/components/PropertyDetailClient';

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  // Parallel fetch: User session & Property Data
  const [userResponse, propertyResponse] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('properties')
      .select(`
        *,
        owner:property_owners(*),
        assigned_advisor:assigned_advisor_id(full_name)
      `)
      .eq('id', id)
      .single()
  ]);

  const { data: { user } } = userResponse;
  const { data: rawProperty, error } = propertyResponse;

  if (error || !rawProperty) {
    notFound();
  }

  // Fetch role only if user exists (can be parallelized too if we had user ID beforehand, but we don't safely)
  // Optimization: If no user, we know role is visitor.
  let role = 'usuario';
  if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      role = profile?.role || 'usuario';
  }
  const isExpert = role === 'asesor' || role === 'superadmin';
  const isOwner = user?.id === rawProperty.user_id;
  const isPublicSale = rawProperty.is_listed && rawProperty.purpose === 'sale';

  if (!isExpert && !isOwner && !isPublicSale) {
    notFound(); // Protect privacy of private analyses/unlisted properties
  }

  // Transform data
  const property = {
    ...rawProperty,
    isOwner,
    // Extract metadata
    rooms: rawProperty.bedrooms || (rawProperty.metadata as any)?.rooms || 0,
    bathrooms: rawProperty.bathrooms || (rawProperty.metadata as any)?.bathrooms || 0,
    parking: rawProperty.parking || (rawProperty.metadata as any)?.parking || 0,
    age: rawProperty.age || (rawProperty.metadata as any)?.age || 0,
    physicalCondition: rawProperty.physical_condition,
    amenities: (rawProperty.metadata as any)?.amenities || [],
    legalStatus: rawProperty.legal_status,
    riskFactors: rawProperty.risk_factors,
    // Mapping for client
    m2: rawProperty.area_total || 0,
    images: rawProperty.images || []
  };

  return <PropertyDetailClient property={property as any} user={user} userRole={role} />;
}
