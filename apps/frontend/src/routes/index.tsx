import { Routes, Route, Navigate } from 'react-router';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SubjectsPage } from '@/pages/SubjectsPage';
import { ExamBoardsPage } from '@/pages/ExamBoardsPage';
import { GeneratePage } from '@/pages/GeneratePage';
import StudyPage from '@/pages/StudyPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { FlashcardsPage } from '@/pages/FlashcardsPage';
import { AchievementsPage } from '@/pages/AchievementsPage';
import { StudyPlanPage } from '@/pages/StudyPlanPage';
import { StatsPage } from '@/pages/StatsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { GroupsPage } from '@/pages/GroupsPage';
import { EssayPage } from '@/pages/EssayPage';
import { ContestsPage } from '@/pages/ContestsPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { HelpPage } from '@/pages/HelpPage';
import { GettingStartedPage } from '@/pages/GettingStartedPage';
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
      <Route path="/documents" element={<ProtectedLayout><DocumentsPage /></ProtectedLayout>} />
      <Route path="/flashcards" element={<ProtectedLayout><FlashcardsPage /></ProtectedLayout>} />
      <Route path="/achievements" element={<ProtectedLayout><AchievementsPage /></ProtectedLayout>} />
      <Route path="/study-plan" element={<ProtectedLayout><StudyPlanPage /></ProtectedLayout>} />
      <Route path="/contests" element={<ProtectedLayout><ContestsPage /></ProtectedLayout>} />
      <Route path="/calendar" element={<ProtectedLayout><CalendarPage /></ProtectedLayout>} />
      <Route path="/essays" element={<ProtectedLayout><EssayPage /></ProtectedLayout>} />
      <Route path="/groups" element={<ProtectedLayout><GroupsPage /></ProtectedLayout>} />
      <Route path="/stats" element={<ProtectedLayout><StatsPage /></ProtectedLayout>} />
      <Route path="/settings" element={<ProtectedLayout><SettingsPage /></ProtectedLayout>} />
      <Route path="/help" element={<ProtectedLayout><HelpPage /></ProtectedLayout>} />
      <Route path="/getting-started" element={<ProtectedLayout><GettingStartedPage /></ProtectedLayout>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
