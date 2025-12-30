import React, { useState, useEffect } from 'react';
import { Plus, Users, Search, Calendar, X, Trash2, CheckCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';

const TaskManagement = () => {
    const { currentProject, projectRole } = useProject();
    const { addToast } = useToast();
    const [tasks, setTasks] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        assigned_to: '',
        due_date: '',
        priority: 'medium'
    });

    const isManager = projectRole === 'manager' || projectRole === 'team_lead';

    console.log('🔧 TaskManagement loaded! projectRole:', projectRole, 'isManager:', isManager);

    useEffect(() => {
        if (currentProject?.id) {
            fetchTasks();
            fetchTeamMembers();
        }
    }, [currentProject?.id]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select(`
                    *,
                    profiles:assigned_to (full_name, email)
                `)
                .eq('project_id', currentProject.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTasks(data || []);
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('team_members')
                .select(`
                    profile_id,
                    role_in_project,
                    profiles:profile_id (id, full_name, email)
                `)
                .eq('team_id', currentProject.id);

            if (error) throw error;
            setTeamMembers(data?.filter(m => m.profiles) || []);
        } catch (err) {
            console.error('Error fetching team members:', err);
        }
    };

    const handleAddTask = async () => {
        if (!newTask.title.trim()) {
            addToast('Please enter a task title', 'error');
            return;
        }
        if (!newTask.assigned_to) {
            addToast('Please select a team member to assign', 'error');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase.from('tasks').insert({
                title: newTask.title,
                description: newTask.description,
                assigned_to: newTask.assigned_to,
                due_date: newTask.due_date || null,
                priority: newTask.priority,
                project_id: currentProject.id,
                created_by: user.id,
                status: 'pending',
                lifecycle_state: 'requirement_refiner',
                sub_state: 'in_progress'
            });

            if (error) throw error;
            addToast('Task created successfully!', 'success');
            setShowAddModal(false);
            setNewTask({ title: '', description: '', assigned_to: '', due_date: '', priority: 'medium' });
            fetchTasks();
        } catch (err) {
            console.error('Error creating task:', err);
            addToast('Failed to create task: ' + err.message, 'error');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            const { error } = await supabase.from('tasks').delete().eq('id', taskId);
            if (error) throw error;
            addToast('Task deleted', 'success');
            fetchTasks();
        } catch (err) {
            addToast('Failed to delete task', 'error');
        }
    };

    const filteredTasks = tasks.filter(t =>
        t.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return { bg: '#fee2e2', text: '#991b1b' };
            case 'medium': return { bg: '#fef3c7', text: '#b45309' };
            case 'low': return { bg: '#dcfce7', text: '#166534' };
            default: return { bg: '#f3f4f6', text: '#6b7280' };
        }
    };

    if (!isManager) {
        return (
            <div style={{ padding: '24px', textAlign: 'center' }}>
                <h2 style={{ color: '#64748b' }}>⚠️ Access Denied</h2>
                <p>Only managers and team leads can access task management.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e293b' }}>
                        📋 Task Management
                    </h1>
                    <p style={{ color: '#64748b', marginTop: '4px' }}>
                        {currentProject?.name} - Assign and manage project tasks
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '12px 20px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white', border: 'none', cursor: 'pointer',
                        fontWeight: 600, fontSize: '0.9rem',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}
                >
                    <Plus size={18} /> Add Task
                </button>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '24px', position: 'relative', maxWidth: '300px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.95rem' }}
                />
            </div>

            {/* Tasks List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#f8fafc', borderRadius: '16px', color: '#64748b' }}>
                    <CheckCircle size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                    <h3>No tasks yet</h3>
                    <p>Click "Add Task" to create your first project task.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredTasks.map(task => {
                        const priorityColor = getPriorityColor(task.priority);
                        return (
                            <div key={task.id} style={{
                                backgroundColor: 'white', borderRadius: '12px', padding: '16px',
                                border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <h3 style={{ fontWeight: 600, color: '#1e293b' }}>{task.title}</h3>
                                        <span style={{
                                            fontSize: '0.75rem', padding: '3px 8px', borderRadius: '8px',
                                            backgroundColor: priorityColor.bg, color: priorityColor.text, fontWeight: 600
                                        }}>
                                            {task.priority}
                                        </span>
                                    </div>
                                    <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
                                        Assigned to: {task.profiles?.full_name || task.profiles?.email || 'Unassigned'}
                                    </p>
                                    {task.due_date && (
                                        <p style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                            <Calendar size={14} /> Due: {new Date(task.due_date).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                                <button onClick={() => handleDeleteTask(task.id)} style={{
                                    padding: '8px', borderRadius: '8px', backgroundColor: '#fef2f2',
                                    border: 'none', cursor: 'pointer'
                                }}>
                                    <Trash2 size={18} color="#ef4444" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Task Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '20px', padding: '28px',
                        width: '100%', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>➕ Add New Task</h2>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#64748b" />
                            </button>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Task Title *</label>
                            <input
                                type="text"
                                value={newTask.title}
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                placeholder="Enter task title"
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '0.95rem' }}
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Description</label>
                            <textarea
                                value={newTask.description}
                                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                placeholder="Task description..."
                                rows={3}
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '0.95rem', resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Assign To *</label>
                            <select
                                value={newTask.assigned_to}
                                onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '0.95rem' }}
                            >
                                <option value="">Select team member</option>
                                {teamMembers.map(m => (
                                    <option key={m.profile_id} value={m.profile_id}>
                                        {m.profiles?.full_name || m.profiles?.email} ({m.role_in_project})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Due Date</label>
                                <input
                                    type="date"
                                    value={newTask.due_date}
                                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '0.95rem' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Priority</label>
                                <select
                                    value={newTask.priority}
                                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '0.95rem' }}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowAddModal(false)} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
                                Cancel
                            </button>
                            <button onClick={handleAddTask} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                                Create Task
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskManagement;
