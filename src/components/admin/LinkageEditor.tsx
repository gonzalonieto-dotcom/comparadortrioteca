import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";

export interface LinkageFormData {
  label: string;
  is_active_default: boolean;
  discount_weight_pct: number;
  annual_cost: number;
}

interface Props {
  linkages: LinkageFormData[];
  onChange: (linkages: LinkageFormData[]) => void;
}

const LinkageEditor = ({ linkages, onChange }: Props) => {
  const add = () =>
    onChange([...linkages, { label: "", is_active_default: true, discount_weight_pct: 0, annual_cost: 0 }]);

  const update = (i: number, patch: Partial<LinkageFormData>) =>
    onChange(linkages.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const remove = (i: number) => onChange(linkages.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Vinculaciones / Bonificaciones</Label>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-3 w-3 mr-1" />Añadir
        </Button>
      </div>
      {linkages.map((l, i) => (
        <div key={i} className="grid grid-cols-[1fr_auto_80px_80px_auto] gap-2 items-end border rounded-lg p-3">
          <div>
            <Label className="text-xs">Nombre</Label>
            <Input value={l.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="Ej: Nómina" />
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
          <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default LinkageEditor;
