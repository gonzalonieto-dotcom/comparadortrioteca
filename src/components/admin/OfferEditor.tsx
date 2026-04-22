import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, ChevronDown, ChevronUp, Calculator } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { toast } from "sonner";
import LinkageEditor, { type LinkageFormData, PRESET_LINKAGES } from "./LinkageEditor";
import PdfDropZone from "./PdfDropZone";
import MixedPeriodEditor, { type MixedPeriodFormData } from "./MixedPeriodEditor";
import type { Offer, OperationDefaults, Linkage, MixedRatePeriod } from "@/data/mortgageData";
import { calcMonthlyPayment, calcEstimatedTAE, generateAmortizationSchedule, calcBonifiedTIN, calcPeriodBreakdown } from "@/lib/mortgageCalc";
import { BankLogo } from "@/lib/bankLogos";

export const BANK_PRESETS: Record<string, { color: string }> = {
  CaixaBank: { color: "hsl(200, 70%, 40%)" },
  Ibercaja: { color: "hsl(340, 75%, 45%)" },
  BBVA: { color: "hsl(210, 80%, 45%)" },
  Kutxabank: { color: "hsl(145, 60%, 40%)" },
  Bankinter: { color: "hsl(25, 90%, 50%)" },
  Abanca: { color: "hsl(195, 85%, 35%)" },
  Santander: { color: "hsl(0, 80%, 45%)" },
  UCI: { color: "hsl(210, 65%, 50%)" },
  Unicaja: { color: "hsl(150, 55%, 40%)" },
  "Global Caja": { color: "hsl(35, 80%, 45%)" },
  Sabadell: { color: "hsl(210, 70%, 40%)" },
  "Laboral Kutxa": { color: "hsl(15, 75%, 45%)" },
  "Caixa Popular": { color: "hsl(120, 50%, 35%)" },
  MyInvestor: { color: "hsl(170, 60%, 40%)" },
};

export interface OfferFormData {
  id?: string;
  bank_name: string;
  logo_color: string;
  type: string;
  base_tin: number;
  estimated_tae: number;
  monthly_payment: number;
  amortization_fee_pct: number;
  upfront_costs: number;
  monthly_account_cost: number;
  euribor_rate: number | null;
  advantages: string[];
  considerations: string[];
  sort_order: number;
  linkages: LinkageFormData[];
  mixedPeriods: MixedPeriodFormData[];
  term_years_override: number | null;
}

interface Props {
  offer: OfferFormData;
  index: number;
  onChange: (offer: OfferFormData) => void;
  onDelete: () => void;
  loanAmount?: number;
  termYears?: number;
  appraisalCost?: number;
  expanded?: boolean;
  onToggle?: () => void;
}

