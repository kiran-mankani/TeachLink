// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import StudentDashboard from './pages/student/StudentDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentProfile from './pages/student/StudentProfile';
import TeacherProfile from './pages/teacher/TeacherProfile';
import TeacherRequests from './pages/teacher/TeacherRequests';
import TeacherRequestDetail from './pages/teacher/TeacherRequestDetail';
import FindTutor from './pages/student/FindTutor';
import CompleteProfile from './pages/student/CompleteProfile';
import TeacherCompleteProfile from './pages/teacher/TeacherCompleteProfile';
import TeacherProfileView from './pages/student/TeacherProfile';
import StudentRequests from './pages/student/StudentRequests';
import ManageSchedule from './pages/teacher/ManageSchedule';
import StudentNotifications from './pages/student/StudentNotifications';
import TeacherNotifications from './pages/teacher/TeacherNotifications';
import ViewStudentProfile from './pages/teacher/ViewStudentProfile';
import MyStudents from './pages/teacher/MyStudents';
import MyCourses from './pages/student/MyCourses';
import PaymentPage from './pages/student/PaymentPage';

// ✅ STUDENT PAGES - ADD THESE IMPORTS
import StudentMessages from './pages/student/StudentMessages';
import StudentAttendance from './pages/student/StudentAttendance';

// ✅ TEACHER ROUTES
import FindStudents from './pages/teacher/FindStudents';
import TeacherMessages from './pages/teacher/TeacherMessages';
import TeacherEarnings from './pages/teacher/TeacherEarnings';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherSettings from './pages/teacher/TeacherSettings';

// ✅ ADMIN ROUTES
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTeachers from './pages/admin/AdminTeachers';
import AdminStudents from './pages/admin/AdminStudents';
import AdminPayments from './pages/admin/AdminPayments';
import AdminEnrollments from './pages/admin/AdminEnrollments';
import AdminAttendance from './pages/admin/AdminAttendance';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();
  const location = window.location.pathname;

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '20px',
        color: '#4a3aff'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (location === '/student/complete-profile' || location === '/teacher-complete-profile') {
    return children;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={`/${user.role}-dashboard`} />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* STUDENT COMPLETE PROFILE */}
      <Route
        path="/student/complete-profile"
        element={
          <ProtectedRoute allowedRole="student">
            <CompleteProfile />
          </ProtectedRoute>
        }
      />

      {/* TEACHER COMPLETE PROFILE */}
      <Route
        path="/teacher-complete-profile"
        element={
          <ProtectedRoute allowedRole="teacher">
            <TeacherCompleteProfile />
          </ProtectedRoute>
        }
      />

      {/* STUDENT FIND TUTORS */}
      <Route
        path="/find-tutor"
        element={
          <ProtectedRoute allowedRole="student">
            <FindTutor />
          </ProtectedRoute>
        }
      />

      {/* ============================== */}
      {/* STUDENT ROUTES */}
      {/* ============================== */}
      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student-profile"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/requests"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentRequests />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/notifications"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentNotifications />
          </ProtectedRoute>
        }
      />

      {/* ✅ ADDED: Student Messages Route */}
      <Route
        path="/student/messages"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentMessages />
          </ProtectedRoute>
        }
      />

      {/* ✅ ADDED: Student Attendance Route */}
      <Route
        path="/student/attendance"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentAttendance />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/courses"
        element={
          <ProtectedRoute allowedRole="student">
            <MyCourses />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/payment"
        element={
          <ProtectedRoute allowedRole="student">
            <PaymentPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/payments/:enrollmentId"
        element={
          <ProtectedRoute allowedRole="student">
            <PaymentPage />
          </ProtectedRoute>
        }
      />

      {/* ============================== */}
      {/* TEACHER ROUTES */}
      {/* ============================== */}
      <Route
        path="/teacher-dashboard"
        element={
          <ProtectedRoute allowedRole="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher-profile"
        element={
          <ProtectedRoute allowedRole="teacher">
            <TeacherProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/requests"
        element={
          <ProtectedRoute allowedRole="teacher">
            <TeacherRequests />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/requests/:requestId"
        element={
          <ProtectedRoute allowedRole="teacher">
            <TeacherRequestDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/manage-schedule"
        element={
          <ProtectedRoute allowedRole="teacher">
            <ManageSchedule />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/notifications"
        element={
          <ProtectedRoute allowedRole="teacher">
            <TeacherNotifications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/student-profile/:studentId"
        element={
          <ProtectedRoute allowedRole="teacher">
            <ViewStudentProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/my-students"
        element={
          <ProtectedRoute allowedRole="teacher">
            <MyStudents />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/find-students"
        element={
          <ProtectedRoute allowedRole="teacher">
            <FindStudents />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/messages"
        element={
          <ProtectedRoute allowedRole="teacher">
            <TeacherMessages />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/earnings"
        element={
          <ProtectedRoute allowedRole="teacher">
            <TeacherEarnings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/attendance"
        element={
          <ProtectedRoute allowedRole="teacher">
            <TeacherAttendance />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/settings"
        element={
          <ProtectedRoute allowedRole="teacher">
            <TeacherSettings />
          </ProtectedRoute>
        }
      />

      {/* Student views Teacher Profile */}
      <Route
        path="/teacher-profile/:teacherId"
        element={
          <ProtectedRoute allowedRole="student">
            <TeacherProfileView />
          </ProtectedRoute>
        }
      />

      {/* ============================== */}
      {/* ✅ ADMIN ROUTES */}
      {/* ============================== */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="teachers" element={<AdminTeachers />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="enrollments" element={<AdminEnrollments />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;