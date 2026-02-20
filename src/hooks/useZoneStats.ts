import { useState, useEffect } from 'react';
import { getUserZones, getZoneHistory, Zone, ZoneHistory } from '@/app/actions/zone-actions';
import { logClientError } from '@/lib/logger-client';

export const useZoneStats = (isSuperAdmin: boolean) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [history, setHistory] = useState<ZoneHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) {
      loadZones();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (selectedZone) {
      fetchHistory(selectedZone.id);
    }
  }, [selectedZone]);

  const loadZones = async () => {
    try {
      const userZones = await getUserZones();
      setZones(userZones);
      if (userZones.length > 0) {
        setSelectedZone(userZones[0]);
      }
    } catch (error) {
      logClientError(error as Error, 'loadZones');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (zoneId: number) => {
    setLoadingHistory(true);
    try {
      const data = await getZoneHistory(zoneId);
      setHistory(data);
    } catch (error) {
      logClientError(error as Error, 'fetchHistory');
    } finally {
      setLoadingHistory(false);
    }
  };

  return {
    zones,
    selectedZone,
    setSelectedZone,
    history,
    loading,
    loadingHistory
  };
};
