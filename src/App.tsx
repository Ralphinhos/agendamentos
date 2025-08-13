import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Editor from "./pages/Editor";
import UploadPage from "./pages/Upload";
import Confirmation from "./pages/Confirmation";
import LoginPage from "./pages/Login";
import NotificationsPage from "./pages/Notifications";
import Header from "./components/Header";
import { BookingsProvider } from "./context/BookingsContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { useIdleTimer } from "./hooks/use-idle-timer";
import { SessionTimeoutDialog } from "./components/SessionTimeoutDialog";

const queryClient = new QueryClient();

const AppContent = () => {
  const { logout, user } = useAuth();

  const { isWarning, reset: resetIdleTimer } = useIdleTimer({
    onIdle: logout,
    warningTimeout: 1000 * 60 * 9, // 9 minutos
    idleTimeout: 1000 * 60 * 10, // 10 minutos
  });

  return (
    <>
      {user && (
        <SessionTimeoutDialog
          isOpen={isWarning}
          onContinue={resetIdleTimer}
          onLogout={logout}
        />
      )}
      <Header />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/confirmacao/:bookingId" element={<Confirmation />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/" element={<Index />} />
          <Route path="/agendamentos" element={<Admin />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['editor']} />}>
          <Route path="/editor" element={<Editor />} />
          <Route path="/upload/:id" element={<UploadPage />} />
        </Route>

        {/* Routes accessible by multiple roles */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'editor']} />}>
          <Route path="/notificacoes" element={<NotificationsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="light" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <BookingsProvider>
                <AppContent />
            </BookingsProvider>
          </AuthProvider>
        </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
