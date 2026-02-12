import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Map as MapIcon, Plus } from 'lucide-react';
import MyPropertiesTable from '@/app/components/MyPropertiesTable';
import UserMenu from '@/app/components/UserMenu';

export default async function MyPropertiesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  return (
    <main className="min-h-screen bg-gray-50">


      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Mis Propiedades
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Gestiona y analiza el rendimiento de tus inversiones inmobiliarias.
            </p>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-3 md:ml-4 md:mt-0">
             <Link
              href="/map"
              className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
            >
              <MapIcon className="-ml-0.5 mr-1.5 h-4 w-4 text-gray-500" />
              Ver en Mapa
            </Link>
            
            <Link
              href="/calculator"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
            >
              <Plus className="-ml-0.5 mr-1.5 h-4 w-4" />
              Nueva Propiedad
            </Link>
          </div>
        </div>

        <MyPropertiesTable userId={user.id} />
        
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} HouseApp. Todos los derechos reservados.</p>
        </footer>
      </div>
    </main>
  );
}
