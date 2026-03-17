import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export interface LinkageFormData {
  label: string;
  is_active_default: boolean;
  discount_weight_pct: number;
  annual_cost: number;
}

export const PRESET_LINKAGES = [
  "Domiciliación de nómina",
  "Seguro hogar",
  "Seguro de vida",
];

interface Props {
  linkages: LinkageFormData[];
  onChange: (linkages: LinkageFormData[]) => void;
}

const LinkageEditor = ({ linkages, onChange }: Props) => {
  const [newLabel, setNewLabel] = useState("");

  // Ensure base 3 presets always exist, then append any extras
  const baseLabels = new Set(PRESET_LINKAGES);
  const normalized: LinkageFormData[] = [
    ...PRESET_LINKAGES.map((label) => {
      const existing = linkages.find((l) => l.label === label);
      return existing ?? { label, is_active_default: true, discount_weight_pct: 0, annual_cost: 0 };
    }),
    ...linkages.filter((l) => !baseLabels.has(l.label)),
  ];

  const update = (i: number, patch: Partial<LinkageFormData>) =>
    onChange(normalized.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const handleAdd = () => {
    const label = newLabel.trim();
    if (!label || normalized.some((l) => l.label === label)) return;
    onChange([...normalized, { label, is_active_default: true, discount_weight_pct: 0, annual_cost: 0 }]);
    setNewLabel("");
  };

  const handleDelete = (i: number) => {
    onChange(normalized.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Vinculaciones / Bonificaciones</Label>
      {normalized.map((l, i) => {
        const isBase = baseLabels.has(l.label);
        return (
          <div key={l.label} className="grid grid-cols-[1fr_auto_80px_80px_auto] gap-2 items-end border rounded-lg p-3">
            <div>
              <Label className="text-xs">Producto</Label>
              {isBase ? (
                <p className="text-sm font-medium mt-1">{l.label}</p>
              ) : (
                <Input
                  value={l.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                  className="mt-1 h-8 text-sm"
                />
              )}
            </div>
            <div className="flex flex-col items-center">
              <Label className="text-xs mb-1">Activa</Label>
              <Switch checked={l.is_active_default} onCheckedChange={(v) => update(i, { is_active_default: v })} />
            </div>
            <div>
              <Label className="text-xs">Peso %</Label>
              <Input type="number" step="0.01" value={l.discount_weight_pct} onFocus={(e) => e.target.select()} onChange={(e) => update(i, { discount_weight_pct: +e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Coste €/año</Label>
              <Input type="number" step="0.01" value={l.annual_cost} onFocus={(e) => e.target.select()} onChange={(e) => update(i, { annual_cost: +e.target.value })} />
            </div>
            <div className="flex items-end pb-1">
              {!isBase && (
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDelete(i)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {/* Add new linkage */}
      <div className="flex gap-2 items-end pt-1">
        <div className="flex-1">
          <Label className="text-xs">Nueva bonificación</Label>
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Ej: Tarjetas, Seguro de auto..."
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
          />
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={handleAdd} disabled={!newLabel.trim()}>
          <Plus className="h-3.5 w-3.5" /> Añadir
        </Button>
      </div>
    </div>
  );
};

export default LinkageEditor;
