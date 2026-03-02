import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import LinkageEditor, { type LinkageFormData } from "./LinkageEditor";
import MixedPeriodEditor, { type MixedPeriodFormData } from "./MixedPeriodEditor";

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
}

const OfferEditor = ({ offer, index, onChange, onDelete }: Props) => {
  const [expanded, setExpanded] = useState(true);

  const update = (patch: Partial<OfferFormData>) => onChange({ ...offer, ...patch });

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: offer.logo_color }} />
            {offer.bank_name || `Oferta ${index + 1}`}
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
          {/* Basic info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Banco</Label>
              <Input value={offer.bank_name} onChange={(e) => update({ bank_name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Color (HSL)</Label>
              <Input value={offer.logo_color} onChange={(e) => update({ logo_color: e.target.value })} />
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
            <div>
              <Label className="text-xs">Orden</Label>
              <Input type="number" value={offer.sort_order} onChange={(e) => update({ sort_order: +e.target.value })} />
            </div>
          </div>

          {/* Financial details */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">TIN bonificado %</Label>
              <Input type="number" step="0.01" value={offer.base_tin} onChange={(e) => update({ base_tin: +e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">TAE estimada %</Label>
              <Input type="number" step="0.01" value={offer.estimated_tae} onChange={(e) => update({ estimated_tae: +e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Cuota mensual €</Label>
              <Input type="number" step="0.01" value={offer.monthly_payment} onChange={(e) => update({ monthly_payment: +e.target.value })} />
            </div>
          </div>

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
              <Input type="number" step="0.01" value={offer.euribor_rate ?? ""} onChange={(e) => update({ euribor_rate: e.target.value ? +e.target.value : null })} placeholder="Solo mixto/var" />
            </div>
          </div>

          {/* Advantages & Considerations */}
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Ventajas (una por línea)</Label>
              <Textarea
                rows={4}
                value={offer.advantages.join("\n")}
                onChange={(e) => update({ advantages: e.target.value.split("\n").filter(Boolean) })}
              />
            </div>
            <div>
              <Label className="text-xs">Consideraciones (una por línea)</Label>
              <Textarea
                rows={4}
                value={offer.considerations.join("\n")}
                onChange={(e) => update({ considerations: e.target.value.split("\n").filter(Boolean) })}
              />
            </div>
          </div>

          {/* Linkages */}
          <LinkageEditor linkages={offer.linkages} onChange={(linkages) => update({ linkages })} />

          {/* Mixed periods (only for Mixto type) */}
          {offer.type === "Mixto" && (
            <MixedPeriodEditor periods={offer.mixedPeriods} onChange={(mixedPeriods) => update({ mixedPeriods })} />
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default OfferEditor;
