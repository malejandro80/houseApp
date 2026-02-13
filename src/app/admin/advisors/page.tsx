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
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-indigo-600" />
            Solicitudes de Asesores
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Revisa y aprueba la documentación de los aspirantes a asesores.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {requestsWithSignedUrls.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
                <p className="text-gray-500">No hay solicitudes pendientes.</p>
            </div>
        ) : (
            requestsWithSignedUrls.map((req) => (
                <AdvisorRequestCard key={req.id} profile={req} />
            ))
        )}
      </div>
    </div>
  );
}
