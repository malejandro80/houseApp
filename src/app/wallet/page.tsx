"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Wallet, ArrowUpRight, ArrowDownLeft, RefreshCcw } from "lucide-react";
import { formatCurrency } from "@/lib/utils"; // Assuming this exists, or use Intl

interface Transaction {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  property_id: string;
  provider_ref: string;
}

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    // 1. Get Wallet Balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();
    
    if (wallet) setBalance(wallet.balance);

    // 2. Get Transactions
    const { data: txs } = await supabase
      .from('transactions')
      .select('*')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });
    
    if (txs) setTransactions(txs as any);
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Wallet className="text-blue-600" /> Billetera Digital
        </h1>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
          <p className="text-blue-100 font-medium mb-1">Saldo Disponible</p>
          <h2 className="text-4xl font-bold">
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
          </h2>
          <div className="mt-6 flex gap-3">
             <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition">
               <ArrowDownLeft className="w-4 h-4" /> Recargar
             </button>
             <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition">
               <ArrowUpRight className="w-4 h-4" /> Retirar
             </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Historial de Transacciones</h3>
            <button onClick={fetchWalletData} className="text-gray-400 hover:text-blue-600 transition">
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
          
          {loading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="animate-spin text-blue-600" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No tienes transacciones recientes.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 hover:bg-gray-50 flex justify-between items-center transition">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      tx.status === 'completed' ? 'bg-green-100 text-green-600' :
                      tx.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                      tx.status === 'refunded' ? 'bg-purple-100 text-purple-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {tx.status === 'refunded' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {tx.status === 'refunded' ? 'Reembolso' : 'Pago de Separación'}
                      </p>
                      <p className="text-xs text-gray-500 text-mono">Ref: {tx.provider_ref}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      tx.status === 'refunded' ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {tx.status === 'refunded' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                      tx.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      tx.status === 'refunded' ? 'bg-purple-100 text-purple-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
