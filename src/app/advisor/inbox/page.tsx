import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdvisorInbox from '@/app/components/AdvisorInbox';
import { MessageSquare } from 'lucide-react';

export default async function InboxPage() {
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
                <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                    <MessageSquare size={24} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Bandeja de Leads</h1>
            </div>
            <p className="text-slate-500 font-medium text-lg">Atiende las consultas de tus prospectos de forma centralizada.</p>
        </div>
        <AdvisorInbox />
      </div>
    </main>
  );
}
