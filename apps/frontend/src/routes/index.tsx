import { Routes, Route } from 'react-router';
import { HomePage } from '@/pages/HomePage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}
