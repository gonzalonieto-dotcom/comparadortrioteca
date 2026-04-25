import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import Login from "./pages/Login";
import Operations from "./pages/admin/Operations";
import ChecklistManager from "./pages/admin/ChecklistManager";
import OperationEditor from "./pages/admin/OperationEditor";
import UserManagement from "./pages/admin/UserManagement";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ClientComparison from "./pages/ClientComparison";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const RedirectOpToC = () => {
  const { token } = useParams();
  return <Navigate to={`/c/${token}`} replace />;
};

const RedirectOpsToEditor = () => {
  const { id } = useParams();
  return <Navigate to={`/admin/dashboard/${id}`} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin/dashboard" element={<Operations />} />
          <Route path="/admin/dashboard/:id" element={<OperationEditor />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/stats" element={<AdminDashboard />} />
          <Route path="/admin/checklists" element={<ChecklistManager />} />
          <Route path="/c/:token" element={<ClientComparison />} />
          {/* Legacy routes */}
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/operations/:id" element={<RedirectOpsToEditor />} />
          <Route path="/op/:token" element={<RedirectOpToC />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
