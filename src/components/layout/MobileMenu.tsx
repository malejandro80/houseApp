'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useUserRole } from '@/hooks/useUserRole';

type MobileMenuProps = {
  user: User | null;
};

export default function MobileMenu({ user }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { role, isAsesor, loading } = useUserRole();

  return (
    <div className="md:hidden flex items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-md transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-100 shadow-lg z-40 p-4 flex flex-col space-y-3 animate-fade-in-down">
          <Link 
            href="/calculator" 
            className="block px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Agregar Propiedad
          </Link>
          
          {user && (
            <>
              {/* Ordinary users see My Properties */}
              {!loading && !isAsesor && (
                  <Link 
                    href="/my-properties" 
                    className="block px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Mis Propiedades
                  </Link>
              )}

              {/* Advisors see their specific tools */}
              {!loading && (role === 'asesor' || role === 'superadmin') && (
                <>
                  <Link 
                    href="/advisor/dashboard" 
                    className="block px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-slate-50 hover:text-indigo-700 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Consola de Asesor
                  </Link>
                  {role === 'superadmin' && (
                    <>
                      <Link 
                        href="/admin" 
                        className="block px-4 py-3 rounded-lg text-base font-medium text-indigo-600 hover:bg-indigo-50 transition-colors border-l-4 border-indigo-600"
                        onClick={() => setIsOpen(false)}
                      >
                        Panel Maestro
                      </Link>
                      <Link 
                        href="/admin/advisors" 
                        className="block px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-indigo-50 transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        Solicitudes Asesores
                      </Link>
                    </>
                  )}
                  <Link 
                    href="/advisor/pipeline" 
                    className="block px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-slate-50 hover:text-indigo-700 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Pipeline de Ventas
                  </Link>
                  <Link 
                    href="/advisor/calendar" 
                    className="block px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-slate-50 hover:text-indigo-700 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Calendario de Visitas
                  </Link>
                  <Link 
                    href="/advisor/inbox" 
                    className="block px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-slate-50 hover:text-indigo-700 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Mensajes
                  </Link>
                </>
              )}
              
              <Link 
                href="/map" 
                className="block px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Mapa Global
              </Link>
            </>
          )}

          {!user && (
            <Link 
                href="/login" 
                className="block px-4 py-3 rounded-lg text-base font-medium bg-indigo-600 text-white text-center hover:bg-indigo-700 transition-colors mt-2"
                onClick={() => setIsOpen(false)}
            >
                Iniciar Sesión
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
