'use client';

import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { uploadDocument } from '@/lib/storage/upload';
import { submitAdvisorRequest } from '@/app/actions/advisor';
import { useRouter } from 'next/navigation';

export default function RegistrationForm({ userId, currentStatus }: { userId: string, currentStatus: string }) {
  const [idFile, setIdFile] = useState<File | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idFile || !certFile) {
      setError('Por favor, sube ambos documentos.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Upload Files
      const idUrl = await uploadDocument(idFile, userId, 'id');
      const certUrl = await uploadDocument(certFile, userId, 'certification');

      if (!idUrl || !certUrl) {
        throw new Error('Error al subir los documentos. Inténtalo de nuevo.');
      }

      // 2. Submit Request
      const result = await submitAdvisorRequest([idUrl, certUrl]);

      if (result.error) {
        throw new Error(result.error);
      }

      // Success
      router.refresh();
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  if (currentStatus === 'pending') {
    return (
      <div className="text-center p-8 bg-yellow-50 rounded-2xl border border-yellow-200">
        <div className="mx-auto h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <h3 className="text-lg font-semibold text-yellow-800">Verificación en Progreso</h3>
        <p className="text-yellow-700 mt-2">
          Hemos recibido tus documentos y nuestro equipo los está revisando. Te notificaremos cuando tu cuenta sea aprobada.
        </p>
      </div>
    );
  }

  if (currentStatus === 'verified' || currentStatus === 'asesor') {
    return (
       <div className="text-center p-8 bg-green-50 rounded-2xl border border-green-200">
        <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
          <CheckCircle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-green-800">¡Eres un Asesor Verificado!</h3>
        <p className="text-green-700 mt-2">
          Ya tienes acceso a las herramientas de asesor. Puedes gestionar ventas y clientes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* ID Upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Documento de Identidad (Cédula/DNI)</label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:bg-gray-50 transition-colors relative">
          <div className="space-y-1 text-center">
            {idFile ? (
                <div className="flex flex-col items-center text-green-600">
                    <FileText className="mx-auto h-12 w-12" />
                    <p className="text-sm font-medium">{idFile.name}</p>
                    <button type="button" onClick={() => setIdFile(null)} className="text-xs text-red-500 hover:text-red-700 mt-1">Cambiar archivo</button>
                </div>
            ) : (
                <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                    <label htmlFor="id-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                        <span>Sube un archivo</span>
                        <input id="id-upload" name="id-upload" type="file" className="sr-only" accept="image/*,.pdf" onChange={(e) => setIdFile(e.target.files?.[0] || null)} />
                    </label>
                    <p className="pl-1">o arrastra y suelta</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF hasta 5MB</p>
                </>
            )}
          </div>
        </div>
      </div>

      {/* Certification Upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Certificación Profesional / Hoja de Vida</label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:bg-gray-50 transition-colors">
          <div className="space-y-1 text-center">
            {certFile ? (
                <div className="flex flex-col items-center text-green-600">
                    <FileText className="mx-auto h-12 w-12" />
                    <p className="text-sm font-medium">{certFile.name}</p>
                    <button type="button" onClick={() => setCertFile(null)} className="text-xs text-red-500 hover:text-red-700 mt-1">Cambiar archivo</button>
                </div>
            ) : (
                <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                    <label htmlFor="cert-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                        <span>Sube un archivo</span>
                        <input id="cert-upload" name="cert-upload" type="file" className="sr-only" accept="image/*,.pdf" onChange={(e) => setCertFile(e.target.files?.[0] || null)} />
                    </label>
                    <p className="pl-1">o arrastra y suelta</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF hasta 5MB</p>
                </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={loading || !idFile || !certFile}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
             <span className="flex items-center gap-2">
                 <Loader2 className="h-4 w-4 animate-spin" /> Procesando...
             </span>
          ) : 'Enviar Solicitud'}
        </button>
      </div>
    </form>
  );
}
