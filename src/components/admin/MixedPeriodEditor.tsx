import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
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
            <NumberInput value={p.from_year} onValueChange={(v) => update(i, { from_year: v })} />
          </div>
          <div>
            <Label className="text-xs">Hasta año</Label>
            <NumberInput value={p.to_year} onValueChange={(v) => update(i, { to_year: v })} placeholder={toYearPlaceholder} />
          </div>
          <div>
            <Label className="text-xs">TIN fijo %</Label>
            <NumberInput step="0.01" value={p.fixed_tin} onValueChange={(v) => update(i, { fixed_tin: v === 0 ? null : v })} placeholder={fixedTinPlaceholder} />
          </div>
          <div>
            <Label className="text-xs">Spread Euríbor</Label>
            <NumberInput step="0.01" value={p.spread_over_euribor} onValueChange={(v) => update(i, { spread_over_euribor: v === 0 ? null : v })} placeholder="-" />
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
