import Link from 'next/link';
import MiniCalculator from '@/app/components/MiniCalculator';
import GoogleLoginButton from '@/app/components/GoogleLoginButton';
import { 
  ArrowRight, 
  BarChart3, 
  Map, 
  ShieldCheck, 
  Search, 
  TrendingUp, 
  Users, 
  MessageSquare,
  ChevronRight,
  Zap,
  Globe
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-white relative overflow-hidden font-sans">
      {/* Decorative background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-50 rounded-full blur-[120px] opacity-60 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-50 rounded-full blur-[120px] opacity-60 pointer-events-none" />

      {/* 1. HERO SECTION */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-48 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
            
            {/* Value Proposition */}
            <div className="space-y-12">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 font-black text-[10px] uppercase tracking-widest animate-fade-in">
                  <Zap size={14} className="fill-indigo-600" />
                  La nueva era de inversión inmobiliaria
                </div>
                
                <h1 className="text-6xl lg:text-8xl font-black text-slate-900 leading-[1] tracking-tight">
                  Invierte con <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900">Certeza Absoluta.</span>
                </h1>
                
                <p className="text-xl text-slate-500 max-w-xl leading-relaxed font-medium">
                  Combinamos <span className="text-slate-900 font-bold italic">datos en tiempo real</span> con <span className="text-slate-900 font-bold italic">asesoría experta</span> para que cada decisión inmobiliaria sea un acierto financiero.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                {user ? (
                  <Link 
                    href="/advisor/dashboard"
                    className="inline-flex items-center justify-center px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-slate-900/40 hover:bg-black hover:scale-105 transition-all duration-300 group"
                  >
                    Ir a Mi Consola
                    <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <Link 
                    href="/calculator"
                    className="inline-flex items-center justify-center px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-slate-900/40 hover:bg-black hover:scale-105 transition-all duration-300 group"
                  >
                    Analizar Propiedad
                    <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
                <Link 
                  href="/map"
                  className="inline-flex items-center justify-center px-10 py-5 bg-white text-slate-900 border-2 border-slate-100 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-slate-50 hover:border-slate-200 transition-all duration-300"
                >
                  Explorar Mapa
                </Link>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Inversor" />
                    </div>
                  ))}
                </div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  <span className="text-slate-900 font-black">+500 Inversores</span> confían en HouseApp
                </div>
              </div>
            </div>

            {/* Visual: Mini Calculator Container */}
            <div className="relative group">
              <div className="absolute -inset-10 bg-gradient-to-tr from-blue-600/10 to-transparent blur-[100px] rounded-full group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 scale-110 lg:scale-[1.2]">
                <MiniCalculator />
              </div>
              
              {/* Floating feature pills */}
              <div className="hidden lg:block absolute -right-12 top-20 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white animate-bounce-slow">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><TrendingUp size={16} /></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase">ROI Promedio</span>
                    <span className="text-sm font-black text-slate-900">8.4% Anual</span>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block absolute -left-12 bottom-20 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white animate-bounce-slow" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><ShieldCheck size={16} /></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Riesgo</span>
                    <span className="text-sm font-black text-slate-900">Nivel Bajo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS BAR */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: 'Propiedades Analizadas', value: '1.2k+' },
            { label: 'Aditamentos Realizados', value: 'Colombia' },
            { label: 'Tiempo de Análisis', value: '< 10s' },
            { label: 'Precisión de Datos', value: '99.4%' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl lg:text-4xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. SOLUTION PILLARS */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em]">Nuestra Tecnología</h2>
            <h3 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">Todo lo que necesitas para ganar.</h3>
            <p className="text-slate-500 font-medium">Diseñamos una herramienta que automatiza lo complejo y simplifica lo rentable.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <BarChart3 className="text-blue-600" />,
                title: 'Data Inmobiliaria',
                desc: 'Predicción de rentabilidad (Cap Rate y Yield) basada en el mercado real de la zona.',
                color: 'bg-blue-50'
              },
              {
                icon: <Globe className="text-indigo-600" />,
                title: 'Mapa de Calor',
                desc: 'Identifica zonas de alta valorización y "perlas" inmobiliarias antes que nadie.',
                color: 'bg-indigo-50'
              },
              {
                icon: <Users className="text-emerald-600" />,
                title: 'Asesoría VIP',
                desc: 'Conexión humana con expertos locales que validan cada paso de tu compra.',
                color: 'bg-emerald-50'
              }
            ].map((f, i) => (
              <div key={i} className="p-10 rounded-[2.5rem] bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 group">
                <div className={`w-16 h-16 ${f.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h4 className="text-xl font-black text-slate-900 mb-4 tracking-tight">{f.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12">
              <h3 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                De la curiosidad a la <br />
                <span className="text-indigo-600">rentabilidad</span> en 3 pasos.
              </h3>
              
              <div className="space-y-8">
                {[
                  { step: '01', title: 'Calcula el Potencial', desc: 'Ingresa el precio y renta estimada. Deja que nuestro algoritmo haga el trabajo sucio.' },
                  { step: '02', title: 'Valida en el Mapa', desc: 'Visualiza la propiedad en su entorno real y compárala con el promedio del sector.' },
                  { step: '03', title: 'Cierra con Expertos', desc: 'Contacta a un asesor dedicado que te acompañará en las visitas y negociación.' }
                ].map((s, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="text-3xl font-black text-indigo-100 flex-shrink-0">{s.step}</div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 mb-1">{s.title}</h4>
                      <p className="text-slate-500 font-medium text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-[3rem] shadow-2xl border border-slate-100 rotate-2 hover:rotate-0 transition-transform duration-700">
               <img 
                 src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1073&q=80" 
                 alt="App Dashboard" 
                 className="rounded-[2.5rem]"
               />
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA SECTION */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[3rem] p-12 lg:p-24 text-center relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
            
            <div className="relative z-10 max-w-2xl mx-auto space-y-10">
              <h3 className="text-4xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                ¿Listo para tu próxima gran inversión?
              </h3>
              <p className="text-slate-300 text-lg font-medium opacity-80">
                Tu primera propiedad analizada es totalmente gratis. Empieza hoy mismo.
              </p>
              
              <div className="flex flex-col items-center gap-8">
                <Link 
                  href="/calculator"
                  className="w-full max-w-[280px] py-5 bg-white text-slate-900 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-50 hover:scale-105 transition-all duration-300 flex items-center justify-center"
                >
                  Empezar Ahora
                </Link>
                
                {!user && (
                   <div className="animate-fade-in w-full max-w-[280px]">
                      <div className="flex items-center gap-4 mb-8">
                          <div className="h-px bg-white/20 flex-1"></div>
                          <span className="text-white/40 text-[9px] uppercase font-black tracking-widest whitespace-nowrap">O entra con tu cuenta</span>
                          <div className="h-px bg-white/20 flex-1"></div>
                      </div>
                      <GoogleLoginButton className="w-full py-5 bg-white text-slate-900 rounded-[2rem] font-black text-sm uppercase tracking-[0.1em] shadow-2xl hover:bg-slate-50 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 border-none" />
                   </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-100 text-center">
         <div className="flex flex-col items-center gap-2">
            <div className="bg-slate-900 text-white rounded-xl h-8 w-8 flex items-center justify-center font-black text-xs">HA</div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">HouseApp Engine v2.0</span>
            <span className="text-[10px] font-bold text-slate-300">Entregando datos reales para decisiones reales. © 2026</span>
         </div>
      </footer>
    </main>
  );
}
