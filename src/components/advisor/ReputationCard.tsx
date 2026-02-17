"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BadgeCheck, Zap, TrendingUp, AlertTriangle } from "lucide-react";

interface AdvisorMetrics {
  current_xp: number;
  current_tier: 'ROOKIE' | 'GOLD' | 'DIAMOND';
  sales_count: number;
}

interface ReputationLog {
  id: string;
  event_type: string;
  points_delta: number;
  reason: string;
  created_at: string;
}

export function ReputationCard({ advisorId }: { advisorId: string }) {
  const [metrics, setMetrics] = useState<AdvisorMetrics | null>(null);
  const [logs, setLogs] = useState<ReputationLog[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: metricsData } = await supabase
        .from('advisor_metrics')
        .select('*')
        .eq('advisor_id', advisorId)
        .single();
      
      const { data: logsData } = await supabase
        .from('reputation_logs')
        .select('*')
        .eq('advisor_id', advisorId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (metricsData) setMetrics(metricsData);
      if (logsData) setLogs(logsData);
    }
    fetchData();
  }, [advisorId]);

  if (!metrics) return <div className="p-4 bg-gray-100 rounded animate-pulse h-48"></div>;

  const nextTierXp = metrics.current_tier === 'ROOKIE' ? 5000 : metrics.current_tier === 'GOLD' ? 10000 : 20000;
  const progress = Math.min((metrics.current_xp / nextTierXp) * 100, 100);

  const tierColor = 
    metrics.current_tier === 'DIAMOND' ? 'bg-blue-600 text-white' : 
    metrics.current_tier === 'GOLD' ? 'bg-yellow-500 text-black' : 
    'bg-gray-500 text-white';

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            Reputation Score
            <BadgeCheck className="text-blue-500 w-5 h-5" />
          </h2>
          <p className="text-sm text-gray-500">Your performance metrics</p>
        </div>
        <div className={`px-4 py-1 rounded-full font-bold text-sm tracking-wide shadow-sm ${tierColor}`}>
          {metrics.current_tier}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
          <span>{metrics.current_xp.toLocaleString()} XP</span>
          <span>Next Tier: {nextTierXp.toLocaleString()} XP</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Earn more XP by closing deals and getting 5-star reviews.
        </p>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Recent Activity
        </h3>
        <ul className="space-y-3">
          {logs.map((log) => (
            <li key={log.id} className="flex justify-between items-center text-sm border-b border-gray-50 last:border-0 pb-2">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-full ${log.points_delta > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {log.points_delta > 0 ? <Zap className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{log.event_type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-500">{new Date(log.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`font-bold ${log.points_delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {log.points_delta > 0 ? '+' : ''}{log.points_delta} XP
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
