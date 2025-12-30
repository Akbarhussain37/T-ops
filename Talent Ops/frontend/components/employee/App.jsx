import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import DashboardHome from './pages/DashboardHome';
import ModulePage from './pages/ModulePage';
import ProjectDocuments from './pages/ProjectDocuments';
import OrgHierarchy from './pages/OrgHierarchy';
import ProjectHierarchy from './pages/ProjectHierarchy';
import TaskManagement from './pages/TaskManagement';
import NotificationsPage from '../shared/NotificationsPage';
import MessagingHub from '../shared/MessagingHub';
import { ToastProvider } from './context/ToastContext';
import { UserProvider } from './context/UserContext';
import { ProjectProvider } from './context/ProjectContext';

function App() {
  return (
    <UserProvider>
      <ProjectProvider>
        <ToastProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/employee-dashboard/dashboard" replace />} />
                <Route path="/employee-dashboard" element={<Navigate to="/employee-dashboard/dashboard" replace />} />
                <Route path="/employee-dashboard/dashboard" element={<DashboardHome />} />
                <Route path="/employee-dashboard/documents" element={<ProjectDocuments />} />
                <Route path="/employee-dashboard/org-hierarchy" element={<OrgHierarchy />} />
                <Route path="/employee-dashboard/project-hierarchy" element={<ProjectHierarchy />} />
                <Route path="/employee-dashboard/assign-tasks" element={<TaskManagement />} />
                <Route path="/employee-dashboard/analytics" element={<ModulePage title="My Analytics" type="analytics" />} />
                <Route path="/employee-dashboard/employees" element={<ModulePage title="Team Members" type="workforce" />} />
                <Route path="/employee-dashboard/tasks" element={<ModulePage title="Your Tasks" type="tasks" />} />
                <Route path="/employee-dashboard/leaves" element={<ModulePage title="Leave Requests" type="leaves" />} />
                <Route path="/employee-dashboard/team-status" element={<ModulePage title="Your Status" type="status" />} />
                <Route path="/employee-dashboard/payslips" element={<ModulePage title="Your Payslip" type="payroll" />} />
                <Route path="/employee-dashboard/policies" element={<ModulePage title="Company Policies" type="policies" />} />
                <Route path="/employee-dashboard/announcements" element={<ModulePage title="Announcements" type="announcements" />} />
                <Route path="/employee-dashboard/performance" element={<ModulePage title="Performance" type="default" />} />
                <Route path="/employee-dashboard/approve-leaves" element={<ModulePage title="Approve Leaves" type="leaves" />} />
                <Route path="/employee-dashboard/manage-members" element={<ModulePage title="Manage Members" type="workforce" />} />
                <Route path="/employee-dashboard/messages" element={<MessagingHub />} />
                <Route path="/employee-dashboard/notifications" element={<NotificationsPage />} />
                <Route path="/employee-dashboard/hierarchy" element={<ModulePage title="Team Hierarchy" type="default" />} />
                <Route path="/employee-dashboard/audit" element={<ModulePage title="Audit Logs" type="default" />} />
                <Route path="/employee-dashboard/settings" element={<ModulePage title="Settings" type="default" />} />
                <Route path="*" element={<Navigate to="/employee-dashboard/dashboard" replace />} />
              </Routes>
            </Layout>
          </Router>
        </ToastProvider>
      </ProjectProvider>
    </UserProvider>
  );
}

export default App;
