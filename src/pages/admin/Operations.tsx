import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyOperations, createOperation, deleteOperation, type DbOperation } from "@/hooks/useOperation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Copy, LogOut } from "lucide-react";
import triotecaLogo from "@/assets/trioteca-logo.svg";

const Operations = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [operations, setOperations] = useState<DbOperation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
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
        purchase_price: 250000,
        appraisal_value: 260000,
        loan_amount: 200000,
        term_years: 30,
        home_insurance_annual: 223.86,
        life_insurance_annual: 180,
        appraisal_cost: 400,
      });
      navigate(`/admin/operations/${op.id}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta operación y todas sus ofertas?")) return;
    try {
      await deleteOperation(id);
      setOperations((prev) => prev.filter((o) => o.id !== id));
      toast.success("Operación eliminada");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/op/${token}`);
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
            <span className="text-xs text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/login"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Mis operaciones</CardTitle>
            <Button onClick={handleNew}><Plus className="h-4 w-4 mr-2" />Nueva operación</Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-sm">Cargando...</p>
            ) : operations.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hay operaciones aún. Crea la primera.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Importe</TableHead>
                    <TableHead>Precio vivienda</TableHead>
                    <TableHead>Plazo</TableHead>
                    <TableHead>Creada</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operations.map((op) => (
                    <TableRow key={op.id}>
                      <TableCell className="font-medium">{fmt(op.loan_amount)}</TableCell>
                      <TableCell>{fmt(op.purchase_price)}</TableCell>
                      <TableCell>{op.term_years} años</TableCell>
                      <TableCell>{new Date(op.created_at).toLocaleDateString("es-ES")}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/operations/${op.id}`)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => copyLink(op.share_token)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(op.id)}>
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
      </main>
    </div>
  );
};

export default Operations;
