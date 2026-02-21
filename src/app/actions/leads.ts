'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

import { Lead, KanbanStageWithLeads, LeadMessage } from '@/common/types/leads';

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

// KanbanStageWithLeads imported from common/types

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

export async function getWeeklyVisits(): Promise<Lead[]> {
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
    return leads as Lead[];
}

export async function getPendingLeads(): Promise<Lead[]> {
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
    return leads as Lead[];
}

export async function getAdvisorLeads(): Promise<LeadMessage[]> {
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
        status: (lead.metadata && lead.metadata.read_by_advisor === true) ? 'replied' : (lead.stage_id ? 'new' : 'archived'),
        timestamp: new Date(lead.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
        hasNew: !(lead.metadata && lead.metadata.read_by_advisor === true),
        propertyId: lead.property_id
    }));
}

export async function getUserInquiries(): Promise<LeadMessage[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    try {
        const { data: leads, error } = await supabase
            .from('leads')
            .select('*, property:properties(title, address)')
            .eq('created_by', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase getUserInquiries error:', error);
            throw error;
        }

        const advisorIds = Array.from(new Set(leads.map(l => l.advisor_id).filter(Boolean)));
        let profileMap: Record<string, string> = {};
        
        if (advisorIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', advisorIds);
                
            if (profiles) {
                profileMap = profiles.reduce((acc, p) => {
                    acc[p.id] = p.full_name || 'Asesor Asignado';
                    return acc;
                }, {} as Record<string, string>);
            }
        }

        return leads.map(lead => ({
            id: lead.id,
            senderName: profileMap[lead.advisor_id] || 'Asesor Asignado',
            senderEmail: '',
            senderPhone: '',
            propertyTitle: (lead as any).property?.title || (lead as any).property?.address || lead.title || 'Propiedad de interés',
            message: lead.message || lead.title,
            status: (lead.metadata && lead.metadata.read_by_user === true) ? 'sent' : 'replied',
            timestamp: new Date(lead.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
            hasNew: !(lead.metadata && lead.metadata.read_by_user === true),
            propertyId: lead.property_id
        }));
    } catch (err: any) {
        console.error('Server Action getUserInquiries failed:', err);
        try {
            const { createClient: createSupClient } = require('@supabase/supabase-js');
            const admin = createSupClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
            await admin.from('error_logs').insert({ 
                user_id: user?.id,
                context: 'getUserInquiries',
                message: err?.message || JSON.stringify(err),
                stack_trace: err?.stack || '',
                environment: process.env.NODE_ENV
            });
        } catch {}
        throw err;
    }
}

export async function scheduleVisit(leadId: string, scheduledDate: Date) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Get 'visita' stage
    const { data: stage } = await supabase
        .from('kanban_stages')
        .select('id')
        .eq('slug', 'visita')
        .single();
    if (!stage) throw new Error('Stage not found');

    const { error } = await supabase
        .from('leads')
        .update({
            stage_id: stage.id,
            updated_at: scheduledDate.toISOString(),
        })
        .eq('id', leadId);
        
    if (error) throw error;
    revalidatePath('/advisor/pipeline');
    revalidatePath('/advisor/calendar');
    revalidatePath('/advisor/inbox');
    revalidatePath('/my-properties/messages');
}

export async function markLeadAsRead(leadId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    const { data: lead, error: fetchErr } = await supabase
        .from('leads')
        .select('metadata, advisor_id, created_by')
        .eq('id', leadId)
        .single();

    if (fetchErr || !lead) return { success: false };

    // Check permissions
    if (lead.advisor_id !== user.id && lead.created_by !== user.id) return { success: false };

    const roleKey = lead.advisor_id === user.id ? 'read_by_advisor' : 'read_by_user';
    
    // Only update if not already read
    const currentMetadata = lead.metadata || {};
    if (currentMetadata[roleKey] === true) {
        return { success: true };
    }

    const newMetadata = { ...currentMetadata, [roleKey]: true };

    const { error: updateErr } = await supabase
        .from('leads')
        .update({ metadata: newMetadata })
        .eq('id', leadId);

    if (!updateErr) {
        revalidatePath('/advisor/inbox');
        revalidatePath('/my-properties/messages');
        return { success: true };
    }
    return { success: false };
}

export async function getLeadMessages(leadId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    try {

        const { data, error } = await supabase
            .from('lead_messages')
            .select(`
                id,
                message,
                created_at,
                sender_id
            `)
            .eq('lead_id', leadId)
            .order('created_at', { ascending: true });
            
        if (error) {
            console.error('getLeadMessages err:', error);
            return [];
        }
        return data;
    } catch (e: any) {
        try {
            const { createClient: createSupClient } = require('@supabase/supabase-js');
            const admin = createSupClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
            await admin.from('error_logs').insert({ 
                user_id: user?.id,
                context: 'getLeadMessages',
                message: e?.message || JSON.stringify(e),
                stack_trace: e?.stack || '',
                environment: process.env.NODE_ENV
            });
        } catch {}
        throw e;
    }
}

export async function sendChatMessage(leadId: string, message: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    try {
        
        // insert message
        const { error } = await supabase
            .from('lead_messages')
            .insert({
                lead_id: leadId,
                sender_id: user.id,
                message: message
            });
            
        if (error) throw error;
        
        // update lead metadata so it shows as unread for the OTHER party
        const { data: lead } = await supabase.from('leads').select('advisor_id, created_by, metadata').eq('id', leadId).single();
        if (lead) {
            const isAdvisor = lead.advisor_id === user.id;
            const currentMetadata = lead.metadata || {};
            
            if (isAdvisor) {
                currentMetadata.read_by_user = false;
            } else {
                currentMetadata.read_by_advisor = false;
            }
            
            const { error: updateError } = await supabase.from('leads').update({
                metadata: currentMetadata,
                updated_at: new Date().toISOString()
            }).eq('id', leadId);
            
            if (updateError) throw updateError;
        }
        
    } catch (e: any) {
        try {
            const { createClient: createSupClient } = require('@supabase/supabase-js');
            const admin = createSupClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
            await admin.from('error_logs').insert({ 
                user_id: user?.id,
                context: 'sendChatMessage',
                message: e?.message || JSON.stringify(e),
                stack_trace: e?.stack || '',
                environment: process.env.NODE_ENV
            });
        } catch {}
        throw e;
    }
}

