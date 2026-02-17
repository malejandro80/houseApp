import { createClient } from '@/lib/supabase/server';

export interface ReputationEvent {
  advisor_id: string;
  event_type: 'SALE_CLOSED' | 'REVIEW_5_STAR' | 'FAST_RESPONSE' | 'NO_SHOW' | 'LEAK_ATTEMPT';
  reason: string;
}

const POINTS_MAP: Record<string, number> = {
  'SALE_CLOSED': 1000,
  'REVIEW_5_STAR': 200,
  'FAST_RESPONSE': 10,
  'NO_SHOW': -300,
  'LEAK_ATTEMPT': -5000
};

export async function addXP(event: ReputationEvent) {
  const supabase = await createClient();
  const points = POINTS_MAP[event.event_type] || 0;

  // 1. Log the event
  const { error: logError } = await supabase
    .from('reputation_logs')
    .insert({
      advisor_id: event.advisor_id,
      event_type: event.event_type,
      points_delta: points,
      reason: event.reason
    });

  if (logError) throw new Error(`Failed to log reputation event: ${logError.message}`);

  // 2. Update Metrics & Check for Tier Upgrade
  // We use a Remote Procedure Call (RPC) or a direct query. 
  // For simplicity in this Next.js environment, we'll read -> calculate -> update.
  // In a high-concurrency env, this should be a DB function.

  const { data: metrics } = await supabase
    .from('advisor_metrics')
    .select('current_xp')
    .eq('advisor_id', event.advisor_id)
    .single();

  const currentXp = metrics?.current_xp || 0;
  const newXp = currentXp + points;
  let newTier = 'ROOKIE';

  if (newXp >= 10000) newTier = 'DIAMOND';
  else if (newXp >= 5000) newTier = 'GOLD';

  await supabase
    .from('advisor_metrics')
    .upsert({
      advisor_id: event.advisor_id,
      current_xp: newXp,
      current_tier: newTier,
      updated_at: new Date().toISOString()
    });

  return { newXp, newTier };
}
