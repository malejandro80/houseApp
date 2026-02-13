import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import RegistrationForm from './registration-form';
import { ShieldCheck } from 'lucide-react';

export default async function AdvisorRegistrationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  // Fetch current profile status
  const { data: profile } = await supabase
    .from('profiles')
    .select('verification_status, role')
    .eq('id', user.id)
    .single();

  const currentStatus = profile?.verification_status || 'unverified';
  const role = profile?.role || 'usuario';

  // If already an advisor, show success state via the form component (or handle here)
  const effectiveStatus = role === 'asesor' ? 'verified' : currentStatus;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
            <div className="h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                <ShieldCheck className="h-8 w-8 text-white" />
            </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Conviértete en Asesor
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Únete a nuestra red de expertos inmobiliarios y comienza a gestionar propiedades.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          <RegistrationForm userId={user.id} currentStatus={effectiveStatus} />
        </div>
      </div>
    </div>
  );
}
