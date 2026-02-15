import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Target } from 'lucide-react';
import MyPropertiesTable from '@/app/components/MyPropertiesTable';
import AdvisorStats from '@/app/components/AdvisorStats';
import { getWeeklyVisits, getPendingLeads } from '@/app/actions/leads';
import DashboardQuickView from '@/app/components/DashboardQuickView';

export default async function AdvisorDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  // Double check if user is advisor (optional but recommended)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'asesor' && profile?.role !== 'superadmin') {
    return redirect('/my-properties');
  }

  // Fetch quick view data
  const [weeklyVisits, pendingLeads] = await Promise.all([
    getWeeklyVisits(),
    getPendingLeads()
  ]);

  return (
    <main className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent -z-10" />
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-blue-400/5 blur-[120px] rounded-full -z-10" />
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        
        {/* Advisor Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest mb-4 border border-indigo-200">
                    <Target size={12} />
                    Panel de Control Premium
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-slate-900 sm:text-5xl lg:text-6xl leading-[0.9]">
                    Consola de <span className="text-indigo-600">Asesor</span>
                </h1>
                <p className="mt-4 text-slate-500 font-medium max-w-2xl text-lg">
                    Gestiona tu portafolio asignado, analiza el impacto de cada propiedad y acelera el cierre con herramientas de marketing automatizado.
                </p>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="h-16 w-px bg-slate-200 hidden md:block mx-4" />
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado del Consultor</span>
                    <span className="flex items-center gap-2 text-sm font-bold text-slate-900 mt-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Perfil Verificado • {profile.role}
                    </span>
                </div>
            </div>
        </div>

        {/* Advisor Custom Stats */}
        <AdvisorStats userId={user.id} />

        {/* Quick View Sections */}
        <DashboardQuickView weeklyVisits={weeklyVisits} pendingLeads={pendingLeads} />

        {/* Managed Properties Section */}
        <div className="mt-20">
            <div className="flex items-center justify-between mb-8 px-2">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Portafolio Gestionado</h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">Lista completa de unidades bajo tu gestión directa.</p>
                </div>
            </div>
            <MyPropertiesTable userId={user.id} viewMode="advisor" />
        </div>
        
        <footer className="mt-20 pt-8 border-t border-slate-200 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
           HouseApp Advisor Ecosystem • Empowering Real Estate Experts
        </footer>
      </div>
    </main>
  );
}
