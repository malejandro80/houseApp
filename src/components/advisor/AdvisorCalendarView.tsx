'use client';

import { Calendar, dateFnsLocalizer, Event as CalendarEvent, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfDay, isBefore } from 'date-fns';
import { useState } from 'react';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Lead } from '@/common/types/leads';
import { useRouter } from 'next/navigation';

const locales = {
  'es': es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})

interface VisitEvent extends CalendarEvent {
    title: string;
    start: Date;
    end: Date;
    resource: Lead;
}

export default function AdvisorCalendarView({ visits }: { visits: Lead[] }) {
    const router = useRouter();
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date());

    const events: VisitEvent[] = visits.map(visit => {
        // En ausencia de un campo específico para la cita de la vista en 'Leads', 
        // usamos la convención que ya establecimos para la DashboardQuickView (updated_at)
        const date = new Date(visit.updated_at);
        return {
            title: visit.title,
            start: date,
            end: new Date(date.getTime() + 60 * 60 * 1000), // Asumimos 1 hora
            resource: visit
        };
    });

    const handleSelectEvent = (event: VisitEvent) => {
        router.push(`/advisor/inbox?id=${event.resource.id}`);
    };

    const customDayPropGetter = (date: Date) => {
        const now = startOfDay(new Date());
        const dayDate = startOfDay(date);
        
        if (isBefore(dayDate, now)) {
            return {
                className: 'opacity-50',
                style: {
                    pointerEvents: 'none' as const, // Prevents clicking the day entirely
                    backgroundColor: '#f8fafc',     // slate-50
                }
            };
        }
        return {};
    };

    return (
        <div className="bg-white p-4 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-[750px] overflow-hidden calendar-container">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%', fontFamily: 'inherit' }}
                messages={{
                    next: "Sig",
                    previous: "Ant",
                    today: "Hoy",
                    month: "Mes",
                    week: "Semana",
                    day: "Día",
                    showMore: (total: number) => `+${total} más`
                }}
                culture='es'
                view={view}
                onView={(v) => setView(v)}
                date={date}
                onNavigate={(d) => setDate(d)}
                onSelectEvent={handleSelectEvent}
                views={['month', 'week', 'day']}
                dayPropGetter={customDayPropGetter}
                eventPropGetter={(event: VisitEvent) => {
                    return {
                        className: 'bg-indigo-600 border-none rounded-lg shadow-sm font-bold text-xs px-2 py-1',
                        style: {
                            backgroundColor: '#4f46e5',
                            color: 'white',
                            borderRadius: '8px',
                            border: 'none',
                        }
                    }
                }}
            />
        </div>
    );
}
