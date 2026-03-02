import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  updateOperation, fetchOffersByOperation, upsertOffer, deleteOffer,
  saveLinkages, saveMixedPeriods, type DbOperation,
} from "@/hooks/useOperation";
import { supabase } from "@/integrations/supabase/client";
import OfferEditor, { type OfferFormData } from "@/components/admin/OfferEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Plus, Save, Copy } from "lucide-react";
import triotecaLogo from "@/assets/trioteca-logo.svg";

const OperationEditor = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Operation fields
  const [op, setOp] = useState({
    purchase_price: 0, appraisal_value: 0, loan_amount: 0, term_years: 30,
    home_insurance_annual: 0, life_insurance_annual: 0, appraisal_cost: 0,
  });
  const [shareToken, setShareToken] = useState("");
  const [offers, setOffers] = useState<OfferFormData[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) loadData();
  }, [user, id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: opData, error: opErr } = await supabase
        .from("operations").select("*").eq("id", id!).single();
      if (opErr) throw opErr;
      const dbOp = opData as any as DbOperation;
      setOp({
        purchase_price: dbOp.purchase_price,
        appraisal_value: dbOp.appraisal_value,
        loan_amount: dbOp.loan_amount,
        term_years: dbOp.term_years,
        home_insurance_annual: dbOp.home_insurance_annual,
        life_insurance_annual: dbOp.life_insurance_annual,
        appraisal_cost: dbOp.appraisal_cost,
      });
      setShareToken(dbOp.share_token);

      const { offers: dbOffers, linkages, mixedPeriods } = await fetchOffersByOperation(id!);
      setOffers(dbOffers.map((o) => ({
        id: o.id,
        bank_name: o.bank_name,
        logo_color: o.logo_color,
        type: o.type,
        base_tin: o.base_tin,
        estimated_tae: o.estimated_tae,
        monthly_payment: o.monthly_payment,
        amortization_fee_pct: o.amortization_fee_pct,
        upfront_costs: o.upfront_costs,
        monthly_account_cost: o.monthly_account_cost,
        euribor_rate: o.euribor_rate,
        advantages: o.advantages || [],
        considerations: o.considerations || [],
        sort_order: o.sort_order,
        linkages: linkages.filter((l) => l.offer_id === o.id).map((l) => ({
          label: l.label,
          is_active_default: l.is_active_default,
          discount_weight_pct: l.discount_weight_pct,
          annual_cost: l.annual_cost,
        })),
        mixedPeriods: mixedPeriods.filter((m) => m.offer_id === o.id).map((m) => ({
          from_year: m.from_year,
          to_year: m.to_year,
          fixed_tin: m.fixed_tin,
          spread_over_euribor: m.spread_over_euribor,
        })),
      })));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save operation
      await updateOperation(id!, op);

      // Save offers
      // Get existing offer IDs to detect deletions
      const { offers: existingOffers } = await fetchOffersByOperation(id!);
      const newIds = new Set(offers.filter((o) => o.id).map((o) => o.id));
      for (const existing of existingOffers) {
        if (!newIds.has(existing.id)) {
          await deleteOffer(existing.id);
        }
      }

      for (const offer of offers) {
        const saved = await upsertOffer({
          ...(offer.id ? { id: offer.id } : {}),
          operation_id: id!,
          bank_name: offer.bank_name,
          logo_color: offer.logo_color,
          type: offer.type,
          base_tin: offer.base_tin,
          estimated_tae: offer.estimated_tae,
          monthly_payment: offer.monthly_payment,
          amortization_fee_pct: offer.amortization_fee_pct,
          upfront_costs: offer.upfront_costs,
          monthly_account_cost: offer.monthly_account_cost,
          euribor_rate: offer.euribor_rate,
          advantages: offer.advantages,
          considerations: offer.considerations,
          sort_order: offer.sort_order,
        });
        await saveLinkages(saved.id, offer.linkages);
        await saveMixedPeriods(saved.id, offer.mixedPeriods);
      }

      toast.success("Operación guardada");
      await loadData(); // reload to get IDs
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addOffer = () => {
    setOffers((prev) => [...prev, {
      bank_name: "", logo_color: "hsl(200, 70%, 50%)", type: "Fijo",
      base_tin: 0, estimated_tae: 0, monthly_payment: 0,
      amortization_fee_pct: 0, upfront_costs: 0, monthly_account_cost: 0,
      euribor_rate: null, advantages: [], considerations: [], sort_order: prev.length,
      linkages: [], mixedPeriods: [],
    }]);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/op/${shareToken}`);
    toast.success("Link copiado");
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={triotecaLogo} alt="Trioteca" className="h-8" />
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-4 w-4 mr-1" />Volver
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyLink}>
              <Copy className="h-4 w-4 mr-1" />Link cliente
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-1" />{saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Operation details */}
        <Card>
          <CardHeader>
            <CardTitle>Datos de la operación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Precio vivienda €</Label>
                <Input type="number" value={op.purchase_price} onChange={(e) => setOp({ ...op, purchase_price: +e.target.value })} />
              </div>
              <div>
                <Label>Valor tasación €</Label>
                <Input type="number" value={op.appraisal_value} onChange={(e) => setOp({ ...op, appraisal_value: +e.target.value })} />
              </div>
              <div>
                <Label>Importe préstamo €</Label>
                <Input type="number" value={op.loan_amount} onChange={(e) => setOp({ ...op, loan_amount: +e.target.value })} />
              </div>
              <div>
                <Label>Plazo (años)</Label>
                <Input type="number" value={op.term_years} onChange={(e) => setOp({ ...op, term_years: +e.target.value })} />
              </div>
              <div>
                <Label>Seguro hogar €/año</Label>
                <Input type="number" step="0.01" value={op.home_insurance_annual} onChange={(e) => setOp({ ...op, home_insurance_annual: +e.target.value })} />
              </div>
              <div>
                <Label>Seguro vida €/año</Label>
                <Input type="number" step="0.01" value={op.life_insurance_annual} onChange={(e) => setOp({ ...op, life_insurance_annual: +e.target.value })} />
              </div>
              <div>
                <Label>Coste tasación €</Label>
                <Input type="number" step="0.01" value={op.appraisal_cost} onChange={(e) => setOp({ ...op, appraisal_cost: +e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Offers */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ofertas de bancos</h2>
          <Button onClick={addOffer}>
            <Plus className="h-4 w-4 mr-2" />Añadir oferta
          </Button>
        </div>

        {offers.map((offer, i) => (
          <OfferEditor
            key={offer.id || `new-${i}`}
            offer={offer}
            index={i}
            onChange={(updated) => setOffers((prev) => prev.map((o, idx) => idx === i ? updated : o))}
            onDelete={() => setOffers((prev) => prev.filter((_, idx) => idx !== i))}
          />
        ))}

        {offers.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">
            No hay ofertas aún. Añade la primera oferta de banco.
          </p>
        )}
      </main>
    </div>
  );
};

export default OperationEditor;
