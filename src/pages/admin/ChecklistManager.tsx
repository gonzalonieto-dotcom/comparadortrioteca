import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft, GripVertical, Save, ExternalLink } from "lucide-react";
import { BankLogo } from "@/lib/bankLogos";
import { BANK_PRESETS } from "@/components/admin/OfferEditor";
import triotecaLogo from "@/assets/trioteca-logo-vert.png";

interface ChecklistItem {
  id?: string;
  bank_name: string;
  label: string;
  sort_order: number;
  is_gatekeeper: boolean;
  link_url: string;
  link_label: string;
  notify_gestor_on_complete: boolean;
}

const BANKS = Object.keys(BANK_PRESETS);

const ChecklistManager = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [banksWithItems, setBanksWithItems] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/admin/dashboard");
  }, [user, authLoading, isAdmin, navigate]);

  // Load banks that have checklist items
  useEffect(() => {
    supabase
      .from("bank_checklist_items")
      .select("bank_name")
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set(data.map((d: any) => d.bank_name))];
          setBanksWithItems(unique);
        }
      });
  }, []);

  // Load items when bank changes
  useEffect(() => {
    if (!selectedBank) { setItems([]); return; }
    setLoading(true);
    supabase
      .from("bank_checklist_items")
      .select("*")
      .eq("bank_name", selectedBank)
      .order("sort_order")
      .then(({ data, error }) => {
        if (error) { toast.error(error.message); setLoading(false); return; }
        setItems((data || []).map((d: any) => ({
          id: d.id,
          bank_name: d.bank_name,
          label: d.label,
          sort_order: d.sort_order,
          is_gatekeeper: d.is_gatekeeper,
          link_url: d.link_url || "",
          link_label: d.link_label || "",
          notify_gestor_on_complete: d.notify_gestor_on_complete,
        })));
        setLoading(false);
      });
  }, [selectedBank]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        bank_name: selectedBank,
        label: "",
        sort_order: prev.length,
        is_gatekeeper: prev.length === 0,
        link_url: "",
        link_label: "",
        notify_gestor_on_complete: false,
      },
    ]);
  };

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateItem = (idx: number, patch: Partial<ChecklistItem>) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, ...patch } : item));
  };

  const moveItem = (idx: number, direction: -1 | 1) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= items.length) return;
    const newItems = [...items];
    [newItems[idx], newItems[newIdx]] = [newItems[newIdx], newItems[idx]];
    setItems(newItems.map((item, i) => ({ ...item, sort_order: i })));
  };

  const handleSave = async () => {
    if (!selectedBank) return;
    if (items.some((i) => !i.label.trim())) {
      toast.error("Todos los pasos deben tener una descripción");
      return;
    }
    setSaving(true);
    try {
      // Delete existing items for this bank
      const { error: delErr } = await supabase
        .from("bank_checklist_items")
        .delete()
        .eq("bank_name", selectedBank);
      if (delErr) throw delErr;

      // Insert new items
      if (items.length > 0) {
        const rows = items.map((item, idx) => ({
          bank_name: selectedBank,
          label: item.label.trim(),
          sort_order: idx,
          is_gatekeeper: item.is_gatekeeper,
          link_url: item.link_url || null,
          link_label: item.link_label || null,
          notify_gestor_on_complete: item.notify_gestor_on_complete,
        }));
        const { error: insErr } = await supabase
          .from("bank_checklist_items")
          .insert(rows);
        if (insErr) throw insErr;
      }

      toast.success(`Checklist de ${selectedBank} guardado`);
      // Update banks list
      setBanksWithItems((prev) => {
        const set = new Set(prev);
        if (items.length > 0) set.add(selectedBank);
        else set.delete(selectedBank);
        return [...set];
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <img src={triotecaLogo} alt="Trioteca" className="h-8" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Configurar Checklists</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Bank selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selecciona un banco</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedBank} onValueChange={setSelectedBank}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Seleccionar banco..." />
              </SelectTrigger>
              <SelectContent>
                {BANKS.map((bank) => (
                  <SelectItem key={bank} value={bank}>
                    <div className="flex items-center gap-2">
                      <BankLogo bankName={bank} size="sm" showName={false} />
                      <span>{bank}</span>
                      {banksWithItems.includes(bank) && (
                        <span className="text-[10px] text-primary ml-1">● configurado</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Checklist items */}
        {selectedBank && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BankLogo bankName={selectedBank} size="md" showName={true} />
                <span className="text-muted-foreground font-normal">— Pasos para avanzar</span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" /> Agregar paso
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" /> {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay pasos configurados. Agrega el primero.</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                      <div className="flex items-start gap-3">
                        {/* Reorder buttons */}
                        <div className="flex flex-col gap-0.5 pt-1">
                          <button
                            onClick={() => moveItem(idx, -1)}
                            disabled={idx === 0}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs"
                          >▲</button>
                          <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                          <button
                            onClick={() => moveItem(idx, 1)}
                            disabled={idx === items.length - 1}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs"
                          >▼</button>
                        </div>

                        <div className="flex-1 space-y-3">
                          {/* Label */}
                          <div>
                            <Label className="text-xs text-muted-foreground">Paso {idx + 1}</Label>
                            <Input
                              value={item.label}
                              onChange={(e) => updateItem(idx, { label: e.target.value })}
                              placeholder="Descripción del paso..."
                              className="mt-1"
                            />
                          </div>

                          {/* Toggles row */}
                          <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 text-xs">
                              <Switch
                                checked={item.is_gatekeeper}
                                onCheckedChange={(v) => updateItem(idx, { is_gatekeeper: v })}
                                className="scale-75"
                              />
                              <span>Gatekeeper (bloquea siguientes)</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs">
                              <Switch
                                checked={item.notify_gestor_on_complete}
                                onCheckedChange={(v) => updateItem(idx, { notify_gestor_on_complete: v })}
                                className="scale-75"
                              />
                              <span>Notificar gestor al completar</span>
                            </label>
                          </div>

                          {/* Link fields */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">URL del enlace (opcional)</Label>
                              <Input
                                value={item.link_url}
                                onChange={(e) => updateItem(idx, { link_url: e.target.value })}
                                placeholder="https://..."
                                className="mt-1 text-xs"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Texto del enlace</Label>
                              <Input
                                value={item.link_label}
                                onChange={(e) => updateItem(idx, { link_label: e.target.value })}
                                placeholder="Abrir cuenta en..."
                                className="mt-1 text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Delete */}
                        <Button variant="ghost" size="sm" onClick={() => removeItem(idx)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ChecklistManager;
