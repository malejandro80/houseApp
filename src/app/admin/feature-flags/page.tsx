"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface FeatureFlag {
  id: string;
  key: string;
  description: string;
  is_enabled: boolean;
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("feature_flags")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setFlags(data);
    setLoading(false);
  };

  const toggleFlag = async (id: string, currentValue: boolean) => {
    // Optimistic update
    setFlags(flags.map(f => f.id === id ? { ...f, is_enabled: !currentValue } : f));
    
    await supabase
      .from("feature_flags")
      .update({ is_enabled: !currentValue })
      .eq("id", id);
  };

  const createFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey) return;

    const { error } = await supabase
      .from("feature_flags")
      .insert([{ key: newKey, description: newDesc }]);

    if (!error) {
      setNewKey("");
      setNewDesc("");
      fetchFlags();
    } else {
      alert("Error creating flag: " + error.message);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Feature Flags Management 🚩</h1>

      {/* Create New Flag */}
      <div className="bg-white p-4 rounded-lg shadow mb-8 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Add New Feature Flag</h2>
        <form onSubmit={createFlag} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Key (e.g., new_checkout)</label>
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="w-full p-2 border rounded text-sm font-mono"
              placeholder="feature_key_name"
            />
          </div>
          <div className="flex-[2]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full p-2 border rounded text-sm"
              placeholder="What does this feature do?"
            />
          </div>
          <button
            type="submit"
            disabled={!newKey}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Create
          </button>
        </form>
      </div>

      {/* List Flags */}
      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
      ) : flags.length === 0 ? (
        <p className="text-gray-500 text-center">No feature flags found.</p>
      ) : (
        <div className="grid gap-4">
          {flags.map((flag) => (
            <div key={flag.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow border border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-800">{flag.key}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${flag.is_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {flag.is_enabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{flag.description}</p>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={flag.is_enabled}
                  onChange={() => toggleFlag(flag.id, flag.is_enabled)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
