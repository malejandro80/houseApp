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
        </div>
        
        <PropertyForm />
        
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} HouseApp. Todos los derechos reservados.</p>
        </footer>
      </div>
    </main>
  );
}
