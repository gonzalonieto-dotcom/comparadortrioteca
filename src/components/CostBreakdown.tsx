import { ComputedOffer } from "@/lib/mortgageCalc";
import { Badge } from "@/components/ui/badge";

interface CostBreakdownProps {
  computedOffers: ComputedOffer[];
  inflationRate?: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const CostBreakdown = ({ computedOffers, inflationRate }: CostBreakdownProps) => {
  const sorted = [...computedOffers].sort((a, b) => a.totalCost - b.totalCost);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {sorted.map((co, i) => {
        const hasPeriods = co.periodBreakdown.length > 0;
        const termMonths = (co.offer.termYears ?? 30) * 12;

        return (
          <div
            key={co.offer.id}
            className={`bg-card rounded-xl border p-5 ${i === 0 ? "border-primary ring-1 ring-primary/20" : ""}`}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="font-medium text-card-foreground text-sm">{co.offer.bankName}</span>
              {i === 0 && <span className="ml-auto text-xs font-medium text-accent">Menor coste</span>}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Intereses totales</span>
                <span className="font-medium text-card-foreground">{fmt(co.totalInterest)}</span>
              </div>

              {/* Period breakdown for mixed offers */}
              {hasPeriods && co.periodBreakdown.map((pb, pi) => (
                <div key={pi} className="flex justify-between text-xs pl-3 border-l-2 border-muted">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    {pb.label}
                    {pb.isVariable && <Badge variant="outline" className="text-[9px] py-0 px-1">Variable</Badge>}
                  </span>
                  <span className="text-card-foreground">{fmt(pb.totalInterest)}</span>
                </div>
              ))}

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Bonificaciones ({co.offer.linkages.filter(l => l.isActive).length} activas)
                  {inflationRate && inflationRate > 0 && (
                    <span className="text-[10px] block text-muted-foreground/70">
                      con inflación {inflationRate}%
                    </span>
                  )}
                </span>
                <span className="font-medium text-card-foreground">{fmt(co.totalLinkageCost)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Otros costes</span>
                <span className="font-medium text-card-foreground">{fmt(co.offer.upfrontCostsEUR + co.offer.monthlyAccountCostEUR * termMonths)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="text-sm font-medium text-card-foreground">Coste total aprox.</span>
                <span className="text-lg font-bold text-card-foreground">{fmt(co.totalCost)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CostBreakdown;
