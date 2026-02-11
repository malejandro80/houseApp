'use client';

import dynamic from 'next/dynamic';

const PropertyMap = dynamic(() => import('./PropertyMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-gray-400">
      Cargando mapa...
    </div>
  ),
});

interface PropertyMapWrapperProps {
  lat: number;
  lng: number;
  title?: string;
  radius?: number;
}

export default function PropertyMapWrapper(props: PropertyMapWrapperProps) {
  return <PropertyMap {...props} />;
}
