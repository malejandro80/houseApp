'use client';

import { Calendar, dateFnsLocalizer, Event as CalendarEvent, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfDay, isBefore } from 'date-fns';
import { useState } from 'react';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Appointment } from '@/common/types/appointments';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    resource: Appointment;
}

export default function AdvisorCalendarView({ appointments }: { appointments: Appointment[] }) {
    const router = useRouter();
    const [view, setView] = useState<View>(Views.MONTH);
    const [date, setDate] = useState(new Date());

    const events: VisitEvent[] = appointments.map(appt => {
        const date = new Date(appt.scheduled_date);
        return {
            title: appt.title,
            start: date,
            end: new Date(date.getTime() + (appt.duration_minutes || 60) * 60 * 1000), // Default 1 hr if missing
            resource: appt
        };
    });

    const handleSelectEvent = (event: VisitEvent) => {
        if (event.resource.lead_id) {
            router.push(`/advisor/inbox?id=${event.resource.lead_id}`);
        }
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
                    next: <ChevronRight size={18} />,
                    previous: <ChevronLeft size={18} />,
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
