import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { fetchMyOperations, createOperation, deleteOperation, updateOperation, type DbOperation } from "@/hooks/useOperation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Copy, LogOut, Eye, EyeOff, Users, ClipboardList } from "lucide-react";
import triotecaLogo from "@/assets/trioteca-logo-vert.png";

const PUBLIC_BASE_URL = "https://comparadortrioteca.lovable.app";

const Operations = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { isAdmin } = useRole();
  const navigate = useNavigate();
  const [operations, setOperations] = useState<DbOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/admin/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) loadOperations();
  }, [user]);

  const loadOperations = async () => {
    try {
      setLoading(true);
      const ops = await fetchMyOperations();
      setOperations(ops);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = async () => {
    try {
      const op = await createOperation({
        client_name: "",
        purchase_price: 250000,
        appraisal_value: 260000,
        loan_amount: 200000,
        term_years: 30,
        home_insurance_annual: 223.86,
        life_insurance_annual: 180,
        appraisal_cost: 400,
      });
      navigate(`/admin/dashboard/${op.id}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteOperation(deleteId);
      setOperations((prev) => prev.filter((o) => o.id !== deleteId));
      toast.success("Operación eliminada");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleteId(null);
    }
  };

  const togglePublish = async (op: DbOperation) => {
    try {
      const updated = await updateOperation(op.id, { is_published: !op.is_published } as any);
      setOperations((prev) => prev.map((o) => o.id === op.id ? { ...o, is_published: updated.is_published } : o));
      toast.success(updated.is_published ? "Comparativa publicada" : "Comparativa despublicada");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const copyLink = (op: DbOperation) => {
    if (!op.is_published) {
      toast.error("Publica la comparativa antes de copiar el link");
      return;
    }
    navigator.clipboard.writeText(`${PUBLIC_BASE_URL}/c/${op.share_token}`);
    toast.success("Link copiado al portapapeles");
  };

  const fmt = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <img src={triotecaLogo} alt="Trioteca" className="h-8" />
          <div className="flex items-center gap-3">
            {isAdmin && (
              <>
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/checklists")}>
                  <ClipboardList className="h-4 w-4 mr-1" />Checklists
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/users")}>
                  <Users className="h-4 w-4 mr-1" />Usuarios
                </Button>
              </>
            )}
            <span className="text-xs text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/admin/login"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Mis comparativas</CardTitle>
            <Button onClick={handleNew}><Plus className="h-4 w-4 mr-2" />Nueva comparativa</Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Cargando...</p>
            ) : operations.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay comparativas aún. Crea la primera.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead>Cliente</TableHead>
                     <TableHead>Importe</TableHead>
                     <TableHead>Precio vivienda</TableHead>
                    <TableHead>Plazo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creada</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operations.map((op) => (
                    <TableRow key={op.id}>
                      <TableCell className="font-medium">{op.client_name || <span className="text-muted-foreground italic">Sin nombre</span>}</TableCell>
                      <TableCell>{fmt(op.loan_amount)}</TableCell>
                      <TableCell>{fmt(op.purchase_price)}</TableCell>
                      <TableCell>{op.term_years} años</TableCell>
                      <TableCell>
                        <Badge variant={op.is_published ? "default" : "secondary"}>
                          {op.is_published ? "Publicada" : "Borrador"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(op.created_at).toLocaleDateString("es-ES")}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/dashboard/${op.id}`)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => togglePublish(op)} title={op.is_published ? "Despublicar" : "Publicar"}>
                          {op.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => copyLink(op)} disabled={!op.is_published}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(op.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar comparativa?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará esta operación y todas sus ofertas asociadas. Esta acción no se puede deshacer.
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

export default Operations;
