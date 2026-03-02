import { useState } from "react";
import { Offer, Linkage, operationDefaults } from "@/data/mortgageData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Building2 } from "lucide-react";

interface ExternalOfferFormProps {
  onAddOffer: (offer: Offer) => void;
}

const COLORS = [
  "hsl(280, 60%, 50%)",
  "hsl(340, 70%, 50%)",
  "hsl(170, 60%, 40%)",
  "hsl(50, 80%, 45%)",
  "hsl(100, 50%, 40%)",
];
let colorIndex = 0;

const ExternalOfferForm = ({ onAddOffer }: ExternalOfferFormProps) => {
  const [open, setOpen] = useState(false);
  const [bankName, setBankName] = useState("");
  const [type, setType] = useState<"Fijo" | "Mixto" | "Variable">("Fijo");
  const [baseTIN, setBaseTIN] = useState("");
  const [amortFeePct, setAmortFeePct] = useState("0");
  const [linkages, setLinkages] = useState<{ label: string; weight: string; cost: string }[]>([]);

  const addLinkage = () => {
    setLinkages((prev) => [...prev, { label: "", weight: "0", cost: "0" }]);
  };

  const removeLinkage = (idx: number) => {
    setLinkages((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateLinkage = (idx: number, field: string, value: string) => {
    setLinkages((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l))
    );
  };

  const handleSubmit = () => {
    if (!bankName || !baseTIN) return;

    const id = `ext-${Date.now()}`;
    const color = COLORS[colorIndex % COLORS.length];
    colorIndex++;

    const offerLinkages: Linkage[] = linkages
      .filter((l) => l.label.trim())
      .map((l, i) => ({
        id: `${id}-link-${i}`,
        label: l.label,
        isActive: true,
        discountWeightPct: parseFloat(l.weight) || 0,
        annualCostEUR: parseFloat(l.cost) || 0,
      }));

    const offer: Offer = {
      id,
      bankName: bankName.trim(),
      logoColor: color,
      type,
      baseTIN: parseFloat(baseTIN) || 0,
      amortizationFeePct: parseFloat(amortFeePct) || 0,
      upfrontCostsEUR: 0,
      monthlyAccountCostEUR: 0,
      linkages: offerLinkages,
      advantages: [],
      considerations: [],
      isExternal: true,
    };

    onAddOffer(offer);
    setBankName("");
    setBaseTIN("");
    setAmortFeePct("0");
    setLinkages([]);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-card rounded-xl border-2 border-dashed border-muted-foreground/30 p-6 hover:border-primary/50 hover:bg-muted/30 transition-all group"
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
          <Building2 className="h-8 w-8" />
          <span className="font-medium text-sm">Incorporar ofertas por fuera de Trioteca</span>
          <span className="text-xs">Añade la oferta de tu banco para compararla</span>
        </div>
      </button>
    );
  }

  return (
    <div className="bg-card rounded-xl border p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-card-foreground">
          Incorporar oferta externa
        </h3>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <Label className="text-xs text-muted-foreground">Banco</Label>
          <Input
            placeholder="Nombre del banco"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as any)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Fijo">Fijo</SelectItem>
              <SelectItem value="Mixto">Mixto</SelectItem>
              <SelectItem value="Variable">Variable</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">TIN base (%)</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="Ej: 2.80"
            value={baseTIN}
            onChange={(e) => setBaseTIN(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Comisión amortización (%)</Label>
          <Input
            type="number"
            step="0.1"
            placeholder="Ej: 0"
            value={amortFeePct}
            onChange={(e) => setAmortFeePct(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs text-muted-foreground">Bonificaciones</Label>
          <Button variant="outline" size="sm" onClick={addLinkage} className="gap-1 text-xs h-7">
            <Plus className="h-3 w-3" /> Añadir
          </Button>
        </div>
        {linkages.length === 0 && (
          <p className="text-xs text-muted-foreground italic">Sin bonificaciones. Pulsa "Añadir" para incluir seguros, nómina, etc.</p>
        )}
        <div className="space-y-2">
          {linkages.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_80px_32px] gap-2 items-end">
              <div>
                <Input
                  placeholder="Nombre (ej: Seguro Hogar)"
                  value={l.label}
                  onChange={(e) => updateLinkage(i, "label", e.target.value)}
                  className="text-xs h-8"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">Peso (pp)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.15"
                  value={l.weight}
                  onChange={(e) => updateLinkage(i, "weight", e.target.value)}
                  className="text-xs h-8"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-0.5">€/año</label>
                <Input
                  type="number"
                  step="1"
                  placeholder="350"
                  value={l.cost}
                  onChange={(e) => updateLinkage(i, "cost", e.target.value)}
                  className="text-xs h-8"
                />
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => removeLinkage(i)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={!bankName || !baseTIN} className="w-full">
        Añadir a la comparativa
      </Button>
    </div>
  );
};

export default ExternalOfferForm;
