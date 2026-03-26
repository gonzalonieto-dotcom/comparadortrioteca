import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  updateOperation, fetchOffersByOperation, upsertOffer, deleteOffer,
  saveLinkages, saveMixedPeriods, type DbOperation,
} from "@/hooks/useOperation";
import { supabase } from "@/integrations/supabase/client";
import OfferEditor, { type OfferFormData, BANK_PRESETS } from "@/components/admin/OfferEditor";
import { PRESET_LINKAGES } from "@/components/admin/LinkageEditor";
import { calcMonthlyPayment, calcEstimatedTAE, calcBonifiedTIN, generateAmortizationSchedule } from "@/lib/mortgageCalc";
import type { Offer, OperationDefaults, Linkage, MixedRatePeriod } from "@/data/mortgageData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Plus, Save, Copy } from "lucide-react";
import triotecaLogo from "@/assets/trioteca-logo-vert.png";

const PUBLIC_BASE_URL = "https://trioteca-offer-clarity.lovable.app";

const MAX_OFFERS = 5;

const OperationEditor = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [euriborRate, setEuriborRate] = useState<number | null>(null);

  const [op, setOp] = useState({
    purchase_price: 0, appraisal_value: 0, loan_amount: 0, term_years: 30,
    home_insurance_annual: 0, life_insurance_annual: 0, appraisal_cost: 0,
    client_name: "",
  });
  const [shareToken, setShareToken] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [offers, setOffers] = useState<OfferFormData[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/admin/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) loadData();
  }, [user, id]);

  // Fetch Euribor on mount
  useEffect(() => {
    const fetchEuribor = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("fetch-euribor");
        if (!error && data?.success && typeof data.euribor === "number") {
          setEuriborRate(data.euribor);
        }
      } catch (e) {
        console.warn("Could not fetch Euribor:", e);
      }
    };
    fetchEuribor();
  }, []);

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
        client_name: dbOp.client_name || "",
      });
      setShareToken(dbOp.share_token);
      setIsPublished(dbOp.is_published);

      const { offers: dbOffers, linkages, mixedPeriods } = await fetchOffersByOperation(id!);
      setOffers(dbOffers.map((o) => {
        const offerLinkages = linkages.filter((l) => l.offer_id === o.id).map((l) => ({
          label: l.label,
          is_active_default: l.is_active_default,
          discount_weight_pct: l.discount_weight_pct,
          annual_cost: l.annual_cost,
        }));
        // DB stores TIN sin bonificar; subtract active discounts to show bonified TIN to gestor
        const activeDiscount = offerLinkages
          .filter((l) => l.is_active_default)
          .reduce((s, l) => s + l.discount_weight_pct, 0);
        return {
        id: o.id,
        bank_name: o.bank_name,
        logo_color: o.logo_color,
        type: o.type,
        base_tin: +(o.base_tin - activeDiscount).toFixed(4),
        estimated_tae: o.estimated_tae,
        monthly_payment: o.monthly_payment,
        amortization_fee_pct: o.amortization_fee_pct,
        upfront_costs: o.upfront_costs,
        monthly_account_cost: o.monthly_account_cost,
        euribor_rate: o.euribor_rate,
        advantages: o.advantages || [],
        considerations: o.considerations || [],
        sort_order: o.sort_order,
        linkages: offerLinkages,
        term_years_override: (o as any).term_years ?? null,
        mixedPeriods: mixedPeriods.filter((m) => m.offer_id === o.id).map((m) => ({
          from_year: m.from_year,
          to_year: m.to_year,
          fixed_tin: m.fixed_tin,
          spread_over_euribor: m.spread_over_euribor,
        })),
      };
      }));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateOperation(id!, { ...op, is_published: isPublished } as any);

      const { offers: existingOffers } = await fetchOffersByOperation(id!);
      const newIds = new Set(offers.filter((o) => o.id).map((o) => o.id));
      for (const existing of existingOffers) {
        if (!newIds.has(existing.id)) {
          await deleteOffer(existing.id);
        }
      }

      for (let i = 0; i < offers.length; i++) {
        const offer = offers[i];

        // Compute TAE & payment for persistence
        const linkages: Linkage[] = offer.linkages.map((l, j) => ({
          id: `l-${j}`, label: l.label, isActive: l.is_active_default,
          discountWeightPct: l.discount_weight_pct, annualCostEUR: l.annual_cost,
        }));
        const totalDiscount = linkages.filter(l => l.isActive).reduce((s, l) => s + l.discountWeightPct, 0);
        const mixedPeriods: MixedRatePeriod[] | undefined = offer.mixedPeriods.length > 0
          ? offer.mixedPeriods.map(m => ({ fromYear: m.from_year, toYear: m.to_year, fixedTIN: m.fixed_tin ?? undefined, spreadOverEuribor: m.spread_over_euribor ?? undefined }))
          : undefined;
        const calcOffer: Offer = {
          id: offer.id || "temp", bankName: offer.bank_name, logoColor: offer.logo_color,
          type: offer.type as Offer["type"], baseTIN: offer.base_tin + totalDiscount,
          amortizationFeePct: offer.amortization_fee_pct, upfrontCostsEUR: offer.upfront_costs,
          monthlyAccountCostEUR: offer.monthly_account_cost, linkages, advantages: offer.advantages,
          considerations: offer.considerations, mixedPeriods, euriborRate: offer.euribor_rate ?? undefined,
        };
        const offerTermYears = offer.term_years_override ?? op.term_years;
        const defaults: OperationDefaults = {
          purchasePrice: op.loan_amount, appraisalValue: op.loan_amount,
          loanAmount: op.loan_amount, termYears: offerTermYears,
          homeInsuranceAnnualDefault: 0, lifeInsuranceAnnualDefault: 0,
          appraisalCostEUR: op.appraisal_cost,
        };
        const bonifiedTIN = calcBonifiedTIN(calcOffer);
        const termMonths = offerTermYears * 12;
        const schedule = generateAmortizationSchedule(op.loan_amount, bonifiedTIN, termMonths, calcOffer);
        const computedPayment = schedule[0]?.payment ?? calcMonthlyPayment(op.loan_amount, bonifiedTIN, termMonths);
        const computedTAE = calcEstimatedTAE(calcOffer, defaults, schedule);

        const saved = await upsertOffer({
          ...(offer.id ? { id: offer.id } : {}),
          operation_id: id!,
          bank_name: offer.bank_name,
          logo_color: offer.logo_color,
          type: offer.type,
          base_tin: +(offer.base_tin + totalDiscount).toFixed(4),
          estimated_tae: isFinite(computedTAE) ? +computedTAE.toFixed(2) : 0,
          monthly_payment: isFinite(computedPayment) ? +computedPayment.toFixed(2) : 0,
          amortization_fee_pct: offer.amortization_fee_pct,
          upfront_costs: offer.upfront_costs,
          monthly_account_cost: offer.monthly_account_cost,
          euribor_rate: offer.euribor_rate,
          advantages: offer.advantages,
          considerations: offer.considerations,
          sort_order: i,
          term_years: offer.term_years_override,
        } as any);
        await saveLinkages(saved.id, offer.linkages);
        await saveMixedPeriods(saved.id, offer.mixedPeriods);
      }

      toast.success("Comparativa guardada");
      await loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addOffer = () => {
    if (offers.length >= MAX_OFFERS) {
      toast.error(`Máximo ${MAX_OFFERS} ofertas por comparativa`);
      return;
    }
    const defaultLinkages = PRESET_LINKAGES.map((label) => ({
      label,
      is_active_default: true,
      discount_weight_pct: 0,
      annual_cost: 0,
    }));
    setOffers((prev) => {
      const newOffers = [...prev, {
        bank_name: "", logo_color: "hsl(200, 70%, 50%)", type: "Fijo",
        base_tin: 0, estimated_tae: 0, monthly_payment: 0,
        amortization_fee_pct: 0, upfront_costs: 0, monthly_account_cost: 0,
        euribor_rate: euriborRate, advantages: [], considerations: [],
        sort_order: prev.length,
        linkages: defaultLinkages, mixedPeriods: [],
        term_years_override: null,
      }];
      setExpandedIndex(newOffers.length - 1);
      return newOffers;
    });
  };

  const copyLink = () => {
    if (!isPublished) {
      toast.error("Publica la comparativa antes de copiar el link");
      return;
    }
    navigator.clipboard.writeText(`${PUBLIC_BASE_URL}/c/${shareToken}`);
    toast.success("Link copiado");
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={triotecaLogo} alt="Trioteca" className="h-8" />
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-1" />Volver
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              <Badge variant={isPublished ? "default" : "secondary"}>
                {isPublished ? "Publicada" : "Borrador"}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={copyLink} disabled={!isPublished}>
              <Copy className="h-4 w-4 mr-1" />Link cliente
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-1" />{saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos de la operación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-4">
                <Label>Nombre del cliente</Label>
                <Input value={op.client_name} onChange={(e) => setOp(prev => ({ ...prev, client_name: e.target.value }))} placeholder="Ej: Juan García" />
              </div>
              <div>
                <Label>Precio vivienda €</Label>
                <Input type="number" value={op.purchase_price} onFocus={(e) => e.target.select()} onChange={(e) => setOp(prev => ({ ...prev, purchase_price: +e.target.value }))} />
              </div>
              <div>
                <Label>Importe préstamo €</Label>
                <Input type="number" value={op.loan_amount} onFocus={(e) => e.target.select()} onChange={(e) => setOp(prev => ({ ...prev, loan_amount: +e.target.value }))} />
              </div>
              <div>
                <Label>Plazo (años)</Label>
                <Input type="number" value={op.term_years} onFocus={(e) => e.target.select()} onChange={(e) => setOp(prev => ({ ...prev, term_years: +e.target.value }))} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ofertas de bancos</h2>
          <Button onClick={addOffer} disabled={offers.length >= MAX_OFFERS}>
            <Plus className="h-4 w-4 mr-2" />Añadir oferta {offers.length >= MAX_OFFERS && `(máx. ${MAX_OFFERS})`}
          </Button>
        </div>

        {offers.map((offer, i) => (
          <OfferEditor
            key={offer.id || `new-${i}`}
            offer={offer}
            index={i}
            expanded={expandedIndex === i}
            onToggle={() => setExpandedIndex(expandedIndex === i ? null : i)}
            onChange={(updated) => setOffers((prev) => prev.map((o, idx) => idx === i ? updated : o))}
            onDelete={() => {
              setOffers((prev) => prev.filter((_, idx) => idx !== i));
              setExpandedIndex(null);
            }}
            loanAmount={op.loan_amount}
            termYears={op.term_years}
            appraisalCost={op.appraisal_cost}
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