/** Convert form data to the calc engine's Offer type */
function toCalcOffer(f: OfferFormData): Offer {
  const linkages: Linkage[] = f.linkages.map((l, i) => ({
    id: `link-${i}`,
    label: l.label,
    isActive: l.is_active_default,
    discountWeightPct: l.discount_weight_pct,
    annualCostEUR: l.annual_cost,
  }));
  const mixedPeriods: MixedRatePeriod[] | undefined = f.mixedPeriods.length > 0
    ? f.mixedPeriods.map((m) => ({
        fromYear: m.from_year,
        toYear: m.to_year,
        fixedTIN: m.fixed_tin ?? undefined,
        spreadOverEuribor: m.spread_over_euribor ?? undefined,
      }))
    : undefined;

  const totalDiscount = linkages
    .filter((l) => l.isActive)
    .reduce((s, l) => s + l.discountWeightPct, 0);

  return {
    id: f.id || "temp",
    bankName: f.bank_name,
    logoColor: f.logo_color,
    type: f.type as Offer["type"],
    baseTIN: f.base_tin + totalDiscount,
    amortizationFeePct: f.amortization_fee_pct,
    upfrontCostsEUR: f.upfront_costs,
    monthlyAccountCostEUR: f.monthly_account_cost,
    linkages,
    advantages: f.advantages,
    considerations: f.considerations,
    mixedPeriods,
    euriborRate: f.euribor_rate ?? undefined,
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const OfferEditor = ({ offer, index, onChange, onDelete, loanAmount, termYears, appraisalCost, expanded: expandedProp, onToggle }: Props) => {
  const [expandedLocal, setExpandedLocal] = useState(true);
  const expanded = expandedProp !== undefined ? expandedProp : expandedLocal;
  const toggleExpanded = onToggle || (() => setExpandedLocal(!expandedLocal));
  const [syncMixed, setSyncMixed] = useState(true);

  const update = (patch: Partial<OfferFormData>) => {
    const updated = { ...offer, ...patch };
    // Auto-create default mixed periods when switching to Mixto
    if (patch.type === "Mixto" && updated.mixedPeriods.length === 0) {
      const years = updated.term_years_override ?? termYears ?? 30;
      updated.mixedPeriods = [
        { from_year: 1, to_year: 10, fixed_tin: updated.base_tin || 1.5, spread_over_euribor: null },
        { from_year: 11, to_year: years, fixed_tin: null, spread_over_euribor: 0.90 },
      ];
    }
    // Sync general fields → mixed periods (only when toggle enabled and Mixto with periods)
    if (syncMixed && updated.type === "Mixto" && updated.mixedPeriods.length > 0) {
      let periods = updated.mixedPeriods;
      // Sync base_tin → first fixed-tin period
      if (patch.base_tin !== undefined) {
        const firstFixedIdx = periods.findIndex((p) => p.fixed_tin !== null);
        if (firstFixedIdx !== -1) {
          periods = periods.map((p, i) =>
            i === firstFixedIdx ? { ...p, fixed_tin: updated.base_tin } : p
          );
        }
      }
      // Sync term_years_override → to_year of last period
      if (patch.term_years_override !== undefined) {
        const newYears = updated.term_years_override ?? termYears ?? 30;
        const lastIdx = periods.length - 1;
        periods = periods.map((p, i) =>
          i === lastIdx ? { ...p, to_year: newYears } : p
        );
      }
      updated.mixedPeriods = periods;
    }
    onChange(updated);
  };

  const handlePdfExtracted = (data: Partial<OfferFormData>) => {
    const preset = data.bank_name ? BANK_PRESETS[data.bank_name] : undefined;
    onChange({
      ...offer,
      ...data,
      logo_color: preset?.color || offer.logo_color,
      considerations: offer.considerations,
      sort_order: offer.sort_order,
    });
    toast.success("Datos extraídos del PDF — revisa y ajusta");
  };

  const handleBankChange = (bankName: string) => {
    const preset = BANK_PRESETS[bankName];
    update({ bank_name: bankName, logo_color: preset?.color || offer.logo_color });
  };

  // ─── Auto-computed TAE, payment & period breakdown ───
  const { computedTAE, computedPayment, periodBreakdown, mixedMismatch } = useMemo(() => {
    const loan = loanAmount || 200000;
    const years = offer.term_years_override ?? termYears ?? 30;
    const termMonths = years * 12;
    const appraisal = appraisalCost || 0;

    const calcOffer = toCalcOffer(offer);
    const bonifiedTIN = calcBonifiedTIN(calcOffer);

    const defaults: OperationDefaults = {
      purchasePrice: loan,
      appraisalValue: loan,
      loanAmount: loan,
      termYears: years,
      homeInsuranceAnnualDefault: 0,
      lifeInsuranceAnnualDefault: 0,
      appraisalCostEUR: appraisal,
    };

    const schedule = generateAmortizationSchedule(loan, bonifiedTIN, termMonths, calcOffer);
    const payment = schedule[0]?.payment ?? calcMonthlyPayment(loan, bonifiedTIN, termMonths);
    const tae = calcEstimatedTAE(calcOffer, defaults, schedule);
    const breakdown = calcPeriodBreakdown(calcOffer, schedule);

    // Cross-validation: for Mixto, the TIN bonificado entered in the general
    // field (base_tin) must match the rate the engine uses for the first fixed
    // tranche. If they diverge (e.g. user toggled off sync and edited periods
    // manually), surface a warning with the expected value.
    let mismatch: { expected: number; actual: number } | null = null;
    if (offer.type === "Mixto" && breakdown.length > 0) {
      const firstFixed = breakdown.find((pb) => !pb.isVariable);
      if (firstFixed && Math.abs(firstFixed.rate - offer.base_tin) > 0.005) {
        mismatch = { expected: firstFixed.rate, actual: offer.base_tin };
      }
    }

    return { computedTAE: tae, computedPayment: payment, periodBreakdown: breakdown, mixedMismatch: mismatch };
  }, [offer, loanAmount, termYears, appraisalCost]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="cursor-pointer" onClick={toggleExpanded}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              {offer.bank_name ? (
                <BankLogo bankName={offer.bank_name} logoColor={offer.logo_color} size="md" />
              ) : (
                <span className="font-medium text-card-foreground">{`Oferta ${index + 1}`}</span>
              )}
              <span className="text-xs text-muted-foreground font-normal">({offer.type})</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
        </CardHeader>
        {expanded && (
          <CardContent className="space-y-4">
            {/* PDF Drop Zone */}
            <PdfDropZone onExtracted={handlePdfExtracted} />

            {/* Bank + Type */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Banco</Label>
                <Select value={offer.bank_name} onValueChange={handleBankChange}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar banco" /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(BANK_PRESETS).map((name) => (
                      <SelectItem key={name} value={name}>
                        <BankLogo bankName={name} logoColor={BANK_PRESETS[name].color} size="sm" />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={offer.type} onValueChange={(v) => update({ type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fijo">Fijo</SelectItem>
                    <SelectItem value="Mixto">Mixto</SelectItem>
                    <SelectItem value="Variable">Variable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Financial details */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">
                  {offer.type === "Mixto" ? "TIN bonificado primer tramo %" : "TIN bonificado %"}
                </Label>
                <Input type="number" step="0.01" value={offer.base_tin} onFocus={(e) => e.target.select()} onChange={(e) => update({ base_tin: +e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Plazo (años)</Label>
                <Input
                  type="number"
                  step="1"
                  value={offer.term_years_override ?? ""}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => update({ term_years_override: e.target.value ? +e.target.value : null })}
                  placeholder={`${termYears || 30} — global`}
                />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1">
                  Cuota mensual €
                  <Calculator className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">(auto)</span>
                </Label>
                <Input
                  readOnly
                  value={isFinite(computedPayment) ? computedPayment.toFixed(2) + " €" : "—"}
                  className="bg-muted cursor-default"
                />
              </div>
            </div>

            {/* Mixto: diferencial sobre Euríbor */}
            {offer.type === "Mixto" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Diferencial sobre Euríbor %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={offer.mixedPeriods?.[1]?.spread_over_euribor ?? offer.mixedPeriods?.[0]?.spread_over_euribor ?? ""}
                    onChange={(e) => {
                      const spread = e.target.value ? +e.target.value : null;
                      const years = offer.term_years_override ?? termYears ?? 30;
                      let periods = [...offer.mixedPeriods];
                      if (periods.length >= 2) {
                        // Update the variable period (second one)
                        periods = periods.map((p, i) => i === 1 ? { ...p, spread_over_euribor: spread } : p);
                      } else if (periods.length === 1) {
                        periods.push({ from_year: 11, to_year: years, fixed_tin: null, spread_over_euribor: spread });
                      } else {
                        periods = [
                          { from_year: 1, to_year: 10, fixed_tin: offer.base_tin, spread_over_euribor: null },
                          { from_year: 11, to_year: years, fixed_tin: null, spread_over_euribor: spread },
                        ];
                      }
                      update({ mixedPeriods: periods });
                    }}
                    placeholder="Ej: 0.75"
                  />
                </div>
              </div>
            )}

            {/* Mixed period breakdown (read-only) */}
            {offer.type === "Mixto" && periodBreakdown.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Desglose por tramo (auto-calculado)</Label>
                {periodBreakdown.map((pb, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-card-foreground">{pb.label}</span>
                    <div className="flex gap-4">
                      <span className="text-muted-foreground">TIN: {pb.rate.toFixed(2)}%</span>
                      <span className="font-medium text-card-foreground">Cuota: {fmt(pb.avgMonthlyPayment)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Comisión amort. %</Label>
                <Input type="number" step="0.01" value={offer.amortization_fee_pct} onFocus={(e) => e.target.select()} onChange={(e) => update({ amortization_fee_pct: +e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Gastos iniciales €</Label>
                <Input type="number" step="0.01" value={offer.upfront_costs} onFocus={(e) => e.target.select()} onChange={(e) => update({ upfront_costs: +e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Coste cuenta €/mes</Label>
                <Input type="number" step="0.01" value={offer.monthly_account_cost} onFocus={(e) => e.target.select()} onChange={(e) => update({ monthly_account_cost: +e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Euríbor %</Label>
                <Input type="number" step="0.01" value={offer.euribor_rate ?? ""} onChange={(e) => update({ euribor_rate: e.target.value ? +e.target.value : null })} placeholder="Auto" />
              </div>
            </div>

            {/* Mixed periods (only for Mixto type) */}
            {offer.type === "Mixto" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                  <div className="flex flex-col">
                    <Label className="text-xs font-medium">Sincronizar con campos generales</Label>
                    <span className="text-[10px] text-muted-foreground">
                      Propaga TIN bonificado y plazo al primer/último tramo automáticamente
                    </span>
                  </div>
                  <Switch checked={syncMixed} onCheckedChange={setSyncMixed} />
                </div>
                <MixedPeriodEditor
                  periods={offer.mixedPeriods}
                  onChange={(mixedPeriods) => update({ mixedPeriods })}
                  suggestedFixedTIN={syncMixed ? offer.base_tin : undefined}
                  suggestedTermYears={syncMixed ? (offer.term_years_override ?? termYears ?? 30) : undefined}
                />
              </div>
            )}

            {/* Bonificaciones (collapsible dentro del formulario) */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <button type="button" className="flex w-full items-center justify-between cursor-pointer py-2 border-t pt-4 mt-2">
                  <span className="text-sm font-semibold">Bonificaciones</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <LinkageEditor linkages={offer.linkages} onChange={(linkages) => update({ linkages })} />
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default OfferEditor;
