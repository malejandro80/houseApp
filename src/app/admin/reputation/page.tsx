"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus, Minus } from "lucide-react";

interface AdvisorMetric {
  advisor_id: string;
  current_xp: number;
  current_tier: string;
  sales_count: number;
  rating_avg: number;
  profiles: {
    email: string;
    full_name: string;
  };
}

export default function AdminReputationPage() {
  const [advisors, setAdvisors] = useState<AdvisorMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchAdvisors();
  }, []);

  const fetchAdvisors = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("advisor_metrics")
      .select(`
        *,
        profiles:advisor_id (email, full_name)
      `)
      .order("current_xp", { ascending: false });
    
    if (data) setAdvisors(data as any);
    setLoading(false);
  };

  const adjustXP = async (advisorId: string, amount: number) => {
    const reason = prompt("Reason for adjustment (e.g. 'Bonus', 'Correction'):");
    if (!reason) return;

    // Call server action or API route in real app.
    // Here simulating logic for admin view prototype.
    // In production, use the `addXP` service function via a Server Action.

    alert(`Adjusting XP by ${amount} for ${reason}. (Connect to Server Action addXP)`);
    
    // Optimistic UI update for demo
    setAdvisors(prev => prev.map(a => 
      a.advisor_id === advisorId ? { ...a, current_xp: a.current_xp + amount } : a
    ));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Advisor Reputation Management 🏆</h1>

      {loading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="p-4">Advisor</th>
                <th className="p-4">Tier</th>
                <th className="p-4">XP</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {advisors.map((advisor) => (
                <tr key={advisor.advisor_id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium">{advisor.profiles?.full_name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{advisor.profiles?.email}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      advisor.current_tier === 'DIAMOND' ? 'bg-blue-100 text-blue-800' :
                      advisor.current_tier === 'GOLD' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {advisor.current_tier}
                    </span>
                  </td>
                  <td className="p-4 font-mono">{advisor.current_xp.toLocaleString()}</td>
                  <td className="p-4">{advisor.rating_avg.toFixed(1)} ★</td>
                  <td className="p-4 flex gap-2">
                    <button 
                      onClick={() => adjustXP(advisor.advisor_id, 100)}
                      className="p-1 hover:bg-green-100 rounded text-green-600"
                      title="Add 100 XP"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => adjustXP(advisor.advisor_id, -100)}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                      title="Deduct 100 XP"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
