import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, LogOut, Users, KeyRound } from "lucide-react";
import triotecaLogo from "@/assets/trioteca-logo-vert.png";

interface GestorUser {
  id: string;
  email: string;
  created_at: string;
  roles: string[];
}

const UserManagement = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const [users, setUsers] = useState<GestorUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteUser, setDeleteUser] = useState<GestorUser | null>(null);
  const [resetPwUser, setResetPwUser] = useState<GestorUser | null>(null);
  const [resetPwValue, setResetPwValue] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);

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
    if (isAdmin) loadUsers();
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      const res = await supabase.functions.invoke("list-gestors", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.error) throw new Error(res.error.message);
      setUsers(res.data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await supabase.functions.invoke("manage-gestor", {
        headers: { Authorization: `Bearer ${token}` },
        body: { action: "create", email: newEmail, password: newPassword },
      });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      toast.success("Gestor creado correctamente");
      setNewEmail("");
      setNewPassword("");
      setShowCreate(false);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await supabase.functions.invoke("manage-gestor", {
        headers: { Authorization: `Bearer ${token}` },
        body: { action: "delete", user_id: deleteUser.id },
      });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      toast.success("Usuario eliminado");
      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleteUser(null);
    }
  };

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
            <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/admin/login"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/dashboard")}>
          <ArrowLeft className="h-4 w-4 mr-2" />Volver al dashboard
        </Button>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />Gestión de usuarios
            </CardTitle>
            <Button onClick={() => setShowCreate(!showCreate)}>
              <Plus className="h-4 w-4 mr-2" />Nuevo gestor
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {showCreate && (
              <Card className="border-dashed">
                <CardContent className="pt-4">
                  <form onSubmit={handleCreate} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="new-email">Email</Label>
                        <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required placeholder="gestor@ejemplo.com" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="new-password">Contraseña</Label>
                        <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={creating}>{creating ? "Creando..." : "Crear gestor"}</Button>
                      <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {loading ? (
              <p className="text-muted-foreground text-sm">Cargando usuarios...</p>
            ) : users.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay usuarios registrados.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Registrado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {u.roles.map((r) => (
                            <Badge key={r} variant={r === "admin" ? "default" : "secondary"}>{r}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(u.created_at).toLocaleDateString("es-ES")}</TableCell>
                      <TableCell className="text-right">
                        {u.id !== user?.id && (
                          <Button variant="ghost" size="sm" onClick={() => setDeleteUser(u)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará a <strong>{deleteUser?.email}</strong> y todas sus operaciones. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default UserManagement;
