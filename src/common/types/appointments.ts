export interface Appointment {
    id: string;
    advisor_id: string;
    lead_id?: string;
    title: string;
    scheduled_date: string;
    duration_minutes: number;
    type: 'visit' | 'block' | 'meeting';
    status: 'scheduled' | 'rescheduled' | 'cancelled' | 'completed';
    created_at: string;
    updated_at: string;
    lead?: {
        id: string;
        client_name: string;
        client_phone?: string;
        address_reference?: string;
    };
}
