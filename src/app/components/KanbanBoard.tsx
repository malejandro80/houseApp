'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MoreHorizontal, 
    Plus, 
    User, 
    MapPin, 
    Calendar,
    Search,
    GripVertical,
    X,
    Loader2,
    Edit2,
    Trash2,
    Mail,
    MessageCircle
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  DragOverEvent,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  DropAnimation,
  defaultDropAnimationSideEffects,
  pointerWithin,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { 
    getKanbanData,
    createLead,
    updateLeadsOrder,
    moveLead,
    updateLead,
    deleteLead,
    KanbanStageWithLeads,
    Lead
} from '@/app/actions/leads';
import { logClientError } from '@/lib/logger-client';

export default function KanbanBoard() {
    const [columns, setColumns] = useState<KanbanStageWithLeads[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTask, setActiveTask] = useState<Lead | null>(null);
    const [initialStageId, setInitialStageId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTaskColumnId, setNewTaskColumnId] = useState<string | null>(null);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Initial Fetch
    const fetchData = useCallback(async () => {
        try {
            const data = await getKanbanData();
            setColumns(data);
        } catch (error) {
            logClientError(error, 'KanbanBoard.fetchData');
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const task = columns.flatMap(col => col.tasks).find(t => t.id === active.id);
        if (task) {
            setActiveTask(task);
            setInitialStageId(task.stage_id);
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id.toString();
        const overId = over.id.toString();

        const activeColumn = columns.find(col => col.tasks.some(t => t.id === activeId));
        const overColumn = columns.find(col => col.id === overId || col.tasks.some(t => t.id === overId));

        if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) return;

        setColumns(prev => {
            const currentActiveCol = prev.find(col => col.tasks.some(t => t.id === activeId));
            const currentOverCol = prev.find(col => col.id === overId || col.tasks.some(t => t.id === overId));

            if (!currentActiveCol || !currentOverCol) return prev;

            const activeTasks = [...currentActiveCol.tasks];
            const overTasks = [...currentOverCol.tasks];

            const activeIndex = activeTasks.findIndex(t => t.id === activeId);
            const overIndex = overTasks.findIndex(t => t.id === overId);

            if (activeIndex === -1) return prev;

            let newIndex: number;
            
            // If dropping on the column container itself
            if (prev.some(col => col.id === overId)) {
                newIndex = overTasks.length; // Append to end
            } else {
                // If dropping over another item
                const isBelowOverItem =
                  over &&
                  active.rect.current.translated &&
                  active.rect.current.translated.top >
                    over.rect.top + over.rect.height;
        
                const modifier = isBelowOverItem ? 1 : 0;
        
                newIndex = overIndex >= 0 ? overIndex + modifier : overTasks.length + 1;
            }

            // Remove from source
            const [movedTask] = activeTasks.splice(activeIndex, 1);
            if (!movedTask) return prev; // Safety check

            // Update stage_id immediately for the UI
            const updatedTask = { ...movedTask, stage_id: currentOverCol.id };
            
            // Add to target
            // Ensure we don't go out of bounds (though splice handles it)
            // If newIndex > length, splice appends.
            overTasks.splice(newIndex, 0, updatedTask);

            return prev.map(col => {
                if (col.id === currentActiveCol.id) return { ...col, tasks: activeTasks };
                if (col.id === currentOverCol.id) return { ...col, tasks: overTasks };
                return col;
            });
        });
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) {
            setInitialStageId(null);
            return;
        }

        const activeId = active.id.toString();
        const overId = over.id.toString();

        const currentColumn = columns.find(col => col.tasks.some(t => t.id === activeId));
        if (!currentColumn) {
            setInitialStageId(null);
            return;
        }

        const activeIndex = currentColumn.tasks.findIndex(t => t.id === activeId);
        const overIndex = currentColumn.tasks.findIndex(t => t.id === overId);

        try {
            if (initialStageId === currentColumn.id) {
                // Same column reorder
                if (activeIndex !== overIndex) {
                    const newTasks = arrayMove(currentColumn.tasks, activeIndex, overIndex);
                    setColumns(prev => prev.map(col => 
                        col.id === currentColumn.id ? { ...col, tasks: newTasks } : col
                    ));
                    await updateLeadsOrder(currentColumn.id, newTasks.map(t => t.id));
                }
            } else {
                // Move between columns
                await moveLead(activeId, initialStageId!, currentColumn.id, currentColumn.tasks.map(t => t.id));
                toast.success('Movido correctamente');
            }
        } catch (err) {
            logClientError(err, 'KanbanBoard.handleDragEnd');
            fetchData(); // Revert state from DB
        } finally {
            setInitialStageId(null);
        }
    };

    const handleAddTask = async (columnId: string, taskData: any) => {
        try {
            const newLead = await createLead({ ...taskData, stage_id: columnId });
            setColumns(prev => prev.map(col => col.id === columnId ? { ...col, tasks: [...col.tasks, newLead] } : col));
            setIsModalOpen(false);
            toast.success('Añadido satisfactoriamente');
        } catch (error) { 
            logClientError(error, 'KanbanBoard.handleAddTask'); 
        }
    };

    const handleUpdateLead = async (leadId: string, taskData: any) => {
        try {
            const updatedLead = await updateLead(leadId, taskData);
            setColumns(prev => prev.map(col => ({ 
                ...col, 
                tasks: col.tasks.map(t => t.id === leadId ? { ...t, ...updatedLead } : t) 
            })));
            setEditingLead(null);
            setIsModalOpen(false);
            toast.success('Actualizado correctamente');
        } catch (error) { 
            logClientError(error, 'KanbanBoard.handleUpdateLead', undefined, { leadId });
        }
    };

    const handleDeleteLead = async (leadId: string) => {
        try {
            await deleteLead(leadId);
            setColumns(prev => prev.map(col => ({ 
                ...col, 
                tasks: col.tasks.filter(t => t.id !== leadId) 
            })));
            setLeadToDelete(null);
            toast.success('Eliminado');
        } catch (error) { 
            logClientError(error, 'KanbanBoard.handleDeleteLead', undefined, { leadId }); 
        }
    };

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: { active: { opacity: '0.5' } },
        }),
    };

    const filteredColumns = columns.map(col => ({
        ...col,
        tasks: col.tasks.filter(task => 
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.client_name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }));


    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar por título o cliente..." 
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => { 
                        setEditingLead(null);
                        setNewTaskColumnId(columns[0]?.id || 'prospecto');
                        setIsModalOpen(true); 
                    }} 
                    className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                    <Plus size={16} /> NUEVO PROSPECTO
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-indigo-600" size={40} />
                </div>
            ) : (
                <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                    <div className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 scrollbar-hide items-start">
                        {filteredColumns.map((column) => (
                            <KanbanColumn key={column.id} column={column} onAddTask={() => { 
                                setEditingLead(null); 
                                setNewTaskColumnId(column.id); 
                                setIsModalOpen(true); 
                            }}>
                                {column.tasks.map((task) => (
                                    <KanbanCard 
                                        key={task.id} 
                                        task={task} 
                                        onEdit={() => { setEditingLead(task); setIsModalOpen(true); }} 
                                        onDelete={() => setLeadToDelete(task.id)} 
                                    />
                                ))}
                            </KanbanColumn>
                        ))}
                    </div>
                    <DragOverlay dropAnimation={dropAnimation}>
                        {activeTask ? (
                            <div className="w-80 opacity-90 scale-105">
                                <KanbanCard task={activeTask} isOverlay />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}

            {/* Modals */}
            <AnimatePresence>
                {isModalOpen && (
                    <NewTaskModal 
                        lead={editingLead} 
                        onClose={() => setIsModalOpen(false)} 
                        onSubmit={(task) => editingLead ? handleUpdateLead(editingLead.id, task) : handleAddTask(newTaskColumnId!, task)} 
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {leadToDelete && (
                    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl">
                            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">¿Eliminar prospecto?</h3>
                            <p className="text-slate-500 mb-8 font-medium">Esta acción no se puede deshacer y el registro se perderá permanentemente del tablero.</p>
                            <div className="flex gap-4">
                                <button onClick={() => setLeadToDelete(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-black hover:bg-slate-200 transition-all">CANCELAR</button>
                                <button onClick={() => handleDeleteLead(leadToDelete)} className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[11px] font-black hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all">ELIMINAR</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function KanbanColumn({ column, children, onAddTask }: { column: KanbanStageWithLeads, children: React.ReactNode, onAddTask: () => void }) {
    const { setNodeRef } = useDroppable({
        id: column.id,
    });

    return (
        <div className="flex-shrink-0 w-80">
            <div className="flex items-center gap-3 mb-4 px-2">
                <div className={`w-2 h-2 rounded-full ${column.color}`} />
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{column.name}</h3>
                <span className="bg-slate-200/50 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full">{column.tasks.length}</span>
            </div>
            
            <SortableContext id={column.id} items={column.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div 
                    ref={setNodeRef}
                    className="flex flex-col gap-4 min-h-[500px] p-2 bg-slate-100/30 rounded-[2rem] border-2 border-dashed border-slate-200/50"
                >
                    {children}
                    
                    <button 
                        onClick={onAddTask}
                        className="w-full py-4 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group"
                    >
                        <Plus size={16} className="group-hover:scale-110 transition-transform" /> 
                        <span className="text-[10px] font-black uppercase tracking-widest">Añadir a {column.name}</span>
                    </button>
                </div>
            </SortableContext>
        </div>
    );
}

function KanbanCard({ task, isOverlay, onEdit, onDelete }: { task: Lead, isOverlay?: boolean, onEdit?: () => void, onDelete?: () => void }) {
    const router = useRouter();
    const [showMenu, setShowMenu] = useState(false);
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
    const style = { 
        transform: CSS.Translate.toString(transform), 
        transition, 
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 1000 : 1
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...listeners} 
            className={`group relative bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 ${isOverlay ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
            <div className="flex items-start justify-between mb-4">
                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
                    task.priority === 'high' ? 'bg-indigo-100 text-indigo-600' : task.priority === 'medium' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                }`}>
                    {task.priority === 'high' ? 'Prioridad Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                </span>
                
                <div className="relative">
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} 
                        className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
                    >
                        <MoreHorizontal size={18} />
                    </button>
                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-[100]" onClick={() => setShowMenu(false)} />
                            <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[101] overflow-hidden">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit?.(); }} 
                                    className="w-full px-4 py-3 text-left text-[11px] font-black text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition-all"
                                >
                                    <Edit2 size={14} /> EDITAR
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete?.(); }} 
                                    className="w-full px-4 py-3 text-left text-[11px] font-black text-red-500 hover:bg-red-50 flex items-center gap-2 transition-all"
                                >
                                    <Trash2 size={14} /> ELIMINAR
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <h4 className="text-sm font-black text-slate-900 mb-3 leading-snug">{task.title}</h4>
            
                <div className="flex items-center gap-2.5 text-slate-600">
                    <div className="p-1 bgColor-slate-100 rounded-lg"><User size={12} className="text-slate-400" /></div>
                    <span className="text-[11px] font-bold truncate max-w-[180px]">{task.client_name}</span>
                </div>
                {(task.client_email || task.client_phone) && (
                    <div className="flex items-center gap-2.5 text-slate-400">
                        <div className="p-1 bgColor-slate-100 rounded-lg"><Mail size={12} /></div>
                        <span className="text-[10px] font-medium truncate">{task.client_email || task.client_phone}</span>
                    </div>
                )}
                <div className="flex items-center gap-2.5 text-slate-400 mb-3">
                    <div className="p-1 bgColor-slate-100 rounded-lg"><MapPin size={12} /></div>
                    <span className="text-[11px] font-medium truncate">{task.address_reference || 'Ubicación no especificada'}</span>
                </div>

                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        // Navigate to inbox with the lead ID selected
                        router.push(`/advisor/inbox?id=${task.id}`);
                    }}
                    className="w-full py-2.5 mb-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-wide transition-colors flex items-center justify-center gap-2 group/btn"
                >
                    <MessageCircle size={14} className="group-hover/btn:scale-110 transition-transform" />
                    Chat con el Cliente
                </button>

            <div className="pt-5 border-t border-slate-50 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Presupuesto</span>
                    <span className="text-xs font-black text-indigo-600">
                        {task.estimated_value ? `$${Number(task.estimated_value).toLocaleString('es-CO')}M` : 'Por definir'}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar size={12} />
                    <span className="text-[10px] font-bold">
                        {new Date(task.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                    </span>
                </div>
            </div>

            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none">
                <GripVertical size={24} />
            </div>
        </div>
    );
}

function NewTaskModal({ onClose, onSubmit, lead }: { onClose: () => void, onSubmit: (task: any) => void, lead?: Lead | null }) {
    const [formData, setFormData] = useState({ 
        title: lead?.title || '', 
        client_name: lead?.client_name || '', 
        address_reference: lead?.address_reference || '', 
        estimated_value: lead?.estimated_value?.toString() || '', 
        priority: lead?.priority || 'medium' 
    });

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
                <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{lead ? 'Editar Prospecto' : 'Nuevo Prospecto'}</h2>
                        <p className="text-slate-500 font-medium">Añade los detalles clave para el seguimiento.</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all"><X size={28} /></button>
                </div>

                <div className="p-10 space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título / Interés</label>
                            <input type="text" placeholder="Ej. Apartamento en Poblado" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente</label>
                                <input type="text" placeholder="Nombre completo" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Presupuesto (M)</label>
                                <input type="number" placeholder="Ej. 650" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" value={formData.estimated_value} onChange={e => setFormData({...formData, estimated_value: e.target.value})} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección / Referencia</label>
                            <input type="text" placeholder="Calle ... o Conjunto ..." className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" value={formData.address_reference} onChange={e => setFormData({...formData, address_reference: e.target.value})} />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Prioridad</label>
                            <div className="flex gap-3">
                                {(['low', 'medium', 'high'] as const).map((p) => (
                                    <button 
                                        key={p} 
                                        onClick={() => setFormData({ ...formData, priority: p })} 
                                        className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                                            formData.priority === p 
                                            ? p === 'high' ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : p === 'medium' ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-slate-50 border-slate-600 text-slate-700'
                                            : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                                        }`}
                                    >
                                        {p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Baja'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex gap-4">
                        <button onClick={onClose} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black shadow-sm hover:bg-slate-200 transition-all">CANCELAR</button>
                        <button 
                            onClick={() => { 
                                if (!formData.title || !formData.client_name) { toast.error('Completa los campos principales'); return; } 
                                onSubmit({ ...formData, estimated_value: formData.estimated_value ? Number(formData.estimated_value) : undefined }); 
                            }} 
                            className="flex-[1.5] py-5 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
                        >
                            {lead ? 'GUARDAR CAMBIOS' : 'CREAR PROSPECTO'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
