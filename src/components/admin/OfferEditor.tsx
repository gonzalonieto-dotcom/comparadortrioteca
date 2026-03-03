import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, ChevronDown, ChevronUp, Calculator } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { toast } from "sonner";
import LinkageEditor, { type LinkageFormData, PRESET_LINKAGES } from "./LinkageEditor";
import PdfDropZone from "./PdfDropZone";
import MixedPeriodEditor, { type MixedPeriodFormData } from "./MixedPeriodEditor";
import type { Offer, OperationDefaults, Linkage, MixedRatePeriod } from "@/data/mortgageData";
import { calcMonthlyPayment, calcEstimatedTAE, generateAmortizationSchedule, calcBonifiedTIN } from "@/lib/mortgageCalc";
export const BANK_PRESETS: Record<string, { color: string }> = {
  CaixaBank: { color: "hsl(200, 70%, 40%)" },
  Ibercaja: { color: "hsl(340, 75%, 45%)" },
  BBVA: { color: "hsl(210, 80%, 45%)" },
  Kutxabank: { color: "hsl(145, 60%, 40%)" },
  Bankinter: { color: "hsl(25, 90%, 50%)" },
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

  // baseTIN in form is the bonified TIN. The calc engine expects baseTIN as
  // the NON-bonified rate (baseTIN = bonifiedTIN + sum of linkage discounts).
  const totalDiscount = linkages
    .filter((l) => l.isActive)
    .reduce((s, l) => s + l.discountWeightPct, 0);

  return {
    id: f.id || "temp",
    bankName: f.bank_name,
    logoColor: f.logo_color,
    type: f.type as Offer["type"],
    baseTIN: f.base_tin + totalDiscount, // engine subtracts discounts to get bonified
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

const OfferEditor = ({ offer, index, onChange, onDelete, loanAmount, termYears, appraisalCost, expanded: expandedProp, onToggle }: Props) => {
  const [expandedLocal, setExpandedLocal] = useState(true);
  const expanded = expandedProp !== undefined ? expandedProp : expandedLocal;
  const toggleExpanded = onToggle || (() => setExpandedLocal(!expandedLocal));

  const update = (patch: Partial<OfferFormData>) => onChange({ ...offer, ...patch });

  const handlePdfExtracted = (data: Partial<OfferFormData>) => {
    // Merge extracted data, setting logo_color from bank preset if available
    const preset = data.bank_name ? BANK_PRESETS[data.bank_name] : undefined;
    onChange({
      ...offer,
      ...data,
      logo_color: preset?.color || offer.logo_color,
      considerations: offer.considerations, // preserve
      sort_order: offer.sort_order,
    });
    toast.success("Datos extraídos del PDF — revisa y ajusta");
  };

  const handleBankChange = (bankName: string) => {
    const preset = BANK_PRESETS[bankName];
    update({ bank_name: bankName, logo_color: preset?.color || offer.logo_color });
  };

  // ─── Auto-computed TAE & payment ───
  const { computedTAE, computedPayment } = useMemo(() => {
    const loan = loanAmount || 200000;
    const years = termYears || 30;
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

    return { computedTAE: tae, computedPayment: payment };
  }, [offer, loanAmount, termYears, appraisalCost]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="cursor-pointer" onClick={toggleExpanded}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="font-medium text-card-foreground">{offer.bank_name || `Oferta ${index + 1}`}</span>
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
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: BANK_PRESETS[name].color }} />
                          {name}
                        </span>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">
                  {offer.type === "Mixto" ? "TIN bonificado primer tramo %" : "TIN bonificado %"}
                </Label>
                <Input type="number" step="0.01" value={offer.base_tin} onChange={(e) => update({ base_tin: +e.target.value })} />
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
                    value={offer.mixedPeriods?.[0]?.spread_over_euribor ?? ""}
                    onChange={(e) => {
                      const spread = e.target.value ? +e.target.value : null;
                      const periods = offer.mixedPeriods.length > 0
                        ? offer.mixedPeriods.map((p, i) => i === 0 ? { ...p, spread_over_euribor: spread } : p)
                        : [{ from_year: 1, to_year: 30, fixed_tin: null, spread_over_euribor: spread }];
                      update({ mixedPeriods: periods });
                    }}
                    placeholder="Ej: 0.75"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Comisión amort. %</Label>
                <Input type="number" step="0.01" value={offer.amortization_fee_pct} onChange={(e) => update({ amortization_fee_pct: +e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Gastos iniciales €</Label>
                <Input type="number" step="0.01" value={offer.upfront_costs} onChange={(e) => update({ upfront_costs: +e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Coste cuenta €/mes</Label>
                <Input type="number" step="0.01" value={offer.monthly_account_cost} onChange={(e) => update({ monthly_account_cost: +e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Euríbor %</Label>
                <Input type="number" step="0.01" value={offer.euribor_rate ?? ""} onChange={(e) => update({ euribor_rate: e.target.value ? +e.target.value : null })} placeholder="Auto" />
              </div>
            </div>

            {/* Mixed periods (only for Mixto type) */}
            {offer.type === "Mixto" && (
              <MixedPeriodEditor periods={offer.mixedPeriods} onChange={(mixedPeriods) => update({ mixedPeriods })} />
            )}

            {/* Bonificaciones (collapsible dentro del formulario) */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer py-2 border-t pt-4 mt-2">
                  <Label className="text-sm font-semibold cursor-pointer">Bonificaciones</Label>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
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
