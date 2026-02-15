'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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
}

// ... existing interfaces ...

export async function submitInquiry(payload: {
    advisor_id: string;
    property_id: string;
    client_name: string;
    client_email: string;
    client_phone: string;
    message: string;
    property_title: string;
}) {
    const supabase = await createClient();
    
    // 1. Get the 'prospecto' stage ID
    const { data: stage } = await supabase
        .from('kanban_stages')
        .select('id')
        .eq('slug', 'prospecto')
        .single();
    
    if (!stage) throw new Error('Stage "prospecto" not found');

    // 2. Get max order_index for this advisor in that stage
    const { data: lastLead } = await supabase
        .from('leads')
        .select('order_index')
        .eq('advisor_id', payload.advisor_id)
        .eq('stage_id', stage.id)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle();

    const nextOrderIndex = (lastLead?.order_index ?? -1) + 1;

    const { data: { user } } = await supabase.auth.getUser();

    // 3. Insert the Lead
    const { error } = await supabase
        .from('leads')
        .insert({
            advisor_id: payload.advisor_id,
            property_id: payload.property_id,
            stage_id: stage.id,
            title: `Interés: ${payload.property_title}`,
            client_name: payload.client_name,
            client_email: payload.client_email,
            client_phone: payload.client_phone,
            client_contact: payload.client_email,
            message: payload.message,
            order_index: nextOrderIndex,
            priority: 'medium',
            created_by: user?.id || null,
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.error('Error submitting inquiry:', error);
        throw error;
    }

    // Revalidate the pipeline for the advisor
    revalidatePath('/advisor/pipeline');
    revalidatePath('/advisor/dashboard');
    
    return { success: true };
}

export interface KanbanStageWithLeads {
    id: string;
    name: string;
    slug: string;
    color: string;
    order_index: number;
    tasks: Lead[];
}

export async function getKanbanData() {
    const supabase = await createClient();
    
    // 1. Get Stages
    const { data: stages, error: stagesError } = await supabase
        .from('kanban_stages')
        .select('*')
        .order('order_index', { ascending: true });

    if (stagesError) throw stagesError;

    // 2. Get User Leads
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('advisor_id', user.id)
        .order('order_index', { ascending: true });

    if (leadsError) throw leadsError;

    // 3. Combine
    const kanbanData: KanbanStageWithLeads[] = (stages || []).map(stage => ({
        ...stage,
        tasks: (leads || []).filter(lead => lead.stage_id === stage.id)
    }));

    return kanbanData;
}

export async function createLead(payload: Omit<Lead, 'id' | 'advisor_id' | 'created_at' | 'order_index' | 'updated_at'>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Get max order_index for the stage
    const { data: lastLead } = await supabase
        .from('leads')
        .select('order_index')
        .eq('advisor_id', user.id)
        .eq('stage_id', payload.stage_id)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle();

    const newOrderIndex = (lastLead?.order_index ?? -1) + 1;

    const { data, error } = await supabase
        .from('leads')
        .insert({
            ...payload,
            advisor_id: user.id,
            order_index: newOrderIndex,
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) throw error;
    
    revalidatePath('/advisor/pipeline');
    return data;
}

export async function updateLeadsOrder(stageId: string, leadIds: string[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Sequential updates to avoid potential conflicts
    for (let i = 0; i < leadIds.length; i++) {
        const { error } = await supabase
            .from('leads')
            .update({ 
                order_index: i, 
                stage_id: stageId,
                updated_at: new Date().toISOString()
            })
            .eq('id', leadIds[i])
            .eq('advisor_id', user.id);
        
        if (error) throw error;
    }

    revalidatePath('/advisor/pipeline');
}

export async function moveLead(leadId: string, sourceStageId: string, targetStageId: string, leadIdsInTarget: string[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // 1. Move the specific lead first
    const { error: moveError } = await supabase
        .from('leads')
        .update({ 
            stage_id: targetStageId,
            updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .eq('advisor_id', user.id);

    if (moveError) throw moveError;

    // 2. Update orders in target column
    for (let i = 0; i < leadIdsInTarget.length; i++) {
        const { error } = await supabase
            .from('leads')
            .update({ 
                order_index: i, 
                stage_id: targetStageId,
                updated_at: new Date().toISOString()
            })
            .eq('id', leadIdsInTarget[i])
            .eq('advisor_id', user.id);
        if (error) throw error;
    }

    // 3. Re-index source column to close gap
    const { data: sourceLeads } = await supabase
        .from('leads')
        .select('id')
        .eq('advisor_id', user.id)
        .eq('stage_id', sourceStageId)
        .order('order_index', { ascending: true });

    if (sourceLeads) {
        for (let i = 0; i < sourceLeads.length; i++) {
            await supabase
                .from('leads')
                .update({ order_index: i })
                .eq('id', sourceLeads[i].id)
                .eq('advisor_id', user.id);
        }
    }

    revalidatePath('/advisor/pipeline');
}

export async function updateLead(leadId: string, payload: Partial<Omit<Lead, 'id' | 'advisor_id' | 'created_at'>>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    
    const { data, error } = await supabase
        .from('leads')
        .update({
            ...payload,
            updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .eq('advisor_id', user.id)
        .select()
        .single();

    if (error) throw error;
    revalidatePath('/advisor/pipeline');
    return data;
}

export async function deleteLead(leadId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    
    const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId)
        .eq('advisor_id', user.id);

    if (error) throw error;
    revalidatePath('/advisor/pipeline');
}

export async function getWeeklyVisits() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get the UUID for the 'visita' stage
    const { data: stage } = await supabase
        .from('kanban_stages')
        .select('id')
        .eq('slug', 'visita')
        .single();

    if (!stage) return [];

    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .eq('advisor_id', user.id)
        .eq('stage_id', stage.id)
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return leads;
}

export async function getPendingLeads() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get the UUID for the 'prospecto' stage
    const { data: stage } = await supabase
        .from('kanban_stages')
        .select('id')
        .eq('slug', 'prospecto')
        .single();

    if (!stage) return [];

    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .eq('advisor_id', user.id)
        .eq('stage_id', stage.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return leads;
}

export async function getAdvisorLeads() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: leads, error } = await supabase
        .from('leads')
        .select('*, property:properties(title, address)')
        .eq('advisor_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    
    return leads.map(lead => ({
        id: lead.id,
        senderName: lead.client_name,
        senderEmail: lead.client_email || lead.client_contact || '',
        senderPhone: lead.client_phone || '',
        propertyTitle: (lead as any).property?.title || (lead as any).property?.address || lead.title || 'Propiedad no especificada',
        message: lead.message || lead.title,
        status: lead.stage_id ? 'new' : 'archived', // Basic mapping
        timestamp: new Date(lead.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
        hasNew: true,
        propertyId: lead.property_id
    }));
}

export async function getUserInquiries() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: leads, error } = await supabase
        .from('leads')
        .select('*, property:properties(title, address), advisor:profiles!leads_advisor_id_fkey(full_name)')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    
    return leads.map(lead => ({
        id: lead.id,
        senderName: (lead as any).advisor?.full_name || 'Asesor Asignado',
        senderEmail: '', // Usually we don't show advisor email directly unless replied
        senderPhone: '',
        propertyTitle: (lead as any).property?.title || (lead as any).property?.address || lead.title || 'Propiedad de interés',
        message: lead.message || lead.title,
        status: lead.stage_id ? 'sent' : 'archived',
        timestamp: new Date(lead.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
        hasNew: false,
        propertyId: lead.property_id
    }));
}
