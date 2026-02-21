export interface Lead {
    id: string;
    advisor_id: string;
    property_id?: string;
    title: string;
    client_name: string;
    client_contact?: string;
    client_email?: string;
    client_phone?: string;
    message?: string;
    address_reference?: string;
    estimated_value?: number;
    priority: 'low' | 'medium' | 'high';
    stage_id: string;
    order_index: number;
    created_at: string;
    updated_at: string;
    scheduled_date?: string;
}

export interface KanbanStageWithLeads {
    id: string;
    name: string;
    slug: string;
    color: string;
    order_index: number;
    tasks: Lead[];
}

export interface LeadMessage {
    id: string;
    senderName: string;
    senderEmail: string;
    senderPhone: string;
    propertyTitle: string;
    message: string;
    status: 'new' | 'replied' | 'archived' | 'sent';
    timestamp: string;
    hasNew: boolean;
    propertyId?: string;
    sender_id?: string;
    receiver_id?: string;
    advisorId?: string;
    scheduledDate?: string;
}
