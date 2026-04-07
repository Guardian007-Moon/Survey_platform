import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './pages/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import ManageCourses from './pages/ManageCourses';
import ManageSkills from './pages/ManageSkills';
import CreateSurvey from './pages/CreateSurvey';
import ManageExperts from './pages/ManageExperts';
import ViewResults from './pages/ViewResults';
import SurveyPage from './pages/SurveyPage';

import { useState, useEffect } from 'react';
import api from './api';

function ProtectedRoute({ children }) {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    async function verify() {
      if (!token) {
        setIsValid(false);
        setIsVerifying(false);
        return;
      }
      try {
        await api.get('/admin/me');
        setIsValid(true);
      } catch (err) {
        localStorage.removeItem('adminToken');
        setIsValid(false);
      } finally {
        setIsVerifying(false);
      }
    }
    verify();
  }, [token]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--st-surface)]">
        <div className="w-8 h-8 border-4 border-[var(--st-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return isValid ? children : <Navigate to="/admin/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="courses" element={<ManageCourses />} />
          <Route path="skills" element={<ManageSkills />} />
          <Route path="surveys" element={<CreateSurvey />} />
          <Route path="experts" element={<ManageExperts />} />
          <Route path="results" element={<ViewResults />} />
        </Route>
        <Route path="/survey/:token" element={<SurveyPage />} />
        <Route path="/survey/p/:publicId" element={<SurveyPage />} />
        <Route path="*" element={<Navigate to="/admin" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
