import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  LogOut,
  RefreshCw,
  LayoutDashboard,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import triotecaLogo from "@/assets/trioteca-logo-vert.png";

interface AdminStats {
  last_operation: {
    id: string;
    client_name: string;
    created_at: string;
    author_email: string | null;
    is_published: boolean;
  } | null;
  month_count: number;
  prev_month_count: number;
  month_delta_pct: number | null;
  month_published_count: number;
  publish_rate: number;
  by_gestor: Array<{
    user_id: string;
    email: string | null;
    created: number;
    published: number;
    last_created_at: string | null;
  }>;
}

const AdminDashboard = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/admin/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !isAdmin && user) {
      toast.error("No tienes permisos de administrador");
      navigate("/admin/dashboard");
    }
  }, [isAdmin, roleLoading, user, navigate]);

  useEffect(() => {
    if (isAdmin) loadStats();
  }, [isAdmin]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await supabase.functions.invoke("admin-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      setStats(res.data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const fmtRelative = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return "hace unos segundos";
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 30) return `hace ${d} d`;
    const months = Math.floor(d / 30);
    return `hace ${months} mes${months > 1 ? "es" : ""}`;
  };

  const monthName = new Date().toLocaleDateString("es-ES", { month: "long" });
  const prevMonthName = new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleDateString(
    "es-ES",
    { month: "long" }
  );

  if (authLoading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src={triotecaLogo} alt="Trioteca" className="h-8" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                signOut();
                navigate("/admin/login");
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al dashboard
          </Button>
          <Button variant="outline" size="sm" onClick={loadStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6" />
            Panel de administración
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Métricas globales del equipo de gestores.
          </p>
        </div>

        {loading && !stats ? (
          <p className="text-muted-foreground text-sm">Cargando métricas...</p>
        ) : !stats ? (
          <p className="text-muted-foreground text-sm">No hay datos disponibles.</p>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Última comparativa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.last_operation ? (
                    <>
                      <div className="text-lg font-semibold">
                        {fmtRelative(stats.last_operation.created_at)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {fmtDateTime(stats.last_operation.created_at)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        por {stats.last_operation.author_email ?? "—"}
                      </div>
                      {stats.last_operation.client_name && (
                        <div className="text-xs text-muted-foreground truncate">
                          Cliente: {stats.last_operation.client_name}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">Sin comparativas</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Este mes ({monthName})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{stats.month_count}</div>
                  <div className="text-xs text-muted-foreground mt-1">comparativas creadas</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {prevMonthName.charAt(0).toUpperCase() + prevMonthName.slice(1)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{stats.prev_month_count}</div>
                  <div className="text-xs mt-1 flex items-center gap-1">
                    {stats.month_delta_pct === null ? (
                      <span className="text-muted-foreground">sin comparación</span>
                    ) : stats.month_delta_pct >= 0 ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />+{Math.round(stats.month_delta_pct * 100)}%
                      </span>
                    ) : (
                      <span className="text-destructive flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        {Math.round(stats.month_delta_pct * 100)}%
                      </span>
                    )}
                    <span className="text-muted-foreground">vs. este mes</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Publicadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">
                    {stats.month_published_count}
                    <span className="text-base text-muted-foreground font-normal">
                      {" / "}
                      {stats.month_count}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {Math.round(stats.publish_rate * 100)}% del mes publicadas
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Per-gestor table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Actividad por gestor — {monthName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.by_gestor.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Ningún gestor ha creado comparativas este mes.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Gestor</TableHead>
                        <TableHead className="text-right">Creadas</TableHead>
                        <TableHead className="text-right">Publicadas</TableHead>
                        <TableHead>Última creada</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.by_gestor.map((g) => (
                        <TableRow key={g.user_id}>
                          <TableCell className="font-medium">
                            {g.email ?? <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{g.created}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={g.published > 0 ? "default" : "outline"}>
                              {g.published}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {g.last_created_at ? fmtDateTime(g.last_created_at) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
