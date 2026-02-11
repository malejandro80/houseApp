'use server';

import { createClient } from '@/lib/supabase/server';

export interface ZoneStats {
  averagePrice: number;
  averagePriceM2: number;
  count: number;
  minPrice: number;
  maxPrice: number;
}

export async function getZoneStats(
  lat: number,
  lon: number,
  radiusKm: number,
  excludeId: number
): Promise<ZoneStats> {
  const supabase = await createClient();

  // Haversine formula to calculate distance in Kilometers
  // 6371 is Earth's radius in km
  const { data, error } = await supabase.rpc('get_properties_in_radius', {
    lat_input: lat,
    lon_input: lon,
    radius_km: radiusKm,
    exclude_id: excludeId
  });

  // If RPC is not available (likely), we'll do it in raw SQL or client-side filtering 
  // For robustness without setting up specific Postgres functions, I'll fetch and filter
  // fetching a bounding box first for performance would be optimization 2.0
  // For now, let's fetch all properties (assuming dataset < 10k) and filter in JS
  // providing a seamless "it just works" experience without complex migrations.
  
  const { data: allProperties } = await supabase
    .from('datahouse')
    .select('id, sale_price, m2, lat, lon');

  if (!allProperties) return { averagePrice: 0, averagePriceM2: 0, count: 0, minPrice: 0, maxPrice: 0 };

  const propertiesInZone = allProperties.filter((p) => {
    if (p.id === excludeId) return false;
    if (!p.lat || !p.lon || !p.sale_price || !p.m2) return false;

    const distance = getDistanceFromLatLonInKm(lat, lon, p.lat, p.lon);
    return distance <= radiusKm;
  });

  if (propertiesInZone.length === 0) {
    return { averagePrice: 0, averagePriceM2: 0, count: 0, minPrice: 0, maxPrice: 0 };
  }

  const prices = propertiesInZone.map(p => p.sale_price);
  const m2Prices = propertiesInZone.map(p => p.sale_price / p.m2);

  const total = prices.reduce((acc, curr) => acc + curr, 0);
  const totalM2 = m2Prices.reduce((acc, curr) => acc + curr, 0);

  return {
    averagePrice: total / prices.length,
    averagePriceM2: totalM2 / m2Prices.length,
    count: prices.length,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
  };
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}
