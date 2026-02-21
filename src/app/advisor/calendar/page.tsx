import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getAdvisorAppointments } from '@/app/actions/appointments';
import AdvisorCalendarView from '@/components/advisor/AdvisorCalendarView';
import { Calendar as CalendarIcon, Target } from 'lucide-react';

export default async function AdvisorCalendarPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'asesor' && profile?.role !== 'superadmin') {
        return redirect('/my-properties');
    }

    // Consultamos directamente la tabla de Appointments para el calendario
    const appointments = await getAdvisorAppointments();

    return (
        <main className="min-h-screen bg-slate-50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent -z-10" />
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div className="flex-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest mb-4 border border-indigo-200">
                            <Target size={12} />
                            Gestión de Calendario
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter text-slate-900 sm:text-5xl lg:text-5xl leading-[0.9]">
                            Calendario de <span className="text-indigo-600">Visitas</span>
                        </h1>
                        <p className="mt-4 text-slate-500 font-medium max-w-2xl text-lg">
                            Visualiza y gestiona todas tus citas, recorridos y reuniones agendadas con clientes.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <CalendarIcon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Programadas</p>
                            <p className="text-xl font-black text-slate-900 leading-tight">{appointments.length} Citas</p>
                        </div>
                    </div>
                </div>

                {/* Calendar Component Wrapper */}
                <div className="mt-8">
                    <AdvisorCalendarView appointments={appointments} />
                </div>
                
                <footer className="mt-20 pt-8 border-t border-slate-200 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                   HouseApp Advisor Ecosystem • Empowering Real Estate Experts
                </footer>
            </div>
            
            {/* Some CSS tweaks to make react-big-calendar match our tailwind app */}
            <style dangerouslySetInnerHTML={{__html: `
                .calendar-container .rbc-calendar {
                    border: none;
                }
                .calendar-container .rbc-toolbar button {
                    border: 1px solid #e2e8f0;
                    border-radius: 0.75rem;
                    padding: 0.5rem 1rem;
                    color: #475569;
                    font-weight: 700;
                    margin-left: 0.25rem;
                }
                .calendar-container .rbc-toolbar button:hover {
                    background-color: #f8fafc;
                }
                .calendar-container .rbc-toolbar button.rbc-active {
                    background-color: #e0e7ff;
                    color: #4f46e5;
                    border-color: #c7d2fe;
                    box-shadow: none;
                }
                .calendar-container .rbc-today {
                    background-color: #f0fdf4 !important;
                }
                .calendar-container .rbc-event {
                    border-radius: 8px;
                }
                .calendar-container .rbc-header {
                    font-size: 0.75rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    padding: 1rem 0;
                    color: #64748b;
                    border-bottom: 2px solid #f1f5f9;
                }
                .calendar-container .rbc-month-view,
                .calendar-container .rbc-time-view,
                .calendar-container .rbc-agenda-view {
                    border: 1px solid #f1f5f9;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                }
            `}} />
        </main>
    );
}
