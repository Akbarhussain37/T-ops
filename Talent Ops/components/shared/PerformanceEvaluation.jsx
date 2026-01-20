
import React, { useState, useEffect } from 'react';
import {
    Star,
    TrendingUp,
    FileText,
    Lightbulb,
    Search,
    Filter,
    Plus,
    Edit2,
    X,
    User,
    Calendar,
    Building2,
    ChevronDown,
    Save,
    AlertCircle,
    Trash2
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const PerformanceEvaluation = ({ userRole = 'employee' }) => {
    // Soft Skills Traits
    const SOFT_SKILLS = [
        { key: 'skill_accountability', label: 'Accountability' },
        { key: 'skill_compliance', label: 'Compliance' },
        { key: 'skill_learnability', label: 'Learnability' },
        { key: 'skill_ambitious', label: 'Ambitious' },
        { key: 'skill_abstract_thinking', label: 'Abstract Thinking' },
        { key: 'skill_communication', label: 'Communication' },
        { key: 'skill_curiosity', label: 'Curiosity' },
        { key: 'skill_english', label: 'English' },
        { key: 'skill_second_order_thinking', label: 'Second-Order Thinking' },
        { key: 'skill_first_principle_thinking', label: 'First-Principle Thinking' }
    ];

    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
    const currentYear = new Date().getFullYear();
    const YEARS = [currentYear - 1, currentYear, currentYear + 1];

    const [evaluations, setEvaluations] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedEvaluation, setSelectedEvaluation] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState('score');
    const [activeView, setActiveView] = useState('evaluations'); // 'evaluations' or 'taskFeedback'

    // Task Feedback state
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState('all');
    const [teamTasks, setTeamTasks] = useState([]);
    const [taskFeedbackModal, setTaskFeedbackModal] = useState(null);
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackRating, setFeedbackRating] = useState('');

    // Filters
    const [periodFilter, setPeriodFilter] = useState('all');
    const [projectFilter, setProjectFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Employee View Filters
    const [viewPeriodType, setViewPeriodType] = useState('month');
    const [viewMonth, setViewMonth] = useState('January'); // Default to current or static
    const [viewQuarter, setViewQuarter] = useState('Q1');
    const [viewYear, setViewYear] = useState(new Date().getFullYear().toString());

    // Employee Search Dropdown State (for Modal)
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
    const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);

    // Form state for create/edit - includes individual soft skills
    const [formData, setFormData] = useState({
        employee_id: '',
        project_id: '',
        period: 'month',
        period_month: 'January',
        period_quarter: 'Q1',
        period_year: currentYear.toString(),
        score: '',
        review: '',
        improvements: '',
        skill_accountability: '',
        skill_compliance: '',
        skill_learnability: '',
        skill_ambitious: '',
        skill_abstract_thinking: '',
        skill_communication: '',
        skill_curiosity: '',
        skill_english: '',
        skill_second_order_thinking: '',
        skill_first_principle_thinking: ''
    });

    const canEdit = userRole === 'executive' || userRole === 'manager';

    useEffect(() => {
        fetchCurrentUser();
        fetchEmployees();
        fetchProjects();
    }, []);

    useEffect(() => {
        if (currentUser) {
            fetchEvaluations();
        }
    }, [currentUser, periodFilter, projectFilter]);

    const fetchCurrentUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setCurrentUser({ ...user, ...profile });
            }
        } catch (error) {
            console.error('Error fetching current user:', error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email, avatar_url')
                .order('full_name');
            setEmployees(data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchProjects = async () => {
        try {
            const { data } = await supabase
                .from('projects')
                .select('id, name')
                .order('name');
            setProjects(data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const fetchEvaluations = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('performance_evaluations')
                .select(`
                    *,
                    employee:profiles!performance_evaluations_employee_id_fkey(id, full_name, email, avatar_url),
                    project:projects(id, name),
                    creator:profiles!performance_evaluations_created_by_fkey(id, full_name)
                `)
                .order('created_at', { ascending: false });

            // Role-based filtering
            if (userRole === 'employee') {
                query = query.eq('employee_id', currentUser?.id);
            }

            // Apply filters
            if (periodFilter !== 'all') {
                query = query.eq('period', periodFilter);
            }
            if (projectFilter !== 'all') {
                query = query.eq('project_id', projectFilter);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching evaluations:', error);
                setEvaluations([]);
            } else {
                setEvaluations(data || []);
            }
        } catch (error) {
            console.error('Error:', error);
            setEvaluations([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        console.log('Delete requested for ID:', id);
        // Confirmation removed as per user request to ensure frontend deletion works immediately

        try {
            console.log('Sending delete request...');
            const { data, error } = await supabase
                .from('performance_evaluations')
                .delete()
                .eq('id', id)
                .select(); // Select to confirm deletion

            console.log('Delete response:', { data, error });

            if (error) throw error;

            if (!data || data.length === 0) {
                console.warn('Delete succeeded but no rows returned. Possible RLS issue.');
                alert('Deletion failed. You may not have permission to delete this record.');
                return;
            }

            console.log('Delete successful. Refreshing list...');
            await fetchEvaluations();
            alert('Evaluation deleted successfully.');
        } catch (error) {
            console.error('Error deleting evaluation:', error);
            alert(`Failed to delete evaluation: ${error.message || 'Unknown error'}`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Calculate soft_skills average from individual traits
            const skillScores = SOFT_SKILLS.map(s => parseFloat(formData[s.key]) || 0).filter(v => v > 0);
            const softSkillsAvg = skillScores.length > 0 ? skillScores.reduce((a, b) => a + b, 0) / skillScores.length : null;

            // Build period_value from dropdown selections
            const periodValue = formData.period === 'month'
                ? `${formData.period_month} ${formData.period_year}`
                : `${formData.period_quarter} ${formData.period_year}`;

            const payload = {
                employee_id: formData.employee_id,
                project_id: formData.project_id || null,
                period: formData.period,
                period_value: periodValue,
                score: parseFloat(formData.score) || null,
                soft_skills: softSkillsAvg,
                review: formData.review,
                improvements: formData.improvements,
                skill_accountability: parseFloat(formData.skill_accountability) || null,
                skill_compliance: parseFloat(formData.skill_compliance) || null,
                skill_learnability: parseFloat(formData.skill_learnability) || null,
                skill_ambitious: parseFloat(formData.skill_ambitious) || null,
                skill_abstract_thinking: parseFloat(formData.skill_abstract_thinking) || null,
                skill_communication: parseFloat(formData.skill_communication) || null,
                skill_curiosity: parseFloat(formData.skill_curiosity) || null,
                skill_english: parseFloat(formData.skill_english) || null,
                skill_second_order_thinking: parseFloat(formData.skill_second_order_thinking) || null,
                skill_first_principle_thinking: parseFloat(formData.skill_first_principle_thinking) || null,
                given_by_role: userRole === 'executive' ? 'Executive' : 'Manager',
                created_by: currentUser?.id
            };

            if (selectedEvaluation) {
                const { error } = await supabase
                    .from('performance_evaluations')
                    .update({ ...payload, updated_at: new Date().toISOString() })
                    .eq('id', selectedEvaluation.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('performance_evaluations')
                    .insert([payload]);
                if (error) throw error;
            }

            setShowModal(false);
            setSelectedEvaluation(null);
            resetForm();
            fetchEvaluations();
        } catch (error) {
            console.error('Error saving evaluation:', error);
            alert('Failed to save evaluation. Please try again.');
        }
    };

    const resetForm = () => {
        setIsEmployeeDropdownOpen(false);
        setEmployeeSearchTerm('');
        setFormData({
            employee_id: '',
            project_id: '',
            period: 'month',
            period_month: 'January',
            period_quarter: 'Q1',
            period_year: currentYear.toString(),
            score: '',
            review: '',
            improvements: '',
            skill_accountability: '',
            skill_compliance: '',
            skill_learnability: '',
            skill_ambitious: '',
            skill_abstract_thinking: '',
            skill_communication: '',
            skill_curiosity: '',
            skill_english: '',
            skill_second_order_thinking: '',
            skill_first_principle_thinking: ''
        });
    };

    const openEditModal = (evaluation) => {
        setSelectedEvaluation(evaluation);
        // Parse period_value to extract month/quarter and year
        const parts = evaluation.period_value?.split(' ') || [];
        const periodMonth = evaluation.period === 'month' && parts[0] ? parts[0] : 'January';
        const periodQuarter = evaluation.period === 'quarter' && parts[0] ? parts[0] : 'Q1';
        const periodYear = parts[1] || currentYear.toString();

        setFormData({
            employee_id: evaluation.employee_id,
            project_id: evaluation.project_id || '',
            period: evaluation.period,
            period_month: periodMonth,
            period_quarter: periodQuarter,
            period_year: periodYear,
            score: evaluation.score?.toString() || '',
            review: evaluation.review || '',
            improvements: evaluation.improvements || '',
            skill_accountability: evaluation.skill_accountability?.toString() || '',
            skill_compliance: evaluation.skill_compliance?.toString() || '',
            skill_learnability: evaluation.skill_learnability?.toString() || '',
            skill_ambitious: evaluation.skill_ambitious?.toString() || '',
            skill_abstract_thinking: evaluation.skill_abstract_thinking?.toString() || '',
            skill_communication: evaluation.skill_communication?.toString() || '',
            skill_curiosity: evaluation.skill_curiosity?.toString() || '',
            skill_english: evaluation.skill_english?.toString() || '',
            skill_second_order_thinking: evaluation.skill_second_order_thinking?.toString() || '',
            skill_first_principle_thinking: evaluation.skill_first_principle_thinking?.toString() || ''
        });
        setShowModal(true);
    };

    const openCreateModal = () => {
        setSelectedEvaluation(null);
        resetForm();
        setShowModal(true);
    };

    const filteredEvaluations = evaluations.filter(e => {
        if (!searchTerm) return true;
        const name = e.employee?.full_name?.toLowerCase() || '';
        const projectName = e.project?.name?.toLowerCase() || '';
        return name.includes(searchTerm.toLowerCase()) || projectName.includes(searchTerm.toLowerCase());
    });

    const getScoreColor = (score) => {
        if (score >= 8) return '#22c55e';
        if (score >= 6) return '#eab308';
        if (score >= 4) return '#f97316';
        return '#ef4444';
    };

    const tabs = [
        { id: 'score', label: 'Score', icon: Star, color: '#f59e0b' },
        { id: 'review', label: 'Review', icon: FileText, color: '#3b82f6' },
        { id: 'improvements', label: 'Improvements', icon: TrendingUp, color: '#22c55e' },
        { id: 'soft_skills', label: 'Soft Skills', icon: Lightbulb, color: '#8b5cf6' }
    ];

    // Employee view - show their own evaluations in a card-based layout
    if (userRole === 'employee') {
        const targetValue = viewPeriodType === 'month'
            ? `${viewMonth} ${viewYear}`
            : `${viewQuarter} ${viewYear}`;

        const myEvaluation = evaluations.find(e =>
            e.period === viewPeriodType && e.period_value === targetValue
        );

        return (
            <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
                            My Review
                        </h1>
                        <p style={{ color: '#6b7280' }}>Track your performance across tasks and soft skills</p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
                                Period Type
                            </label>
                            <select
                                value={viewPeriodType}
                                onChange={(e) => setViewPeriodType(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    backgroundColor: 'white',
                                    color: '#374151',
                                    minWidth: '120px',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="month">Monthly</option>
                                <option value="quarter">Quarterly</option>
                            </select>
                        </div>

                        {viewPeriodType === 'month' ? (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
                                    Month
                                </label>
                                <select
                                    value={viewMonth}
                                    onChange={(e) => setViewMonth(e.target.value)}
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        backgroundColor: 'white',
                                        color: '#374151',
                                        minWidth: '120px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
                                    Quarter
                                </label>
                                <select
                                    value={viewQuarter}
                                    onChange={(e) => setViewQuarter(e.target.value)}
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        backgroundColor: 'white',
                                        color: '#374151',
                                        minWidth: '120px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
                                </select>
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
                                Year
                            </label>
                            <select
                                value={viewYear}
                                onChange={(e) => setViewYear(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    backgroundColor: 'white',
                                    color: '#374151',
                                    minWidth: '90px',
                                    cursor: 'pointer'
                                }}
                            >
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tab Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '24px',
                                borderRadius: '16px',
                                border: activeTab === tab.id ? `2px solid ${tab.color}` : '2px solid #e5e7eb',
                                background: activeTab === tab.id ? tab.color : 'white',
                                color: activeTab === tab.id ? 'white' : '#374151',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <tab.icon size={24} />
                            <span style={{ fontWeight: '600' }}>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content based on active tab */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
                        Loading...
                    </div>
                ) : myEvaluation ? (
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '32px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        {activeTab === 'score' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                <div style={{
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '50%',
                                    border: `8px solid ${getScoreColor(myEvaluation.score)}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column'
                                }}>
                                    <span style={{ fontSize: '2rem', fontWeight: '700', color: getScoreColor(myEvaluation.score) }}>
                                        {myEvaluation.score?.toFixed(1) || 'N/A'}
                                    </span>
                                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>/10</span>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>Performance Score</h3>
                                    <p style={{ color: '#6b7280' }}>Period: {myEvaluation.period_value}</p>
                                    <p style={{ color: '#6b7280' }}>Given by: {myEvaluation.creator?.full_name || 'Unknown'} ({myEvaluation.given_by_role})</p>
                                </div>
                            </div>
                        )}
                        {activeTab === 'review' && (
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px' }}>Performance Review</h3>
                                <p style={{ color: '#374151', lineHeight: '1.75', whiteSpace: 'pre-wrap' }}>
                                    {myEvaluation.review || 'No review provided yet.'}
                                </p>
                            </div>
                        )}
                        {activeTab === 'improvements' && (
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px' }}>Areas for Improvement</h3>
                                <p style={{ color: '#374151', lineHeight: '1.75', whiteSpace: 'pre-wrap' }}>
                                    {myEvaluation.improvements || 'No improvement notes provided yet.'}
                                </p>
                            </div>
                        )}
                        {activeTab === 'soft_skills' && (
                            <div>
                                {/* Overall Average */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
                                    <div style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        border: `6px solid ${getScoreColor(myEvaluation.soft_skills)}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column'
                                    }}>
                                        <span style={{ fontSize: '1.75rem', fontWeight: '700', color: getScoreColor(myEvaluation.soft_skills) }}>
                                            {myEvaluation.soft_skills?.toFixed(1) || 'N/A'}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>/10</span>
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '4px' }}>Overall Soft Skills</h3>
                                        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Average of all traits</p>
                                    </div>
                                </div>

                                {/* Individual Soft Skills Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                                    {SOFT_SKILLS.map(skill => {
                                        const score = myEvaluation[skill.key];
                                        return (
                                            <div key={skill.key} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '12px 16px',
                                                background: '#f9fafb',
                                                borderRadius: '10px',
                                                border: '1px solid #e5e7eb'
                                            }}>
                                                <span style={{ fontWeight: '500', color: '#374151' }}>{skill.label}</span>
                                                <span style={{
                                                    fontWeight: '700',
                                                    fontSize: '1.1rem',
                                                    color: getScoreColor(score),
                                                    minWidth: '40px',
                                                    textAlign: 'right'
                                                }}>
                                                    {score?.toFixed(1) || '-'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '48px',
                        textAlign: 'center',
                        color: '#6b7280'
                    }}>
                        <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                        <p>No performance evaluation available yet.</p>
                    </div>
                )}
            </div>
        );
    }

    // Manager/Executive/Team Lead view - table with full CRUD for manager/executive
    return (
        <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
                        Performance Evaluation
                    </h1>
                    <p style={{ color: '#6b7280' }}>
                        {canEdit ? 'Review and manage employee performance evaluations' : 'View employee performance evaluations'}
                    </p>
                </div>
                {canEdit && (
                    <button
                        onClick={openCreateModal}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 20px',
                            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                        }}
                    >
                        <Plus size={20} />
                        Add Evaluation
                    </button>
                )}
            </div>

            {/* Filters */}
            <div style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '24px',
                flexWrap: 'wrap'
            }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                        type="text"
                        placeholder="Search by employee or project..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 14px 12px 42px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>
                <select
                    value={periodFilter}
                    onChange={(e) => setPeriodFilter(e.target.value)}
                    style={{
                        padding: '12px 16px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        minWidth: '150px',
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                    }}
                >
                    <option value="all">All Periods</option>
                    <option value="month">Monthly</option>
                    <option value="quarter">Quarterly</option>
                </select>
                <select
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    style={{
                        padding: '12px 16px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        minWidth: '180px',
                        fontSize: '0.9rem',
                        cursor: 'pointer'
                    }}
                >
                    <option value="all">All Projects</option>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div style={{
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
            }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                        Loading evaluations...
                    </div>
                ) : filteredEvaluations.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                        <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                        <p>No evaluations found.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Employee</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Project</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Period</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Score</th>
                                <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Soft Skills</th>
                                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Given By</th>
                                {canEdit && <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEvaluations.map((evaluation, idx) => (
                                <tr
                                    key={evaluation.id}
                                    style={{
                                        borderBottom: '1px solid #e5e7eb',
                                        background: idx % 2 === 0 ? 'white' : '#fafafa'
                                    }}
                                >
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontWeight: '600'
                                            }}>
                                                {evaluation.employee?.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600', color: '#1f2937' }}>
                                                    {evaluation.employee?.full_name || 'Unknown'}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                                    {evaluation.employee?.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', color: '#374151' }}>
                                        {evaluation.project?.name || 'Organization'}
                                    </td>
                                    <td style={{ padding: '16px', color: '#374151' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            background: evaluation.period === 'month' ? '#dbeafe' : '#fef3c7',
                                            color: evaluation.period === 'month' ? '#1e40af' : '#92400e',
                                            fontSize: '0.85rem',
                                            fontWeight: '500'
                                        }}>
                                            {evaluation.period_value}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <span style={{
                                            fontWeight: '700',
                                            color: getScoreColor(evaluation.score),
                                            fontSize: '1.1rem'
                                        }}>
                                            {evaluation.score?.toFixed(1) || '-'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <span style={{
                                            fontWeight: '700',
                                            color: getScoreColor(evaluation.soft_skills),
                                            fontSize: '1.1rem'
                                        }}>
                                            {evaluation.soft_skills?.toFixed(1) || '-'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                                                {evaluation.creator?.full_name || 'Unknown'}
                                            </div>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                background: evaluation.given_by_role === 'Executive' ? '#f3e8ff' : '#e0f2fe',
                                                color: evaluation.given_by_role === 'Executive' ? '#7c3aed' : '#0369a1',
                                                fontSize: '0.75rem',
                                                fontWeight: '500'
                                            }}>
                                                {evaluation.given_by_role}
                                            </span>
                                        </div>
                                    </td>
                                    {canEdit && (
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => openEditModal(evaluation)}
                                                    style={{
                                                        padding: '8px 12px',
                                                        background: 'transparent',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        color: '#6b7280',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    <Edit2 size={16} />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(evaluation.id)}
                                                    style={{
                                                        padding: '8px 12px',
                                                        background: 'transparent',
                                                        border: '1px solid #fee2e2',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        color: '#ef4444',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '20px',
                        width: '90%',
                        maxWidth: '600px',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        <div style={{
                            padding: '24px',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                                {selectedEvaluation ? 'Edit Evaluation' : 'New Evaluation'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                            <div style={{ display: 'grid', gap: '20px' }}>
                                {/* Employee */}
                                <div>
                                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                                        Employee *
                                    </label>

                                    {/* Custom Searchable Dropdown */}
                                    <div style={{ position: 'relative' }}>
                                        {/* Click Outside Overlay */}
                                        {isEmployeeDropdownOpen && (
                                            <div
                                                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40, cursor: 'default' }}
                                                onClick={() => setIsEmployeeDropdownOpen(false)}
                                            />
                                        )}

                                        {/* Trigger */}
                                        <div
                                            onClick={() => setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen)}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '10px',
                                                fontSize: '0.95rem',
                                                cursor: 'pointer',
                                                background: 'white',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                position: 'relative',
                                                zIndex: 41
                                            }}
                                        >
                                            <span style={{ color: formData.employee_id ? '#1f2937' : '#9ca3af' }}>
                                                {formData.employee_id
                                                    ? employees.find(e => e.id === formData.employee_id)?.full_name
                                                    : 'Select Employee'}
                                            </span>
                                            <ChevronDown size={16} color="#6b7280" />
                                        </div>

                                        {/* Dropdown Menu */}
                                        {isEmployeeDropdownOpen && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '110%',
                                                left: 0,
                                                right: 0,
                                                background: 'white',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '10px',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                                zIndex: 50,
                                                maxHeight: '300px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{ padding: '10px', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
                                                    <div style={{ position: 'relative' }}>
                                                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                                        <input
                                                            type="text"
                                                            placeholder="Search employee..."
                                                            value={employeeSearchTerm}
                                                            onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                                                            autoFocus
                                                            style={{
                                                                width: '100%',
                                                                padding: '8px 12px 8px 36px',
                                                                border: '1px solid #d1d5db',
                                                                borderRadius: '6px',
                                                                outline: 'none',
                                                                fontSize: '0.9rem'
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                </div>

                                                <div style={{ overflowY: 'auto' }}>
                                                    {employees.filter(emp => emp.full_name.toLowerCase().includes(employeeSearchTerm.toLowerCase())).length > 0 ? (
                                                        employees
                                                            .filter(emp => emp.full_name.toLowerCase().includes(employeeSearchTerm.toLowerCase()))
                                                            .map(emp => (
                                                                <div
                                                                    key={emp.id}
                                                                    onClick={() => {
                                                                        setFormData({ ...formData, employee_id: emp.id });
                                                                        setIsEmployeeDropdownOpen(false);
                                                                        setEmployeeSearchTerm('');
                                                                    }}
                                                                    style={{
                                                                        padding: '12px 16px',
                                                                        cursor: 'pointer',
                                                                        borderBottom: '1px solid #f9fafb',
                                                                        background: formData.employee_id === emp.id ? '#f0f9ff' : 'white',
                                                                        color: formData.employee_id === emp.id ? '#0369a1' : '#374151',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '12px'
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        if (formData.employee_id !== emp.id) e.currentTarget.style.background = '#f9fafb';
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        if (formData.employee_id !== emp.id) e.currentTarget.style.background = 'white';
                                                                    }}
                                                                >
                                                                    <div style={{
                                                                        width: '28px', height: '28px', borderRadius: '50%',
                                                                        background: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '600'
                                                                    }}>
                                                                        {emp.full_name.charAt(0)}
                                                                    </div>
                                                                    {emp.full_name}
                                                                </div>
                                                            ))
                                                    ) : (
                                                        <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
                                                            No employees found
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Project (Optional) */}
                                <div>
                                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                                        Project (Optional)
                                    </label>
                                    <select
                                        value={formData.project_id}
                                        onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '10px',
                                            fontSize: '0.95rem'
                                        }}
                                    >
                                        <option value="">Organization Level</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Period */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                                            Period Type *
                                        </label>
                                        <select
                                            required
                                            value={formData.period}
                                            onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '10px',
                                                fontSize: '0.95rem'
                                            }}
                                        >
                                            <option value="month">Monthly</option>
                                            <option value="quarter">Quarterly</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                                            {formData.period === 'month' ? 'Month *' : 'Quarter *'}
                                        </label>
                                        {formData.period === 'month' ? (
                                            <select
                                                required
                                                value={formData.period_month}
                                                onChange={(e) => setFormData({ ...formData, period_month: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '10px',
                                                    fontSize: '0.95rem'
                                                }}
                                            >
                                                {MONTHS.map(m => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <select
                                                required
                                                value={formData.period_quarter}
                                                onChange={(e) => setFormData({ ...formData, period_quarter: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '12px',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '10px',
                                                    fontSize: '0.95rem'
                                                }}
                                            >
                                                {QUARTERS.map(q => (
                                                    <option key={q} value={q}>{q}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                                            Year *
                                        </label>
                                        <select
                                            required
                                            value={formData.period_year}
                                            onChange={(e) => setFormData({ ...formData, period_year: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '10px',
                                                fontSize: '0.95rem'
                                            }}
                                        >
                                            {YEARS.map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Performance Score */}
                                <div>
                                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                                        Performance Score (0-10)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="0.1"
                                        placeholder="0 - 10"
                                        value={formData.score}
                                        onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '10px',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>

                                {/* Soft Skills Section */}
                                <div>
                                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                                        Soft Skills (0-10 each) - Average: {(() => {
                                            const scores = SOFT_SKILLS.map(s => parseFloat(formData[s.key]) || 0).filter(v => v > 0);
                                            return scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
                                        })()}
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                                        {SOFT_SKILLS.map(skill => (
                                            <div key={skill.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <label style={{ flex: '1', fontSize: '0.9rem', color: '#4b5563' }}>
                                                    {skill.label}
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="10"
                                                    step="0.1"
                                                    placeholder="0-10"
                                                    value={formData[skill.key]}
                                                    onChange={(e) => setFormData({ ...formData, [skill.key]: e.target.value })}
                                                    style={{
                                                        width: '70px',
                                                        padding: '8px',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '8px',
                                                        fontSize: '0.9rem',
                                                        textAlign: 'center'
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Review */}
                                <div>
                                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                                        Review
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Write your performance review..."
                                        value={formData.review}
                                        onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '10px',
                                            fontSize: '0.95rem',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                {/* Improvements */}
                                <div>
                                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                                        Areas for Improvement
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Suggestions for improvement..."
                                        value={formData.improvements}
                                        onChange={(e) => setFormData({ ...formData, improvements: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '10px',
                                            fontSize: '0.95rem',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Submit */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        padding: '12px 24px',
                                        background: '#f3f4f6',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        color: '#374151'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '12px 24px',
                                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                        border: 'none',
                                        borderRadius: '10px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <Save size={18} />
                                    {selectedEvaluation ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformanceEvaluation;
