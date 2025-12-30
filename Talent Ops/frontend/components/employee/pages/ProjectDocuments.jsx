import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit3, Save, X, Code, FileQuestion, ListTodo, Loader2, Download, Upload } from 'lucide-react';
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
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

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
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [currentProject?.id]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleAddDocument = async () => {
        console.log('DEBUG: Attempting to add document');
        console.log('DEBUG: Current Project:', currentProject);
        console.log('DEBUG: Project ID being sent:', currentProject?.id);

        if (!newDoc.title.trim()) {
            addToast('Please enter a title', 'error');
            return;
        }

        setUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            console.log('DEBUG: User ID:', user?.id);

            let fileUrl = null;



            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${currentProject.id}/${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('project-docs')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('project-docs')
                    .getPublicUrl(fileName);

                fileUrl = urlData.publicUrl;
            }

            const { data: docData, error } = await supabase.from('project_documents').insert({
                project_id: currentProject.id,
                title: newDoc.title,
                content: newDoc.content,
                doc_type: newDoc.doc_type,
                file_url: fileUrl,
                created_by: user.id
            })
                .select()
                .single();

            if (error) throw error;

            // ✨ Automatically index document for chatbot RAG
            if (fileUrl && docData) {
                try {
                    const ingestResponse = await fetch('http://localhost:8000/api/ingest/document', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            document_id: docData.id,
                            file_url: fileUrl,
                            document_type: newDoc.doc_type || 'project_doc',
                            department: currentProject.name || 'general',
                            role_visibility: ['all'],
                            title: newDoc.title
                        })
                    });
                    if (ingestResponse.ok) {
                        console.log('✅ Document indexed for chatbot');
                    }
                } catch (ingestErr) {
                    console.warn('⚠️ RAG indexing failed:', ingestErr);
                }
            }

            addToast('Document added successfully', 'success');
            setShowAddModal(false);
            setNewDoc({ title: '', content: '', doc_type: 'requirements' });
            setFile(null);
            fetchDocuments();
        } catch (err) {
            console.error('Error adding document:', err);
            addToast('Failed to add document: ' + err.message, 'error');
        } finally {
            setUploading(false);
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
                <Loader2 size={24} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ marginLeft: '12px' }}>Loading documents...</span>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', backgroundColor: '#f8fafc', borderRadius: '16px', marginTop: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
                        📄 Project Documents
                    </h2>
                    <p style={{ color: '#64748b', marginTop: '4px' }}>
                        Shared resources and documentation for {currentProject?.name}
                    </p>
                </div>
                {isManager && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 16px', borderRadius: '10px',
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
                            padding: '6px 12px', borderRadius: '16px',
                            backgroundColor: `${type.color}15`, color: type.color,
                            fontSize: '0.8rem', fontWeight: 600
                        }}>
                            <type.icon size={14} />
                            {type.label} <span style={{ opacity: 0.7 }}>({count})</span>
                        </div>
                    );
                })}
            </div>

            {/* Documents Grid */}
            {documents.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '40px 20px',
                    borderColor: '#e2e8f0', borderStyle: 'dashed', borderWidth: '2px',
                    borderRadius: '12px', color: '#64748b'
                }}>
                    <FileText size={32} style={{ opacity: 0.5, marginBottom: '12px' }} />
                    <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>No documents shared yet</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {documents.map(doc => {
                        const typeInfo = getDocTypeInfo(doc.doc_type);
                        const isEditing = editingDoc?.id === doc.id;

                        return (
                            <div key={doc.id} style={{
                                backgroundColor: 'white', borderRadius: '12px',
                                padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                border: '1px solid #e2e8f0'
                            }}>
                                {/* Doc Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '8px',
                                            backgroundColor: `${typeInfo.color}20`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <typeInfo.icon size={16} color={typeInfo.color} />
                                        </div>
                                        {isEditing ? (
                                            <input
                                                value={editingDoc.title}
                                                onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                                                style={{
                                                    fontSize: '0.9rem', fontWeight: 600, border: '1px solid #e2e8f0',
                                                    borderRadius: '6px', padding: '4px 8px', width: '180px'
                                                }}
                                            />
                                        ) : (
                                            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1e293b' }}>{doc.title}</h3>
                                        )}
                                    </div>
                                    {isManager && (
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {isEditing ? (
                                                <>
                                                    <button onClick={() => handleUpdateDocument(doc.id)} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '4px', cursor: 'pointer' }}>
                                                        <Save size={14} />
                                                    </button>
                                                    <button onClick={() => setEditingDoc(null)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '4px', cursor: 'pointer' }}>
                                                        <X size={14} />
                                                    </button>
                                                </>
                                            ) : (
                                                <button onClick={() => handleDeleteDocument(doc.id)} style={{ background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer' }}>
                                                    <Trash2 size={14} color="#94a3b8" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                {isEditing ? (
                                    <textarea
                                        value={editingDoc.content}
                                        onChange={(e) => setEditingDoc({ ...editingDoc, content: e.target.value })}
                                        style={{
                                            width: '100%', minHeight: '80px', border: '1px solid #e2e8f0',
                                            borderRadius: '6px', padding: '8px', fontSize: '0.85rem',
                                            resize: 'vertical', marginBottom: '12px'
                                        }}
                                    />
                                ) : (
                                    <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {doc.content || 'No description.'}
                                    </p>
                                )}

                                {/* Actions */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                        {new Date(doc.created_at).toLocaleDateString()}
                                    </span>

                                    {doc.file_url && (
                                        <a
                                            href={doc.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                fontSize: '0.8rem', fontWeight: 600, color: '#3b82f6',
                                                textDecoration: 'none'
                                            }}
                                        >
                                            <Download size={14} /> Download
                                        </a>
                                    )}
                                </div>
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
                        backgroundColor: 'white', borderRadius: '16px', padding: '24px',
                        width: '100%', maxWidth: '450px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '20px' }}>Add New Document</h2>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>Title *</label>
                            <input
                                type="text"
                                value={newDoc.title}
                                onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                                placeholder="Document title"
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem' }}
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>Type</label>
                            <select
                                value={newDoc.doc_type}
                                onChange={(e) => setNewDoc({ ...newDoc, doc_type: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem' }}
                            >
                                {docTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>Description</label>
                            <textarea
                                value={newDoc.content}
                                onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                                placeholder="Optional description..."
                                rows={3}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: '#374151' }}>Upload File</label>
                            <div style={{
                                border: '2px dashed #e2e8f0', borderRadius: '8px', padding: '20px',
                                textAlign: 'center', cursor: 'pointer', backgroundColor: '#f9fafb'
                            }}>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    id="file-upload"
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                    <Upload size={24} color="#94a3b8" />
                                    <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                        {file ? file.name : 'Click to upload'}
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowAddModal(false)} disabled={uploading} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
                                Cancel
                            </button>
                            <button onClick={handleAddDocument} disabled={uploading} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', cursor: 'pointer', fontWeight: 600, opacity: uploading ? 0.7 : 1 }}>
                                {uploading ? 'Uploading...' : 'Add Document'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDocuments;
