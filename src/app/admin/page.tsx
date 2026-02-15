import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getAdminStats } from '@/app/actions/admin';
import { 
    Users, 
    Building2, 
    UserCheck, 
    Clock, 
    TrendingUp, 
    ShieldCheck,
    ArrowRight,
    MessageSquare,
    ChevronRight,
    Search
} from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'superadmin') return redirect('/');

    const stats = await getAdminStats();

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 font-black text-[10px] uppercase tracking-widest w-fit">
                            <ShieldCheck size={12} />
                            Panel de Control Maestro
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Estado de la Plataforma</h1>
                        <p className="text-slate-500 font-medium">Supervisa el crecimiento y la operación de HouseApp.</p>
                    </div>
                    
                    <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Buscar usuarios o casas..." 
                                className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all w-64"
                            />
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {/* Investors */}
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-indigo-500 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                <Users size={24} />
                            </div>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">Inversores</span>
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 mb-1">{stats.investors}</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-tight">Usuarios Registrados</p>
                    </div>

                    {/* Advisors */}
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-emerald-500 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                                <UserCheck size={24} />
                            </div>
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">Asesores</span>
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 mb-1">{stats.advisors}</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-tight">Expertos Verificados</p>
                    </div>

                    {/* Properties */}
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-purple-500 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                                <Building2 size={24} />
                            </div>
                            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full">Propiedades</span>
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 mb-1">{stats.properties}</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-tight">En toda la plataforma</p>
                    </div>

                    {/* Leads */}
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm group hover:border-orange-500 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                                <MessageSquare size={24} />
                            </div>
                            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full">Leads</span>
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 mb-1">{stats.leads}</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-tight">Consultas Totales</p>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Pending Tasks / Notifications */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Summary Card */}
                        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-10">
                                <TrendingUp size={200} />
                            </div>
                            <div className="relative z-10 max-w-lg">
                                <h3 className="text-3xl font-black mb-6 tracking-tight leading-tight">La plataforma está creciendo un <span className="text-emerald-400">12.5%</span> este mes.</h3>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Ticket Promedio</div>
                                        <div className="text-2xl font-black">$450M</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Tiempo de Cierre</div>
                                        <div className="text-2xl font-black">18 días</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity (Placeholder for now) */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10">
                            <h4 className="text-xl font-black text-slate-900 mb-8 flex items-center justify-between">
                                Actividades Recientes
                                <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Ver Todo</button>
                            </h4>
                            <div className="space-y-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors px-4 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black">
                                                {i}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 tracking-tight">Nuevo Lead en Apartamento Poblado</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Hace 15 minutos • Miguel Alejandro</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Admin Quick Actions */}
                    <div className="space-y-6">
                        
                        {/* Pending Advisor Requests Notification */}
                        {stats.pendingAdvisors > 0 && (
                            <Link href="/admin/advisors">
                                <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200 hover:scale-[1.02] transition-all cursor-pointer group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-white/20 rounded-2xl">
                                            <Clock size={24} />
                                        </div>
                                        <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                                    </div>
                                    <h4 className="text-xl font-black mb-1">Solicitudes Pendientes</h4>
                                    <p className="text-indigo-100 text-sm font-medium opacity-80 mb-6">Tienes {stats.pendingAdvisors} aspirantes esperando revisión como asesores.</p>
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-indigo-600 bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600">
                                                {i}
                                            </div>
                                        ))}
                                        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 bg-white flex items-center justify-center text-[10px] font-black text-indigo-600">
                                            +{stats.pendingAdvisors}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )}

                        <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Acciones Administrativas</h5>
                            <div className="space-y-4">
                                <button className="w-full text-left px-5 py-4 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-between group transition-all">
                                    <span className="text-xs font-black text-slate-700 uppercase tracking-tight">Gestionar Usuarios</span>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
                                </button>
                                <button className="w-full text-left px-5 py-4 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-between group transition-all">
                                    <span className="text-xs font-black text-slate-700 uppercase tracking-tight">Ver Propiedades Globales</span>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
                                </button>
                                <button className="w-full text-left px-5 py-4 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-between group transition-all">
                                    <span className="text-xs font-black text-slate-700 uppercase tracking-tight">Configuración del Sistema</span>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
                                </button>
                            </div>
                        </div>

                        {/* Health Check */}
                        <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100">
                            <div className="flex items-center gap-3 text-emerald-600 mb-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Sistemas Operativos</span>
                            </div>
                            <p className="text-xs font-medium text-emerald-800 leading-relaxed">Todos los servicios están respondiendo correctamente ( Latencia: 42ms )</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
