import { ComputedOffer } from "@/lib/mortgageCalc";


interface CostBreakdownProps {
  computedOffers: ComputedOffer[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const CostBreakdown = ({ computedOffers }: CostBreakdownProps) => {
  const sorted = [...computedOffers].sort((a, b) => a.totalCost - b.totalCost);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {sorted.map((co, i) => (
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
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bonificaciones ({co.offer.linkages.filter(l => l.isActive).length} activas)</span>
              <span className="font-medium text-card-foreground">{fmt(co.totalLinkageCost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Otros costes</span>
              <span className="font-medium text-card-foreground">{fmt(co.offer.upfrontCostsEUR + co.offer.monthlyAccountCostEUR * 360)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="text-sm font-medium text-card-foreground">Coste total aprox.</span>
              <span className="text-lg font-bold text-card-foreground">{fmt(co.totalCost)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CostBreakdown;
