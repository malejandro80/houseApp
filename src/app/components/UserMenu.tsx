'use client';

import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { UserCircle } from 'lucide-react';

export default function UserMenu({ user }: { user: User | null }) {
  const supabase = createClient();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  if (!user) {
    return (
      <Link href="/login" className="px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100 transition-colors">
        Iniciar Sesión
      </Link>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 focus:outline-none bg-gray-50 hover:bg-gray-100 rounded-full pl-2 pr-1 py-1 transition-colors border border-gray-200"
      >
        <span className="text-sm font-medium text-gray-700 px-2 hidden sm:block">
            {displayName}
        </span>
        
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={displayName} 
            className="h-8 w-8 rounded-full object-cover border border-white shadow-sm"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200">
            <UserCircle size={20} />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50 transform origin-top-right transition-all">
          <div className="px-4 py-3 border-b border-gray-100">
             <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
             <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
          </div>
          
          <div className="py-1">
            <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
                Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
