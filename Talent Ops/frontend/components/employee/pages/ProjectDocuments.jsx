import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit3, Save, X, Code, FileQuestion, ListTodo, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useProject } from '../context/ProjectContext';
import { useToast } from '../context/ToastContext';

const ProjectDocuments = () => {
    const { currentProject, projectRole } = useProject();
    const { addToast } = useToast();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingDoc, setEditingDoc] = useState(null);
    const [newDoc, setNewDoc] = useState({ title: '', content: '', doc_type: 'requirements' });

    const isManager = projectRole === 'manager' || projectRole === 'team_lead';

    const docTypes = [
        { value: 'requirements', label: 'Requirements', icon: FileQuestion, color: '#8b5cf6' },
        { value: 'tech_stack', label: 'Tech Stack', icon: Code, color: '#3b82f6' },
        { value: 'project_tasks', label: 'Project Tasks', icon: ListTodo, color: '#10b981' },
        { value: 'other', label: 'Other', icon: FileText, color: '#6b7280' }
    ];

    const fetchDocuments = async () => {
        if (!currentProject?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('project_documents')
                .select('*')
                .eq('project_id', currentProject.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (err) {
            console.error('Error fetching documents:', err);
            // If table doesn't exist yet, just show empty state
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [currentProject?.id]);

    const handleAddDocument = async () => {
        if (!newDoc.title.trim()) {
            addToast('Please enter a title', 'error');
            return;
        }
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase.from('project_documents').insert({
                project_id: currentProject.id,
                title: newDoc.title,
                content: newDoc.content,
                doc_type: newDoc.doc_type,
                created_by: user.id
            });

            if (error) throw error;
            addToast('Document added successfully', 'success');
            setShowAddModal(false);
            setNewDoc({ title: '', content: '', doc_type: 'requirements' });
            fetchDocuments();
        } catch (err) {
            console.error('Error adding document:', err);
            addToast('Failed to add document', 'error');
        }
    };

    const handleUpdateDocument = async (id) => {
        try {
            const { error } = await supabase
                .from('project_documents')
                .update({ title: editingDoc.title, content: editingDoc.content, doc_type: editingDoc.doc_type })
                .eq('id', id);

            if (error) throw error;
            addToast('Document updated', 'success');
            setEditingDoc(null);
            fetchDocuments();
        } catch (err) {
            console.error('Error updating document:', err);
            addToast('Failed to update document', 'error');
        }
    };

    const handleDeleteDocument = async (id) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;
        try {
            const { error } = await supabase.from('project_documents').delete().eq('id', id);
            if (error) throw error;
            addToast('Document deleted', 'success');
            fetchDocuments();
        } catch (err) {
            console.error('Error deleting document:', err);
            addToast('Failed to delete document', 'error');
        }
    };

    const getDocTypeInfo = (type) => docTypes.find(d => d.value === type) || docTypes[3];

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#64748b' }}>
                <Loader2 size={32} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ marginLeft: '12px' }}>Loading documents...</span>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e293b' }}>
                        📄 Project Documents
                    </h1>
                    <p style={{ color: '#64748b', marginTop: '4px' }}>
                        {currentProject?.name || 'Select a project'} - Documentation, tech stack, and requirements
                    </p>
                </div>
                {isManager && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '12px 20px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                            color: 'white', border: 'none', cursor: 'pointer',
                            fontWeight: 600, fontSize: '0.9rem'
                        }}
                    >
                        <Plus size={18} /> Add Document
                    </button>
                )}
            </div>

            {/* Document Type Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {docTypes.map(type => {
                    const count = documents.filter(d => d.doc_type === type.value).length;
                    return (
                        <div key={type.value} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 16px', borderRadius: '20px',
                            backgroundColor: `${type.color}20`, color: type.color,
                            fontSize: '0.85rem', fontWeight: 600
                        }}>
                            <type.icon size={16} />
                            {type.label} <span style={{ opacity: 0.7 }}>({count})</span>
                        </div>
                    );
                })}
            </div>

            {/* Documents Grid */}
            {documents.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px 20px',
                    backgroundColor: '#f8fafc', borderRadius: '16px', color: '#64748b'
                }}>
                    <FileText size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>No documents yet</h3>
                    <p style={{ fontSize: '0.9rem' }}>
                        {isManager ? 'Add your first project document to get started.' : 'Your manager hasn\'t added any documents yet.'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {documents.map(doc => {
                        const typeInfo = getDocTypeInfo(doc.doc_type);
                        const isEditing = editingDoc?.id === doc.id;

                        return (
                            <div key={doc.id} style={{
                                backgroundColor: 'white', borderRadius: '16px',
                                padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                border: '1px solid #e2e8f0', transition: 'transform 0.2s'
                            }}>
                                {/* Doc Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '10px',
                                            backgroundColor: `${typeInfo.color}20`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <typeInfo.icon size={20} color={typeInfo.color} />
                                        </div>
                                        {isEditing ? (
                                            <input
                                                value={editingDoc.title}
                                                onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                                                style={{
                                                    fontSize: '1rem', fontWeight: 600, border: '1px solid #e2e8f0',
                                                    borderRadius: '8px', padding: '6px 10px', width: '200px'
                                                }}
                                            />
                                        ) : (
                                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>{doc.title}</h3>
                                        )}
                                    </div>
                                    {isManager && (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {isEditing ? (
                                                <>
                                                    <button onClick={() => handleUpdateDocument(doc.id)} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                                                        <Save size={16} />
                                                    </button>
                                                    <button onClick={() => setEditingDoc(null)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                                                        <X size={16} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => setEditingDoc(doc)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                                                        <Edit3 size={16} color="#64748b" />
                                                    </button>
                                                    <button onClick={() => handleDeleteDocument(doc.id)} style={{ background: '#fef2f2', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                                                        <Trash2 size={16} color="#ef4444" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Type Badge */}
                                <span style={{
                                    display: 'inline-block', fontSize: '0.75rem', fontWeight: 600,
                                    padding: '4px 10px', borderRadius: '12px',
                                    backgroundColor: `${typeInfo.color}20`, color: typeInfo.color,
                                    marginBottom: '12px'
                                }}>
                                    {typeInfo.label}
                                </span>

                                {/* Content */}
                                {isEditing ? (
                                    <textarea
                                        value={editingDoc.content}
                                        onChange={(e) => setEditingDoc({ ...editingDoc, content: e.target.value })}
                                        style={{
                                            width: '100%', minHeight: '120px', border: '1px solid #e2e8f0',
                                            borderRadius: '8px', padding: '10px', fontSize: '0.9rem',
                                            resize: 'vertical'
                                        }}
                                    />
                                ) : (
                                    <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                        {doc.content || 'No content provided.'}
                                    </p>
                                )}

                                {/* Footer */}
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '12px' }}>
                                    Added {new Date(doc.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Modal */}
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
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '20px' }}>Add New Document</h2>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>Title</label>
                            <input
                                type="text"
                                value={newDoc.title}
                                onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                                placeholder="Document title"
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '0.95rem' }}
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>Type</label>
                            <select
                                value={newDoc.doc_type}
                                onChange={(e) => setNewDoc({ ...newDoc, doc_type: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '0.95rem' }}
                            >
                                {docTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>Content</label>
                            <textarea
                                value={newDoc.content}
                                onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                                placeholder="Document content..."
                                rows={6}
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '0.95rem', resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowAddModal(false)} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
                                Cancel
                            </button>
                            <button onClick={handleAddDocument} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                                Add Document
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDocuments;
