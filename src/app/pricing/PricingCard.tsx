'use client';

import { useState } from 'react';
import { subscribeToPlan } from '@/app/actions/payment';
import { Loader2, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

export default function PricingCard({ currentPlan }: { currentPlan: string | null }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const isSubscribed = currentPlan === 'seller_basic';

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // Mock payment delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const result = await subscribeToPlan('seller_basic');
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('¡Suscripción exitosa!');
        router.push('/my-properties');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error en el proceso de pago.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative p-8 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col">
      <div className="flex-1">
        <h3 className="text-xl font-semibold text-gray-900">Plan Vendedor</h3>
        <p className="absolute top-0 py-1.5 px-4 bg-indigo-500 text-white rounded-full transform -translate-y-1/2 uppercase tracking-wide font-semibold text-xs shadow-sm">
            Más Popular
        </p>
        <p className="mt-4 flex items-baseline text-gray-900">
          <span className="text-5xl font-extrabold tracking-tight">$3</span>
          <span className="ml-1 text-xl font-semibold">/mes</span>
        </p>
        <p className="mt-6 text-gray-500">
            Publica tus propiedades y llega a miles de compradores potenciales con el respaldo de nuestros asesores expertos.
        </p>

        {/* Feature List */}
        <ul role="list" className="mt-6 space-y-4 text-sm text-gray-700">
          <li className="flex">
            <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
            <span className="ml-3">Publicación ilimitada de propiedades</span>
          </li>
          <li className="flex">
            <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
            <span className="ml-3">Asignación automática de asesor experto</span>
          </li>
          <li className="flex">
            <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
            <span className="ml-3">Gestión de trámites legales</span>
          </li>
          <li className="flex">
            <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
            <span className="ml-3">Soporte prioritario</span>
          </li>
        </ul>
      </div>

      <button
        onClick={handleSubscribe}
        disabled={loading || isSubscribed}
        className={`mt-8 block w-full py-3 px-6 border border-transparent rounded-xl text-center font-medium transition-colors duration-200 ${
            isSubscribed 
            ? 'bg-green-100 text-green-700 cursor-default'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
        }`}
      >
        {loading ? (
            <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin h-5 w-5" /> Procesando...
            </span>
        ) : isSubscribed ? (
            'Plan Activo'
        ) : (
            'Suscribirse Ahora'
        )}
      </button>
    </div>
  );
}
