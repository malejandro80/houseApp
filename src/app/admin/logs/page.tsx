import { getErrorLogs } from '@/app/actions/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AlertCircle, ArrowLeft, Clock, Monitor } from 'lucide-react';
import Link from 'next/link';

export default async function LogsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'superadmin') return redirect('/');

  const logs = await getErrorLogs();

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">
              <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Registro de Errores</h1>
              <p className="text-slate-500 text-sm font-medium">Logs de cliente capturados en producción</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-medium">No hay errores registrados recientemente.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contexto</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mensaje</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Env</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 align-top">
                        <span className="inline-flex px-2 py-1 bg-red-50 text-red-600 rounded-md text-xs font-bold border border-red-100">
                          {log.context}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-top max-w-md">
                        <div className="font-bold text-slate-800 text-sm mb-1">{log.message}</div>
                        {log.stack_trace && (
                          <details className="text-[10px] text-slate-400 font-mono bg-slate-50 p-2 rounded border border-slate-100 mt-2 open:bg-slate-100 cursor-pointer">
                            <summary className="hover:text-indigo-600 transition-colors mb-1 select-none">Ver Stack Trace</summary>
                            <div className="whitespace-pre-wrap overflow-x-auto mt-2 max-h-40 overflow-y-auto">
                                {log.stack_trace}
                            </div>
                          </details>
                        )}
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <details className="text-[10px] text-slate-500 font-mono mt-1 cursor-pointer">
                                <summary className="hover:text-indigo-600 transition-colors select-none">Ver Metadatos</summary>
                                <pre className="mt-1 bg-slate-50 p-2 rounded">{JSON.stringify(log.metadata, null, 2)}</pre>
                            </details>
                        )}
                      </td>
                      <td className="px-6 py-4 align-top text-xs font-medium text-slate-500">
                        {log.user_id ? log.user_id.slice(0, 8) + '...' : 'Anónimo'}
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                          <Clock size={12} />
                          {new Date(log.occurred_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                           <Monitor size={12} />
                           {log.environment || 'N/A'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
