import Link from "next/link";
import { Map as MapIcon } from "lucide-react";
import PropertyForm from "./components/PropertyForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Calculadora de Inversiones Inmobiliarias
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Evalúa rápidamente si una propiedad es una buena oportunidad de inversión basándote en su rentabilidad estimada.
          </p>
          <div className="mt-8">
            <Link href="/mapa" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <MapIcon className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
              Ver Mapa de Propiedades
            </Link>
          </div>
        </div>
        
        <PropertyForm />
        
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} HouseApp. Todos los derechos reservados.</p>
        </footer>
      </div>
    </main>
  );
}
