import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";
import Index from "./pages/Index";
import Solicitudes from "./pages/Solicitudes";
import NuevaSolicitud from "./pages/NuevaSolicitud";
import SolicitudDetalle from "./pages/SolicitudDetalle";
import MiTaller from "./pages/MiTaller";
import MisReparaciones from "./pages/MisReparaciones";
import Mensajes from "./pages/Mensajes";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <GlobalErrorBoundary>
            <Routes>
              {/* Public routes - accessible without login */}
              <Route path="/" element={<Solicitudes />} />
              <Route path="/solicitud/:id" element={<SolicitudDetalle />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/home" element={<Index />} />

              {/* Protected routes - require login */}
              <Route path="/nueva-solicitud" element={
                <ProtectedRoute>
                  <NuevaSolicitud />
                </ProtectedRoute>
              } />
              <Route path="/mi-taller" element={
                <ProtectedRoute>
                  <MiTaller />
                </ProtectedRoute>
              } />
              <Route path="/mis-reparaciones" element={
                <ProtectedRoute>
                  <MisReparaciones />
                </ProtectedRoute>
              } />
              <Route path="/mensajes" element={
                <ProtectedRoute>
                  <Mensajes />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </GlobalErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
