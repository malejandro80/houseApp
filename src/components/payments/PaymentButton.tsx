"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface PaymentButtonProps {
  propertyId: string;
  amount: number;
  listingStatus: string; // active, reserved, sold
}

export function PaymentButton({ propertyId, amount, listingStatus }: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Get User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to pay.");
      }

      // 2. Initiate Payment (Mock)
      const { data: txId, error: initError } = await supabase.rpc('mock_payment_initiate', {
        p_property_id: propertyId,
        p_buyer_id: user.id,
        p_amount: amount
      });

      if (initError) throw initError;

      // 3. Simulate processing delay (2s)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 4. Authorize Payment (Mock Webhook)
      const { error: authError } = await supabase.rpc('mock_payment_authorize', {
        p_tx_id: txId
      });

      if (authError) throw authError;

      alert("🎉 Pago Exitoso! La propiedad ha sido reservada.");
      router.refresh(); // Refresh page to show new status

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  if (listingStatus === 'sold') {
    return (
      <button disabled className="w-full bg-gray-300 text-gray-500 py-3 rounded-lg font-bold cursor-not-allowed">
        Vendida
      </button>
    );
  }

  if (listingStatus === 'reserved') {
    return (
      <button disabled className="w-full bg-amber-200 text-amber-800 py-3 rounded-lg font-bold cursor-not-allowed flex justify-center items-center gap-2">
        <CheckCircle className="w-5 h-5" /> Reservada
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <button 
        onClick={handlePayment}
        disabled={loading}
        className={`w-full py-3 rounded-lg font-bold text-white shadow-lg flex justify-center items-center gap-2 transition-all
          ${loading ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Procesando...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" /> Separar por ${amount.toLocaleString()}
          </>
        )}
      </button>
      
      {error && (
        <div className="text-red-600 text-sm flex items-center gap-1 justify-center bg-red-50 p-2 rounded">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}
      
      <p className="text-xs text-center text-gray-500 mt-2">
        * Este es un pago de prueba (Mock Smoke Test). No se debitará dinero real.
      </p>
    </div>
  );
}
