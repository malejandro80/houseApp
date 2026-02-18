import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Map as MapIcon, Plus } from 'lucide-react';
import MyPropertiesTable from '@/app/components/MyPropertiesTable';
import DashboardStats from '@/app/components/DashboardStats';

export default async function MyPropertiesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  // Fallback: Redirect advisors to their dedicated console
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'asesor' || profile?.role === 'superadmin') {
    return redirect('/advisor/dashboard');
  }

  const displayName = profile?.full_name || user.email?.split('@')[0];

  return (
    <main className="min-h-screen bg-[#f8fafc] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="relative mb-12">
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-indigo-400/10 blur-3xl rounded-full" />
            <div className="md:flex md:items-end md:justify-between relative z-10">
                <div className="min-w-0 flex-1">
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                        Consola de <span className="text-indigo-600">Inversión</span>
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 font-medium">
                        Bienvenido de nuevo, {displayName}. Gestiona tu portafolio y acelera tus ventas.
                    </p>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 md:ml-4 md:mt-0">
                    <Link
                        href="/map"
                        className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 hover:ring-gray-300 transition-all active:scale-95"
                    >
                        <MapIcon className="-ml-0.5 mr-2 h-4 w-4 text-indigo-500" />
                        Mapa de Oportunidades
                    </Link>
                    
                    <Link
                        href="/calculator"
                        className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 hover:shadow-indigo-500/40 transition-all active:scale-95"
                    >
                        <Plus className="-ml-0.5 mr-2 h-4 w-4" />
                        Añadir Propiedad
                    </Link>
                </div>
            </div>
        </div>

        {/* Dashboard Metrics (PM vision: Console View) */}
        <DashboardStats userId={user.id} />

        {/* List Section */}
        <div className="relative">
            <div className="absolute -right-10 top-1/2 w-64 h-64 bg-indigo-400/5 blur-3xl rounded-full pointer-events-none" />
            <MyPropertiesTable userId={user.id} />
        </div>
        
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} HouseApp. Todos los derechos reservados.</p>
        </footer>
      </div>
    </main>
  );
}
