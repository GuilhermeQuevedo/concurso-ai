import { Routes, Route, Navigate } from 'react-router';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SubjectsPage } from '@/pages/SubjectsPage';
import { ExamBoardsPage } from '@/pages/ExamBoardsPage';
import { GeneratePage } from '@/pages/GeneratePage';
import { BoardPage } from '@/pages/BoardPage';
import StudyPage from '@/pages/StudyPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { FlashcardsPage } from '@/pages/FlashcardsPage';
import { AchievementsPage } from '@/pages/AchievementsPage';
import { StudyPlanPage } from '@/pages/StudyPlanPage';
import { StatsPage } from '@/pages/StatsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { GroupsPage } from '@/pages/GroupsPage';
import { EssayPage } from '@/pages/EssayPage';
import { ContestsPage } from '@/pages/ContestsPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { MemorySimulatorPage } from '@/pages/MemorySimulatorPage';
import { RankingsPage } from '@/pages/RankingsPage';
import { GamesPage } from '@/pages/GamesPage';
import { AdminPage } from '@/pages/AdminPage';
import { AdminContactsPage } from '@/pages/AdminContactsPage';
import { HelpPage } from '@/pages/HelpPage';
import { MethodologyPage } from '@/pages/MethodologyPage';
import { GettingStartedPage } from '@/pages/GettingStartedPage';
import { ErrorNotebookPage } from '@/pages/ErrorNotebookPage';
import { ExamSlicerPage } from '@/pages/ExamSlicerPage';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { SubscriptionGate } from '@/features/subscription/components/SubscriptionGate';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <SubscriptionGate>
        <DashboardLayout>{children}</DashboardLayout>
      </SubscriptionGate>
    </ProtectedRoute>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/planos" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
      <Route path="/subjects" element={<ProtectedLayout><SubjectsPage /></ProtectedLayout>} />
      <Route path="/exam-boards" element={<ProtectedLayout><ExamBoardsPage /></ProtectedLayout>} />
      <Route path="/generate" element={<ProtectedLayout><GeneratePage /></ProtectedLayout>} />
      <Route path="/exam-slicer" element={<ProtectedLayout><ExamSlicerPage /></ProtectedLayout>} />
      <Route path="/error-notebook" element={<ProtectedLayout><ErrorNotebookPage /></ProtectedLayout>} />
      <Route path="/study" element={<ProtectedLayout><StudyPage /></ProtectedLayout>} />
      <Route path="/documents" element={<ProtectedLayout><DocumentsPage /></ProtectedLayout>} />
      <Route path="/flashcards" element={<ProtectedLayout><FlashcardsPage /></ProtectedLayout>} />
      <Route path="/achievements" element={<ProtectedLayout><AchievementsPage /></ProtectedLayout>} />
      <Route path="/study-plan" element={<ProtectedLayout><StudyPlanPage /></ProtectedLayout>} />
      <Route path="/board" element={<ProtectedLayout><BoardPage /></ProtectedLayout>} />
      <Route path="/contests" element={<ProtectedLayout><ContestsPage /></ProtectedLayout>} />
      <Route path="/calendar" element={<ProtectedLayout><CalendarPage /></ProtectedLayout>} />
      <Route path="/essays" element={<ProtectedLayout><EssayPage /></ProtectedLayout>} />
      <Route path="/groups" element={<ProtectedLayout><GroupsPage /></ProtectedLayout>} />
      <Route path="/stats" element={<ProtectedLayout><StatsPage /></ProtectedLayout>} />
      <Route path="/memory-simulator" element={<ProtectedLayout><MemorySimulatorPage /></ProtectedLayout>} />
      <Route path="/games" element={<ProtectedLayout><GamesPage /></ProtectedLayout>} />
      <Route path="/rankings" element={<ProtectedLayout><RankingsPage /></ProtectedLayout>} />
      <Route path="/admin" element={<ProtectedLayout><AdminPage /></ProtectedLayout>} />
      <Route path="/admin/contatos" element={<ProtectedLayout><AdminContactsPage /></ProtectedLayout>} />
      <Route path="/settings" element={<ProtectedLayout><SettingsPage /></ProtectedLayout>} />
      <Route path="/profile" element={<ProtectedLayout><ProfilePage /></ProtectedLayout>} />
      <Route path="/help" element={<ProtectedLayout><HelpPage /></ProtectedLayout>} />
      <Route path="/metodologia" element={<ProtectedLayout><MethodologyPage /></ProtectedLayout>} />
      <Route path="/getting-started" element={<ProtectedLayout><GettingStartedPage /></ProtectedLayout>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
