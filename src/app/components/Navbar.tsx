import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import UserMenu from "./UserMenu";
import MobileMenu from "./MobileMenu";

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-4 md:gap-8">
            {/* Mobile Menu Toggle (Left on mobile?) or Right? Let's put it right with user menu */}
             
            <Link href="/" className="text-xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-2">
              <span className="bg-indigo-600 text-white p-1 rounded-md text-sm font-extrabold h-8 w-8 flex items-center justify-center">HA</span>
              <span className="hidden sm:inline">HouseApp</span>
            </Link>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Calculadora
              </Link>
              {user && (
                <>
                  <Link href="/my-properties" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Mis Propiedades
                  </Link>
                   <Link href="/map" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Mapa Global
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <UserMenu user={user} />
            <div className="md:hidden">
                <MobileMenu user={user} />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
