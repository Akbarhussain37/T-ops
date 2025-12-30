import React, { useState, useEffect } from 'react';
import { Building2, Users, User, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

const OrgHierarchy = () => {
    const [hierarchy, setHierarchy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedNodes, setExpandedNodes] = useState({});
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOrgHierarchy();
    }, []);

    const fetchOrgHierarchy = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch all profiles grouped by role
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name, email, role, team_id, avatar_url');

            console.log('Profiles fetched:', profiles?.length, profiles);

            if (profileError) {
                console.error('Profile fetch error:', profileError);
                throw profileError;
            }

            // Fetch all teams
            const { data: teams } = await supabase
                .from('teams')
                .select('id, team_name, manager_id');

            // Build hierarchy structure
            const orgStructure = {
                name: 'TalentOps Organisation',
                type: 'org',
                children: []
            };

            // If no profiles, show message
            if (!profiles || profiles.length === 0) {
                setError('No employees found in the organization');
                setLoading(false);
                return;
            }

            // Group by role
            const executives = profiles?.filter(p => p.role === 'executive') || [];
            const managers = profiles?.filter(p => p.role === 'manager') || [];
            const teamLeads = profiles?.filter(p => p.role === 'team_lead') || [];
            const employees = profiles?.filter(p => p.role === 'employee' || !p.role) || [];

            console.log('Role counts:', { executives: executives.length, managers: managers.length, teamLeads: teamLeads.length, employees: employees.length });

            // Add executives
            if (executives.length > 0) {
                orgStructure.children.push({
                    name: 'Executives',
                    type: 'department',
                    emoji: '👑',
                    children: executives.map(e => ({
                        name: e.full_name || e.email || 'Unknown',
                        type: 'person',
                        role: 'Executive',
                        avatar: e.avatar_url,
                        id: e.id
                    }))
                });
            }

            // Add managers
            if (managers.length > 0) {
                orgStructure.children.push({
                    name: 'Managers',
                    type: 'department',
                    emoji: '🔴',
                    children: managers.map(m => ({
                        name: m.full_name || m.email || 'Unknown',
                        type: 'person',
                        role: 'Manager',
                        avatar: m.avatar_url,
                        id: m.id
                    }))
                });
            }

            // Add team leads
            if (teamLeads.length > 0) {
                orgStructure.children.push({
                    name: 'Team Leads',
                    type: 'department',
                    emoji: '🟡',
                    children: teamLeads.map(tl => ({
                        name: tl.full_name || tl.email || 'Unknown',
                        type: 'person',
                        role: 'Team Lead',
                        avatar: tl.avatar_url,
                        id: tl.id
                    }))
                });
            }

            // Add consultants/employees
            if (employees.length > 0) {
                orgStructure.children.push({
                    name: 'Consultants',
                    type: 'department',
                    emoji: '🟢',
                    children: employees.map(e => ({
                        name: e.full_name || e.email || 'Unknown',
                        type: 'person',
                        role: 'Consultant',
                        avatar: e.avatar_url,
                        id: e.id
                    }))
                });
            }

            // Expand root by default
            setExpandedNodes({ 'TalentOps Organisation': true });
            setHierarchy(orgStructure);
        } catch (err) {
            console.error('Error fetching org hierarchy:', err);
            setError('Failed to load organization hierarchy: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleNode = (nodeName) => {
        setExpandedNodes(prev => ({
            ...prev,
            [nodeName]: !prev[nodeName]
        }));
    };

    const renderNode = (node, level = 0) => {
        const isExpanded = expandedNodes[node.name];
        const hasChildren = node.children && node.children.length > 0;

        return (
            <div key={node.name + level} style={{ marginLeft: level * 24 }}>
                <div
                    onClick={() => hasChildren && toggleNode(node.name)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 16px',
                        marginBottom: '4px',
                        borderRadius: '12px',
                        backgroundColor: node.type === 'org' ? '#8b5cf620' : node.type === 'department' ? '#f1f5f9' : 'white',
                        border: node.type === 'person' ? '1px solid #e2e8f0' : 'none',
                        cursor: hasChildren ? 'pointer' : 'default',
                        transition: 'all 0.2s'
                    }}
                >
                    {hasChildren && (
                        isExpanded ? <ChevronDown size={16} color="#64748b" /> : <ChevronRight size={16} color="#64748b" />
                    )}

                    {node.type === 'org' && <Building2 size={20} color="#8b5cf6" />}
                    {node.type === 'department' && <span style={{ fontSize: '1.2rem' }}>{node.emoji}</span>}
                    {node.type === 'person' && (
                        node.avatar ? (
                            <img src={node.avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={14} color="#64748b" />
                            </div>
                        )
                    )}

                    <div>
                        <span style={{ fontWeight: node.type !== 'person' ? 600 : 500, color: '#1e293b', fontSize: node.type === 'org' ? '1.1rem' : '0.95rem' }}>
                            {node.name}
                        </span>
                        {node.role && (
                            <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '10px' }}>
                                {node.role}
                            </span>
                        )}
                        {node.children && (
                            <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#94a3b8' }}>
                                ({node.children.length})
                            </span>
                        )}
                    </div>
                </div>

                {isExpanded && hasChildren && (
                    <div style={{ borderLeft: '2px solid #e2e8f0', marginLeft: '20px', paddingLeft: '8px' }}>
                        {node.children.map((child, idx) => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#64748b' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ marginLeft: '12px' }}>Loading organisation hierarchy...</span>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e293b' }}>
                    🏢 Organisation Hierarchy
                </h1>
                <p style={{ color: '#64748b', marginTop: '4px' }}>
                    View the complete organizational structure
                </p>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                {error ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
                        <p style={{ fontWeight: 600 }}>⚠️ {error}</p>
                        <button onClick={fetchOrgHierarchy} style={{ marginTop: '12px', padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                            Retry
                        </button>
                    </div>
                ) : hierarchy ? (
                    renderNode(hierarchy)
                ) : (
                    <p style={{ color: '#64748b', textAlign: 'center' }}>No hierarchy data available</p>
                )}
            </div>
        </div>
    );
};

export default OrgHierarchy;
