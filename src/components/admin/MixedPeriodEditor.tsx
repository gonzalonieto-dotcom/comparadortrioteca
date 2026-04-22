import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

export interface MixedPeriodFormData {
  from_year: number;
  to_year: number;
  fixed_tin: number | null;
  spread_over_euribor: number | null;
}

interface Props {
  periods: MixedPeriodFormData[];
  onChange: (periods: MixedPeriodFormData[]) => void;
  suggestedFixedTIN?: number;
  suggestedTermYears?: number;
}

const MixedPeriodEditor = ({ periods, onChange, suggestedFixedTIN, suggestedTermYears }: Props) => {
  const add = () =>
    onChange([...periods, { from_year: 1, to_year: 10, fixed_tin: null, spread_over_euribor: null }]);

  const update = (i: number, patch: Partial<MixedPeriodFormData>) =>
    onChange(periods.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const remove = (i: number) => onChange(periods.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Periodos mixtos</Label>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-3 w-3 mr-1" />Añadir periodo
        </Button>
      </div>
      {periods.map((p, i) => {
        const isLast = i === periods.length - 1;
        const toYearPlaceholder = isLast && suggestedTermYears != null
          ? `${suggestedTermYears} (sugerido)`
          : undefined;
        const fixedTinPlaceholder = suggestedFixedTIN != null
          ? `${suggestedFixedTIN.toFixed(2)} (sugerido)`
          : "-";
        return (
        <div key={i} className="grid grid-cols-[60px_60px_80px_80px_auto] gap-2 items-end border rounded-lg p-3">
          <div>
            <Label className="text-xs">Desde año</Label>
            <Input type="number" value={p.from_year} onChange={(e) => update(i, { from_year: +e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Hasta año</Label>
            <Input type="number" value={p.to_year} onChange={(e) => update(i, { to_year: +e.target.value })} placeholder={toYearPlaceholder} />
          </div>
          <div>
            <Label className="text-xs">TIN fijo %</Label>
            <Input type="number" step="0.01" value={p.fixed_tin ?? ""} onChange={(e) => update(i, { fixed_tin: e.target.value ? +e.target.value : null })} placeholder={fixedTinPlaceholder} />
          </div>
          <div>
            <Label className="text-xs">Spread Euríbor</Label>
            <Input type="number" step="0.01" value={p.spread_over_euribor ?? ""} onChange={(e) => update(i, { spread_over_euribor: e.target.value ? +e.target.value : null })} placeholder="-" />
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
        );
      })}
    </div>
  );
};

export default MixedPeriodEditor;
