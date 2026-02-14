
import Link from 'next/link';
import MiniCalculator from '@/app/components/MiniCalculator';
import GoogleLoginButton from '@/app/components/GoogleLoginButton';
import { ArrowRight, BarChart3, Map, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-100 relative overflow-hidden font-sans">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left Column: Value Prop */}
          <div className="space-y-10">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
                Invierte con <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Datos</span>, no solo con intuición.
              </h1>
              
              <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
                Analiza rentabilidad, riesgo y potencial de valorización en segundos. La herramienta definitiva para inversores inmobiliarios modernos.
              </p>
            </div>

            <div className="space-y-5">
               <div className="flex items-center gap-4">
                 <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-blue-100 rounded-2xl text-blue-600 shadow-sm">
                   <BarChart3 size={24} />
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-900">Análisis Financiero Instantáneo</h3>
                   <p className="text-sm text-gray-500">Calcula Cap Rate, ROI y Yield Bruto automáticamente.</p>
                 </div>
               </div>
               
               <div className="flex items-center gap-4">
                 <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-indigo-100 rounded-2xl text-indigo-600 shadow-sm">
                   <Map size={24} />
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-900">Inteligencia de Ubicación</h3>
                   <p className="text-sm text-gray-500">Mapas de calor de precios y tendencias por zona.</p>
                 </div>
               </div>

               <div className="flex items-center gap-4">
                 <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-green-100 rounded-2xl text-green-600 shadow-sm">
                   <ShieldCheck size={24} />
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-900">Matriz de Riesgos 360°</h3>
                   <p className="text-sm text-gray-500">Evalúa factores legales, físicos y de entorno.</p>
                 </div>
               </div>
            </div>

            <div className="flex flex-col gap-6 pt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/calculator"
                  className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-xl hover:bg-blue-700 hover:scale-105 hover:shadow-2xl transition-all duration-300 group"
                >
                  Agregar Propiedad
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </Link>
                <Link 
                  href="/map"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-800 border border-gray-200 rounded-xl font-bold text-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-300"
                >
                  Explorar Mapa
                </Link>
              </div>

              {!user && (
                 <div className="w-full sm:w-auto animate-fade-in">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="h-px bg-gray-300 flex-1"></div>
                        <span className="text-gray-400 text-xs uppercase font-bold tracking-widest">O accede directamente</span>
                        <div className="h-px bg-gray-300 flex-1"></div>
                    </div>
                    <GoogleLoginButton />
                 </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-400 font-medium pl-1">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               Optimizado para el mercado inmobiliario actual
            </div>
          </div>

          {/* Right Column: Mini Calculator */}
          <div className="relative flex justify-center lg:justify-end">
             {/* Decorative blob behind calculator */}
             <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-3xl rounded-full transform scale-90" />
             <div className="relative z-10 w-full max-w-md">
                <MiniCalculator />
             </div>
          </div>

        </div>
      </div>
    </main>
  );
}
