"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, FileText, CheckCircle, FilePlus, ExternalLink } from "lucide-react";
import Link from "next/link";

interface LegalDocument {
  id: string;
  status: 'draft' | 'generated' | 'sent_to_sign' | 'signed' | 'voided';
  created_at: string;
  pdf_url: string;
  template_id: string;
  properties: {
    title: string;
    address: string;
  };
}

export default function AdvisorLegalDocumentsPage() {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    // Fetch documents for properties assigned to this advisor
    // Note: RLS policies handle the filtering, but we need to join properties to be useful
    const { data, error } = await supabase
      .from('legal_documents')
      .select(`
        *,
        properties (title, address)
      `)
      .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching docs:", error);
    } else {
        setDocuments(data as any || []);
    }
    
    setLoading(false);
  };

  const generateDemoDoc = async () => {
      // Logic to create a demo document row would go here (requires backend RPC or careful insert)
      alert("Para generar un documento nuevo, ve a la ficha de la propiedad (Mock Implementation)");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="text-indigo-600" /> Gestión Documental Legal
                </h1>
                <p className="text-gray-500 text-sm mt-1">Contratos, Promesas y Mandatos</p>
            </div>
            <button 
                onClick={generateDemoDoc}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition flex items-center gap-2"
            >
                <FilePlus className="w-5 h-5" /> Nuevo Contrato
            </button>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
            </div>
          ) : documents.length === 0 ? (
            <div className="p-16 text-center text-gray-400 flex flex-col items-center gap-4">
              <FileText className="w-16 h-16 opacity-20" />
              <p>No has generado documentos legales aún.</p>
            </div>
          ) : (
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase border-b border-gray-100">
                    <tr>
                        <th className="p-4 font-semibold">Propiedad</th>
                        <th className="p-4 font-semibold">Tipo de Contrato</th>
                        <th className="p-4 font-semibold">Estado</th>
                        <th className="p-4 font-semibold">Fecha</th>
                        <th className="p-4 font-semibold">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50 transition">
                            <td className="p-4">
                                <div className="font-medium text-gray-900">{doc.properties?.title || 'Unknown Property'}</div>
                                <div className="text-xs text-gray-400 truncate max-w-[200px]">{doc.properties?.address}</div>
                            </td>
                            <td className="p-4 text-sm text-gray-600">
                                Promesa de Compraventa
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                    doc.status === 'signed' ? 'bg-green-100 text-green-700' :
                                    doc.status === 'sent_to_sign' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                    {doc.status.replace(/_/g, ' ')}
                                </span>
                            </td>
                            <td className="p-4 text-sm text-gray-500">
                                {new Date(doc.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                                {doc.pdf_url ? (
                                    <Link 
                                        href={doc.pdf_url} 
                                        target="_blank"
                                        className="text-blue-600 hover:underline flex items-center gap-1 text-sm font-medium"
                                    >
                                        Ver PDF <ExternalLink className="w-3 h-3" />
                                    </Link>
                                ) : (
                                    <span className="text-gray-400 text-sm italic">Generando...</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
