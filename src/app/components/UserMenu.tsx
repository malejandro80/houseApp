'use client';

import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { UserCircle, Calculator, Building2, Map, BarChart3, LogOut, X, Menu } from 'lucide-react';

export default function UserMenu({ user }: { user: User | null }) {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

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

  const navItems = [
    { name: 'Calculadora', href: '/', icon: Calculator },
    { name: 'Mis Propiedades', href: '/my-properties', icon: Building2 },
    { name: 'Mapa Global', href: '/map', icon: Map },
    { name: 'Mis Estadísticas', href: '/zone-stats', icon: BarChart3 },
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 focus:outline-none bg-gray-50 hover:bg-gray-100 rounded-full pl-2 pr-1 py-1 transition-colors border border-gray-200 group"
      >
        <span className="text-sm font-medium text-gray-700 px-2 hidden sm:block group-hover:text-indigo-600 transition-colors">
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

      {/* Side Nav Drawer */}
      {isOpen && (
        <>
            {/* Overlay */}
            <div 
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
                onClick={() => setIsOpen(false)}
            />
            
            {/* Drawer */}
            <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col animate-in slide-in-from-right">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                         {avatarUrl ? (
                            <img src={avatarUrl} alt={displayName} className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm" />
                         ) : (
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <UserCircle size={24} />
                            </div>
                         )}
                         <div className="flex flex-col">
                             <span className="font-bold text-gray-900 text-sm">{displayName}</span>
                             <span className="text-xs text-gray-500 truncate max-w-[150px]">{user.email}</span>
                         </div>
                    </div>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menú Principal</p>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link 
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                                    isActive 
                                    ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <Icon size={18} className={`transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                {item.name}
                            </Link>
                        )
                    })}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                    >
                        <LogOut size={18} />
                        Cerrar Sesión
                    </button>
                    <p className="text-center text-[10px] text-gray-400 mt-4">HouseApp v1.0 • 2026</p>
                </div>
            </div>
        </>
      )}
    </>
  );
}
