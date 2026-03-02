import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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
  // Ensure we always have exactly 3 preset linkages
  const normalized: LinkageFormData[] = PRESET_LINKAGES.map((label) => {
    const existing = linkages.find((l) => l.label === label);
    return existing ?? { label, is_active_default: true, discount_weight_pct: 0, annual_cost: 0 };
  });

  const update = (i: number, patch: Partial<LinkageFormData>) =>
    onChange(normalized.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Vinculaciones / Bonificaciones</Label>
      {normalized.map((l, i) => (
        <div key={l.label} className="grid grid-cols-[1fr_auto_80px_80px] gap-2 items-end border rounded-lg p-3">
          <div>
            <Label className="text-xs">Producto</Label>
            <p className="text-sm font-medium mt-1">{l.label}</p>
          </div>
          <div className="flex flex-col items-center">
            <Label className="text-xs mb-1">Activa</Label>
            <Switch checked={l.is_active_default} onCheckedChange={(v) => update(i, { is_active_default: v })} />
          </div>
          <div>
            <Label className="text-xs">Peso %</Label>
            <Input type="number" step="0.01" value={l.discount_weight_pct} onChange={(e) => update(i, { discount_weight_pct: +e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Coste €/año</Label>
            <Input type="number" step="0.01" value={l.annual_cost} onChange={(e) => update(i, { annual_cost: +e.target.value })} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default LinkageEditor;
