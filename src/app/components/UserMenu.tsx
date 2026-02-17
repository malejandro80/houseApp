'use client';

import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { UserCircle, Calculator, Building2, Map, BarChart3, LogOut, X, Menu, Gem, Trello, MessageSquare, ShieldCheck, Users, User as UserIcon, Flag, Wallet, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserRole } from '@/hooks/useUserRole';
import { createPortal } from 'react-dom';

export default function UserMenu({ user }: { user: User | null }) {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [fullName, setFullName] = useState<string | null>(null);
  const { role, isAsesor, loading } = useUserRole();

  useEffect(() => {
    setMounted(true);
    
    // Fetch profile name
    async function fetchProfileName() {
        if (!user) return;
        const { data } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
        
        if (data?.full_name) {
            setFullName(data.full_name);
        }
    }
    fetchProfileName();
  }, [user]);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (!user) {
    return (
      <Link 
        href="/login" 
        className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-black hover:bg-black transition-all shadow-lg shadow-slate-900/20 active:scale-95"
      >
        Iniciar Sesión
      </Link>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const displayName = fullName || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0];

  const allNavItems = [
    { name: 'Mi Perfil', href: '/profile', icon: UserIcon, roles: ['usuario', 'asesor', 'superadmin'] },
    { name: 'Registrar Propiedad', href: '/calculator', icon: Calculator, roles: ['usuario', 'asesor', 'superadmin'] },
    { name: 'Mis Propiedades', href: '/my-properties', icon: Building2, roles: ['usuario'] },
    { name: 'Mis Mensajes', href: '/my-properties/messages', icon: MessageSquare, roles: ['usuario'] },
    { name: 'Consola de Asesor', href: '/advisor/dashboard', icon: BarChart3, roles: ['asesor', 'superadmin'] },
    { name: 'Panel Maestro', href: '/admin', icon: ShieldCheck, roles: ['superadmin'] },
    { name: 'Feature Flags', href: '/admin/feature-flags', icon: Flag, roles: ['superadmin'] },
    { name: 'Solicitudes Asesores', href: '/admin/advisors', icon: Users, roles: ['superadmin'] },
    { name: 'Pipeline de Ventas', href: '/advisor/pipeline', icon: Trello, roles: ['asesor', 'superadmin'] },
    { name: 'Bandeja de Leads', href: '/advisor/inbox', icon: MessageSquare, roles: ['asesor', 'superadmin'] },
    { name: 'Billetera Digital', href: '/wallet', icon: Wallet, roles: ['usuario', 'asesor', 'superadmin'] },
    { name: 'Documentos Legales', href: '/advisor/documents', icon: FileText, roles: ['asesor', 'superadmin'] },
    { name: 'Mapa Global', href: '/map', icon: Map, roles: ['usuario', 'asesor', 'superadmin'] },
    { name: 'Membresía', href: '/pricing', icon: Gem, roles: ['usuario'] },
    { name: 'Conviértete en Asesor', href: '/advisor-registration', icon: UserCircle, roles: ['usuario'] },
  ];

  const navItems = allNavItems.filter(item => 
    !loading && role && item.roles.includes(role)
  );

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 focus:outline-none bg-white/50 hover:bg-white rounded-full pl-2 pr-1 py-1 transition-all duration-300 border border-slate-200 shadow-sm hover:shadow-md group"
      >
        <span className="text-xs font-black text-slate-700 px-2 hidden sm:block group-hover:text-indigo-600 transition-colors">
            {displayName}
            {role && <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-widest -mt-0.5">{role}</span>}
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

      {/* Side Nav Drawer - Portaled to Body to avoid Navbar clipping */}
      {mounted && createPortal(
        <AnimatePresence>
        {isOpen && (
          <>
              {/* Overlay */}
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100]"
                  onClick={() => setIsOpen(false)}
              />
              
              {/* Drawer */}
              <motion.div 
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="fixed top-0 right-0 h-full w-85 sm:w-96 bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-[110] flex flex-col"
              >
                  {/* ... Header ... */}
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white -z-10" />
                      <div className="flex items-center gap-4">
                           {avatarUrl ? (
                              <img src={avatarUrl} alt={displayName || 'User'} className="h-14 w-14 rounded-2xl object-cover border-2 border-white shadow-xl shadow-slate-200" />
                           ) : (
                              <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200 shadow-sm">
                                  <UserCircle size={28} />
                              </div>
                           )}
                           <div className="flex flex-col">
                               <span className="font-black text-slate-900 text-lg truncate max-w-[180px] leading-tight tracking-tighter">{displayName}</span>
                               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate max-w-[180px] mt-1">{user?.email || 'Inversionista'}</span>
                           </div>
                      </div>
                      <motion.button 
                          whileHover={{ scale: 1.1, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setIsOpen(false)}
                          className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors border border-slate-100 shadow-sm"
                      >
                          <X size={20} />
                      </motion.button>
                  </div>

                  {/* Navigation Links */}
                  <div className="flex-1 overflow-y-auto py-8 px-6 space-y-2">
                      <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Menú de Navegación</p>
                      <motion.div
                          className="space-y-px"
                          initial="hidden"
                          animate="show"
                          variants={{
                              hidden: { opacity: 0 },
                              show: {
                                  opacity: 1,
                                  transition: { staggerChildren: 0.05 }
                              }
                          }}
                      >
                      {navItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;
                          return (
                              <Link 
                                  key={item.href}
                                  href={item.href}
                                  onClick={() => setIsOpen(false)}
                              >
                                   <motion.div
                                      variants={{
                                          hidden: { opacity: 0, x: 20 },
                                          show: { opacity: 1, x: 0 }
                                      }}
                                      whileHover={{ scale: 1.02, x: 5 }}
                                      whileTap={{ scale: 0.98 }}
                                      className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-[13px] font-black transition-all duration-300 group ${
                                          isActive 
                                          ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20' 
                                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                      }`}
                                  >
                                      <Icon size={20} className={`transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                      {item.name}
                                  </motion.div>
                              </Link>
                          )
                      })}
                      </motion.div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                      <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleSignOut}
                          className="w-full flex items-center justify-center gap-3 px-6 py-4 text-xs font-black text-red-600 bg-red-50 hover:bg-red-100 rounded-2xl transition-all border border-red-100"
                      >
                          <LogOut size={18} />
                          CERRAR SESIÓN
                      </motion.button>
                      <div className="flex flex-col items-center gap-1 mt-6">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">HouseApp Engine v2.0</span>
                        <span className="text-[8px] font-bold text-slate-300">© 2026 • Premium Real Estate Tools</span>
                      </div>
                  </div>
              </motion.div>
          </>
        )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
