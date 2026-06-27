import { Routes, Route, Navigate } from 'react-router';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SubjectsPage } from '@/pages/SubjectsPage';
import { ExamBoardsPage } from '@/pages/ExamBoardsPage';
import { GeneratePage } from '@/pages/GeneratePage';
import StudyPage from '@/pages/StudyPage';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
      <Route path="/subjects" element={<ProtectedLayout><SubjectsPage /></ProtectedLayout>} />
      <Route path="/exam-boards" element={<ProtectedLayout><ExamBoardsPage /></ProtectedLayout>} />
      <Route path="/generate" element={<ProtectedLayout><GeneratePage /></ProtectedLayout>} />
      <Route path="/study" element={<ProtectedLayout><StudyPage /></ProtectedLayout>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
