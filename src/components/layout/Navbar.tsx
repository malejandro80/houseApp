import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import UserMenu from "./UserMenu";

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <nav className="sticky top-0 z-[60] w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group translate-y-[-1px]">
              <div className="bg-indigo-600 text-white rounded-xl h-10 w-10 flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-600/25 group-hover:scale-110 transition-transform duration-300">
                HA
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black text-slate-900 tracking-tighter leading-none group-hover:text-indigo-600 transition-colors">HouseApp</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block mt-1">Real Estate Engine</span>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <UserMenu user={user} />

          </div>
        </div>
      </div>
    </nav>
  );
}
