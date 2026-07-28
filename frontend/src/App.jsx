import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';

import AdminDashboard from './pages/admin/AdminDashboard';
import ManageStudents from './pages/admin/ManageStudents';
import ManageTeachers from './pages/admin/ManageTeachers';
import ManageCompanies from './pages/admin/ManageCompanies';
import ManageAssignments from './pages/admin/ManageAssignments';
import ImportStudents from './pages/admin/ImportStudents';

import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherStudents from './pages/teacher/TeacherStudents';
import TeacherReports from './pages/teacher/TeacherReports';
import TeacherGrading from './pages/teacher/TeacherGrading';
import SupervisionRequests from './pages/teacher/SupervisionRequests';

import StudentDashboard from './pages/student/StudentDashboard';
import StudentReports from './pages/student/StudentReports';
import StudentScores from './pages/student/StudentScores';
import RequestSupervisor from './pages/student/RequestSupervisor';
import FileViewerPage from './pages/FileViewerPage';

const RootRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
  if (user.role === 'student') return <Navigate to="/student" replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />

            {/* Admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/students" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageStudents />
              </ProtectedRoute>
            } />
            <Route path="/admin/import" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ImportStudents />
              </ProtectedRoute>
            } />
            <Route path="/admin/teachers" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageTeachers />
              </ProtectedRoute>
            } />
            <Route path="/admin/companies" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageCompanies />
              </ProtectedRoute>
            } />
            <Route path="/admin/assignments" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageAssignments />
              </ProtectedRoute>
            } />

            {/* Teacher routes */}
            <Route path="/teacher" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            <Route path="/teacher/students" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherStudents />
              </ProtectedRoute>
            } />
            <Route path="/teacher/requests" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <SupervisionRequests />
              </ProtectedRoute>
            } />
            <Route path="/teacher/reports" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherReports />
              </ProtectedRoute>
            } />
            <Route path="/teacher/grading" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherGrading />
              </ProtectedRoute>
            } />

            {/* Student routes */}
            <Route path="/student" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/student/supervisor" element={
              <ProtectedRoute allowedRoles={['student']}>
                <RequestSupervisor />
              </ProtectedRoute>
            } />
            <Route path="/student/reports" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentReports />
              </ProtectedRoute>
            } />
            <Route path="/student/scores" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentScores />
              </ProtectedRoute>
            } />

            <Route path="/view-file" element={<FileViewerPage />} />

            <Route path="/" element={<RootRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
