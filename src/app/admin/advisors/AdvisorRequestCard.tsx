'use client';

import { useState } from 'react';
import { verifyAdvisor } from '@/app/actions/admin';
import { Loader2, Check, X, FileText, ExternalLink } from 'lucide-react';

interface AdvisorRequestProps {
  profile: {
    id: string;
    full_name: string | null;
    verification_status: string;
    documents: string[]; // URLs
    created_at: string;
  };
}

export default function AdvisorRequestCard({ profile }: AdvisorRequestProps) {
  const [loading, setLoading] = useState(false);

  // Helper to extract filename/type from URL if needed, or just show link
  // Since we store full path in storage, we need to construct the public URL or signed URL.
  // Wait, `documents` stores the path `advisor-documents/userId/filename`.
  // We need to generate a signed URL or public URL.
  // Ideally the parent component passed signed URLs, or we generate them here? 
  // Generation of signed URLs is async server-side.
  // Let's assume the passed `documents` are ALREADY signed URLs or public URLs for simplicity in this component?
  // Or better, let's just make them clickable and let the browser handle it if they are public?
  // The bucket is private. So we need signed URLs.
  // I should handle signed URL generation in the PARENT server component.

  // Let's assume profile.documents contains string paths, and we receive a separate array of signedUrl objects?
  // Or the parent transforms the profile object to include signedUrls.
  
  const handleVerify = async (action: 'approve' | 'reject') => {
    if (!confirm(`¿Estás seguro de ${action === 'approve' ? 'APROBAR' : 'RECHAZAR'} a este asesor?`)) return;
    
    setLoading(true);
    try {
      await verifyAdvisor(profile.id, action);
    } catch (error) {
      alert('Error en la operación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-100 flex flex-col sm:flex-row justify-between gap-6">
      <div className="flex-1">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">{profile.full_name || 'Usuario Sin Nombre'}</h3>
            <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 uppercase font-bold tracking-wide">
                {profile.verification_status}
            </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">ID: {profile.id}</p>
        
        <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Documentos Adjuntos:</h4>
            {profile.documents && profile.documents.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {/* Note: The parent MUST transform these into signed URLs for the 'href' */}
                    {profile.documents.map((docUrl: string, index: number) => (
                        <a 
                            key={index} 
                            href={docUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        >
                            <FileText size={16} />
                            <span>Documento {index + 1}</span>
                            <ExternalLink size={14} />
                        </a>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-red-500 italic">No hay documentos adjuntos.</p>
            )}
        </div>
      </div>

      <div className="flex flex-col gap-2 justify-center border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6">
        <button
          onClick={() => handleVerify('approve')}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors w-full sm:w-auto"
        >
          {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Check className="h-4 w-4" />}
          Aprobar
        </button>
        <button
          onClick={() => handleVerify('reject')}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors w-full sm:w-auto"
        >
           <X className="h-4 w-4" />
           Rechazar
        </button>
      </div>
    </div>
  );
}
