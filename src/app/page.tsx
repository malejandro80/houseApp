
import PropertyForm from "./components/PropertyForm";
import HeroSection from "./components/HeroSection";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <HeroSection />
        
        <PropertyForm user={user} />
        
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} HouseApp. Todos los derechos reservados.</p>
        </footer>
      </div>
    </main>
  );
}
