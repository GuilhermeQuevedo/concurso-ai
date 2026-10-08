import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { AuthProvider } from './features/auth/contexts/AuthContext';
import { TourProvider } from './features/tour/TourProvider';
import { AppRoutes } from './routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
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
          </TourProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
