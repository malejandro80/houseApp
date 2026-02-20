import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PricingCard from './PricingCard';
import { Gem } from 'lucide-react';

export default async function PricingPage() {
  const supabase = await createClient();

  // 1. Check User
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/login');

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_type, status, current_period_end')
    .eq('user_id', user.id)
    .single();

  const currentPlan = (subscription?.status === 'active' && new Date(subscription.current_period_end) > new Date()) 
    ? subscription.plan_type 
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
            <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
                <Gem className="h-8 w-8 text-white" />
            </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Elige tu Membresía
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Únete a la comunidad exclusiva de vendedores y maximiza tus ganancias.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
          <PricingCard currentPlan={currentPlan} />
      </div>
    </div>
  );
}
