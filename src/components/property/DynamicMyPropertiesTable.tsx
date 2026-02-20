'use client';

import dynamic from 'next/dynamic';
// Import type only to avoid server-side execution of client module if any side-effects exist (though unlikely in component file)
import type MyPropertiesTable from './MyPropertiesTable'; 
import { ComponentProps } from 'react';

// We need to define the props interface manually if typeof doesn't work or just trust it.
// Actually, let's just use `any` for props to avoid type errors during build if complex generics are involved, 
// OR better: import the type of the component.
// But `import MyPropertiesTable` is a value import. 
// "typeof MyPropertiesTable" gives the function type.
// ComponentProps<typeof ...> gives props.

const DynamicTable = dynamic(() => import('./MyPropertiesTable'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-pulse" />
  ),
});

export default function DynamicMyPropertiesTable(props: { userId: string, viewMode?: 'owner' | 'advisor' }) {
  return <DynamicTable {...props} />;
}
