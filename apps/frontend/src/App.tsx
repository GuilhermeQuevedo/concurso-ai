import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { Toaster } from './components/ui/Toaster';
import { AuthProvider } from './features/auth/contexts/AuthContext';
import { TourProvider } from './features/tour/TourProvider';
import { CookieBanner } from './features/privacy/components/CookieBanner';
import { AppRoutes } from './routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TourProvider>
            <AppRoutes />
            <CookieBanner />
            <Toaster />
          </TourProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
