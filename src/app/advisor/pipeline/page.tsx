import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import KanbanBoard from "@/components/advisor/KanbanBoard";
import { Trello } from 'lucide-react';

export default async function PipelinePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'asesor' && profile?.role !== 'superadmin') return redirect('/my-properties');

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                    <Trello size={24} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Pipeline de Ventas</h1>
            </div>
            <p className="text-slate-500 font-medium text-lg">Gestiona el progreso de tus clientes y propiedades bajo tu responsabilidad.</p>
        </div>
        <KanbanBoard />
      </div>
    </main>
  );
}
