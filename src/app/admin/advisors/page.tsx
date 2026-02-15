import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdvisorRequestCard from './AdvisorRequestCard';
import { ShieldAlert } from 'lucide-react';

export default async function AdminAdvisorsPage() {
  const supabase = await createClient();

  // 1. Check Superadmin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'superadmin') {
    return redirect('/');
  }

  // 2. Fetch Pending Requests
  const { data: requests, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('verification_status', 'pending')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching requests:', error);
    return <div>Error loading requests.</div>;
  }

  // 3. Generate Signed URLs for documents
  const requestsWithSignedUrls = await Promise.all(requests.map(async (req) => {
    let signedDocs: string[] = [];
    
    if (req.documents && Array.isArray(req.documents)) {
        const signedUrls = await Promise.all(req.documents.map(async (path: string) => {
            // Remove any potential bucket prefix if stored (it shouldn't be based on upload.ts)
            // Path should be "advisor-documents/..."
            const { data, error } = await supabase
                .storage
                .from('private_documents')
                .createSignedUrl(path, 3600); // 1 hour expiry
            
            return data?.signedUrl || null;
        }));
        // Filter out nulls
        signedDocs = signedUrls.filter((url): url is string => url !== null);
    }

    return {
        ...req,
        documents: signedDocs
    };
  }));



  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
                    <ShieldAlert size={24} />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Validación de Asesores</h1>
                    <p className="text-slate-500 font-medium mt-1">Revisa y aprueba la documentación de los aspirantes.</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {requestsWithSignedUrls.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <ShieldAlert size={32} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-1">Todo en orden</h3>
                  <p className="text-slate-400 font-medium">No hay solicitudes pendientes de validación.</p>
              </div>
          ) : (
              requestsWithSignedUrls.map((req) => (
                  <AdvisorRequestCard key={req.id} profile={req} />
              ))
          )}
        </div>
      </div>
    </main>
  );
}
